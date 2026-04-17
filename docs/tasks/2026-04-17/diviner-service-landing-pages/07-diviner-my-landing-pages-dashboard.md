# Task 07 - Diviner Dashboard: Landing Pages List + Page Builder UI - 2026-04-17

- Status: Not Started
- Priority: P0
- Owner: Frontend
- Parent: `00-master-task.md`
- Phase: 5 - Diviner Dashboard + Page Builder UI
- Depends On: Tasks 01, 02, 05, 06
- Blocks: Task 08

## Goal

Build the complete diviner-facing UI for managing landing pages. This includes:
1. **Landing Pages list** — see all enabled services with status, stats, and actions
2. **Page Builder** — full visual editor with drag-and-drop sections, section editors per type, live preview, and publish workflow
3. **Preview mode** — render draft pages for diviner review before publishing

## Existing Assets to Reuse

| Asset | Path | Purpose |
|---|---|---|
| shadcn/ui (35+ components) | `src/components/ui/` | Cards, Dialogs, Buttons, Switch, Badge, Tabs, Sheet, Form, Select, etc. |
| Tiptap rich text editor | `src/components/ui/rich-text-editor.tsx` | Rich text editing in bio, text_content, rich_content sections |
| HTML editor | `src/components/ui/html-editor.tsx` | Advanced editing for rich_content sections |
| Media upload form | `src/components/dashboard/media-item-form.tsx` | Reuse upload pattern for image/gallery sections |
| Supabase Storage | bucket `all-frontend-assets` | Image storage for landing page sections |
| sonner (toasts) | `sonner@^2.0.7` | Success/error notifications |
| react-hook-form | `@hookform/resolvers@^5.2.2` | Form handling per section editor |
| Zod | `zod@^4.3.6` | Client-side validation matching server schemas |
| lucide-react | `lucide-react@^1.7.0` | Icons for section types |

**Must install (from Task 06):**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Implementation Steps

### Part 1: Landing Pages List Page

#### Step 1: Landing Pages List API

**File to create:** `src/app/api/dashboard/landing-pages/route.ts`

```
GET /api/dashboard/landing-pages
- Auth: diviner
- Query params: ?search=&status=&category=&sort_by=&sort_dir=
- Returns: {
    landing_pages: [
      {
        diviner_service_id: "uuid",
        template_id: "uuid",
        template_name: "Nativity Birth Chart",
        template_slug: "nativity-birth-chart",
        template_category: "astrology",
        template_icon: "star",

        // Landing page state
        has_landing_page: true,             // does service_landing_pages row exist?
        landing_page_id: "uuid" | null,
        landing_page_status: "published" | "draft" | "unpublished" | null,
        section_count: 8,                   // total sections including system
        custom_section_count: 5,            // non-system sections
        published_at: "2026-04-10T...",
        moderation_status: "approved",

        // Service access state
        is_enabled: true,
        is_published: true,
        publish_status: "published",

        // URLs
        public_url: "/luna/services/nativity-birth-chart",
        preview_url: "/luna/services/nativity-birth-chart?preview=true",
        builder_url: "/dashboard/landing-pages/{templateId}/builder",

        // Quick stats (last 30 days)
        stats: {
          views: 245,
          unique_visitors: 180,
          bookings_completed: 15,
          conversion_rate: 6.12
        },

        // Pricing
        price: 175.00,
        duration_minutes: 90,

        updated_at: "2026-04-15T..."
      },
      ...
    ],
    summary: {
      total_enabled: 8,
      total_published: 6,
      total_draft: 2,
      total_views_30d: 1200,
      total_bookings_30d: 45
    }
  }
```

#### Step 2: Landing Pages List Page

**File to create:** `src/app/dashboard/landing-pages/page.tsx`

