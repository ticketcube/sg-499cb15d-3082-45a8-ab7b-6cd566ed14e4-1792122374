-- Add referral tracking to four_unders_waitlist
ALTER TABLE four_unders_waitlist
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Create index for referral lookups
CREATE INDEX IF NOT EXISTS idx_four_unders_referral_code ON four_unders_waitlist(referral_code);
CREATE INDEX IF NOT EXISTS idx_four_unders_referred_by ON four_unders_waitlist(referred_by);