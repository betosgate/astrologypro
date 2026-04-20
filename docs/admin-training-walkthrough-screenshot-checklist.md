# Admin Training Walkthrough Screenshot Checklist

This checklist defines the target screenshots for the admin training portion of `/walkthrough/admin`.

## Scope

These screenshots should match the active admin walkthrough entries in `src/lib/walkthrough-data.ts`.

Current target set:

1. `training_lessons`
2. `quiz-bank-admin`
3. `training_program_new`
4. `training-program-detail`
5. `training_category_new`
6. `training_lesson_new`
7. `training_lesson_edit`
8. `training_quiz_new`
9. `quiz-detail-admin`
10. `training_analytics`
11. `trainee-quiz-scores`
12. `training_settings`

Currently omitted:

- `certificate-issued-log` — no matching admin issued-certificate audit log/revoke screen exists yet.

## Capture rules

- Use a desktop viewport and keep framing consistent across all admin training screenshots.
- Prefer real seeded data over empty states.
- Make sure the page title and the primary controls are visible above the fold.
- Avoid partial modals, toast messages, loading spinners, and half-open dropdowns.
- Keep filenames exact so the walkthrough resolves them automatically.

## Per-screen checklist

### 1. `training_lessons.png`
- Route: `/admin/training`
- Show:
  - all four training management tables
  - search and status filter controls
  - visible rows in Programs, Categories, Lessons, and Quizzes
  - add buttons visible for each section
- Avoid:
  - empty tables
  - loading overlays

### 2. `quiz-bank-admin.png`
- Route: `/admin/training`
- Show:
  - bottom `Quizzes` table from the Training Management route
  - quiz title, linked lesson, question count, status, and created date columns
  - Refresh, Export, AI Generate, and Add Quiz actions
- Avoid:
  - capturing only Programs/Categories/Lessons
  - loading overlays

### 3. `training_program_new.png`
- Route: `/admin/training/programs/new`
- Show:
  - program name field
  - description field
  - priority
  - sequential lock toggle
  - allowed roles section
- Best state:
  - at least one role visible in the checklist

### 4. `training-program-detail.png`
- Route: first available `/admin/training/programs/:id/edit`
- Show:
  - edit page heading
  - existing program name and description
  - order/priority controls
  - access or active-state controls if present
- Best state:
  - a real program with meaningful seeded content

### 5. `training_category_new.png`
- Route: `/admin/training/categories/new`
- Show:
  - category title
  - parent program selector
  - priority
  - sequential option
  - active toggle
- Best state:
  - at least one real program available in the selector

### 6. `training_lesson_new.png`
- Route: `/admin/training/lessons/new`
- Show:
  - lesson title
  - category selector
  - video mode controls
  - PDF attachment area
  - priority / previous lesson fields
- Best state:
  - at least one real category available

### 7. `training_lesson_edit.png`
- Route: first available `/admin/training/lessons/:id/edit`
- Show:
  - edit page heading
  - existing lesson content
  - attached video or PDF area
  - sequencing or status controls
- Best state:
  - a lesson that already has assets attached

### 8. `training_quiz_new.png`
- Route: `/admin/training/quizzes/new`
- Show:
  - lesson selector
  - quiz title
  - question builder area
  - create/save action
- Best state:
  - at least one lesson available

### 9. `quiz-detail-admin.png`
- Route: first available `/admin/training/quizzes/:id/edit`
- Show:
  - edit page heading
  - quiz title
  - question list
  - question editor area
  - pass/remediation-related controls if available
- Best state:
  - an existing quiz with at least one question

### 10. `training_analytics.png`
- Route: `/admin/training/analytics`
- Show:
  - KPI cards at the top
  - one populated tabular analytics section
  - filters or export controls if present
- Best state:
  - visible non-zero metrics

### 11. `trainee-quiz-scores.png`
- Route: `/admin/training/analytics`
- Show:
  - Users tab selected
  - KPI cards at the top
  - trainee rows with status, lessons, progress, quiz pass rate, average attempts, and time spent
  - search/sort/export controls
- Avoid:
  - skeleton loading state
  - empty user table

### 12. `training_settings.png`
- Route: `/admin/training/settings`
- Show:
  - training access roles section
  - global sequential lock section
  - save button
- Best state:
  - at least one role visible

## Seed data recommendation

For clean screenshots, seed at minimum:

- 2 programs
- 3 categories
- 6 lessons
- 3 quizzes
- mixed active/inactive status
- one lesson with media attached
- one quiz with at least one saved question

## Automation note

The capture script can automate:

- direct routes
- first available edit route for program detail
- first available edit route for lesson edit
- first available edit route for quiz detail

If seed data is missing, the script should skip the corresponding detail screenshot instead of failing the full run.
