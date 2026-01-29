-- FIX: Profiles Table Schema
-- Run this in Supabase SQL Editor to resolve the "Profile Setup Error"

-- 1. Ensure 'profiles' table exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMPTZ,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    
    -- Game Fields
    display_name TEXT,
    emoji_avatar TEXT DEFAULT '😎',
    coins INTEGER DEFAULT 1000,
    gems INTEGER DEFAULT 10,
    energy INTEGER DEFAULT 100,
    max_energy INTEGER DEFAULT 100,
    health INTEGER DEFAULT 100,
    max_health INTEGER DEFAULT 100,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add missing columns safely (if table already existed but was incomplete)
DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emoji_avatar TEXT DEFAULT '😎';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 1000;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 10;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS energy INTEGER DEFAULT 100;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_energy INTEGER DEFAULT 100;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS health INTEGER DEFAULT 100;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_health INTEGER DEFAULT 100;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'Column already exists in profiles.';
END $$;

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Upsert needs INSERT + UPDATE permissions)

-- Policy: Users can see everyone's profile (for leaderboards/map)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

-- Policy: Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- 5. Grant permissions to authenticated users
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

COMMIT;
