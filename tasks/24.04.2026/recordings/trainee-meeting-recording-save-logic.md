# Trainee Meeting Recording Save Logic

## Goal

Document the actual recording flow for trainee meetings opened from the trainee dashboard route `/trainee`, and explain how short S3 recording chunks are supposed to become one playable recording and get saved to the database.

## Short answer

The database does **not** store the concatenated video file itself.

The current flow is:

1. Chime records the meeting into many small S3 segment files under `recordings/{bookingId}/...`.
2. When the session ends, the app starts an AWS **Media Concatenation Pipeline**.
3. AWS writes a merged file into `recordings/{bookingId}/final/`.
4. Later, the sync job finds that final file, generates a signed URL, and saves that URL into the DB.

So:

- S3 stores the raw chunks first.
- AWS concatenates them into a final MP4.
- Supabase stores only `recording_url` and `recording_share_id`.

## Which trainee flow uses this

For trainee-side practice sessions:

- `/trainee` and `/trainee/sessions` load trainee bookings from `src/app/api/trainee/appointments/route.ts`
- joining an `admin_bookings` session goes through `src/app/api/trainee/appointments/admin-bookings/[id]/join/route.ts`
- that redirects to `/book/{adminUsername}/session/{bookingId}`
- the actual Chime join for trainee/admin sessions is handled by `src/app/api/chime/admin-bookings/join/route.ts`

This means trainee dashboard recordings are tied to the `admin_bookings` table, not the legacy `bookings` table.

## Actual recording lifecycle

### 1. Meeting starts

File: `src/app/api/chime/admin-bookings/join/route.ts`

When the host admin joins for the first time:

- `startChimeRecording(activeMeetingId, "recordings/{bookingId}")` is called
- the returned pipeline ARN is saved into `admin_bookings.chime_pipeline_id`

This is the pipeline that writes raw recording artifacts into S3.

## 2. Why S3 has many 5-second files

File: `src/lib/chime-meetings.ts`

`startChimeRecording()` creates an AWS **Media Capture Pipeline**.

That pipeline does **not** write one final MP4 immediately. It writes multiple recording artifacts and composited video chunks into S3 while the call is live. That is why you see many short `.mp4` files.

This part is expected.

## 3. How concatenation is supposed to happen

Files:

- `src/app/api/chime/admin-bookings/end/route.ts`
- `src/lib/chime-meetings.ts`

When the session ends, the app should do this exact order:

1. `stopChimeRecording(chime_pipeline_id)`
2. wait `3000ms`
3. `startChimeConcatenation(chime_pipeline_id, bookingId)`
4. `endChimeMeeting(chime_meeting_id)`

`startChimeConcatenation()` creates an AWS **Media Concatenation Pipeline** and writes the merged output to:

`recordings/{bookingId}/final/`

Important: this concatenation happens in AWS/S3, not inside Supabase and not inside the frontend.

## 4. What gets saved in DB

File: `src/app/api/cron/sync-recordings/route.ts`

The cron job checks pending rows in:

- `bookings`
- `admin_bookings`
- `phone_sessions`

For trainee sessions it looks at `admin_bookings`.

The sync logic:

1. list S3 objects under `recordings/{bookingId}/`
2. prefer a file inside `/final/`
3. if `/final/` is not ready yet, wait for concatenation first
4. if still needed, fall back to the largest playable segment
5. generate a 7-day signed S3 URL
6. update DB row with:
   - `recording_url`
   - `recording_share_id`

So the DB save is only:

- `admin_bookings.recording_url`
- `admin_bookings.recording_share_id`

## Final video link

There are two important "final link" forms in this flow:

### 1. Final S3 file location

After AWS concatenation succeeds, the merged MP4 is written under:

`recordings/{bookingId}/final/{aws-generated-file}.mp4`

Example:

`recordings/BOOKING_UUID/final/FINAL_RECORDING.mp4`

This is the final video object path inside the S3 bucket configured by:

`CHIME_RECORDING_BUCKET`

So the raw S3-style final file reference is:

`s3://{CHIME_RECORDING_BUCKET}/recordings/{bookingId}/final/{aws-generated-file}.mp4`

### 2. Final link saved in database

The app does not save the raw S3 path in normal success flow.

