-- ResuMind: Add 5-pillar analysis columns
-- Run this BEFORE deploying the updated backend
-- All columns are nullable for backward compatibility with existing rows

ALTER TABLE analysis_results
  ADD COLUMN ats_parseability INT NULL AFTER feedback,
  ADD COLUMN hard_skills_score INT NULL AFTER ats_parseability,
  ADD COLUMN impact_score INT NULL AFTER hard_skills_score,
  ADD COLUMN structural_score INT NULL AFTER impact_score,
  ADD COLUMN clarity_score INT NULL AFTER structural_score,
  ADD COLUMN pillar_details LONGTEXT NULL AFTER clarity_score,
  ADD COLUMN verb_replacements LONGTEXT NULL AFTER pillar_details;
