# Task 03: Connect Service Config With Price Management And Diviner Assignment

- Status: Pending
- Priority: High

## Goal
Make `Service Config` use admin-managed pricing data and support assigning services to diviners.

## Why This Task Exists
- Service price should not be free-typed manually inside the service form
- Admin should choose price data from the existing admin price management module
- Services should be assignable to specific diviners

## Expected Result
- Service form shows price options coming from admin price management
- Admin can assign one or more diviners to a service
- Saved service records correctly store these relationships
- Assigned data appears properly in the admin service list and edit form

## Scope
- Service-to-price relation
- Service-to-diviner relation
- Admin form input updates
- Backend relation save/update logic

## Steps

### 1. Inspect Existing Price Management
- Find the admin price management module
- Identify the source table / API / query for price records
- Understand which fields should be shown in the service form
- Confirm whether service should store:
  - a price id
  - a pricing tier id
  - or copied numeric price data

### 2. Add Price Selection To Service Form
- Replace manual price entry with a selector based on admin price records
- Show enough information for admin to choose correctly, for example:
  - label / plan name
  - amount
  - category
- Validate that a valid price record is selected

### 3. Inspect Diviner Assignment Model
- Find how diviners are stored in the app
- Decide how a service should be assigned:
  - one diviner
  - many diviners
- Confirm the expected database relationship before implementation

### 4. Add Diviner Assignment UI
- Add a diviner selector to the service form
- If many diviners are allowed, use multi-select or checkbox style UI
- Make the edit form show current assignments correctly

### 5. Save And Read Relationships
- Update backend create and update logic to save:
  - selected price reference
  - selected diviner assignment(s)
- Update the service read logic so admin pages can display the relationships clearly

### 6. Show Assignment In The List
- In the service table or cards, show:
  - selected price label / amount
  - assigned diviner name(s) or count

### 7. Verify
- Create a service with a selected admin-managed price
- Assign one or more diviners
- Save and reopen the service
- Confirm all selected values persist correctly

## Notes For Implementation
- Do not duplicate price source-of-truth fields if a relation is enough
- Keep labels friendly for admin users
- If the current database structure does not support many-to-many assignment, add that carefully and document it

## Acceptance Checklist
- [ ] Price options come from admin price management
- [ ] Admin can assign diviners
- [ ] Save and edit flows persist relations correctly
- [ ] Service list shows price and assignment information clearly
