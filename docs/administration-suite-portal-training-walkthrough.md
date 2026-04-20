# Administration Suite Portal Training Walkthrough

## Existing walkthrough pattern

The `/walkthrough` experience is driven from `src/lib/walkthrough-data.ts`.

For each role, the pattern is:

1. A role-level summary:
   - `role`
   - `slug`
   - `tagline`
   - `roleDescription`
   - `featureAreas`
   - `capabilities`
   - `keyPages`
   - `groups`
2. An ordered `screens` array.
3. Each screen usually follows this structure:

```ts
{
  name: "screenshot_file_name",
  label: "Human-readable title",
  description: "Short 1-line summary shown in the walkthrough.",
  group: "Feature Group",
  purpose: "Longer explanation of why this page exists and how admins use it.",
  bullets: [
    "3-5 concrete interface highlights",
  ],
}
```

## What exists today for admin training

Current admin training coverage is too thin for a proper portal walkthrough. The existing `admin` section only gives:

- `training_lessons`
- `training_analytics`
- `training_settings`
- `class_config`

That works as a placeholder, but it misses the actual authoring and governance flow:

- training hub with programs, categories, lessons, quizzes
- program creation and ordering
- lesson creation with video/PDF handling
- quiz authoring and remediation
- analytics breakdown
- global access and sequential lock controls

## Recommended training walkthrough structure

Use this order so the walkthrough tells a coherent admin story:

1. Training Hub
2. Program Creation
3. Program Detail
4. Category Authoring
5. Lesson Authoring
6. Lesson Edit / Asset Review
7. Quiz Builder
8. Quiz Detail
9. Analytics
10. Settings
11. Class Config

## Replacement-ready content

This block is designed to fit directly into the `admin` role `screens` array in `src/lib/walkthrough-data.ts`.

