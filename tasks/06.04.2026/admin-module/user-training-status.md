**Status:** Done

# Task: User Training Status Management

## Objective
Enable admins to manually update the training completion status for **all users who have access to training** (including but not limited to the `trainee` role) directly from the user list or details view.

## Requirements
- [ ] **Action**: Add an "Update Training Status" option for **all users eligible for training**.
- [ ] **Status Options**: Provide a way to switch between different training statuses (e.g., `In Progress`, `Completed`, `Certified`, `Dropped`).
- [ ] **Database Update**: Update the `training_status` for the respective user record in the database.
- [ ] **Notification**: Notify the user via email/in-app notification once their status has been updated (especially for `Completed` and `Certified` transitions).
- [ ] **Audit Trail**: Record the status change and the admin who performed it in the activity log.
