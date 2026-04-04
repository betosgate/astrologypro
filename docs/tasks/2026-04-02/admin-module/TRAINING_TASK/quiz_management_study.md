# Quiz Management Study (`admin-dashboard/training/quiz`)

This document provides a technical specification for the Quiz management interface, detailing API interactions, hierarchical data structures, and the complex answer management logic.

---

## 1. Route Configuration & Initialization
- **Path**: `/admin-dashboard/training/quiz`
- **Associated Component**: `QuizMainComponent` (List) and `QuizAddEditMainComponent` (Add/Edit).
- **Module**: `QuizModule`
- **Resolver**: `ResolveService`
  - **Endpoint**: `admin/quiz-list`
  - **Purpose**: Fetches the initial list of quiz questions.
  - **Payload**: `{}` (via router data configuration).

---

## 2. Core API Endpoints

### 2.1 Content Retrieval
| Feature | Endpoint | Method | Payload | Key Response Data |
| :--- | :--- | :--- | :--- | :--- |
| **Quiz List** | `admin/quiz-list` | POST | See **Listing Payload** below. | `{ "results": { "res": [ ... ] } }` |
| **Quiz Count** | `admin/quiz-list-count`| POST | See **Listing Payload** below. | `{ "count": number }` |
| **Fetch for Edit** | `admin/quiz-edit` | POST | `{ "_id": string }` | Full quiz object including answer array. |
| **Quiz Preview** | `admin/quiz-preview` | POST | `{ "_id": string }` | Formatted preview object for modal display. |

**Listing Payload Structure (Shared):**
```json
{
  "condition": { "limit": 10, "skip": 0 },
  "searchcondition": {
    "question": { "$regex": "Term", "$options": "i" },
    "status": 1
  },
  "sort": { "field": "createdon_datetime", "type": "desc" },
  "project": {},
  "token": ""
}
```

### 2.2 Management Actions
| Action | Endpoint | Method | Sample Payload |
| :--- | :--- | :--- | :--- |
| **Add Quiz** | `admin/quiz-add` | POST | See **Upsert Payload** below. |
| **Update Quiz** | `admin/quiz-update` | POST | See **Upsert Payload** (includes `_id`). |
| **Status Toggle** | `admin/quiz-status-change` | POST | `{ "id": string, "status": 0/1 }` |
| **Delete** | `admin/quiz-delete` | POST | `{ "_id": string }` or `{ "ids": [string] }` |

---

## 3. UI Sections & Functional Details

### 3.1 Quiz List Table
Displays questions and assignments with the following columns:
1.  **Question**: The quiz item text.
2.  **Lesson**: The parent lesson name (`lesson_name`).
3.  **Priority**: Display order.
4.  **Status**: Active/Inactive toggle.
5.  **Created On**: Displayed timestamp (`createdon_datetime`).

---

## 4. Add/Edit Quiz Deep Dive (`/quiz-add` & `/quiz-edit/:_id`)

### 4.1 Initialization & Dynamic Fields
- **Lesson List Fetch**: `admin/lesson-list` (POST)
  - Fetches all available lessons with a limit of 1000 to populate the "Lesson" selection dropdown.
  - Payload matches the standard listing format with high limit.

### 4.2 Form Configuration & Validation
The quiz form uniquely manages a list of choices via an `externaldata` field:
1.  **Question**: `question` (Text, Required).
2.  **Lesson**: `lesson_id` (Select, Required).
3.  **Priority**: `priority` (Number, Required).
4.  **Review Timings**: `review_start_time_in_second` and `review_end_time_in_second` (Numbers).
5.  **Answer Management**:
    - Handled via `AnswerModal`.
    - Each answer contains: `answer` (string) and `correct_answer` (boolean).
    - **Validation**: Submissions are blocked unless at least one choice is marked as the correct answer.

**Upsert Payload (Add/Update):**
```json
{
  "question": "What is astrology?",
  "lesson_id": "6512...",
  "priority": 1,
  "review_start_time_in_second": 10,
  "review_end_time_in_second": 20,
  "answer": [
    { "answer": "The study of stars", "correct_answer": true },
    { "answer": "The study of rocks", "correct_answer": false }
  ],
  "status": 1,
  "_id": "6723..." // Only for Update
}
```

---

## 5. Replication Checklist
1.  **Answer Array Logic**: The frontend must maintain an internal array (`this.answers`) that reflects the external data structure used by `lib-form`.
2.  **Validation Rule**: Implement the `noCorrectAns` check in the submission listener to ensure data integrity.
3.  **Preview Modal**: Requires `QuizPreviewModal` targeting the `admin/quiz-preview` endpoint to visualize the question/answer set in a non-table format.
4.  **Bulk Management**: Map `updateendpointmany` and `deleteendpointmany` to the status-change and delete endpoints respectively.