**Layout:**
```
+------------------------------------------------------------------+
| My Landing Pages                                                  |
+------------------------------------------------------------------+
| 8 services enabled | 6 published | 2 drafts | 1,200 views (30d) |
+------------------------------------------------------------------+
| Search: [____________]                                            |
| [All Categories v] [All Status v]  Sort: [Most Views v]          |
+------------------------------------------------------------------+
|                                                                   |
| +--------------------------------------------------------------+ |
| | [STAR]  Nativity Birth Chart               PUBLISHED  [green] | |
| |  Astrology | 90 min | $175 | 5 custom sections                | |
| |  Views: 245 | Bookings: 15 | Conversion: 6.1%                 | |
| |                                                                | |
| |  [Open Builder]  [Preview]  [Copy Link]  [Analytics]           | |
| +--------------------------------------------------------------+ |
|                                                                   |
| +--------------------------------------------------------------+ |
| | [MOON]  Weekly Transits                       DRAFT  [amber]  | |
| |  Astrology | 30 min | $65 | 3 custom sections                 | |
| |  Not published yet                                             | |
| |                                                                | |
| |  [Open Builder]  [Preview]  [Publish]                          | |
| +--------------------------------------------------------------+ |
|                                                                   |
| +--------------------------------------------------------------+ |
| | [CARDS] 3 Card Basic Question            NO PAGE YET  [grey]  | |
| |  Tarot | 20 min | $35                                         | |
| |  No landing page created yet                                   | |
| |                                                                | |
| |  [Start Building]                                              | |
| +--------------------------------------------------------------+ |
|                                                                   |
+------------------------------------------------------------------+
```

**Card states:**

| State | Badge | Actions |
|---|---|---|
| No landing page yet | Grey "No Page" | [Start Building] |
| Draft (never published) | Amber "Draft" | [Open Builder] [Preview] [Publish] |
| Published | Green "Published" | [Open Builder] [Preview] [Copy Link] [Analytics] [Unpublish] |
| Unpublished | Grey "Unpublished" | [Open Builder] [Preview] [Publish] |
| Flagged by admin | Red "Flagged" | [Open Builder] — with warning banner |

**Empty state (no enabled services):**
```
No landing pages available.
Your account does not have any services enabled yet.
Contact support to get started.
```

**Copy Link:** Copies `https://{domain}/{username}/services/{slug}` to clipboard with toast.

#### Step 3: Add Navigation Link

**File to modify:** Dashboard layout/navigation

Add "Landing Pages" to diviner dashboard sidebar:
```
icon: LayoutTemplate (from lucide-react)
label: "Landing Pages"
href: "/dashboard/landing-pages"
badge: count of published pages (optional)
```

Position after "Services" in the navigation order.

---

### Part 2: Page Builder UI

#### Step 4: Page Builder Layout

**File to create:** `src/app/dashboard/landing-pages/[templateId]/builder/page.tsx`

This is the main page builder — the most complex UI component in this sprint.

**Layout:**
```
+------------------------------------------------------------------+
| ← Back to Landing Pages                                          |
| Page Builder: Nativity Birth Chart                                |
| Status: Draft (v2)  |  Last saved: 2 minutes ago                 |
| [Preview]  [Save Draft]  [Publish]                                |
+------------------------------------------------------------------+
|                          |                                        |
|  SECTIONS                |  SECTION EDITOR                        |
|  (left panel)            |  (right panel)                         |
|                          |                                        |
|  ┌──────────────────┐    |  ┌──────────────────────────────────┐  |
|  │ 🔒 Hero Section  │    |  │  Bio / Introduction               │  |
|  │    [always first] │    |  │                                    │  |
|  ├──────────────────┤    |  │  Heading:                          │  |
|  │ 🔒 Pricing       │    |  │  [About Me___________________]    │  |
|  │    [system]       │    |  │                                    │  |
|  ├──────────────────┤    |  │  Content:                          │  |
|  │ ≡ Bio            │◄───┤  │  [Rich text editor_____________]  │  |
|  │   [enabled] ●    │    |  │  [B I U S | H1 H2 | • | ↺ ↻]    │  |
|  ├──────────────────┤    |  │  [________________________________]│  |
|  │ ≡ Expertise      │    |  │  [________________________________]│  |
|  │   [enabled] ●    │    |  │                                    │  |
|  ├──────────────────┤    |  │  Image:                            │  |
|  │ ≡ What's Included│    |  │  [Upload] [Remove]                 │  |
|  │   [enabled] ●    │    |  │  [current image preview]           │  |
|  ├──────────────────┤    |  │                                    │  |
|  │ ≡ FAQ            │    |  │  Image Position: [Left v]          │  |
|  │   [disabled] ○   │    |  │                                    │  |
|  ├──────────────────┤    |  │           [Save Section] [Revert]  │  |
|  │ 🔒 Booking CTA   │    |  └──────────────────────────────────┘  |
|  │   [always last]   │    |                                        |
|  └──────────────────┘    |                                        |
|                          |                                        |
|  [+ Add Section]         |                                        |
|                          |                                        |
+------------------------------------------------------------------+

Page Settings:
  ┌──────────────────────────────────────────────────────────────┐
  │  Custom Page Title:  [________________________________]       │
  │  Accent Color:       [#______ ] [picker]                      │
  │  SEO Title:          [________________________________] 0/70  │
  │  SEO Description:    [________________________________] 0/160 │
  │  OG Image:           [Upload]                                  │
  └──────────────────────────────────────────────────────────────┘
```

