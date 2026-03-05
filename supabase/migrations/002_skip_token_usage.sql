-- Migration: Add skip_token_usage table

CREATE TABLE IF NOT EXISTS skip_token_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skip_token_id UUID NOT NULL REFERENCES skip_tokens(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('workout', 'meals', 'water', 'sleep')),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skip_token_id, category, date)
);

CREATE INDEX idx_skip_token_usage_token_id ON skip_token_usage(skip_token_id);
CREATE INDEX idx_skip_token_usage_date ON skip_token_usage(date);

-- Enable RLS
ALTER TABLE skip_token_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own skip token usage"
  ON skip_token_usage
  FOR SELECT
  USING (
    skip_token_id IN (
      SELECT id FROM skip_tokens WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own skip token usage"
  ON skip_token_usage
  FOR INSERT
  WITH CHECK (
    skip_token_id IN (
      SELECT id FROM skip_tokens WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE skip_token_usage IS 'Tracks when users use skip tokens to maintain streaks';