It generates a **presigned URL** for the final file and saves that URL into:

`admin_bookings.recording_url`

So the real final video link for the app is:

`admin_bookings.recording_url`

That value is generated from the final S3 object under:

`recordings/{bookingId}/final/`

### 3. Share page link

After sync, the app also saves:

`admin_bookings.recording_share_id`

Using that, the shareable app URL becomes:

`/session/{recording_share_id}/recording`

Example:

`https://astrologypro.com/session/SHARE_ID/recording`

## Final link summary

For trainee meetings, think of the final video links like this:

1. Final S3 merged file:
   `s3://{CHIME_RECORDING_BUCKET}/recordings/{bookingId}/final/{aws-generated-file}.mp4`
2. Final app playback URL stored in DB:
   `admin_bookings.recording_url`
3. Final share page URL:
   `/session/{admin_bookings.recording_share_id}/recording`

Optionally, the legacy `video_sessions.recording_url` mirror is updated for legacy booking flows, but trainee recording ownership is really on `admin_bookings`.

## 5. How trainee playback works if final concatenation is missing

Files:

- `src/app/api/bookings/[id]/recording-segments/route.ts`
- `src/components/trainee/session-explorer.tsx`

If a final recording URL is missing or incomplete, the UI can still fetch all raw segment files from S3 using `/api/bookings/[id]/recording-segments`.

That endpoint:

- lists all `composited-video` segment files
- sorts them in order
- returns presigned URLs for each segment

So currently there are two playback modes:

1. normal mode: play `recording_url` from DB
2. fallback mode: sequentially play raw segments from S3

## Why you may still be seeing only 5-second recordings

If only short files are available, usually one of these is happening:

1. The session did not end through `POST /api/chime/admin-bookings/end`, so concatenation never started.
2. The capture pipeline stopped, but concatenation failed or has not completed yet.
3. The sync job ran before the `/final/` file existed and fell back to a single segment.
4. The meeting was deleted too early in an older/broken flow, so only early flushed chunks survived.

There is already a code comment in `src/app/api/chime/admin-bookings/end/route.ts` saying this exact ordering was added because deleting the meeting too early was producing 5-second recordings.

## Important gap in current code

File: `src/app/api/chime/webhook/route.ts`

The Chime webhook currently updates:

- `bookings`
- `video_sessions`

It does **not** update `admin_bookings`.

That means trainee/admin recordings depend mainly on:

- successful `admin-bookings/end`
- successful AWS concatenation
- successful `/api/cron/sync-recordings`

and not on the webhook for final persistence.

## Final logic to rely on for trainee recordings

For `/trainee` meetings, the correct save logic should be understood as:

1. trainee opens session from `/trainee`
2. session joins `admin_bookings` meeting
3. host join starts Chime capture pipeline
4. Chime stores many short raw files in S3
5. end-session route stops capture and starts AWS concatenation
6. AWS creates one final MP4 in `recordings/{bookingId}/final/`
7. sync job generates signed URL for that final file
8. sync job updates `admin_bookings.recording_url` and `admin_bookings.recording_share_id`
9. trainee dashboard/player reads the saved URL from DB, or falls back to segment playback

## What is not happening

The app is **not**:

- concatenating video inside the browser
- concatenating video inside Supabase
- storing MP4 binary data in the database

It stores only metadata and access URLs in the database.

## Recommended check list if this is failing in production

1. Verify `admin_bookings.chime_pipeline_id` is saved on first host join.
2. Verify `POST /api/chime/admin-bookings/end` is actually called when the trainee/admin session ends.
3. Verify S3 has both:
   - raw segment files under `recordings/{bookingId}/`
   - a merged file under `recordings/{bookingId}/final/`
4. Verify `/api/cron/sync-recordings` is running after the meeting ends.
5. Verify `admin_bookings.recording_url` and `admin_bookings.recording_share_id` are updated after sync.

## Conclusion

The 5-second files in S3 are normal raw Chime capture segments. They are supposed to be merged by AWS concatenation after the session ends. The database should then save only the final signed URL and share ID, mainly on the `admin_bookings` row for trainee sessions.

If you only see short recordings in the app, the most likely break is in the **end-session -> concatenation -> sync-recordings** chain, not in Stripe and not in database storage itself.
