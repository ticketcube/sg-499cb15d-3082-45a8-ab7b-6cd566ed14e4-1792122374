-- Migration: Auto-create user profiles on signup
-- This trigger automatically creates a user_profiles entry when a new user signs up
-- Works for ALL auth methods: email, Google OAuth, GitHub OAuth, Apple OAuth, etc.

-- ============================================================================
-- FUNCTION: Auto-create user profile on signup (with conflict resolution)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    -- Base username from email prefix or user ID
    base_username text;
    final_username text;
    username_counter int := 1;

    -- Base display name from metadata or fallback
    base_display text;
    final_display text;
    display_counter int := 1;
    
    max_attempts int := 100; -- Prevent infinite loops
BEGIN
    BEGIN
        -- Handle null emails (Apple "Hide My Email" feature)
        IF NEW.email IS NULL OR NEW.email = '' THEN
            base_username := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
            base_display := 'User ' || SUBSTRING(NEW.id::text, 1, 8);
        ELSE
            base_username := SPLIT_PART(NEW.email, '@', 1);
            -- Use full_name from metadata if available, otherwise use email prefix
            base_display := COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name',
                SPLIT_PART(NEW.email, '@', 1)
            );
        END IF;

        -- Clean username (remove special characters, lowercase)
        base_username := LOWER(REGEXP_REPLACE(base_username, '[^a-zA-Z0-9_-]', '', 'g'));
        
        -- Ensure username is not empty after cleaning
        IF base_username = '' OR base_username IS NULL THEN
            base_username := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
        END IF;
        
        final_username := base_username;
        final_display := base_display;

        -- Ensure username is unique (with counter)
        WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = final_username) AND username_counter < max_attempts LOOP
            final_username := base_username || username_counter;
            username_counter := username_counter + 1;
        END LOOP;

        -- Ensure display_name is unique (with counter)
        WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE display_name = final_display) AND display_counter < max_attempts LOOP
            final_display := base_display || display_counter;
            display_counter := display_counter + 1;
        END LOOP;

        -- Insert new profile with conflict-safe values
        INSERT INTO public.user_profiles (
            user_id,
            email,
            username,
            display_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email, -- Can be null for Apple "Hide My Email"
            final_username,
            final_display,
            'fan', -- Default role is 'fan'
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Successfully created profile for user % with username % and display name %', 
            NEW.id, final_username, final_display;

    EXCEPTION 
        WHEN unique_violation THEN
            -- If we still hit a unique violation, try one more time with UUID suffix
            BEGIN
                final_username := base_username || '_' || SUBSTRING(NEW.id::text, 1, 6);
                final_display := base_display || ' ' || SUBSTRING(NEW.id::text, 1, 6);
                
                INSERT INTO public.user_profiles (
                    user_id,
                    email,
                    username,
                    display_name,
                    role,
                    created_at,
                    updated_at
                ) VALUES (
                    NEW.id,
                    NEW.email,
                    final_username,
                    final_display,
                    'fan',
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE 'Created profile with UUID suffix for user %', NEW.id;
            EXCEPTION WHEN OTHERS THEN
                -- Log error but don't block user creation
                RAISE WARNING 'Failed to create user profile for user %. Error: % (SQLSTATE: %)', 
                    NEW.id, SQLERRM, SQLSTATE;
            END;
        WHEN OTHERS THEN
            -- Log any other errors but allow user creation to succeed
            RAISE WARNING 'Unexpected error creating profile for user %. Error: % (SQLSTATE: %)', 
                NEW.id, SQLERRM, SQLSTATE;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Run function on new user creation
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFICATION: Check if trigger exists
-- ============================================================================
-- To verify the trigger is working, check:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- To check for error logs in Supabase:
-- Check the Postgres logs in your Supabase dashboard under Database > Logs

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. This trigger fires AFTER a new user is inserted into auth.users
-- 2. It automatically creates a matching profile in user_profiles
-- 3. Handles null emails from Apple "Hide My Email" feature
-- 4. Username is generated from email (part before @) or user ID
-- 5. Ensures unique usernames and display names with counter suffix
-- 6. Display name comes from OAuth metadata (full_name or name field)
-- 7. Default role is 'fan' (users can upgrade to 'artist' later)
-- 8. Uses exception handling to prevent auth failures if profile creation fails
-- 9. Logs warnings for debugging without blocking user signup

-- ============================================================================
-- APPLE AUTH SPECIFIC HANDLING:
-- ============================================================================
-- Apple Sign In provides these metadata fields:
-- - raw_user_meta_data->>'name' (JSON object with first_name, last_name)
-- - raw_user_meta_data->>'full_name' (string)
-- - email (can be null if user chooses "Hide My Email")
-- 
-- This function handles all cases gracefully:
-- 1. If email exists: use email prefix for username
-- 2. If email is null: use user_id for username
-- 3. Display name priority: full_name > name > email prefix > user_id

-- ============================================================================
-- TESTING:
-- ============================================================================
-- After running this migration, test with:
-- 1. New Apple Auth signup (with email)
-- 2. New Apple Auth signup (without email - "Hide My Email")
-- 3. New Google Auth signup
-- 4. Multiple signups with same email prefix
-- 5. Check user_profiles table to verify all profiles created successfully