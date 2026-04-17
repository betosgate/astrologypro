/**
 * Trainee Tabbie Appointment Service
 *
 * Central module for:
 *  - Status constants
 *  - Eligibility calculation
 *  - Current appointment resolution
 *  - Dashboard state computation
 *  - Config loading
 *  - History writes
 *  - Trainee summary field updates
 *
 * Business rules:
 *  - Eligibility = training_status === 'graduated' AND feature enabled AND appointment not completed
 *  - booking !== completion
 *  - One active appointment is current; history is never deleted
 *  - Manual overrides require reason and are audited
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─────────────────────────────────────────────────────────────────────────────
// Status constants
// ─────────────────────────────────────────────────────────────────────────────
export const TABBIE_STATUS = {
  NOT_REQUIRED: "not_required",
  ELIGIBLE_TO_BOOK: "eligible_to_book",
  BOOKING_IN_PROGRESS: "booking_in_progress",
  BOOKED: "booked",
  CANCELLED: "cancelled",
  RESCHEDULED: "rescheduled",
  COMPLETED: "completed",
  NO_SHOW: "no_show",
  FAILED: "failed",
  MANUALLY_COMPLETED: "manually_completed",
  MANUALLY_CANCELLED: "manually_cancelled",
} as const;

export type TabbieStatus = (typeof TABBIE_STATUS)[keyof typeof TABBIE_STATUS];

/** Statuses that mean there is an active appointment the trainee is tracking */
export const ACTIVE_STATUSES: TabbieStatus[] = [
  TABBIE_STATUS.BOOKING_IN_PROGRESS,
  TABBIE_STATUS.BOOKED,
  TABBIE_STATUS.MANUALLY_COMPLETED,
  TABBIE_STATUS.MANUALLY_CANCELLED,
];

/** Provider event → internal status mapping */
export const PROVIDER_STATUS_MAP: Record<string, TabbieStatus> = {
  // Calendly / generic
  "invitee.created": TABBIE_STATUS.BOOKED,
  "invitee.canceled": TABBIE_STATUS.CANCELLED,
  invitee_no_show: TABBIE_STATUS.NO_SHOW,
  // Generic keys implementations can use
  provider_booked: TABBIE_STATUS.BOOKED,
  provider_cancelled: TABBIE_STATUS.CANCELLED,
  provider_rescheduled: TABBIE_STATUS.BOOKED, // history row captures 'rescheduled'
  provider_completed: TABBIE_STATUS.COMPLETED,
  provider_no_show: TABBIE_STATUS.NO_SHOW,
};

// ─────────────────────────────────────────────────────────────────────────────
// Config types
// ─────────────────────────────────────────────────────────────────────────────
export interface TabbieAppointmentConfig {
  id: string;
  featureKey: string;
  isEnabled: boolean;
  blockTitle: string;
  blockBody: string;
  buttonLabel: string;
  bookingLink: string;
  openMode: "same_tab" | "new_tab";
  highlightVariant: "info" | "neutral" | "warning" | "success";
  helperText: string | null;
  successMessage: string | null;
  cancelledMessage: string | null;
  postBookingMessage: string | null;
  displayPriority: number;
  updatedBy: string | null;
  updatedAt: string;
  version: number;
}

export interface TabbieAppointmentConfigPayload {
  is_enabled: boolean;
  block_title: string;
  block_body: string;
  button_label: string;
  booking_link: string;
  open_mode: "same_tab" | "new_tab";
  highlight_variant: "info" | "neutral" | "warning" | "success";
  helper_text?: string | null;
  success_message?: string | null;
  cancelled_message?: string | null;
  post_booking_message?: string | null;
  display_priority?: number;
}

