# Trainee Walkthrough Screenshot Checklist

This checklist defines the target screenshots for `/walkthrough/trainee`.

## Scope

These screenshots should match the active trainee walkthrough entries in `src/lib/walkthrough-data.ts`.

Current target set:

1. `trainee-hub`
2. `training-center`
3. `program-workspace`
4. `progress`
5. `quiz-history`
6. `resources`
7. `sessions`
8. `graduation`
9. `certificate`
10. `trainee-profile`

Not part of current active walkthrough:

- Standalone notifications, mentor chat, schedule, bookmarks, badge wall, glossary, peer community, and help screens — no matching `/trainee/*` routes exist currently.
- Separate training category and lesson detail deep links — the current learner flow uses the program workspace with inline lesson viewing; the detail-view navigation is not active in the UI.

Conditional capture:

- `certificate.png` — `/trainee/certificate` is real, but it is only accessible for graduated trainees. The capture script skips it for incomplete trainees and captures it only when run with a graduated trainee account. Current screenshot was captured with the graduated trainee QA account.

## Capture Rules

- Use a real trainee account with onboarding completed and at least one accessible training program.
- Use a desktop viewport and keep the top trainee navigation visible.
- Prefer populated states where possible: at least one program, one lesson, one quiz attempt, and lesson assets.
- Avoid login pages, loading skeletons, toast messages, half-open dropdowns, and modal overlays.
- Keep filenames exact so the walkthrough resolves them automatically.

## Per-Screen Checklist

### 1. `trainee-hub.png`
- Route: `/trainee`
- Show:
  - trainee dashboard heading
  - training progress card
  - continue learning card
  - mentor or practice-session context
- Avoid:
  - unauthenticated login screen
  - empty onboarding redirect

### 2. `training-center.png`
- Route: `/trainee/training`
- Show:
  - Not Started / Ongoing / Completed status split
  - total lesson progress
  - multiple program cards
  - Start / Continue action buttons

### 3. `program-workspace.png`
- Route: preferred `/trainee/training/:programId` for `Tarot Mastery Track` when available; otherwise first available program
- Show:
  - program header
  - lesson pane on the left
  - category rail on the right
  - expanded lesson with full-width video/content visible
  - lesson quiz section in the same workspace panel, scrolling the lesson panel if needed
- Avoid:
  - locked-only program where no lesson can be opened

### 4. `progress.png`
- Route: `/trainee/progress`
- Show:
  - summary cards
  - training status
  - module breakdown
  - lesson rows with completion indicators

### 5. `quiz-history.png`
- Route: `/trainee/quiz-history`
- Show:
  - quiz stats cards
  - all attempts list
  - score/pass indicators
- Best state:
  - at least one quiz attempt

### 6. `resources.png`
- Route: `/trainee/resources`
- Show:
  - quick links
  - lesson assets grouped by type
  - download/open controls
  - study guides if available

### 7. `sessions.png`
- Route: `/trainee/sessions`
- Show:
  - upcoming sessions section
  - past sessions section
  - scheduling instructions or populated booking cards

### 8. `graduation.png`
- Route: `/trainee/training/graduation`
- Show:
  - not-yet-graduated card for incomplete trainees, or certificate summary for graduated trainees
  - Continue Training or certificate verification action

### 9. `certificate.png`
- Route: `/trainee/certificate`
- Capture mode: automated with a graduated trainee account.
- Show:
  - certificate page heading/action bar
  - printed certificate body
  - trainee name
  - designation and program title
  - training stats
  - certificate ID / verification section
  - Print and Share actions if visible
- Avoid:
  - redirected `/trainee/progress` page
  - browser print dialog
  - incomplete trainee state

### 10. `trainee-profile.png`
- Route: `/trainee/profile`
- Show:
  - profile completion bar
  - personal information editor
  - package notice
  - visible training/profile fields

## Automation Note

The capture script resolves:

- first available program route for `program-workspace`
- guarded certificate route for `certificate`
- direct routes for all static trainee pages

If a trainee account has no accessible program data, the script should skip the dynamic program-workspace screenshot rather than overwrite valid images with empty or redirect states.

The automation skips `certificate` when the active trainee is redirected away from `/trainee/certificate`, preventing an incomplete trainee's progress page from overwriting the certificate screenshot. Use `WALKTHROUGH_EMAIL` and `WALKTHROUGH_PASSWORD` when a graduated account is needed for a targeted capture.