**Builder behavior:**

1. **Left panel (Section List):**
   - Shows all sections in display_order
   - System sections (hero, pricing, booking_cta) have a lock icon and cannot be dragged
   - Custom sections have a drag handle (≡) for reordering
   - Each section shows: name, enabled/disabled toggle, selected indicator
   - Click a section to open its editor in the right panel
   - Drag to reorder (using @dnd-kit)
   - [+ Add Section] button at bottom

2. **Right panel (Section Editor):**
   - Shows the editor form for the currently selected section
   - Form fields change based on section_type
   - [Save Section] saves draft content via PATCH API
   - [Revert] discards unsaved changes and reloads from server
   - Auto-save after 5 seconds of inactivity (optional, configurable)

3. **Top bar:**
   - Back link to landing pages list
   - Page status badge
   - Version indicator (draft v2, published v1)
   - Last saved timestamp
   - [Preview] opens `/{username}/services/{slug}?preview=true` in new tab
   - [Save Draft] saves page-level settings
   - [Publish] publishes all draft sections → confirmation dialog

#### Step 5: Drag-and-Drop Section Reordering

**File to create:** `src/components/dashboard/builder/section-list.tsx`

```typescript
"use client";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// SortableSectionItem component wraps each section card
// System sections (is_reorderable = false) are NOT draggable — rendered as static items
// Custom sections are draggable — rendered with SortableContext

// On drag end:
// 1. Calculate new display_order values
// 2. PATCH /api/dashboard/landing-pages/{templateId}/sections/reorder
// 3. Update local state optimistically
// 4. If API fails, revert to previous order + show error toast
```

**Accessibility:** @dnd-kit supports keyboard reordering (Tab + Space + Arrow keys). Include aria labels on drag handles.

#### Step 6: Section Editor Components

**File to create:** `src/components/dashboard/builder/section-editors/`

One editor component per section type. Each receives the section data and provides a form.

```
src/components/dashboard/builder/section-editors/
  hero-editor.tsx
  pricing-editor.tsx
  booking-cta-editor.tsx
  bio-editor.tsx
  expertise-editor.tsx
  text-content-editor.tsx
  image-banner-editor.tsx
  cta-editor.tsx
  faq-editor.tsx
  video-embed-editor.tsx
  testimonials-editor.tsx
  gallery-editor.tsx
  rich-content-editor.tsx
  whats-included-editor.tsx
  who-its-for-editor.tsx
```

**Each editor must:**
1. Use react-hook-form with Zod resolver matching the section type schema
2. Show relevant fields based on content_json structure
3. Include the Tiptap RichTextEditor for HTML fields
4. Include image upload for image fields (reuse media upload pattern)
5. Validate on client before submitting
6. Call PATCH API on save
7. Show loading state during save
8. Show success/error toast via sonner

**Example: Bio Section Editor**

```
┌──────────────────────────────────────────────────┐
│  Bio / Introduction                    [Delete]   │
│                                                    │
│  Heading:                                          │
│  [About Me_________________________________]       │
│                                                    │
│  Content:                                          │
│  ┌──────────────────────────────────────────────┐ │
│  │ [B] [I] [U] [S] | [H1] [H2] [H3] | [•] [1.]│ │
│  │ [Link] [Blockquote] | [Undo] [Redo]          │ │
│  ├──────────────────────────────────────────────┤ │
│  │ I'm a certified astrologer with 15 years     │ │
│  │ of experience in Vedic and Western astrology. │ │
│  │                                               │ │
│  │ My approach combines traditional techniques   │ │
│  │ with modern psychological insights...         │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Photo:                                            │
│  ┌──────────────┐                                  │
│  │              │  [Upload New]  [Remove]           │
│  │  [preview]   │                                   │
│  │              │  Recommended: 400x400px           │
│  └──────────────┘  Max: 2MB, JPG/PNG/WebP          │
│                                                    │
│  Photo Position: ○ Left  ● Right  ○ Top  ○ Background│
│                                                    │
│                          [Revert Changes] [Save]   │
└──────────────────────────────────────────────────┘
```

**Example: FAQ Section Editor**

