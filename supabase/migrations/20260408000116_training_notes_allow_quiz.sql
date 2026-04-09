-- Extend training_notes.entity_type to allow 'quiz'.
--
-- The original migration 20260405000003_training_notes.sql added a CHECK
-- constraint limiting entity_type to ('program', 'category', 'lesson'). The
-- admin Training Management standardization task (tasks/08.04.2026/
-- standardization/admin-ui/01) surfaces notes in the detail sheet for every
-- training entity, including quizzes, so the constraint must admit 'quiz'.
--
-- This is additive: it drops the old constraint and installs a wider one
-- covering the same three values plus 'quiz'. No data migration is required.
-- Idempotent: re-running the migration is safe.

ALTER TABLE training_notes
  DROP CONSTRAINT IF EXISTS training_notes_entity_type_check;

ALTER TABLE training_notes
  ADD CONSTRAINT training_notes_entity_type_check
  CHECK (entity_type IN ('program', 'category', 'lesson', 'quiz'));
