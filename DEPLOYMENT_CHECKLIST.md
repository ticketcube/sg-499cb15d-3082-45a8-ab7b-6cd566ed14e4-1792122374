# Four Under Club MVP - Deployment Security Checklist

## Pre-Deployment Database Changes

### 1. Run Migration
```bash
# Apply the launch_hardening migration to production
supabase db push
```

**Migration summary:**
- Enables RLS on all golf tables (gamepools, games, game_scores, survey_responses, points_ledger, user_points, daily_prizes, courses, course_tees, stripe_prices, admin_settings)
- Removes dangerous self-serve write policies
- Secures four_unders_waitlist (read-only for safe columns, no anonymous writes)
- Adds unique constraint on stripe_checkout_id to prevent webhook duplicates
- Drops increment_current_players RPC (allows negative quantity)

### 2. Verify stripe_prices Table
Ensure exactly ONE active Four Under Club price:
```sql
SELECT price_id, product_name, member_cat, active, amount 
FROM stripe_prices 
WHERE member_cat = '4unders';
```
- Should show one row with `active = true`
- `price_id` should match your live Stripe price (starts with `price_`)
- `amount` should be 50.00

## Environment Variables

Verify these are set in production (Vercel/your hosting):

```bash
# Stripe (LIVE keys - start with sk_live_ and whsec_)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (ticketcube project: agyoehyzvergiiwdbzmz)
NEXT_PUBLIC_SUPABASE_URL=https://agyoehyzvergiiwdbzmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App URL
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

## Stripe Configuration

### 1. Live Mode Webhook
In Stripe Dashboard → Developers → Webhooks:
- Endpoint URL: `https://your-production-domain.com/api/stripe/webhook`
- Events to send: `checkout.session.completed`
- Status: Active
- Copy the signing secret to `STRIPE_WEBHOOK_SECRET` env var

### 2. Verify Price
In Stripe Dashboard → Products:
- Find "Four Under Club Membership" product
- Verify live price is $50 USD
- Copy price ID (starts with `price_`) to stripe_prices table

## Testing Protocol

### 1. Test Free Waitlist
1. Visit homepage
2. Fill survey
3. Click "Join Free Waitlist"
4. Verify entry in four_unders_waitlist with `paid = false`

### 2. Test Paid Membership (Test Mode First)
1. Switch Stripe to test mode
2. Update env vars with test keys (sk_test_, whsec_test_)
3. Create test price in stripe_prices
4. Complete checkout with test card: 4242 4242 4242 4242
5. Verify:
   - Webhook received (Stripe Dashboard → Webhooks → Events)
   - Entry in four_unders_waitlist with `paid = true`
   - No duplicate entries

### 3. Test Webhook Retry
In Stripe Dashboard → Webhooks → Events:
1. Find completed checkout event
2. Click "Resend event"
3. Verify NO duplicate row created (unique constraint works)
4. Should return 200 with "Already processed"

### 4. Test Live Payment
1. Switch back to live mode
2. Update env vars with live keys
3. Complete real $50 payment
4. Verify member appears on /members page

## Security Verification

### 1. RLS Enabled
Run in Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'gamepools', 'gamepool_entries', 'stripe_prices', 
  'games', 'game_scores', 'survey_responses', 
  'points_ledger', 'user_points', 'daily_prizes', 
  'courses', 'course_tees', 'four_unders_waitlist', 
  'admin_settings'
);
```
All should show `rowsecurity = true`

### 2. Waitlist Table Permissions
```sql
SELECT grantee, privilege_type, column_name
FROM information_schema.column_privileges
WHERE table_name = 'four_unders_waitlist'
AND grantee IN ('anon', 'authenticated');
```
Should only show SELECT on: id, username, created_at, referral_code, referred_by, paid

### 3. Deleted Routes
These should return 404:
- `/api/scores`
- `/api/profiles`
- `/api/survey-responses`
- `/api/waitlist` (old one, not /api/4unders-waitlist)
- `/api/stripe/test-price`

### 4. Protected Admin Route
`/api/waitlist/admin` requires:
- Bearer token in Authorization header
- User must exist in user_profiles
- member_cat must be 'admin' or 'aug31_paid'

## Post-Deployment Monitoring

### Week 1 Checklist
- [ ] Monitor Stripe webhook delivery (should be 100% success)
- [ ] Check for duplicate four_unders_waitlist entries (should be zero)
- [ ] Verify /members page loads without errors
- [ ] Monitor error logs for 500s on payment routes
- [ ] Check that free waitlist signups work
- [ ] Verify no unauthorized database access attempts

### Red Flags
- Webhook failures in Stripe Dashboard
- 500 errors on /api/stripe/webhook
- Missing paid members (payment succeeded but no waitlist entry)
- Duplicate stripe_checkout_id errors (should auto-handle, but investigate)
- RLS policy violations in Supabase logs

## Rollback Plan

If issues arise:
1. Disable Stripe webhook (Stripe Dashboard → Webhooks → Disable)
2. Put maintenance page up
3. Revert migration:
```sql
-- Emergency: Disable RLS to restore access
ALTER TABLE public.four_unders_waitlist DISABLE ROW LEVEL SECURITY;
-- (repeat for other tables if needed)
```
4. Contact team for investigation

## MVP Scope Reminder

**IN SCOPE:** Four Under Club membership signup (/, /4unders), payment processing, /members page

**OUT OF SCOPE (don't fix or enable):**
- 4Points game (/game)
- Leaderboards
- Gamepools/tournament inventory
- Points system
- User profiles
- Admin dashboard features

Focus all security efforts on the payment flow and waitlist only.