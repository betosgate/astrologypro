# Task: Testimonial List with Search

**Date:** 2026-04-01
**Status:** Done
**Reference:** [dashboard-and-user's-list-issue.md](../../../1ST_APR_DASHBOARD_TASK/dashboard-and-user's-list-issue.md)

## Objective
Implement a full testimonial list management page for the Admin with comprehensive search functionality and correct pagination using the discovered API patterns.

## API Specification

### 1. Testimonial List
**Endpoint:** `testimonial/testimonial-list`

**Request Payload:**
```json
{
  "condition": {
    "limit": 10,
    "skip": 0
  },
  "searchcondition": {},
  "sort": {
    "type": "desc",
    "field": "created_on"
  },
  "project": {},
  "token": ""
}
```

**Response Example:**
```json
{
    "status": "success",
    "message": "successful",
    "results": {
        "res": [
            {
                "_id": "659398e25ae8b11f05b0bad7",
                "requested_by_id": "64c75b0a9ea6981a86a101d3",
                "requested_to_email": "souravkar@influxiqtech.com",
                "status": 0,
                "notes": "Hi there ",
                "requested_to_name": "Sourav",
                "added_by_name": "The Astrologer ",
                "astro_tarot_name": "The Astrologer ",
                "created_on": 1704171746191
                ...
            }
        ]
    }
}
```

### 2. Testimonial Count
**Endpoint:** `testimonial/testimonial-list-count`

**Request Payload:**
```json
{
  "condition": {
    "limit": 10,
    "skip": 0
  },
  "searchcondition": {},
  "sort": {
    "type": "desc",
    "field": "createdon_datetime"
  },
  "project": {},
  "token": ""
}
```

**Response Example:**
```json
{
  "status": "success",
  "message": "successful",
  "count": 16
}
```

### 3. Search Payload (Using $regex)
When a search is performed, the `searchcondition` should follow this structure using the `$regex` operator:

**Example (Search for "google" in testimonial_title):**
```json
{
  "condition": {
    "limit": 10,
    "skip": 0
  },
  "sort": {
    "field": "created_on",
    "type": "desc"
  },
  "searchcondition": {
    "testimonial_title": {
      "$regex": "google"
    }
  },
  "secret": "na",
  "token": ""
}
```

*Note: The same payload structure applies to both the `testimonial-list` and `testimonial-list-count` endpoints when filtering.*

## Features to Implement
- [ ] **Admin Testimonial List Page**: Located at `/admin/testimonials`.
- [ ] **Add Button**: Include a "Create Testimonial" or "Add" button that directs users to `/admin/testimonials/create`.
- [ ] **Search Everything**: Implementation of a search bar that dynamically populates the `searchcondition` with `$regex` queries across the desired fields.
- [ ] **Standard Pagination**: Use the dual-API pattern (List + Count) as verified in the April 1st dashboard updates.
