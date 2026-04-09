-- Fix Column Types for Problems Table (v3 - Subquery Fix)
-- Run this in Supabase SQL Editor

-- 1. Create a helper function to convert jsonb array to text array
--    This avoids the "cannot use subquery in transform expression" error
CREATE OR REPLACE FUNCTION jsonb_array_to_text_array(input_jsonb jsonb)
RETURNS text[] AS $$
BEGIN
  IF jsonb_typeof(input_jsonb) = 'array' THEN
    RETURN ARRAY(SELECT jsonb_array_elements_text(input_jsonb));
  ELSE
    RETURN '{}'::text[];
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Execute the changes using the helper function
DO $$ 
BEGIN 
    -- Convert starter_code from TEXT to JSONB
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'starter_code' AND data_type = 'text') THEN
        ALTER TABLE problems 
        ALTER COLUMN starter_code TYPE JSONB 
        USING (
            CASE 
                WHEN starter_code IS NULL THEN NULL 
                WHEN starter_code::text ~ '^\s*\{.*\}\s*$' THEN starter_code::jsonb 
                ELSE jsonb_build_object('python', starter_code) 
            END
        );
    END IF;

    -- Convert hints from JSONB to TEXT[] using the helper function
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'hints' AND data_type = 'jsonb') THEN
        ALTER TABLE problems 
        ALTER COLUMN hints TYPE TEXT[] 
        USING jsonb_array_to_text_array(hints);
    END IF;

END $$;

-- 3. Cleanup helper function (optional, but good practice if not needed elsewhere)
-- DROP FUNCTION IF EXISTS jsonb_array_to_text_array(jsonb);
