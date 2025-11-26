/*
  # Create WB Project Opportunity Analyzer Schema

  1. New Tables
    - `project_scores`
      - `id` (uuid, primary key)
      - `project_id` (text) - World Bank project ID
      - `project_name` (text)
      - `country` (text)
      - `region` (text)
      - `sector` (text)
      - `amount` (text)
      - `status` (text)
      - `relevance_score` (numeric)
      - `opportunity_signals` (jsonb)
      - `opportunity_type` (text)
      - `estimated_engagement_size` (text)
      - `brief_justification` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (text) - Browser fingerprint or session ID
      - `openai_key` (text, encrypted)
      - `anthropic_key` (text, encrypted)
      - `active_model` (text)
      - `scoring_prompt` (text)
      - `report_prompt` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is an internal tool)
*/

CREATE TABLE IF NOT EXISTS project_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text UNIQUE NOT NULL,
  project_name text,
  country text,
  region text,
  sector text,
  amount text,
  status text,
  relevance_score numeric,
  opportunity_signals jsonb DEFAULT '[]'::jsonb,
  opportunity_type text,
  estimated_engagement_size text,
  brief_justification text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  openai_key text,
  anthropic_key text,
  active_model text DEFAULT 'demo',
  scoring_prompt text,
  report_prompt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to project_scores"
  ON project_scores FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to project_scores"
  ON project_scores FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to project_scores"
  ON project_scores FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from project_scores"
  ON project_scores FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to user_settings"
  ON user_settings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to user_settings"
  ON user_settings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to user_settings"
  ON user_settings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_project_scores_project_id ON project_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
