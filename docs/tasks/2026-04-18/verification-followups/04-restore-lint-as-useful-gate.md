# Task VF-04 - Restore Lint as a Useful Gate

- Status: Not Started
- Priority: P1
- Owner: Full Stack
- Area: Code quality / CI
- Source: Local verification of `docs/tasks/2026-04-17`
- Created: 2026-04-18

## Files

- `eslint.config.mjs`
- `next.config.ts`
- affected React client components

## Problem

`npm run lint` fails with 413 problems:

- 188 errors
- 225 warnings

Many errors are React compiler lint rules such as:

- `react-hooks/set-state-in-effect`
- `react-hooks/static-components`
- `react-hooks/purity`

Build currently skips TypeScript errors and has an invalid `eslint` key in `next.config.ts` for Next 16.

## Implementation

1. Remove or replace the invalid `eslint` config from `next.config.ts`.
2. Decide whether React compiler lint rules are intended to be blocking in this project.
3. Fix or explicitly tune lint rules so `npm run lint` is actionable.
4. Do not silence new sprint-specific issues without review.

## Acceptance Criteria

- `npm run lint` completes successfully, or the remaining failures are intentionally documented and scoped.
- `next.config.ts` no longer produces the Next 16 invalid config warning for `eslint`.
- Build no longer relies on unsupported lint config.

## Verification

```bash
npm run lint
npm run build
```
