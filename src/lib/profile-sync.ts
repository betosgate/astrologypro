import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Shared profile fields that can be synced across role tables.
// ---------------------------------------------------------------------------
export interface ProfileSyncFields {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  specialties?: string[];
  phone?: string;
  timezone?: string;
  birth_date?: string | null;
  birth_time?: string | null;
  birth_city?: string | null;
}

// ---------------------------------------------------------------------------
// Role tables and how ProfileSyncFields map to each table's column names.
// A `null` value means the table does not store that field.
// ---------------------------------------------------------------------------
const ROLE_TABLES = [
  "diviners",
  "trainees",
  "clients",
  "social_advocates",
  "community_members",
] as const;

type RoleTable = (typeof ROLE_TABLES)[number];

const FIELD_MAP: Record<
  keyof ProfileSyncFields,
  Record<RoleTable, string | null>
> = {
  display_name: {
    diviners: "display_name",
    trainees: "name",
    clients: "full_name",
    social_advocates: "name",
    community_members: "full_name",
  },
  bio: {
    diviners: "bio",
    trainees: "bio",
    clients: null,
    social_advocates: null,
    community_members: null,
  },
  avatar_url: {
    diviners: "avatar_url",
    trainees: "avatar_url",
    clients: null,
    social_advocates: null,
    community_members: null,
  },
  specialties: {
    diviners: "specialties",
    trainees: "specialties",
    clients: null,
    social_advocates: null,
    community_members: null,
  },
  phone: {
    diviners: "phone",
    trainees: "phone",
    clients: null,
    social_advocates: null,
    community_members: "phone",
  },
  timezone: {
    diviners: "timezone",
    trainees: "timezone",
    clients: null,
    social_advocates: null,
    community_members: null,
  },
  birth_date: {
    diviners: null,
    trainees: null,
    clients: "birth_date",
    social_advocates: null,
    community_members: "date_of_birth",
  },
  birth_time: {
    diviners: null,
    trainees: null,
    clients: "birth_time",
    social_advocates: null,
    community_members: "birth_time",
  },
  birth_city: {
    diviners: null,
    trainees: null,
    clients: "birth_city",
    social_advocates: null,
    community_members: "birth_city",
  },
};

// ---------------------------------------------------------------------------
// syncProfileAcrossRoles
//
// Syncs shared profile fields across all role tables for a given user.
// Call this after any role-specific profile update.
// Only updates tables where the user has a record.
// Only updates fields that are provided (non-undefined).
//
// @param userId       - The auth user's UUID
// @param fields       - The fields to sync (only non-undefined values are synced)
// @param excludeTable - Skip this table to avoid update loops
// ---------------------------------------------------------------------------
export async function syncProfileAcrossRoles(
  userId: string,
  fields: ProfileSyncFields,
  excludeTable?: string
): Promise<void> {
  const admin = createAdminClient();

  // Determine which tables have a record for this user (parallel lookups).
  const tablesToCheck = ROLE_TABLES.filter((t) => t !== excludeTable);

  const existenceResults = await Promise.all(
    tablesToCheck.map(async (table): Promise<{ table: RoleTable; exists: boolean }> => {
      try {
        const { data } = await admin
          .from(table)
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        return { table, exists: !!data };
      } catch {
        return { table, exists: false };
      }
    })
  );

  const tablesToUpdate = existenceResults
    .filter((r) => r.exists)
    .map((r) => r.table);

  if (tablesToUpdate.length === 0) return;

  // Build per-table update payloads, mapping input field names to table columns.
  const updates: Promise<void>[] = [];

  for (const table of tablesToUpdate) {
    const payload: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      const column = FIELD_MAP[field as keyof ProfileSyncFields]?.[table];
      if (column) {
        payload[column] = value;
      }
    }

    // Nothing to update for this table — skip.
    if (Object.keys(payload).length === 0) continue;

    updates.push(
      (async () => {
        try {
          const { error } = await admin
            .from(table)
            .update(payload)
            .eq("user_id", userId);
          if (error) {
            console.error(
              `[profile-sync] Failed to sync to ${table} for user ${userId}:`,
              error.message
            );
          }
        } catch (err: unknown) {
          console.error(
            `[profile-sync] Unexpected error syncing to ${table} for user ${userId}:`,
            err
          );
        }
      })()
    );
  }

  await Promise.all(updates);
}
