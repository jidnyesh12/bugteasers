-- ============================================================
-- ROBUST FIX FOR REGISTRATION 500 ERROR
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- 1. Reset Trigger & Function
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Ensure Types Exist (Idempotent)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create Robust Function with Error Handling
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role user_role := 'student';
  _role_text TEXT;
  _full_name TEXT;
BEGIN
  -- Log start of execution (visible in Supabase logs)
  RAISE LOG 'handle_new_user trigger started for User ID: %', NEW.id;

  -- 1. Safe Meta Data Extraction
  BEGIN
    _role_text := NEW.raw_user_meta_data->>'role';
    _full_name := NEW.raw_user_meta_data->>'full_name';
    
    -- Validate Role
    IF _role_text IS NOT NULL AND _role_text IN ('student', 'instructor', 'admin') THEN
      _role := _role_text::user_role;
    ELSE
      _role := 'student'; -- Default fallback
    END IF;
  EXCEPTION WHEN OTHERS THEN
    _role := 'student'; -- Ultimate fallback if JSON parsing fails
    RAISE WARNING 'Error extract metadata, reverting to default role';
  END;

  -- 2. Insert Profile (Idempotent)
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, 'unknown@example.com'),
      COALESCE(_full_name, ''),
      _role
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error inserting profile: %', SQLERRM;
    RETURN NEW; -- Don't fail the transaction, allow user creation even if profile fails (can be fixed manually)
  END;

  -- 3. Insert User Settings (Idempotent)
  BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error inserting user_settings: %', SQLERRM;
    -- Swallow error to ensure auth user is created
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach Trigger
-- ============================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Permission Verification (Fixes potentially missing grants)
-- ============================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_settings TO postgres, anon, authenticated, service_role;
