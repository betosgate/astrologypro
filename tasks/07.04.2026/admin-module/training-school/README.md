# Training School Follow-Up Task Index

## Purpose
This folder contains the second-pass Training School execution pack. It only targets gaps that remain after the first pass in:

- `tasks/06.04.2026/admin-module/training-school`

## How To Use This Pack
- Start from `00-master-task.md`.
- Execute tasks in listed order unless a task explicitly says it can run in parallel.
- Treat each child task as implementation-ready, not as an open-ended investigation.
- If current repo behavior conflicts with a child task, follow the child task unless doing so would break an explicit schema/API constraint.

## Current Follow-Up Scope
- enforce global sequential lock in learner APIs
- fix runtime stability of `/trainee/training`
- wire trigger-based quiz playback into the real trainee lesson page
- move lesson completion authority from legacy full-lesson quiz flow to trigger completion
- store exact playback resume state and improve trigger persistence
- align sidebar locking and next-item routing with the final progression model
- align graduation and certificate flow with the final completion model

## Excluded From This Follow-Up
- basic admin CRUD for programs, categories, and lessons
- basic lesson assets and videos support
- already-implemented analytics mean/median calculations
- Mystery School community training flows unless they directly depend on Training School completion behavior

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
If an item is already fully implemented, do not restate it here. This folder is only for unresolved or partially implemented work.
