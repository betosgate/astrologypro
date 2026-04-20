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

Manual screenshot required:

- `certificate.png` — `/trainee/certificate` is real, but it is only accessible for graduated trainees. The current automated trainee account redirects to `/trainee/progress`, so provide a graduated trainee screenshot manually or run the capture with a graduated trainee account.

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
- Route: first available `/trainee/training/:programId`
- Show:
  - program header
  - lesson pane on the left
  - category rail on the right
  - expanded lesson with content visible
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
- Capture mode: manual unless a graduated trainee account is available.
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
- direct routes for all static trainee pages

If a trainee account has no accessible program data, the script should skip the dynamic program-workspace screenshot rather than overwrite valid images with empty or redirect states.

The automation intentionally does not capture `certificate` with the current trainee account because the route redirects incomplete trainees. Add `public/walkthrough/screenshots/trainee/certificate.png` manually after capturing from a graduated trainee.
