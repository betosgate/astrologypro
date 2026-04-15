/**
 * Seed script: mystery school decan + foundation progress for ms.test
 * Seeds 20 completed decans + 8 completed foundation weeks so the
 * graduation page shows meaningful progress (not 0/36, 0/12).
 *
 * Run: node scripts/seed-ms-progress.mjs
 */

const SUPABASE_URL = "https://wyluvclvtvwptsvvtgkv.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHV2Y2x2dHZ3cHRzdnZ0Z2t2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MjU0OSwiZXhwIjoyMDkwNTU4NTQ5fQ.FFO4z0U0HUnRxioHGZbwh6cOU0Ex_9vZ6rNhotwB_AM";

const MS_TEST_USER_ID = "d373d6eb-82db-413c-894b-65a7fe473f63";

const hdrs = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function get(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: hdrs });
  if (!res.ok) throw new Error(`GET ${path} failed: ${await res.text()}`);
  return res.json();
}

async function upsert(table, rows, onConflict) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...hdrs,
      Prefer: `resolution=merge-duplicates,return=representation`,
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn(`Upsert ${table} warning: ${err}`);
    return [];
  }
  return res.json();
}

// ─── 1. Find student row ────────────────────────────────────────────────────

console.log("Fetching mystery_school_students row for ms.test...");
const students = await get(`mystery_school_students?user_id=eq.${MS_TEST_USER_ID}&select=id,status,training_status`);

if (!students || students.length === 0) {
  console.error("No mystery_school_students row found for ms.test user");
  process.exit(1);
}

const student = students[0];
console.log(`Found student: id=${student.id}, status=${student.status}, training_status=${student.training_status}`);

// ─── 2. Fetch decans (first 20) ────────────────────────────────────────────

console.log("\nFetching decans...");
const decans = await get("decans?select=id,decan_number,start_month,start_day,end_month,end_day&order=decan_number.asc&limit=20");
console.log(`Found ${decans.length} decans to seed progress for`);

// ─── 3. Fetch foundation weeks (first 8) ───────────────────────────────────

console.log("\nFetching mystery_school_foundation_weeks...");
let weeks = [];
try {
  weeks = await get("mystery_school_foundation_weeks?select=id,week_number,tasks&is_published=eq.true&order=week_number.asc&limit=8");
  console.log(`Found ${weeks.length} foundation weeks`);
} catch (e) {
  console.warn("mystery_school_foundation_weeks not found or empty:", e.message);
}

// ─── 4. Seed student_decan_progress ──────────────────────────────────────

console.log("\nSeeding decan progress (completed)...");
const now = new Date();
const sevenMonthsAgo = new Date(now);
sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

const decanProgressRows = decans.map((d, i) => {
  // Space completions ~10 days apart going backward
  const completedAt = new Date(sevenMonthsAgo.getTime() + i * 10 * 24 * 60 * 60 * 1000);
  const windowOpen = new Date(completedAt.getTime() - 3 * 24 * 60 * 60 * 1000);
  const windowClose = new Date(completedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const graceClose = new Date(windowClose.getTime() + 2 * 24 * 60 * 60 * 1000);

  return {
    student_id: student.id,
    decan_id: d.id,
    status: "completed",
    ritual_done: true,
    scry_done: true,
    journal_done: true,
    unlocked_at: windowOpen.toISOString(),
    completed_at: completedAt.toISOString(),
    missed_at: null,
    window_open: windowOpen.toISOString(),
    window_close: windowClose.toISOString(),
    grace_close: graceClose.toISOString(),
    admin_excused: false,
    excuse_reason: null,
    excused_at: null,
  };
});

try {
  await upsert("student_decan_progress", decanProgressRows);
  console.log(`✓ Upserted ${decanProgressRows.length} decan progress rows`);
} catch (e) {
  console.error("Failed to seed decan progress:", e.message);
}

// ─── 5. Seed student_foundation_progress ─────────────────────────────────

if (weeks.length > 0) {
  console.log("\nSeeding foundation week progress (completed)...");
  const foundationRows = weeks.map((w, i) => {
    const completedAt = new Date(sevenMonthsAgo.getTime() + i * 7 * 24 * 60 * 60 * 1000);

    // Build task_completions from the week's task list
    const tasks = Array.isArray(w.tasks) ? w.tasks : [];
    const taskCompletions = {};
    for (const task of tasks) {
      const taskCompletedAt = new Date(completedAt.getTime() - (tasks.length - tasks.indexOf(task)) * 60 * 60 * 1000);
      taskCompletions[task.id] = { completed_at: taskCompletedAt.toISOString() };
    }

    return {
      student_id: student.id,
      week_number: w.week_number,
      week_completed_at: completedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      task_completions: taskCompletions,
    };
  });

  try {
    await upsert("student_foundation_progress", foundationRows);
    console.log(`✓ Upserted ${foundationRows.length} foundation week progress rows`);
  } catch (e) {
    console.error("Failed to seed foundation progress:", e.message);
  }
} else {
  console.log("\nNo published foundation weeks found — skipping week progress seed");
}

console.log("\n✅ Done. ms.test now has:");
console.log(`   ${decanProgressRows.length}/36 decans completed`);
console.log(`   ${weeks.length}/12 foundation weeks completed`);
