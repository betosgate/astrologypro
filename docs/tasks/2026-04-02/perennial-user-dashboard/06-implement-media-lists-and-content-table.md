# Task 06 - Implement Media Lists and Content Table - 2026-04-02

- Status: Todo
- Priority: P2
- Parent Task: `00-master-task.md`

## Goal

Migrate the Blog list, Video list, and the general dashboard Content table (Rituals, Documents, etc.).

## Tasks

- [ ] Fetch the Blog list.
    - **Endpoint:** `POST` `blogmanagement/list-for-front-end`
    - **Payload:** `{ "condition": { "limit": 10, "skip": 0 }, "searchcondition": {}, "sort": { "type": "desc", "field": "created_on" }, "project": {}, "token": "" }`
- [ ] Fetch the Video list.
    - **Endpoint:** `POST` `videomanagement/list-for-front-end`
    - **Payload:** `{ "condition": { "limit": 10, "skip": 0 }, "searchcondition": {}, "sort": { "type": "desc", "field": "created_on" }, "project": {}, "token": "" }`
- [ ] Fetch the Dashboard Content listing.
    - **Endpoint:** `POST` `content/content-list-for-frontend`
    - **Payload:** `{ "searchcondition": {}, "sort": { "type": "asc", "field": "priority" }, "project": {}, "token": "" }`
- [ ] Implement media URL construction logic (VERIFIED):
    - **Thumbnails/Images:** `item.thumbnail_path.baseurl + item.thumbnail_path.fileservername`
    - **Documents/S3 Files:** `item.file_path.baseurl + item.file_path.fileservername`
    - **S3 Video Prefix:** `https://awsbackend-dev-patient-files-test.s3.amazonaws.com/` (as per Angular dashboard line 653)
    - **YouTube Embed:** `https://www.youtube.com/embed/VIDEO_ID`

## Done Definition

- Blogs and Videos are displayed in their respective dashboard sections.
- The content table/list is functional and displays priority-ordered items.
- Media links (YouTube embeds, S3 downloads) work correctly.

## Verification Plan

- Confirm the payloads match the Angular component exactly.
- Verify that S3 bucket prefixes are correctly concatenated.
