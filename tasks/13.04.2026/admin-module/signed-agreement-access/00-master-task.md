# Signed Agreement Access Pack

## Objective

Allow:

- users to see their own signed agreements
- users to download their own signed agreements
- users to email signed agreements to themselves
- admin to do the same from backend tools

This must work on the signed agreement the user actually accepted, not only on the currently active legal document template.

This pack is architecture only. It does not implement code or migrations.

## Current Repo Grounding

### Existing legal document and acceptance system

The repo already has:

- legal document management
- legal document viewing
- legal acceptance tracking

Relevant files:

- `src/app/api/legal/status/route.ts`
- `src/app/api/legal/accept/route.ts`
- `src/app/api/admin/legal/route.ts`
- `src/app/api/admin/legal/[id]/route.ts`
- `src/app/legal/[type]/page.tsx`

### Current limitation

There is no current flow for:

- fetching a user’s own signed agreement document snapshot
- generating a downloadable artifact of that agreement
- emailing a signed agreement copy
- admin sending the signed agreement to the user from backend tools

The current legal system is document-type and acceptance-row based, not signed-agreement artifact based.

## Product Direction

The correct model is:

1. rendered agreement snapshot
2. user acceptance tied to that snapshot
3. downloadable representation of the signed artifact
4. self-service access for the signer
5. admin access and resend tools

## Workstreams

1. `01-signed-agreement-artifact-model.md`
2. `02-user-self-service-view-download-and-email.md`
3. `03-admin-backoffice-access-and-resend-tools.md`
4. `04-pdf-download-and-rendering-standards.md`
5. `05-permissions-audit-and-delivery-logging.md`

## Acceptance Standard

This feature is complete only when:

- users can access their own signed agreements only
- admin can access signed agreements from backend tools
- download is tied to the accepted agreement snapshot
- email delivery is logged and auditable
- the artifact is stable even if the template changes later

## Status

- `01-signed-agreement-artifact-model.md` — Done
- `02-user-self-service-view-download-and-email.md` — Done
- `03-admin-backoffice-access-and-resend-tools.md` — Done
- `04-pdf-download-and-rendering-standards.md` — Done
- `05-permissions-audit-and-delivery-logging.md` — Done
