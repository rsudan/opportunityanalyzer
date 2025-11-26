/*
  # Create user settings table

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (text, unique) - for future auth integration
      - `openai_key` (text) - encrypted OpenAI API key
      - `anthropic_key` (text) - encrypted Anthropic API key
      - `active_model` (text) - selected AI model
      - `custom_models` (jsonb) - array of custom model names
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `user_settings` table
    - For now, allow public access (single-user app)
    - In future, restrict to authenticated users only
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE DEFAULT 'default',
  openai_key text DEFAULT '',
  anthropic_key text DEFAULT '',
  active_model text DEFAULT 'demo',
  custom_models jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to settings"
  ON user_settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);