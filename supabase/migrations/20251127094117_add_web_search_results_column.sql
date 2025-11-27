/*
  # Add Web Search Results Storage

  1. Changes
    - Add `web_search_results` (jsonb) column to project_scores table to store all web search data used for scoring
    - This enables transparency and auditability of the scoring process

  2. Structure
    - The column will store an object with search categories as keys
    - Each category contains an array of search results with title, description, and URL
    - Example: {"emerging_tech": [{title: "...", description: "...", url: "..."}], ...}

  3. Notes
    - Maintains backward compatibility
    - Allows users to see exactly what research informed each score
*/

-- Add web_search_results column to store complete search data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_scores' AND column_name = 'web_search_results'
  ) THEN
    ALTER TABLE project_scores ADD COLUMN web_search_results jsonb;
  END IF;
END $$;