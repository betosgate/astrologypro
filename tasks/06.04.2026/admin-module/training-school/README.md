# Training School Task Index - AI Ready

## Purpose
This folder is the canonical AI execution pack for implementing the Training School requirements against the current AstrologyPro codebase.

## Why This Version Is AI-Ready
Each task is written to reduce ambiguity by including:
- objective
- current repo state
- exact gap
- required implementation
- likely affected files
- API/schema constraints
- dependencies
- acceptance criteria
- verification plan
- out of scope

## Folder Structure
- `00-master-task.md`
- `01-governance/`
- `02-authoring/`
- `03-learner-experience/`
- `04-reporting-and-certification/`
- `09-requirements-traceability-checklist.md`

## Current Repo Coverage
- hierarchy: `training_programs` -> `training_categories` -> `training_lessons`
- priority fields on program/category/lesson
- sequential flags on program/category
- previous lesson linkage on lesson
- training settings and role access
- lesson videos and lesson assets
- learner progress and completion caches
- admin analytics
- certificate verification

## Major Remaining Gaps
- global training governance setting for sequential lock
- exact next-item routing rule for incomplete training re-entry
- richer lesson delivery authoring alignment
- slide-triggered video quiz engine
- rewatch enforcement after wrong answers
- finalized reporting matrix
- finalized completion-time metric set
- final certificate trigger validation

## Working Rule
Requirement wording can differ from repo naming. Keep repo naming if it already carries the correct business function.
