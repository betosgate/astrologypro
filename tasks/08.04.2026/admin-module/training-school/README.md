# Training School UX and Quiz Follow-Up Task Index

## Purpose
This folder contains the next Training School execution pack for the trainee-facing experience changes requested on April 8, 2026.

## Scope Of This Pack
- strengthen sequential-lock behavior and blocked-access feedback
- redesign program entry so `Start Program` lands on a structured program workspace instead of deep-linking straight to a lesson
- redesign the top-level Training Center overall-progress summary
- replace the current batch-submit lesson quiz flow with stepwise remediation tied to video timestamps

## How To Use This Pack
- Start from `00-master-task.md`.
- Execute tasks in listed order unless a task explicitly says it can run in parallel.
- Treat each child task as implementation work, not as open-ended product exploration.
- Reuse existing learner APIs, progress tables, and trigger/video infrastructure where they already solve part of the requirement.

## Standard Child Task Pattern
Each task in this folder should define:
- Objective
- Why This Task Exists
- Current Repo State
- Exact Gap
- Fixed Behavior Decisions
- Required Implementation
- Files To Read First
- Likely Files To Change
- API and Schema Constraints
- Dependencies
- Acceptance Criteria
- Verification Test Plan
- Out Of Scope

## Working Rule
If a requested UX detail can be satisfied by extending an existing source of truth, do that instead of introducing a second computation path for the same learner state.
