# Module 10 - Tarot Dependency Integration

## Objective
Wire the existing Tarot system into Mystery School where the curriculum explicitly depends on tarot card mappings and card access.

## Current State In Repo
- Tarot pages and admin tarot CRUD exist.
- General decan/tarot metadata exists in other parts of the app.
- Mystery School decan flow does not yet appear to be fully bound to tarot-card identity and navigation.

## Required Outcome
- Each decan has a tarot card association usable by the Mystery School student flow.
- Students can open the assigned card during scrying work.
- Admins can manage the mapping if the current metadata source is insufficient.

## Detailed Tasks
- [ ] Identify the current canonical source of decan-to-tarot mapping in the repo.
- [ ] Decide whether to reuse existing decan tarot metadata or add a minimal reference onto the decan curriculum model.
- [ ] Ensure each Mystery School decan can resolve to a specific tarot card.
- [ ] Add card display/linking on the student decan page.
- [ ] Update the scrying flow so the assigned card is part of the task UX.
- [ ] If needed, expose admin management for the mapping through existing decan or tarot admin screens.
- [ ] Ensure the mapping works for all 36 decans and is stable across UI and API responses.

## Acceptance Criteria
- The student decan experience can reliably surface the associated tarot card.
- Tarot mapping is manageable by admins and consistent across the app.
