# Mystery School Visual Parity And Interaction Consistency

- Status: Ready For Implementation
- Date: 2026-04-08
- Category: Mystery School Dashboard
- Owner: Frontend
- Priority: P2
- Task File: `tasks/08.04.2026/mystery-school/03-visual-parity-and-interaction-consistency.md`

## Goal

After aligning the shell and nav behavior, refine the Mystery School dashboard so it feels visually consistent with the quality and structure of the Perennial dashboard.

## Problem

Even where Mystery School is functional, it still feels less systematized than Perennial:

1. section hierarchy is thinner
2. dashboard framing is less consistent
3. page rhythm feels more bespoke and less reusable
4. navigation behavior and page composition do not feel part of one unified portal system

This task is not asking for new features. It is asking for cleanup and parity using what already exists.

## Required Areas Of Review

Review the Mystery School shell and top-level pages against Perennial for:

1. section hierarchy
2. spacing rhythm
3. sidebar/content relationship
4. title/subtitle treatment
5. card grouping and density
6. consistency of nav active-state behavior
7. consistency of account/portal chrome placement

## Required Improvements

1. Keep Mystery School-specific visual identity where it already exists, especially gold-on-dark thematic accents.
2. Align layout rhythm with Perennial so the pages feel like the same product family.
3. Prefer shared dashboard framing patterns and component usage over one-off presentation choices.
4. Reduce visual friction created by the current shell mismatch.

## Explicit Non-Goals

Do not:

1. invent new dashboard modules
2. redesign Mystery School branding
3. rebuild all page internals if the issue is only shell-level inconsistency
4. turn this into a broad rebrand or design exploration task

## Junior-Friendly Notes

This task is about polish with discipline.

Do not change things randomly because they "look nicer."

Each refinement should answer one of these questions:

1. does this make Mystery School look more consistent with Perennial?
2. does this reduce confusion?
3. does this make the dashboard feel more intentionally structured?

If not, it probably does not belong in this task.

## Codex / AI-Agent Guidance

When implementing:

1. use existing shared components first
2. do not fork styling patterns unnecessarily
3. avoid introducing a second dashboard visual system
4. make visual refinements proportional to the actual parity problem

## Acceptance Criteria

1. Mystery School shell no longer feels like a separate dashboard system
2. visual hierarchy is closer to Perennial quality
3. nav, shell, and page framing feel coherent together
4. the result reads as refinement and parity work, not unrelated redesign work
