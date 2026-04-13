# Task 02: User Self-Service View, Download, and Email

## Goal

Give authenticated users a clean way to access their own signed agreements.

## Why This Is Needed

The user requirement is explicit: users can see and download their own signed agreement and send those to themselves by email.

## Required UX

### 1. User agreement list

Create a self-service area where the user can see:

- agreement title
- signed date
- version
- role or purpose

### 2. View behavior

When opening a signed agreement, the user should see the accepted content snapshot, not only the latest public legal page.

### 3. Download behavior

Provide:

- PDF download
- stable filename

Suggested filename pattern:

- `{agreement-type}-{version}-{signed-date}.pdf`

### 4. Email-to-self action

Allow the user to request an email containing:

- agreement title
- signed date
- attachment or secure download link

### 5. Scope restrictions

A user must only be able to access agreements they themselves accepted.

## Files Likely In Scope

- new user-facing legal/agreement page
- new self-service agreement API endpoints
- email template(s)

## Acceptance Criteria

- users can list, open, download, and self-email their own signed agreements
- users cannot access another user’s agreements
