-- ============================================================
-- Migration: Mystery School Seed + Constraint Fixes
-- 1. Add 'grace' to student_decan_progress.status allowed values
--    (the cron and live-compute logic can set grace; the check
--     constraint was missing it, causing rejected updates)
-- 2. Seed foundation week tasks so students see actual checklists
-- ============================================================

-- ── 1. Fix status constraint — add 'grace' to allowed values ──────────────────
--
-- Drop old constraint (only if it exists) then recreate with grace included.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'student_decan_progress'::regclass
      AND conname   = 'student_decan_progress_status_check'
  ) THEN
    ALTER TABLE student_decan_progress
      DROP CONSTRAINT student_decan_progress_status_check;
  END IF;
END $$;

ALTER TABLE student_decan_progress
  ADD CONSTRAINT student_decan_progress_status_check
  CHECK (status IN ('locked', 'upcoming', 'preview', 'active', 'grace', 'completed', 'missed'));

-- ── 2. Seed foundation week tasks ─────────────────────────────────────────────
--
-- Each week gets 3 structured tasks. Only updates weeks that currently have an
-- empty task array so re-running is safe. Admins can edit tasks afterward via
-- the admin UI.

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w01-t01", "order": 1, "title": "Read the Week 1 introduction material", "description": "Review the provided reading on the foundational principles of the Mystery School tradition."},
  {"id": "w01-t02", "order": 2, "title": "Complete the opening meditation exercise", "description": "Spend 15 minutes in silent reflection on your intention for beginning this path."},
  {"id": "w01-t03", "order": 3, "title": "Journal reflection — Why I am here", "description": "Write at least one paragraph on what drew you to the Mystery School and what you hope to discover."}
]'::jsonb
WHERE week_number = 1 AND (tasks = '[]'::jsonb OR tasks IS NULL);

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w02-t01", "order": 1, "title": "Read the Week 2 material on the Tao", "description": "Study the assigned passages from the Tao Te Ching and supplementary notes."},
  {"id": "w02-t02", "order": 2, "title": "Contemplate the principle of wu wei", "description": "Sit with the concept of non-action and effortless action for at least one day before proceeding."},
  {"id": "w02-t03", "order": 3, "title": "Write a brief response to the week prompt", "description": "How does the principle of the Tao relate to your astrological understanding?"}
]'::jsonb
WHERE week_number = 2 AND (tasks = '[]'::jsonb OR tasks IS NULL);

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w03-t01", "order": 1, "title": "Read the assigned Gospel of Thomas passages", "description": "Focus on sayings 1–30 and the supplementary commentary provided."},
  {"id": "w03-t02", "order": 2, "title": "Identify one teaching that resonates most deeply", "description": "Choose one saying and sit with it for the week, noticing where it appears in your daily life."},
  {"id": "w03-t03", "order": 3, "title": "Journal reflection — Hidden teachings", "description": "What does it mean for spiritual knowledge to be esoteric or hidden? Write your thoughts."}
]'::jsonb
WHERE week_number = 3 AND (tasks = '[]'::jsonb OR tasks IS NULL);

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w04-t01", "order": 1, "title": "Read the Bhagavad Gita selections", "description": "Review the assigned chapters focusing on dharma, karma yoga, and right action."},
  {"id": "w04-t02", "order": 2, "title": "Reflect on your own dharma", "description": "Consider your own path of duty — what obligations do you hold to yourself and to others on this spiritual path?"},
  {"id": "w04-t03", "order": 3, "title": "Complete the Gita reflection exercise", "description": "Write a one-page response connecting the concept of dharmic action to your decan practice."}
]'::jsonb
WHERE week_number = 4 AND (tasks = '[]'::jsonb OR tasks IS NULL);

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w05-t01", "order": 1, "title": "Study the seven traditional planetary archetypes", "description": "Learn the mythological, psychological, and astrological dimensions of Sun, Moon, Mercury, Venus, Mars, Jupiter, and Saturn."},
  {"id": "w05-t02", "order": 2, "title": "Identify the dominant planet in your own chart", "description": "Using your natal chart, identify which planet feels most personally significant and why."},
  {"id": "w05-t03", "order": 3, "title": "Write a planetary self-portrait", "description": "Describe yourself through the lens of your dominant planetary archetype in at least 200 words."}
]'::jsonb
WHERE week_number = 5 AND (tasks = '[]'::jsonb OR tasks IS NULL);

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w06-t01", "order": 1, "title": "Review the twelve signs and their qualities", "description": "Study each sign''s element, modality, ruling planet, and core themes."},
  {"id": "w06-t02", "order": 2, "title": "Map your own chart placements on the wheel", "description": "Draw or annotate a zodiac wheel with your major natal placements."},
  {"id": "w06-t03", "order": 3, "title": "Reflect on your solar and lunar signs", "description": "In at least one paragraph, describe how the tension or harmony between your Sun and Moon signs shows up in your life."}
]'::jsonb
WHERE week_number = 6 AND (tasks = '[]'::jsonb OR tasks IS NULL);

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w07-t01", "order": 1, "title": "Deepen your study of the seven sacred planets", "description": "Go beyond the archetypes into the ritual significance of each planet in the Hermetic and astrological tradition."},
  {"id": "w07-t02", "order": 2, "title": "Choose one planet for a weekly devotional", "description": "Select one planet and dedicate this week to noticing its energy in your environment, schedule, and relationships."},
  {"id": "w07-t03", "order": 3, "title": "Write a brief invocation or prayer for your chosen planet", "description": "Draft a personal planetary invocation of at least 100 words that you can use in ritual."}
]'::jsonb
WHERE week_number = 7 AND (tasks = '[]'::jsonb OR tasks IS NULL);

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w08-t01", "order": 1, "title": "Study the structure of the 36 decans", "description": "Learn how the zodiac is divided into three 10-degree segments per sign, and how the decans differ from the signs themselves."},
  {"id": "w08-t02", "order": 2, "title": "Identify your natal decan", "description": "Determine which decan your Sun falls in and read about its planetary ruler and traditional meaning."},
  {"id": "w08-t03", "order": 3, "title": "Write a reflection on your natal decan", "description": "How does the energy of your natal decan appear in your character or life circumstances?"}
]'::jsonb
WHERE week_number = 8 AND (tasks = '[]'::jsonb OR tasks IS NULL);

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w09-t01", "order": 1, "title": "Read the assigned material on scrying and inner vision", "description": "Study the theory and practice of scrying as it applies to decan work in the Mystery School tradition."},
  {"id": "w09-t02", "order": 2, "title": "Practice a brief scrying exercise", "description": "Spend 10–15 minutes in a relaxed focus on a candle flame, mirror, or bowl of water. Record what you observe."},
  {"id": "w09-t03", "order": 3, "title": "Write your first scrying journal entry", "description": "Describe your experience in detail — images, emotions, thoughts, and any symbolic content that arose."}
]'::jsonb
WHERE week_number = 9 AND (tasks = '[]'::jsonb OR tasks IS NULL);

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w10-t01", "order": 1, "title": "Study the mundane journaling framework", "description": "Learn the three-section structure: Relationships, Business/Work, and Shifts in Perception that you will use throughout the decan year."},
  {"id": "w10-t02", "order": 2, "title": "Practice the three-section journal format", "description": "Write a practice entry for this week using all three sections (minimum 100 words each)."},
  {"id": "w10-t03", "order": 3, "title": "Reflect on the value of mundane tracking", "description": "Why is it important to observe how planetary energies manifest in ordinary life? Write your answer."}
]'::jsonb
WHERE week_number = 10 AND (tasks = '[]'::jsonb OR tasks IS NULL);

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w11-t01", "order": 1, "title": "Study the Five-Fold Creed", "description": "Learn the five principles of the Mystery School tradition and their practical application in daily life."},
  {"id": "w11-t02", "order": 2, "title": "Choose one principle to practice this week", "description": "Select the principle that you find most challenging and commit to a specific practice for the week."},
  {"id": "w11-t03", "order": 3, "title": "Write a creed reflection", "description": "How have the five principles already begun to shape your engagement with this path? Reflect in at least one paragraph."}
]'::jsonb
WHERE week_number = 11 AND (tasks = '[]'::jsonb OR tasks IS NULL);

UPDATE mystery_school_foundation_weeks
SET tasks = '[
  {"id": "w12-t01", "order": 1, "title": "Review the complete foundation curriculum", "description": "Spend time reviewing your notes and journal entries from Weeks 1–11 before completing your foundation."},
  {"id": "w12-t02", "order": 2, "title": "Write a foundation completion reflection", "description": "Summarize what you have learned and how you have changed over the past 12 weeks. Minimum 300 words."},
  {"id": "w12-t03", "order": 3, "title": "Set your intention for the decan year", "description": "What are you committing to in the coming year of decan practice? Write a brief vow or statement of intention."}
]'::jsonb
WHERE week_number = 12 AND (tasks = '[]'::jsonb OR tasks IS NULL);