```
┌──────────────────────────────────────────────────┐
│  FAQ Accordion                         [Delete]   │
│                                                    │
│  Heading:                                          │
│  [Frequently Asked Questions_______________]       │
│                                                    │
│  Questions:                                        │
│  ┌──────────────────────────────────────────────┐ │
│  │ Q: What should I prepare for the reading?    │ │
│  │ A: [rich text editor]                         │ │
│  │                            [Remove] [▲] [▼]  │ │
│  ├──────────────────────────────────────────────┤ │
│  │ Q: How long does a session last?              │ │
│  │ A: [rich text editor]                         │ │
│  │                            [Remove] [▲] [▼]  │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  [+ Add Question]                (max 20)          │
│                                                    │
│                          [Revert Changes] [Save]   │
└──────────────────────────────────────────────────┘
```

**Example: Gallery Section Editor**

```
┌──────────────────────────────────────────────────┐
│  Image Gallery                         [Delete]   │
│                                                    │
│  Heading: [_________________________________]      │
│  Display: ● Grid  ○ Carousel  ○ Masonry            │
│  Columns: [3 v]                                    │
│                                                    │
│  Images:                                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │      │ │      │ │      │ │  +   │              │
│  │ img1 │ │ img2 │ │ img3 │ │ Add  │              │
│  │      │ │      │ │      │ │      │              │
│  └──[x]─┘ └──[x]─┘ └──[x]─┘ └──────┘             │
│  Alt: [___] Alt: [___] Alt: [___]                  │
│                                                    │
│  Drag images to reorder         (max 20 images)    │
│                                                    │
│                          [Revert Changes] [Save]   │
└──────────────────────────────────────────────────┘
```

#### Step 7: Add Section Dialog

**File to create:** `src/components/dashboard/builder/add-section-dialog.tsx`

Triggered by [+ Add Section] button. Shows available section types in a categorized grid.

```
┌──────────────────────────────────────────────────┐
│  Add Section                              [Close] │
│                                                    │
│  CONTENT                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ [User]   │ │ [Award]  │ │[FileText]│          │
│  │ Bio      │ │ Expertise│ │ Text     │          │
│  │          │ │          │ │ Content  │          │
│  │ MAX 1    │ │ MAX 1    │ │ 3 of 5   │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │[CheckSq] │ │ [Users]  │ │[Newspaper│          │
│  │ What's   │ │ Who It's │ │ Rich     │          │
│  │ Included │ │ For      │ │ Content  │          │
│  │ MAX 1    │ │ MAX 1    │ │ 2 of 3   │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                    │
│  MEDIA                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ [Image]  │ │ [Video]  │ │[LayoutG] │          │
│  │ Image    │ │ Video    │ │ Gallery  │          │
│  │ Banner   │ │ Embed    │ │          │          │
│  │ 1 of 3   │ │ 2 of 3   │ │ MAX 2    │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                    │
│  ENGAGEMENT                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │[MousePtr]│ │[HelpCirc]│ │ [Quote]  │          │
│  │ Call to  │ │ FAQ      │ │ Testimo- │          │
│  │ Action   │ │          │ │ nials    │          │
│  │ 1 of 3   │ │ MAX 1    │ │ MAX 1    │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                    │
│  Grey cards = max reached (cannot add more)        │
└──────────────────────────────────────────────────┘
```

**Behavior:**
1. Fetch available_section_types from GET sections API
2. Group by category (content, media, engagement)
3. Show remaining_slots count per type
4. Grey out / disable types at max capacity
5. Grey out types with `is_globally_enabled = false`
6. On click: POST to create section API with defaults → section appears in list → editor opens

#### Step 8: Publish Workflow

**File to create:** `src/components/dashboard/builder/publish-dialog.tsx`

Publish confirmation dialog:

```
┌──────────────────────────────────────────────────┐
│  Publish Landing Page                             │
│                                                    │
│  You are about to publish your Nativity Birth     │
│  Chart landing page. This will make it visible     │
│  to the public.                                    │
│                                                    │
│  Changes to publish:                               │
│  • Bio section (updated content)                   │
│  • FAQ section (added 2 new questions)             │
│  • Gallery section (new, 5 images)                 │
│                                                    │
│  ⚠ 1 section is disabled and will not appear:     │
│    • Expertise (disabled by you)                    │
│                                                    │
│                        [Cancel]  [Publish Now]      │
└──────────────────────────────────────────────────┘
```

