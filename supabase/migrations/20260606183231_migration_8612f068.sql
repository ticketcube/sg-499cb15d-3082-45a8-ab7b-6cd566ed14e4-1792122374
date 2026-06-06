-- Create four_unders_waitlist table
CREATE TABLE IF NOT EXISTS four_unders_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  round_duration text,
  last_score text,
  price_premium text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE four_unders_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public waitlist)
CREATE POLICY "Anyone can join waitlist"
  ON four_unders_waitlist
  FOR INSERT
  WITH CHECK (true);

-- Allow public to read (for confirmation)
CREATE POLICY "Anyone can view waitlist"
  ON four_unders_waitlist
  FOR SELECT
  USING (true);