```ts
{
  name: "training_lessons",
  label: "Training Hub",
  description: "Central admin workspace for programs, categories, lessons, and quizzes.",
  group: "Training",
  purpose:
    "This is the operational command center for the Administration Suite training module. Admins can manage the entire curriculum hierarchy from one page: top-level programs, nested categories, individual lessons, and linked quizzes. It is designed for day-to-day curriculum operations, not just reporting, so training managers can search, filter, refresh, and maintain structure without jumping across unrelated pages.",
  bullets: [
    "Four coordinated data tables for Programs, Categories, Lessons, and Quizzes",
    "Shared search and active/inactive filtering across the training dataset",
    "Independent refresh and pagination controls per training entity",
    "Quick entry points to create, edit, preview, and manage curriculum records"
  ]
},
{
  name: "training_program_new",
  label: "Create Training Program",
  description: "Top-level setup screen for a new training program.",
  group: "Training",
  purpose:
    "Admins use this screen to define a new training program before any categories or lessons are added. The program acts as the curriculum container, so this step sets the name, description, display priority, access roles, activation state, and whether the program enforces sequential progression.",
  bullets: [
    "Program title and description establish the curriculum identity",
    "Priority field controls display order across multiple programs",
    "Allowed roles matrix limits which user types can access the program",
    "Sequential lock switch determines whether categories must be completed in order"
  ]
},
{
  name: "training_program_detail",
  label: "Training Program Detail",
  description: "Structured editor for a single training program and its ordered content.",
  group: "Training",
  purpose:
    "This screen is where curriculum leads maintain one full training program after creation. It should communicate both structure and operational status: what lessons belong to the program, how content is ordered, how much content exists, and how many learners are enrolled. It is the best place to explain program-level administration in the walkthrough.",
  bullets: [
    "Ordered curriculum view showing the relationship between categories and lessons",
    "Program metadata such as title, status, estimated duration, and visibility",
    "Enrollment context so admins can see whether the program is actively in use",
    "Reordering and maintenance tools for keeping the learning path clean"
  ]
},
{
  name: "training_category_new",
  label: "Create Training Category",
  description: "Category authoring screen for grouping lessons inside a program.",
  group: "Training",
  purpose:
    "Categories organize a program into teachable sections. This screen should show how administrators assign a category to its parent program, define sequence, and decide whether learners must complete lessons in that category in order. It is important because the platform uses category structure to drive navigation and progression logic.",
  bullets: [
    "Program assignment ties the category to the correct training path",
    "Priority determines where the category appears within the program",
    "Sequential setting controls whether lessons unlock in order",
    "Active state allows admins to stage future content without exposing it yet"
  ]
},
{
  name: "training_lesson_new",
  label: "Create Training Lesson",
  description: "Lesson authoring form with video, PDF, sequencing, and content controls.",
  group: "Training",
  purpose:
    "This is the most important authoring screen in the training suite because it defines what the learner actually consumes. Admins configure the lesson title, long-form content, category, display priority, prerequisite lesson, and delivery assets such as YouTube links, uploaded videos, PDFs, and written notes.",
  bullets: [
    "Lesson metadata includes title, summary, category, and active state",
    "Video can be supplied by YouTube URL, direct URL, or platform upload",
    "PDF support allows worksheets, slide decks, or reading packs to be attached",
    "Previous lesson selection and priority fields support structured sequencing"
  ]
},
{
  name: "training_lesson_edit",
  label: "Lesson Edit & Asset Review",
  description: "Maintenance view for refining a live lesson and reviewing attached media.",
  group: "Training",
  purpose:
    "After launch, curriculum teams need a stable edit view for correcting lesson copy, replacing assets, changing ordering, or updating supplementary files without rebuilding the lesson from scratch. This screen should demonstrate that the Administration Suite supports iterative lesson maintenance as content evolves.",
  bullets: [
    "Update lesson copy, metadata, and placement without recreating the record",
    "Review and replace uploaded video or PDF assets in one workflow",
    "Adjust lesson ordering when curriculum structure changes",
    "Preserve live operational context while making content corrections"
  ]
},
{
  name: "training_quiz_new",
  label: "Create Lesson Quiz",
  description: "Quiz authoring screen for attaching assessment to a lesson.",
  group: "Training",
  purpose:
    "This page establishes the assessment layer for the training experience. Admins use it to connect a quiz to a lesson, define the question set, and set the first version of the learner checkpoint. It should communicate that quizzes are not standalone trivia items; they are part of the learning gate for lesson completion and certification readiness.",
  bullets: [
    "Lesson linkage ensures the quiz belongs to the correct learning step",
    "Question authoring supports answer options and correct-answer selection",
    "Draft-to-live workflow allows quizzes to be prepared before launch",
    "Assessment becomes part of the completion path for trainees"
  ]
},
{
  name: "quiz-detail-admin",
  label: "Quiz Detail & Remediation",
  description: "Detailed admin view for scoring rules, attempts, and learner remediation design.",
  group: "Training",
  purpose:
    "This is the deeper control surface for a training quiz after it exists. It should show how admins tune passing score, attempt policy, and question ordering, while also reviewing how the quiz performs in production. This is the right place to explain operational assessment quality, not just quiz creation.",
  bullets: [
    "Passing score and attempt limits define how strict the checkpoint is",
    "Question ordering and editing keep the quiz aligned with lesson intent",
    "Performance stats reveal weak questions and learner drop-off",
    "Remediation-ready structure supports future rewatch or retry flows"
  ]
},
{
  name: "training_analytics",
  label: "Training Analytics",
  description: "Performance dashboard for trainee progress, completion, and quiz outcomes.",
  group: "Training",
  purpose:
    "The analytics screen gives training managers evidence, not assumptions. It shows whether people are completing content, where they stall, which lessons take too long, and which quizzes produce weak pass rates. In the walkthrough, this page should represent the monitoring and optimization side of the Administration Suite training portal.",
  bullets: [
    "Overview cards summarize trainee count, active learners, lesson completions, and quiz pass rate",
    "Tabbed reporting breaks down performance by users, programs, categories, lessons, and quizzes",
    "Search, filtering, and sorting expose bottlenecks in the learning path",
    "CSV export supports external review and operational reporting"
  ]
},
{
  name: "training_settings",
  label: "Training Settings",
  description: "Global controls for who can access training and how progression is enforced.",
  group: "Training",
  purpose:
    "This page governs the system-wide rules behind the training center. It should be positioned as a policy screen rather than a content screen: admins decide which user roles may enter the training center and whether sequential progression rules are globally enforced across all programs and categories.",
  bullets: [
    "Role access checklist controls which user types can enter the training center",
    "Global sequential lock determines whether ordered progression is enforced platform-wide",
    "Precedence guidance explains how global and local sequence rules interact",
    "Last updated metadata gives governance visibility for operational changes"
  ]
},
{
  name: "class_config",
  label: "Class Configuration",
  description: "Administrative setup for live classes, virtual rooms, or cohort delivery settings.",
  group: "Training",
  purpose:
    "If your training operation includes scheduled live sessions, cohort events, or classroom-style overlays, this screen should show how the Administration Suite configures those delivery mechanics. In the walkthrough it works best as an optional advanced page after the core curriculum and quiz flow is established.",
  bullets: [
    "Virtual session configuration for class-based delivery models",
    "Room or event settings connected to the training program structure",
    "Operational setup for instructor-led or scheduled training moments",
    "Useful for blended learning beyond self-paced lesson delivery"
  ]
}
```

