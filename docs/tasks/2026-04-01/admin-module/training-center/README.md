# Training Center Parity Task Index - 2026-04-01

- Module: Admin -> Training -> Training Center
- Angular Source Route: `admin-dashboard/training/training-center`
- Next Route: `/admin/training/center`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review

## Scope Of This Review

This folder contains the validated parity tasks for the first Admin Training module migration review: **Training Center**.

The goal is not to reproduce old AI-generated assumptions. These tasks are based on actual code review of:

- `divine-infinite-being-angular-ui`
- `Divine-infinite-ui-next`

## Verified Current Comparison Summary

### Implemented In Angular But Not Yet In Next

- interactive training player shell with lesson panel plus category sidebar
- route states for training selection and lesson deep-linking
- training progress banner using `training-centre/training-report-percentage`
- sequential training-category lock using `training-centre/is-trainig-complete`
- sequential lesson lock using previous lesson completion checks
- lesson-detail fetch and video-based lesson progression
- mark-as-done flow using `training-centre/done-training-lesson-add`
- next-lesson and next-training progression logic
- all-training-completed modal and restart path
- quiz attempt/view flow using `admin/calculate-quiz-result`
- quiz remediation flow with targeted video replay windows
- assignment submission modal and assignment review modal

### Already Implemented In Next

- training center CRUD list page at `/admin/training/center`
- add form at `/admin/training/center/add`
- edit form at `/admin/training/center/edit/[id]`
- list/search/status/delete wiring for `training-centre/*` admin endpoints

## Recommended Execution Order

1. `01-build-training-center-player-shell-and-routing.md`
2. `02-build-progress-sidebar-and-selection-state.md`
3. `03-build-sequential-guards-mark-done-and-next-navigation.md`
4. `04-build-quiz-attempt-view-and-remediation-flow.md`
5. `05-build-assignment-submission-and-review-flow.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/training/training-routing.module.ts`
- `src/app/astrologer-dashboard/training-center/training-center-routing.module.ts`
- `src/app/astrologer-dashboard/training-center/training-main/training-main.component.ts`
- `src/app/astrologer-dashboard/training-center/training-main/training-main.component.html`
- `src/app/astrologer-dashboard/training-center/training-progress/training-progress.component.ts`
- `src/app/astrologer-dashboard/training-center/training-category-list/training-category-list.component.ts`
- `src/app/astrologer-dashboard/training-center/training-lesson-show/training-lesson-show.component.ts`
- `src/app/astrologer-dashboard/training-center/category-lesson/category-lesson.component.ts`
- `src/app/astrologer-dashboard/training-center/attempt-quiz/attempt-quiz.component.ts`

### Next

- `src/app/(admin)/admin/training/center/page.tsx`
- `src/app/(admin)/admin/training/center/add/page.tsx`
- `src/app/(admin)/admin/training/center/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`

## Notes

- This folder should be treated as the canonical task set for this module.
- The existing `antigravity-claude-response/training-center` folder can be kept as reference only; it should not be treated as the reviewed source of truth.
