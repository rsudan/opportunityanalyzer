/*
  # Update Scoring Structure for Research-Driven Methodology

  1. Changes
    - Add `score_data` (jsonb) column to store complete score object with three dimensions
    - Add `custom_models` (jsonb) column to user_settings for custom model list

  2. Notes
    - Maintains backward compatibility
    - New scoring structure includes emerging_tech, foresight, and collective_intelligence dimensions
*/

-- Add score_data column to store complete score object
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_scores' AND column_name = 'score_data'
  ) THEN
    ALTER TABLE project_scores ADD COLUMN score_data jsonb;
  END IF;
END $$;

-- Add custom_models column to user_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'custom_models'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN custom_models jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;