export const FEATURE_KEY = "trainee_tabbie_post_training_booking";

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard state type
// ─────────────────────────────────────────────────────────────────────────────
export interface TraineeTabbieDashboardState {
  isTrainingCompleted: boolean;
  isFeatureEnabled: boolean;
  isRequired: boolean;
  showBlock: boolean;
  status: TabbieStatus;
  completed: boolean;
  currentAppointment: {
    id: string;
    scheduledStartAt: string | null;
    scheduledEndAt: string | null;
    timezone: string | null;
    externalBookingId: string | null;
    status: TabbieStatus;
  } | null;
  content: {
    title: string;
    body: string;
    buttonLabel: string;
    helperText: string | null;
    openMode: "same_tab" | "new_tab";
    bookingLink: string | null;
    variant: "info" | "neutral" | "warning" | "success";
    successMessage: string | null;
    cancelledMessage: string | null;
  } | null;
  configMissing: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Config helpers
// ─────────────────────────────────────────────────────────────────────────────

function rowToConfig(row: Record<string, unknown>): TabbieAppointmentConfig {
  return {
    id: row.id as string,
    featureKey: row.feature_key as string,
    isEnabled: row.is_enabled as boolean,
    blockTitle: row.block_title as string,
    blockBody: row.block_body as string,
    buttonLabel: row.button_label as string,
    bookingLink: row.booking_link as string,
    openMode: (row.open_mode as string) === "new_tab" ? "new_tab" : "same_tab",
    highlightVariant: (["info", "neutral", "warning", "success"].includes(
      row.highlight_variant as string
    )
      ? row.highlight_variant
      : "info") as TabbieAppointmentConfig["highlightVariant"],
    helperText: (row.helper_text as string | null) ?? null,
    successMessage: (row.success_message as string | null) ?? null,
    cancelledMessage: (row.cancelled_message as string | null) ?? null,
    postBookingMessage: (row.post_booking_message as string | null) ?? null,
    displayPriority: (row.display_priority as number) ?? 0,
    updatedBy: (row.updated_by as string | null) ?? null,
    updatedAt: row.updated_at as string,
    version: (row.version as number) ?? 1,
  };
}

export async function getAdminTabbieConfig(): Promise<TabbieAppointmentConfig | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_tabbie_appointment_config")
    .select("*")
    .eq("feature_key", FEATURE_KEY)
    .maybeSingle();

  if (error) {
    console.error("[tabbie-config] load error:", error.message);
    return null;
  }
  if (!data) return null;
  return rowToConfig(data as Record<string, unknown>);
}

export function validateTabbieConfigPayload(
  payload: TabbieAppointmentConfigPayload
): { ok: true } | { ok: false; error: string } {
  if (payload.is_enabled) {
    if (!payload.block_title?.trim()) return { ok: false, error: "Title is required when feature is enabled" };
    if (!payload.block_body?.trim()) return { ok: false, error: "Body is required when feature is enabled" };
    if (!payload.button_label?.trim()) return { ok: false, error: "Button label is required when feature is enabled" };
    if (!payload.booking_link?.trim()) return { ok: false, error: "Booking link is required when feature is enabled" };
    try {
      new URL(payload.booking_link.trim());
    } catch {
      return { ok: false, error: "Booking link must be a valid URL" };
    }
  }
  if (payload.block_title && payload.block_title.length > 200) return { ok: false, error: "Title too long (max 200 chars)" };
  if (payload.block_body && payload.block_body.length > 1000) return { ok: false, error: "Body too long (max 1000 chars)" };
  if (payload.button_label && payload.button_label.length > 100) return { ok: false, error: "Button label too long (max 100 chars)" };
  return { ok: true };
}

