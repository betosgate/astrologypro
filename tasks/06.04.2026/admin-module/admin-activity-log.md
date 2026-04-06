**Status:** Done

# Task: Admin Activity Log

## Objective
Implement a comprehensive activity logging system to track all admin actions performed within the User Management module.

## Requirements

### 1. Activity Recording
- [ ] **Global Logger**: Implement a logging mechanism to capture all critical admin actions, including:
    - User Status Changes
    - Password Resets/Forced Changes
    - User Edits (record changed fields)
    - Soft Deletes and Restorations
- [ ] **Data to Capture**:
    - Admin User ID (who performed the action)
    - Target User ID (who was affected)
    - Action Type (e.g., `status_change`, `password_reset`)
    - Details (JSON blob containing old vs. new values where applicable)
    - IP Address and Timestamp

### 2. Activity Log Page
- [ ] **UI**: Create a new page at `/admin/activity-log` to list all captured events.
- [ ] **Filtering**: Allow filtering by Admin User, Target User, Date Range, and Action Type.
- [ ] **Details View**: Provide a way to view the full JSON details for each log entry.
- [ ] **Export**: Add an option to export the activity log as a CSV for auditing.
