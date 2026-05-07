/**
 * Mystery School Decan content notification helpers.
 *
 * Three notification kinds for the Decan admin content upgrade:
 *   • feedback_received       — admin reviewed a student's optional Decan
 *                                 journal entry (rating + feedback_text)
 *   • instructor_journal      — Beto/admin published a new instructor
 *                                 journal entry on a Decan
 *   • decan_resource          — admin published a new Decan resource
 *                                 (PDF / video / audio / link / image)
 *
 * Notifications use the existing `notifications` table via
 * `createNotification`. Wrappers fan-out to all current Decan-phase
 * students for the publish events; review notifications go to the single
 * student that owns the entry.
 *
 * Sprint: docs/tasks/2026-05-06/mystery-school-decan-admin-content-upgrade.md
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notifications";

interface DecanLookup {
  title: string | null;
  decan_number: number | null;
}

async function readDecan(
  admin: SupabaseClient,
  decanId: string,
): Promise<DecanLookup> {
  const { data } = await admin
    .from("decans")
    .select("title, decan_number")
    .eq("id", decanId)
    .maybeSingle();
  const d = data as Record<string, unknown> | null;
  return {
    title: (d?.title as string | null) ?? null,
    decan_number: (d?.decan_number as number | null) ?? null,
  };
}

async function listDecanPhaseStudents(
  admin: SupabaseClient,
): Promise<string[]> {
  // Currently in the Decan year — Foundation students never see Decan
  // content notifications because they can't access the page.
  const { data } = await admin
    .from("mystery_school_students")
    .select("user_id, training_status")
    .in("training_status", ["decans"]);
  return ((data ?? []) as Array<{ user_id: string }>).map((r) => r.user_id);
}

/** Notify the single student that admin reviewed their Decan journal entry. */
export async function notifyFeedbackReceived(input: {
  admin: SupabaseClient;
  userId: string;
  decanId: string;
  entryId: string;
  entryTitle: string | null;
  status: string;
  rating: number | null;
}): Promise<void> {
  const decan = await readDecan(input.admin, input.decanId);
  const decanLabel =
    decan.title ??
    (decan.decan_number != null ? `Decan ${decan.decan_number}` : "Decan");
  const titlePart = input.entryTitle ? ` "${input.entryTitle}"` : "";
  const ratingPart =
    input.rating != null ? ` Rating: ${input.rating}/5.` : "";
  const action =
    input.status === "revision_requested"
      ? `Your ${decanLabel} journal entry${titlePart} needs a revision.`
      : `Your ${decanLabel} journal entry${titlePart} was reviewed.${ratingPart}`;
  await createNotification({
    userId: input.userId,
    title:
      input.status === "revision_requested"
        ? "Revision requested"
        : "Feedback received",
    body: action,
    type: "info",
    actionUrl: `/mystery-school/decans/${input.decanId}`,
  });
}

/** Notify all current Decan-phase students that a new instructor journal landed. */
export async function notifyInstructorJournalPublished(input: {
  admin: SupabaseClient;
  decanId: string;
  journalTitle: string;
}): Promise<void> {
  const [decan, recipients] = await Promise.all([
    readDecan(input.admin, input.decanId),
    listDecanPhaseStudents(input.admin),
  ]);
  if (recipients.length === 0) return;
  const decanLabel =
    decan.title ??
    (decan.decan_number != null ? `Decan ${decan.decan_number}` : "Decan");
  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        userId,
        title: `New ${decanLabel} instructor journal`,
        body: `Beto added "${input.journalTitle}" to ${decanLabel}.`,
        type: "info",
        actionUrl: `/mystery-school/decans/${input.decanId}`,
      }),
    ),
  );
}

/** Notify all current Decan-phase students that a new Decan resource landed. */
export async function notifyDecanResourcePublished(input: {
  admin: SupabaseClient;
  decanId: string;
  resourceTitle: string;
}): Promise<void> {
  const [decan, recipients] = await Promise.all([
    readDecan(input.admin, input.decanId),
    listDecanPhaseStudents(input.admin),
  ]);
  if (recipients.length === 0) return;
  const decanLabel =
    decan.title ??
    (decan.decan_number != null ? `Decan ${decan.decan_number}` : "Decan");
  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        userId,
        title: `New ${decanLabel} resource`,
        body: `"${input.resourceTitle}" was added to ${decanLabel}.`,
        type: "info",
        actionUrl: `/mystery-school/decans/${input.decanId}`,
      }),
    ),
  );
}