**Logic:**
1. Show sections with `is_draft = true` (have unpublished changes)
2. Show disabled sections as info
3. Check for flagged/rejected sections → block publish with warning
4. On confirm: POST `/api/dashboard/landing-pages/{templateId}/publish`
5. Show success toast: "Landing page published!"
6. Redirect back to landing pages list or stay in builder with updated status

#### Step 9: Preview Mode Support

**File to modify:** `src/app/[username]/services/[slug]/page.tsx`

Add preview mode:

```typescript
// Check for ?preview=true query param
const isPreview = searchParams?.preview === 'true';

if (isPreview) {
  // 1. Verify user is authenticated as the diviner who owns this page OR admin
  // 2. If authorized: render using getPublishedLandingPage() but with draft content
  //    (use draft_content_json instead of published_content_json)
  // 3. Show preview banner at top:
  //    "Preview Mode — This page is not published. Only you can see this."
  //    [Publish Now] [Back to Builder]
  // 4. Do NOT track analytics in preview mode
  // 5. If not authorized: return 404
}
```

**Preview banner component:**
**File to create:** `src/components/landing/preview-banner.tsx`

```
┌──────────────────────────────────────────────────┐
│ 👁 PREVIEW MODE — This page is not published yet. │
│ Only you can see this preview.                     │
│                             [Publish Now] [← Builder] │
└──────────────────────────────────────────────────┘
```
Fixed position at top, semi-transparent, does not interfere with page content.

#### Step 10: Page Builder State Management

**File to create:** `src/components/dashboard/builder/builder-context.tsx`

Use React Context to manage builder state across the section list, section editors, and toolbar:

```typescript
interface BuilderState {
  landingPage: ServiceLandingPage | null;
  sections: LandingPageSection[];
  selectedSectionId: string | null;
  availableSectionTypes: SectionTypeConfig[];
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;
}

interface BuilderActions {
  selectSection: (id: string) => void;
  addSection: (type: string) => Promise<void>;
  updateSection: (id: string, data: Partial<LandingPageSection>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  toggleSection: (id: string, enabled: boolean) => Promise<void>;
  reorderSections: (orderedIds: string[]) => Promise<void>;
  savePageSettings: (settings: Partial<ServiceLandingPage>) => Promise<void>;
  publishPage: () => Promise<void>;
  unpublishPage: () => Promise<void>;
  refreshData: () => Promise<void>;
}

// Provider wraps the entire builder page
export function BuilderProvider({ templateId, children }: { templateId: string; children: React.ReactNode }) {
  // Fetch initial data from API
  // Manage state with useReducer
  // Provide actions that call APIs and update state
  // Track unsaved changes
  // Warn before leaving page with unsaved changes (beforeunload event)
}
```

#### Step 11: Unsaved Changes Warning

**Add to builder page:**

```typescript
// Warn user before navigating away with unsaved changes
useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [hasUnsavedChanges]);
```

#### Step 12: Mobile Responsive Layout

**Responsive behavior:**

| Viewport | Layout |
|---|---|
| Desktop (1024px+) | Two-column: section list left, editor right |
| Tablet (768-1023px) | Section list collapses to sheet/drawer, editor full-width |
| Mobile (< 768px) | Full-width stack: list page → tap section → editor page (navigation, not side-by-side) |

On mobile, the section list becomes the primary view. Tapping a section navigates to a full-screen editor. Back button returns to list.

## Complete Component Structure

