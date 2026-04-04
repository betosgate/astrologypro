# 03 Align Refund Request Preview And Comment Hydration Semantics

- Status: Done

## Why

Next already has a stronger combined preview-and-comments surface than Angular, but the current data parser does not fully match the response shapes Angular actually consumes. That creates a real risk that preview or comments appear empty even when the API call succeeds.

## Current Verified Gap

- Angular preview loads refund detail from `refund-processing/refund-request-list-details` and reads from `res.results`
- Angular comments flow loads from `refund-processing/fetch-refund-request-comment-list-details` and reads from `res.results`
- Next preview currently resolves detail from:
  - `detail.result`
  - `detail.data`
- Next comment thread currently resolves data from:
  - `commentsData.result`
  - `commentsData.data`
- Next does not currently include `results` in either parser

## Required Behavior

- Align refund detail hydration with the response shape used by the working Angular module
- Align comment-thread hydration with the response shape used by the working Angular module
- Preserve the stronger Next interaction model once the data compatibility issue is fixed

## Acceptance Criteria

- preview opens with real refund-request detail data when the endpoint returns `results`
- comment thread renders when the comment-list endpoint returns `results`
- new comments still append correctly after submission
- existing status badge, detail fields, and comment composer continue to work

## Verification Test Plan

1. Open `/admin/refunds`.
2. Launch preview for a refund request that has detail data and comments.
3. Confirm the detail surface renders real values rather than the no-data state.
4. Confirm the comment thread renders existing comments.
5. Add a new comment and confirm it appears in the thread after submission.
6. Reopen the same request and confirm the comment history still hydrates correctly.
