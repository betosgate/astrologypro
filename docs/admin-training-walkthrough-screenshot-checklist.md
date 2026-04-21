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
6. `training-category-detail`
7. `training_lesson_new`
8. `training_lesson_edit`
9. `training_quiz_new`
10. `quiz-detail-admin`
11. `ai-quiz-generator`
12. `training_analytics`
13. `trainee-quiz-scores`
14. `training_settings`
15. `certificate-config`
16. `tabbie-appointment-config`
17. `tabbie-appointment-monitor`

Not part of current active walkthrough:

- `class_config` — route exists, but the Admin Training nav item is currently commented out. Keep it excluded until the nav item is restored or the product decision changes.
- `certificate-issued-log` — no matching admin issued-certificate audit log/revoke screen exists currently. If that audit screen is added later, create a new walkthrough entry instead of treating `Certificate Config` as an issued-certificate log.

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

### 6. `training-category-detail.png`
- Route: first available `/admin/training/categories/:id/edit`
- Show:
  - edit page heading
  - existing category title and description
  - parent program selector
  - priority, active status, and sequential lock controls
  - internal training notes section if visible
- Best state:
  - a real category with meaningful seeded content

### 7. `training_lesson_new.png`
- Route: `/admin/training/lessons/new`
- Show:
  - lesson title
  - category selector
  - video mode controls
  - PDF attachment area
  - priority / previous lesson fields
- Best state:
  - at least one real category available

### 8. `training_lesson_edit.png`
- Route: first available `/admin/training/lessons/:id/edit`
- Show:
  - edit page heading
  - existing lesson content
  - attached video or PDF area
  - sequencing or status controls
- Best state:
  - a lesson that already has assets attached

### 9. `training_quiz_new.png`
- Route: `/admin/training/quizzes/new`
- Show:
  - lesson selector
  - quiz title
  - question builder area
  - create/save action
- Best state:
  - at least one lesson available

### 10. `quiz-detail-admin.png`
- Route: first available `/admin/training/quizzes/:id/edit`
- Show:
  - edit page heading
  - quiz title
  - question list
  - question editor area
  - pass/remediation-related controls if available
- Best state:
  - an existing quiz with at least one question

### 11. `ai-quiz-generator.png`
- Route: `/admin/training/quiz-generate`
- Show:
  - AI Quiz Generator heading
  - PPTX upload control
  - lesson assignment selector
  - question count field
  - Generate Questions action
- Best state:
  - lesson selector populated with real lessons
- Avoid:
  - generated-question review state unless intentionally documenting generated draft review

### 12. `training_analytics.png`
- Route: `/admin/training/analytics`
- Show:
  - KPI cards at the top
  - one populated tabular analytics section
  - filters or export controls if present
- Best state:
  - visible non-zero metrics

### 13. `trainee-quiz-scores.png`
- Route: `/admin/training/analytics`
- Show:
  - Users tab selected
  - KPI cards at the top
  - trainee rows with status, lessons, progress, quiz pass rate, average attempts, and time spent
  - search/sort/export controls
- Avoid:
  - skeleton loading state
  - empty user table

### 14. `training_settings.png`
- Route: `/admin/training/settings`
- Show:
  - training access roles section
  - global sequential lock section
  - save button
- Best state:
  - at least one role visible

### 15. `certificate-config.png`
- Route: `/admin/certificate-config`
- Show:
  - Certificate Config heading
  - school identity fields
  - certification details fields
  - training stats block
  - save action
- Best state:
  - configured school/program values visible, not empty defaults where possible

### 16. `tabbie-appointment-config.png`
- Route: `/admin/tabbie-appointment`
- Show:
  - Tabbie Appointment Config heading
  - feature toggle
  - block content fields
  - booking link / call-to-action fields
  - lifecycle state message fields
- Best state:
  - enabled or configured state with meaningful copy visible

### 17. `tabbie-appointment-monitor.png`
- Route: `/admin/trainee-tabbie-appointments`
- Show:
  - Tabbie Appointment Monitor heading
  - search and status filter controls
  - trainee appointment status table
  - training status, appointment status, completed, sync, and action columns
- Best state:
  - at least one trainee row visible

## Seed data recommendation

For clean screenshots, seed at minimum:

- 2 programs
- 3 categories
- 6 lessons
- 3 quizzes
- mixed active/inactive status
- one lesson with media attached
- one quiz with at least one saved question
- certificate config populated
- trainee appointment records across at least two statuses

## Automation note

The capture script can automate:

- direct routes
- first available edit route for program detail
- first available edit route for category detail
- first available edit route for lesson edit
- first available edit route for quiz detail
- direct capture for certificate and Tabbie appointment admin config/monitor screens

If seed data is missing, the script should skip the corresponding detail screenshot instead of failing the full run.