export async function upsertTabbieConfig(
  payload: TabbieAppointmentConfigPayload,
  adminEmail: string
): Promise<TabbieAppointmentConfig> {
  const admin = createAdminClient();

  const existing = await getAdminTabbieConfig();

  if (!existing) {
    const { data, error } = await admin
      .from("admin_tabbie_appointment_config")
      .insert({
        feature_key: FEATURE_KEY,
        is_enabled: payload.is_enabled,
        block_title: payload.block_title ?? "",
        block_body: payload.block_body ?? "",
        button_label: payload.button_label ?? "Book Appointment",
        booking_link: payload.booking_link ?? "",
        open_mode: payload.open_mode ?? "same_tab",
        highlight_variant: payload.highlight_variant ?? "info",
        helper_text: payload.helper_text ?? null,
        success_message: payload.success_message ?? null,
        cancelled_message: payload.cancelled_message ?? null,
        post_booking_message: payload.post_booking_message ?? null,
        display_priority: payload.display_priority ?? 0,
        updated_by: adminEmail,
        updated_at: new Date().toISOString(),
        version: 1,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToConfig(data as Record<string, unknown>);
  }

  const { data, error } = await admin
    .from("admin_tabbie_appointment_config")
    .update({
      is_enabled: payload.is_enabled,
      block_title: payload.block_title ?? "",
      block_body: payload.block_body ?? "",
      button_label: payload.button_label ?? "Book Appointment",
      booking_link: payload.booking_link ?? "",
      open_mode: payload.open_mode ?? "same_tab",
      highlight_variant: payload.highlight_variant ?? "info",
      helper_text: payload.helper_text ?? null,
      success_message: payload.success_message ?? null,
      cancelled_message: payload.cancelled_message ?? null,
      post_booking_message: payload.post_booking_message ?? null,
      display_priority: payload.display_priority ?? 0,
      updated_by: adminEmail,
      updated_at: new Date().toISOString(),
      version: existing.version + 1,
    })
    .eq("feature_key", FEATURE_KEY)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToConfig(data as Record<string, unknown>);
}

// ─────────────────────────────────────────────────────────────────────────────
// Appointment helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function getCurrentAppointment(traineeId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("trainee_tabbie_appointments")
    .select("id, status, scheduled_start_at, scheduled_end_at, timezone, external_booking_id, created_at")
    .eq("trainee_id", traineeId)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function getLatestAppointment(traineeId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("trainee_tabbie_appointments")
    .select("id, status, scheduled_start_at, scheduled_end_at, timezone, external_booking_id, created_at")
    .eq("trainee_id", traineeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function getAppointmentHistory(appointmentId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("trainee_tabbie_appointment_history")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getTraineeAppointmentHistory(traineeId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("trainee_tabbie_appointment_history")
    .select("*")
    .eq("trainee_id", traineeId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function writeHistoryRow({
  appointmentId,
  traineeId,
  actionType,
  oldStatus,
  newStatus,
  changedByType,
  changedById,
  changeReason,
  payloadSnapshot,
}: {
  appointmentId: string;
  traineeId: string;
  actionType: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  changedByType: "system" | "webhook" | "admin";
  changedById?: string | null;
  changeReason?: string | null;
  payloadSnapshot?: Record<string, unknown> | null;
}) {
  const admin = createAdminClient();
  await admin.from("trainee_tabbie_appointment_history").insert({
    appointment_id: appointmentId,
    trainee_id: traineeId,
    action_type: actionType,
    old_status: oldStatus ?? null,
    new_status: newStatus ?? null,
    changed_by_type: changedByType,
    changed_by_id: changedById ?? null,
    change_reason: changeReason ?? null,
    payload_snapshot: payloadSnapshot ?? null,
  });
}

export async function updateTraineeSummary(
  traineeId: string,
  fields: {
    tabbie_appointment_required?: boolean;
    tabbie_appointment_status?: TabbieStatus;
    tabbie_appointment_completed?: boolean;
    tabbie_appointment_completed_at?: string | null;
    current_tabbie_appointment_id?: string | null;
    tabbie_appointment_sync_status?: string | null;
    tabbie_appointment_last_synced_at?: string | null;
    tabbie_appointment_completion_source?: string | null;
    tabbie_appointment_completion_notes?: string | null;
  }
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("trainees")
    .update(fields)
    .eq("id", traineeId);
  if (error) {
    console.error("[tabbie] updateTraineeSummary error:", error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Eligibility + dashboard state computation
// ─────────────────────────────────────────────────────────────────────────────

export async function computeTraineeTabbieDashboardState(
  traineeId: string,
  userId: string
): Promise<TraineeTabbieDashboardState> {
  const admin = createAdminClient();

  const [traineeResult, config] = await Promise.all([
    admin
      .from("trainees")
      .select(
        "id, training_status, graduated_at, tabbie_appointment_required, tabbie_appointment_status, tabbie_appointment_completed, tabbie_appointment_completed_at, current_tabbie_appointment_id, tabbie_appointment_sync_status"
      )
      .eq("id", traineeId)
      .eq("user_id", userId)
      .single(),
    getAdminTabbieConfig(),
  ]);

  const trainee = traineeResult.data;
  if (!trainee) {
    return notRequiredState();
  }

  const isTrainingCompleted =
    trainee.training_status === "graduated" || !!trainee.graduated_at;
  const isFeatureEnabled = config?.isEnabled ?? false;
  const isCompleted = trainee.tabbie_appointment_completed === true;

  if (!isTrainingCompleted || !isFeatureEnabled) {
    return {
      isTrainingCompleted,
      isFeatureEnabled,
      isRequired: false,
      showBlock: false,
      status: TABBIE_STATUS.NOT_REQUIRED,
      completed: isCompleted,
      currentAppointment: null,
      content: null,
      configMissing: false,
    };
  }

  // Feature enabled + training done
  // If already completed, show success block
  if (isCompleted) {
    return {
      isTrainingCompleted: true,
      isFeatureEnabled: true,
      isRequired: true,
      showBlock: true,
      status: TABBIE_STATUS.COMPLETED,
      completed: true,
      currentAppointment: null,
      content: config
        ? {
            title: config.blockTitle,
            body: config.successMessage ?? "Your appointment has been completed. Well done!",
            buttonLabel: config.buttonLabel,
            helperText: config.helperText,
            openMode: config.openMode,
            bookingLink: null,
            variant: "success",
            successMessage: config.successMessage,
            cancelledMessage: config.cancelledMessage,
          }
        : null,
      configMissing: !config,
    };
  }

  // Ensure booking link is valid before showing CTA
  const bookingLinkValid = isValidUrl(config?.bookingLink ?? "");
  const configMissing = !config || !bookingLinkValid;

  // Load current active appointment
  const currentAppt = await getCurrentAppointment(traineeId);

  // If no active appointment exists but we have a latest one, check its status
  let resolvedStatus: TabbieStatus = (trainee.tabbie_appointment_status as TabbieStatus) ?? TABBIE_STATUS.ELIGIBLE_TO_BOOK;

  // If trainee has no appointment record at all, mark as eligible_to_book
  if (!currentAppt) {
    const latest = await getLatestAppointment(traineeId);
    if (!latest || latest.status === TABBIE_STATUS.CANCELLED || latest.status === TABBIE_STATUS.NO_SHOW) {
      resolvedStatus = TABBIE_STATUS.ELIGIBLE_TO_BOOK;
    } else {
      resolvedStatus = (latest?.status as TabbieStatus) ?? TABBIE_STATUS.ELIGIBLE_TO_BOOK;
    }
  } else {
    resolvedStatus = currentAppt.status as TabbieStatus;
  }

  const content = config
    ? buildContentForStatus(resolvedStatus, config)
    : null;

  return {
    isTrainingCompleted: true,
    isFeatureEnabled: true,
    isRequired: true,
    showBlock: true,
    status: resolvedStatus,
    completed: false,
    currentAppointment: currentAppt
      ? {
          id: currentAppt.id,
          scheduledStartAt: currentAppt.scheduled_start_at,
          scheduledEndAt: currentAppt.scheduled_end_at,
          timezone: currentAppt.timezone,
          externalBookingId: currentAppt.external_booking_id,
          status: currentAppt.status as TabbieStatus,
        }
      : null,
    content,
    configMissing,
  };
}

function notRequiredState(): TraineeTabbieDashboardState {
  return {
    isTrainingCompleted: false,
    isFeatureEnabled: false,
    isRequired: false,
    showBlock: false,
    status: TABBIE_STATUS.NOT_REQUIRED,
    completed: false,
    currentAppointment: null,
    content: null,
    configMissing: false,
  };
}

function buildContentForStatus(
  status: TabbieStatus,
  config: TabbieAppointmentConfig
): TraineeTabbieDashboardState["content"] {
  switch (status) {
    case TABBIE_STATUS.COMPLETED:
    case TABBIE_STATUS.MANUALLY_COMPLETED:
      return {
        title: config.blockTitle,
        body: config.successMessage ?? "Your appointment has been completed!",
        buttonLabel: config.buttonLabel,
        helperText: config.helperText,
        openMode: config.openMode,
        bookingLink: null,
        variant: "success",
        successMessage: config.successMessage,
        cancelledMessage: config.cancelledMessage,
      };
    case TABBIE_STATUS.CANCELLED:
    case TABBIE_STATUS.NO_SHOW:
    case TABBIE_STATUS.MANUALLY_CANCELLED:
      return {
        title: config.blockTitle,
        body: config.cancelledMessage ?? "Your appointment was cancelled. Please book a new time.",
        buttonLabel: config.buttonLabel,
        helperText: config.helperText,
        openMode: config.openMode,
        bookingLink: config.bookingLink || null,
        variant: "warning",
        successMessage: config.successMessage,
        cancelledMessage: config.cancelledMessage,
      };
    case TABBIE_STATUS.BOOKED:
    case TABBIE_STATUS.BOOKING_IN_PROGRESS:
    case TABBIE_STATUS.RESCHEDULED:
      return {
        title: config.blockTitle,
        body: config.postBookingMessage ?? "Your appointment is scheduled. We look forward to speaking with you!",
        buttonLabel: config.buttonLabel,
        helperText: config.helperText,
        openMode: config.openMode,
        bookingLink: null,
        variant: "neutral",
        successMessage: config.successMessage,
        cancelledMessage: config.cancelledMessage,
      };
    default:
      // eligible_to_book / not_required / failed
      return {
        title: config.blockTitle,
        body: config.blockBody,
        buttonLabel: config.buttonLabel,
        helperText: config.helperText,
        openMode: config.openMode,
        bookingLink: config.bookingLink || null,
        variant: config.highlightVariant,
        successMessage: config.successMessage,
        cancelledMessage: config.cancelledMessage,
      };
  }
}

function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook / sync lifecycle
// ─────────────────────────────────────────────────────────────────────────────

export interface SyncAppointmentInput {
  traineeId: string;
  userId: string;
  externalBookingId?: string | null;
  externalEventId?: string | null;
  providerEvent: string; // e.g. 'invitee.created', 'provider_cancelled'
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  timezone?: string | null;
  hostName?: string | null;
  appointmentType?: string | null;
  bookingLinkUsed?: string | null;
  rawPayload?: Record<string, unknown>;
  changedByType?: "system" | "webhook" | "admin";
  changedById?: string | null;
  isReschedule?: boolean;
  rescheduledFromAppointmentId?: string | null;
}

export async function syncAppointmentFromProvider(
  input: SyncAppointmentInput
): Promise<{ ok: boolean; appointmentId?: string; error?: string }> {
  const admin = createAdminClient();

  const internalStatus = PROVIDER_STATUS_MAP[input.providerEvent] ?? TABBIE_STATUS.FAILED;
  const now = new Date().toISOString();
  const changedByType = input.changedByType ?? "webhook";

  try {
    // Try to find existing appointment by external_booking_id first
    let existingAppt: { id: string; status: string; trainee_id: string } | null = null;
    if (input.externalBookingId) {
      const { data } = await admin
        .from("trainee_tabbie_appointments")
        .select("id, status, trainee_id")
        .eq("external_booking_id", input.externalBookingId)
        .maybeSingle();
      existingAppt = data as typeof existingAppt;
    }

    let appointmentId: string;
    const oldStatus = existingAppt?.status ?? null;

    if (existingAppt && !input.isReschedule) {
      // Update existing appointment
      const updateFields: Record<string, unknown> = {
        status: internalStatus,
        updated_at: now,
        raw_payload: input.rawPayload ?? null,
      };
      if (internalStatus === TABBIE_STATUS.CANCELLED) updateFields.cancelled_at = now;
      if (internalStatus === TABBIE_STATUS.COMPLETED) updateFields.completed_at = now;
      if (internalStatus === TABBIE_STATUS.NO_SHOW) updateFields.no_show_at = now;
      if (input.scheduledStartAt) updateFields.scheduled_start_at = input.scheduledStartAt;
      if (input.scheduledEndAt) updateFields.scheduled_end_at = input.scheduledEndAt;
      if (input.timezone) updateFields.timezone = input.timezone;

      await admin
        .from("trainee_tabbie_appointments")
        .update(updateFields)
        .eq("id", existingAppt.id);

      appointmentId = existingAppt.id;
    } else {
      // Create new appointment row
      const { data: newAppt, error: insertError } = await admin
        .from("trainee_tabbie_appointments")
        .insert({
          trainee_id: input.traineeId,
          user_id: input.userId,
          external_booking_id: input.externalBookingId ?? null,
          external_event_id: input.externalEventId ?? null,
          appointment_type: input.appointmentType ?? null,
          host_name: input.hostName ?? "Tabbie",
          scheduled_start_at: input.scheduledStartAt ?? null,
          scheduled_end_at: input.scheduledEndAt ?? null,
          timezone: input.timezone ?? null,
          status: internalStatus,
          booking_source: "trainee_dashboard_block",
          booking_link_used: input.bookingLinkUsed ?? null,
          rescheduled_from_appointment_id: input.rescheduledFromAppointmentId ?? null,
          raw_payload: input.rawPayload ?? null,
          cancelled_at: internalStatus === TABBIE_STATUS.CANCELLED ? now : null,
          completed_at: internalStatus === TABBIE_STATUS.COMPLETED ? now : null,
          no_show_at: internalStatus === TABBIE_STATUS.NO_SHOW ? now : null,
        })
        .select("id")
        .single();

      if (insertError || !newAppt) {
        throw new Error(insertError?.message ?? "Failed to create appointment");
      }
      appointmentId = newAppt.id;
    }

    // Write history row
    await writeHistoryRow({
      appointmentId,
      traineeId: input.traineeId,
      actionType: input.isReschedule ? "rescheduled" : internalStatus,
      oldStatus,
      newStatus: internalStatus,
      changedByType,
      changedById: input.changedById ?? null,
      payloadSnapshot: input.rawPayload ?? null,
    });

    // Update trainee summary
    const summaryUpdates: Parameters<typeof updateTraineeSummary>[1] = {
      tabbie_appointment_status: internalStatus === TABBIE_STATUS.BOOKED ? TABBIE_STATUS.BOOKED
        : internalStatus === TABBIE_STATUS.CANCELLED ? TABBIE_STATUS.CANCELLED
        : internalStatus === TABBIE_STATUS.COMPLETED ? TABBIE_STATUS.COMPLETED
        : internalStatus === TABBIE_STATUS.NO_SHOW ? TABBIE_STATUS.NO_SHOW
        : internalStatus,
      tabbie_appointment_sync_status: "synced",
      tabbie_appointment_last_synced_at: now,
    };

    if (internalStatus === TABBIE_STATUS.COMPLETED) {
      summaryUpdates.tabbie_appointment_completed = true;
      summaryUpdates.tabbie_appointment_completed_at = now;
      summaryUpdates.tabbie_appointment_completion_source = "webhook";
    }

    // For active statuses, point current_tabbie_appointment_id
    if (ACTIVE_STATUSES.includes(internalStatus)) {
      summaryUpdates.current_tabbie_appointment_id = appointmentId;
    }

    await updateTraineeSummary(input.traineeId, summaryUpdates);

    return { ok: true, appointmentId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[tabbie-sync] error:", msg);

    // Mark sync error on trainee record without wiping current state
    await updateTraineeSummary(input.traineeId, {
      tabbie_appointment_sync_status: "error",
      tabbie_appointment_last_synced_at: now,
    });

    return { ok: false, error: msg };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin override
// ─────────────────────────────────────────────────────────────────────────────
export type AdminOverrideAction =
  | "mark_completed"
  | "reset_completed"
  | "mark_cancelled";

export async function applyAdminOverride({
  traineeId,
  action,
  reason,
  adminEmail,
}: {
  traineeId: string;
  action: AdminOverrideAction;
  reason: string;
  adminEmail: string;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Load trainee
  const { data: trainee } = await admin
    .from("trainees")
    .select("id, current_tabbie_appointment_id, tabbie_appointment_status, tabbie_appointment_completed")
    .eq("id", traineeId)
    .maybeSingle();

  if (!trainee) return { ok: false, error: "Trainee not found" };

  const oldStatus = trainee.tabbie_appointment_status as TabbieStatus;

  try {
    let newStatus: TabbieStatus;
    const summaryUpdate: Parameters<typeof updateTraineeSummary>[1] = {};

    switch (action) {
      case "mark_completed":
        newStatus = TABBIE_STATUS.MANUALLY_COMPLETED;
        summaryUpdate.tabbie_appointment_status = newStatus;
        summaryUpdate.tabbie_appointment_completed = true;
        summaryUpdate.tabbie_appointment_completed_at = now;
        summaryUpdate.tabbie_appointment_completion_source = "admin_override";
        summaryUpdate.tabbie_appointment_completion_notes = reason;
        break;
      case "reset_completed":
        newStatus = TABBIE_STATUS.ELIGIBLE_TO_BOOK;
        summaryUpdate.tabbie_appointment_status = newStatus;
        summaryUpdate.tabbie_appointment_completed = false;
        summaryUpdate.tabbie_appointment_completed_at = null;
        summaryUpdate.tabbie_appointment_completion_source = null;
        summaryUpdate.tabbie_appointment_completion_notes = null;
        break;
      case "mark_cancelled":
        newStatus = TABBIE_STATUS.MANUALLY_CANCELLED;
        summaryUpdate.tabbie_appointment_status = newStatus;
        break;
      default:
        return { ok: false, error: "Unknown override action" };
    }

    await updateTraineeSummary(traineeId, summaryUpdate);

    // If there's a current appointment, update its status too
    if (trainee.current_tabbie_appointment_id) {
      await admin
        .from("trainee_tabbie_appointments")
        .update({ status: newStatus, updated_at: now })
        .eq("id", trainee.current_tabbie_appointment_id);

      await writeHistoryRow({
        appointmentId: trainee.current_tabbie_appointment_id,
        traineeId,
        actionType: `admin_${action}`,
        oldStatus,
        newStatus,
        changedByType: "admin",
        changedById: adminEmail,
        changeReason: reason,
      });
    }

    // Audit log
    await admin.from("admin_activity_log").insert({
      admin_user_id: adminEmail,
      target_user_id: traineeId,
      action_type: `tabbie_override_${action}`,
      details: {
        old_status: oldStatus,
        new_status: newStatus,
        reason,
        appointment_id: trainee.current_tabbie_appointment_id,
      },
    }).maybeSingle();

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
