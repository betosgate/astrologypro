# 03 Align Decan Video Content Hydration Upload And Submit Semantics

## Why

Angular does not save this module as a flat form. It converts branch-specific fields into a nested `content` object, includes selected-sign metadata, and rehydrates edit state from `content.*` fields. The current Next form does not yet preserve those semantics reliably.

## Current Verified Gap

- Angular edit hydrates branch data from:
  - `formValue.content.title`
  - `formValue.content.description`
  - `formValue.content.youtube_url`
  - `formValue.content.thumbnail_path`
  - `formValue.content.video`
  - `formValue.content.pronuncement_name`
  - `formValue.content.pronuncement_description`
  - `formValue.content.assets`
- Angular save submits:
  - `sign_id` from the selected sign
  - `sign` as the selected sign label
  - nested `content` object for the branch-specific fields
- Angular uploaded-video and pronouncement branches also carry upload-backed values
- Next form currently:
  - resets from flatter top-level fields
  - submits flatter top-level branch fields
  - does not yet align uploaded values and nested `content` save semantics with Angular

## Required Behavior

- Rehydrate edit state from the nested content structure the working module uses
- Align create and edit submit behavior with the nested `content` object
- Preserve upload-backed values for thumbnail, video, and pronouncement assets
- Preserve sign id and sign label semantics in the final payload

## Acceptance Criteria

- uploaded-video records reopen with thumbnail and video data intact
- YouTube-video records reopen with title, description, and YouTube URL intact
- pronouncement records reopen with name, description, and assets intact
- create and edit both submit the expected selected-sign and nested-content semantics

## Verification Test Plan

1. Create an uploaded-video record with thumbnail and video data.
2. Reopen it in edit mode and confirm the uploaded values hydrate correctly.
3. Create a YouTube-video record and confirm the nested content fields reopen correctly.
4. Create a pronouncement record with assets and confirm those values reopen correctly.
5. Change the selected sign on an existing record, save, and reopen it to confirm sign metadata remains correct.
