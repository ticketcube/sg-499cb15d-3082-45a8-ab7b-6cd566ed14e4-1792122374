-- Add columns to track paid memberships and payment details
ALTER TABLE four_unders_waitlist
ADD COLUMN username text,
ADD COLUMN paid boolean DEFAULT false,
ADD COLUMN stripe_checkout_id text,
ADD COLUMN stripe_payment_intent_id text,
ADD COLUMN amount_paid numeric(10,2) DEFAULT 0;

-- Add index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_four_unders_username ON four_unders_waitlist(username);

-- Add index on paid status
CREATE INDEX IF NOT EXISTS idx_four_unders_paid ON four_unders_waitlist(paid);