## Screenshot guidance

### What good walkthrough screenshots need to show

For this project, screenshots work best when each image shows one clear admin job:

- overview and control
- creation
- editing
- monitoring
- policy/governance

Avoid empty forms or blank tables. Seed enough data so each screenshot proves the page is live and meaningful.

### Recommended screenshot list

Use these filenames so they align with the content above:

| Filename | Route | What should be visible |
| --- | --- | --- |
| `training_lessons.png` | `/admin/training` | All four tables visible with real rows, search/filter bar, status badges |
| `training_program_new.png` | `/admin/training/programs/new` | Filled example program form with roles selected and sequential toggle visible |
| `training_program_detail.png` | `/admin/training/programs/[id]/edit` | Existing program with categories/lessons context and admin controls |
| `training_category_new.png` | `/admin/training/categories/new` | Filled category form tied to a real program |
| `training_lesson_new.png` | `/admin/training/lessons/new` | Lesson form with category chosen, video mode, PDF section, and sequencing fields visible |
| `training_lesson_edit.png` | `/admin/training/lessons/[id]/edit` | Existing lesson with uploaded assets already present |
| `training_quiz_new.png` | `/admin/training/quizzes/new` | New quiz form with linked lesson and sample questions |
| `quiz-detail-admin.png` | `/admin/training/quizzes/[id]/edit` | Existing quiz with pass settings, question list, and stats if available |
| `training_analytics.png` | `/admin/training/analytics` | Top KPI cards plus one populated tabular report |
| `training_settings.png` | `/admin/training/settings` | Role access section and global sequential lock card both visible |
| `class_config.png` | your actual class-config route | Any live classroom or session settings that belong to training delivery |

### Capture rules

- Use seeded content, not empty-state screenshots.
- Keep the browser at a consistent desktop viewport.
- Make sure the page title and first meaningful controls are above the fold.
- Prefer one screenshot per page, not full-page scroll captures.
- Show realistic statuses like active/inactive, sequential on/off, roles selected, and lesson assets attached.
- For forms, prefill enough data to make the screenshot self-explanatory.

### Best seed state for screenshots

Before capturing, prepare at least:

- 2 training programs
- 3-5 categories
- 6-10 lessons
- 3-4 quizzes
- mixed active/inactive records
- one program with sequential lock on
- one lesson with video + PDF attached
- one quiz with attempts or analytics history

### Practical implementation note

If you add these new screenshots, you will also need to place the files under:

`public/walkthrough/screenshots/admin/`

The existing capture script at `scripts/capture-walkthrough.mjs` currently only captures a small admin set. It does not yet include the full training authoring flow, so you will need to extend that script or capture these pages manually.

## Recommended minimal version

If you want the smallest good version instead of the full version, ship these 6 screens first:

1. `training_lessons`
2. `training_program_new`
3. `training_lesson_new`
4. `quiz-detail-admin`
5. `training_analytics`
6. `training_settings`

That gives a clean story:

- curriculum control
- program setup
- lesson authoring
- assessment control
- performance review
- governance
