# Task 03: Admin Backoffice Access and Resend Tools

## Goal

Allow admin to access signed agreements from backend tools and send them by email when needed.

## Why This Is Needed

Admin needs to help with:

- compliance requests
- support issues
- user disputes
- resend requests

The requirement explicitly says admin can do the same.

## Required Admin UX

### 1. Agreement access in admin

From admin legal or user-management views, admin should be able to:

- view acceptance history for a user
- open a signed agreement artifact
- download the artifact

### 2. Email actions

Admin should be able to:

- send the signed agreement to the user’s own email
- optionally send it to another verified destination only if product policy explicitly allows it

For now, safest default is:

- resend to the account email only

### 3. Searchability

Admin should be able to find signed agreements by:

- user
- agreement type
- version
- acceptance date

## Acceptance Criteria

- admin can retrieve and resend signed agreements from backend tools
- resend behavior is bounded and auditable
