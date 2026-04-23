# Task: Recording Display and Session Exit Redirects

This task addresses three critical UI/UX issues in the meeting workflow for Admins and Trainees.

## 1. Post-Meeting Redirect Logic
### Issue
Currently, when a session ends (e.g., at `/book/[username]/session/[bookingId]`), both participants are redirected to `/dashboard/bookings` by default. This is only appropriate for standard Diviners. 
- **Admins** should be redirected to `/admin/my-bookings` to stay within their management console.
- **Trainees** should be redirected to `/trainee` to return to their learning portal.

### Solution
Modify the `ChimeSessionRoom` component to conditionally set the redirect URL based on the `joinApiPath` or a new prop:
- Check if `joinApiPath` includes `/admin-bookings/`.
- If `role === 'diviner'`, redirect to `/admin/my-bookings`.
- If `role === 'client'`, redirect to `/trainee`.
- Otherwise, fallback to the standard `/dashboard/bookings` (for Diviners) and `/portal/bookings` (for standard Clients).

---

## 2. Admin Dashboard: Recording & Session Details
### Issue
The "Booking Details" sidebar in `admin/my-bookings` was not displaying meeting recordings or actual session duration/metadata for completed meetings, making it difficult for admins to review past sessions.

### Solution
- **Frontend**: Update `BookingDetailSheet` to allow fetching session details (via `/api/bookings/[id]/session-details`) even when `detailsOnly` is true (which is the case for admin bookings).
- **Backend**: Ensure the `sync-recording` API supports the `admin_bookings` table so that missing recordings can be manually pulled from S3 into the database.
- **Status**: [COMPLETED] 
    - `BookingDetailSheet` updated to fetch metadata for all booking types.
    - `sync-recording` API updated to support cross-table lookups.

---

## 3. Trainee Dashboard: Recording & Session Details
### Issue
Trainees cannot view their practice session recordings or session metadata in the `trainee/sessions` route. The current list only shows basic status and time information without the ability to "See Details" and watch the recording.

### Solution
- **UI Integration**: Replace the simple `Card` display in `src/app/trainee/sessions/page.tsx` with the `BookingDetailSheet` component.
- **Configuration**:
    - Set `viewerRole="client"` to ensure a read-only view.
    - Pass the booking object with the relative `id` and `status`.
    - Ensure the `actionBasePath` is correctly set if they need to reschedule (though trainees usually reschedule via mentors).
- **Benefit**: This centralizes the recording player logic so trainees can review their sessions directly in their dashboard.

---

## Next Steps
- [x] Implement conditional redirect logic in `components/session/chime-session-room.tsx`.
- [x] Integrate `BookingDetailSheet` into `src/app/trainee/sessions/page.tsx`.
- [x] Verify recordings are playable from the Trainee portal.
