# Task: Testimonial Add Form Modification

**Date:** 2026-04-01
**Status:** Done
**Verified 2026-04-08:** Already Done — src/app/admin/testimonials/create/page.tsx + src/app/api/admin/testimonials/.

## Objective
Modify the existing "Create Testimonial" form to incorporate multi-media upload capabilities (Images, Audio, Video) and advanced field validation, bridging the gap between the legacy portal functionality and the new modern dashboard UI.

## UI Transformation

### 1. Legacy UI (Reference)
The legacy form featured distinct horizontal sections for:
- Core details (Title, Name, Email, Phone, Astrologer).
- A rich text editor for feedback content.
- Dedicated upload bars for **Images**, **Audio**, and **Video** with "Browse or Drop" functionality.
- A simple "Active" checkbox and orange "Submit", "Cancel", "Reset" buttons.

### 2. Modern UI (Target)
The new form should maintain the premium dark-themed design system:
- Grouped "Testimonial Details" section.
- Modern input fields with subtle borders and clear labels.
- Integration of the media upload sections into the modern aesthetic (e.g., using card-based uploaders or sleek drag-and-drop zones).
- Transition from a checkbox to a modern "Active" toggle switch.

## Media Section Requirements
- **Upload Images**: Standard image uploader with preview and multi-file support.
- **Upload Audio**: Audio file uploader (MP3, WAV).
- **Upload Videos**: Video file uploader (MP4, etc.).
- **Consistency:** Ensure the uploaders match the styling of the modern dashboard components.

### Media Field Mapping
The following fields in the payload explicitly correspond to the file upload sections in the UI:

| UI Section | Payload Field | Data Type | Description |
| :--- | :--- | :--- | :--- |
| **Upload Images** | `images` | `Array<Object>` | Array of uploaded image files or their metadata objects. |
| **Upload Audio** | `audio` | `Array<Object>` | Array of uploaded audio files (e.g., MP3, WAV). |
| **Upload Videos** | `video` | `Array<Object>` | Array of uploaded video files (e.g., MP4). |

## Tasks
- [ ] Update `/admin/testimonials/create` component.
- [ ] Add the `images`, `audio`, and `video` upload sections to the form.
- [ ] Map all fields correctly to the backend schema.
- [ ] Implement toggle switch for active status.
- [ ] Standardize Submit/Cancel button styling.
