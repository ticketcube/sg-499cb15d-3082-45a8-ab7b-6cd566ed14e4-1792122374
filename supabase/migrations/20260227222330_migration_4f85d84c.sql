-- Add the missing expires_at column to oauth_authorizations table
-- This column tracks when the entire authorization expires (different from code_expires_at)
ALTER TABLE oauth_authorizations 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '90 days');

-- Add a comment to clarify the difference between the two expiration columns
COMMENT ON COLUMN oauth_authorizations.expires_at IS 'When the entire authorization expires (long-lived, 90 days by default)';
COMMENT ON COLUMN oauth_authorizations.code_expires_at IS 'When the authorization code expires (short-lived, 10 minutes)';