# 03 End-to-End QA Checklist - 2026-04-15

- Status: Planned
- Priority: P0
- Owner: QA / Full-stack
- Parent: `00-master-task.md`
- Task File: `tasks/15.04.2026/astro-charts-api/03-end-to-end-qa-checklist.md`

## Goal

Ensure the fixed API and frontend behavior functions correctly together across all defined edge cases and normal use cases.

## Test Matrix

| State Tested | Steps | Expected Result | Pass/Fail |
|---|---|---|---|
| Never Generated | 1. Access dashboard with a fresh user without generated charts. | UI immediately shows "Missing Data" or similar state without spinning endlessly. | - |
| Chart Generation Init | 1. Trigger chart generation for a user. <br> 2. Observe dashboard immediately following trigger. | UI enters "Your chart is being prepared..." mode. Network tool shows regular polling. | - |
| Chart Complete | 1. Wait for completion, or login as a user whose chart is already generated. | UI shows the generated chart data immediately. Polling ceases. | - |
| Generation Timeout | 1. Simulate a backend failure during generation where the pending state remains but no chart ever completes. | UI spins up to the timeout threshold, then smoothly degrades to an error/timeout state. | - |

## Acceptance Criteria

- [ ] All rows in the test matrix pass.
- [ ] No regression introduced to the core application layout or routing.
- [ ] Browser developer tools network tab confirms that infinite polling effectively stops when intended.
