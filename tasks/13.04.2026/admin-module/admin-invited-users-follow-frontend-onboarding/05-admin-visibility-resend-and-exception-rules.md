# 05 Admin Visibility Resend and Exception Rules

## Goal

Define what admin can do operationally without breaking the standard frontend flow.

## Admin Must Be Able To

- send invites
- resend invites
- see whether invite was accepted
- see whether onboarding is complete

## Admin Must Not Do By Default

- bypass the standard onboarding stepper
- mark onboarding complete unless there is an explicit backoffice override policy

## Deliverables

- admin visibility requirements
- resend rules
- controlled exception policy

## Status

Done.

The existing admin invitation backoffice already covers this operational surface through `src/app/admin/invitations/page.tsx`, `src/components/admin/invitations-client.tsx`, `src/app/api/admin/invitations/route.ts`, and related detail or resend endpoints. Admin can inspect invite status and resend invites without bypassing frontend onboarding completion.