```
src/app/dashboard/landing-pages/
  page.tsx                                      -- Landing pages list
  [templateId]/
    builder/
      page.tsx                                  -- Page builder shell
    analytics/
      page.tsx                                  -- Per-service analytics (Task 08)

src/components/dashboard/builder/
  builder-context.tsx                           -- React context for builder state
  section-list.tsx                              -- Left panel: sortable section list
  section-list-item.tsx                         -- Individual section card in list
  section-editor-panel.tsx                      -- Right panel: dynamic editor wrapper
  add-section-dialog.tsx                        -- Section type picker dialog
  publish-dialog.tsx                            -- Publish confirmation dialog
  page-settings-panel.tsx                       -- Page-level settings (title, SEO, color)
  builder-toolbar.tsx                           -- Top bar: status, save, publish, preview

  section-editors/                             -- One editor per section type
    hero-editor.tsx
    pricing-editor.tsx
    booking-cta-editor.tsx
    bio-editor.tsx
    expertise-editor.tsx
    text-content-editor.tsx
    image-banner-editor.tsx
    cta-editor.tsx
    faq-editor.tsx
    video-embed-editor.tsx
    testimonials-editor.tsx
    gallery-editor.tsx
    rich-content-editor.tsx
    whats-included-editor.tsx
    who-its-for-editor.tsx

src/components/dashboard/
  landing-page-card.tsx                        -- Card component for landing pages list
  landing-page-filters.tsx                     -- Search, filter, sort controls
  landing-page-summary.tsx                     -- Summary stats bar
  landing-page-empty-state.tsx                 -- Empty state component

src/components/landing/
  section-renderer.tsx                         -- Dynamic section renderer for public pages
  preview-banner.tsx                           -- Preview mode banner
  sections/                                    -- Public-facing section components
    hero-section.tsx
    bio-section.tsx
    expertise-section.tsx
    text-content-section.tsx
    image-banner-section.tsx
    cta-section.tsx
    faq-section.tsx
    video-embed-section.tsx
    testimonials-section.tsx
    gallery-section.tsx
    rich-content-section.tsx
    whats-included-section.tsx
    who-its-for-section.tsx
    pricing-section.tsx
    booking-cta-section.tsx
```

## Verification Plan

### Landing Pages List
1. Diviner with 5 enabled services sees exactly 5 cards
2. Published pages show stats (views, bookings, conversion)
3. Draft pages show "Draft" badge and [Publish] button
4. Services with no landing page show "No Page" and [Start Building]
5. Copy Link copies correct URL to clipboard
6. Search, category filter, status filter all work
7. Empty state shows when no services enabled
8. Navigation link appears in dashboard sidebar

### Page Builder
9. Opening builder for first time → lazy init creates landing page + 3 system sections
10. System sections (hero, pricing, booking_cta) show lock icon, cannot be dragged or deleted
11. Custom sections can be dragged to reorder
12. Drag-and-drop updates display_order via API
13. Click section → editor opens in right panel with correct form fields
14. Bio editor: heading, rich text, image upload, position picker all work
15. FAQ editor: add/remove/reorder questions all work
16. Gallery editor: add/remove/reorder images, alt text, caption all work
17. Video editor: YouTube/Vimeo URL input, preview thumbnail shown
18. CTA editor: heading, text, button label, URL, style selector all work
19. Rich text editor: all Tiptap formatting tools work (bold, italic, headings, lists, links)
20. Image upload: valid image → uploaded → preview shown
21. Image upload: invalid type → error toast
22. Image upload: oversized file → error toast with size limit message
23. Save section → API called → success toast → is_draft = true
24. Delete section → confirmation → API called → section removed from list
25. Toggle section visibility → switch toggles → API called
26. System section toggle → disabled (cannot hide system sections)

### Add Section
27. [+ Add Section] → dialog opens with categorized section types
28. Types at max capacity are greyed out
29. Click available type → section created → appears in list → editor opens
30. Globally disabled types not shown

### Publish Flow
31. [Publish] → confirmation dialog shows changed sections
32. Flagged sections block publish with error
33. Publish → all draft content becomes published → status badge updates
34. Public page renders published content correctly
35. [Unpublish] → confirmation → page hidden from public

### Preview
36. [Preview] → opens page in new tab with draft content
37. Preview banner shown at top of page
38. Preview mode does not track analytics
39. Unauthenticated user accessing ?preview=true → 404

### State Management
40. Unsaved changes warning appears when navigating away
41. Concurrent editing: last save wins
42. Network error during save: error toast with retry option
43. Page refreshes preserve state (data from server, not just local)

### Responsive
44. Desktop: two-column layout
45. Tablet: section list as collapsible drawer
46. Mobile: stack navigation (list → editor → back)

## Edge Cases

- Builder opened for service with disabled diviner_services → redirect to landing pages list with error
- 15+ sections on a page → section list scrolls independently from editor
- Very long section title → truncate in list with ellipsis, full title in editor
- Rich text with large amount of content (10,000 chars) → editor handles it without lag
- Image upload fails mid-upload → error toast, section retains previous image
- Drag section to invalid position (between system sections) → snap back to valid position
- Two browser tabs open on same builder → last save wins, refresh shows latest
- Admin flags a section while diviner is editing → diviner sees warning on next save/refresh
- Builder opened while preview is open in another tab → preview reflects draft content in real-time (on refresh)
- Diviner deletes all custom sections → page can still publish (system sections only)
- Section type schema changed in TypeScript but not in DB → validation uses code-level schema, DB stores raw JSON
