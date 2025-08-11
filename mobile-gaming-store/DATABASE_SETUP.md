# Database Setup Guide - FIXED

## Supabase Database Tables

To fix the "no rows returned" error, you need to update your Supabase database with proper RLS policies.

### 1. First, Check Current Tables

Run this to see what exists:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('profiles', 'carts');

-- Check current policies
SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'carts');
```

### 2. Drop and Recreate Tables (if needed)

If you have existing tables with wrong policies, run this:

```sql
-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

### 3. Create Tables with Proper RLS

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  phone TEXT,
  location TEXT,
  email TEXT,
  orders_count INTEGER DEFAULT 0,
  wishlist_count INTEGER DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create carts table
CREATE TABLE carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Enable RLS and Create CORRECT Policies

```sql
-- Enable RLS on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own cart" ON carts;
DROP POLICY IF EXISTS "Users can update their own cart" ON carts;
DROP POLICY IF EXISTS "Users can insert their own cart" ON carts;

-- Create CORRECT policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create CORRECT policies for carts
CREATE POLICY "Users can view their own cart" ON carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart" ON carts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart" ON carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 5. Create Function for Auto Profile Creation

```sql
-- Function to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 6. Test the Setup

```sql
-- Test if you can insert a profile (replace with your user ID)
-- First, get your user ID from the auth.users table
SELECT id, email FROM auth.users LIMIT 1;

-- Then test insert (replace 'your-user-id-here' with actual ID)
INSERT INTO profiles (id, email, name)
VALUES ('your-user-id-here', 'test@example.com', 'Test User')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();

-- Test if you can select
SELECT * FROM profiles WHERE id = 'your-user-id-here';
```

## Quick Fix for "No Rows Returned"

If you're still getting "no rows returned", try this temporary fix:

```sql
-- TEMPORARY: Disable RLS for testing (remove this in production)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE carts DISABLE ROW LEVEL SECURITY;

-- Test insert
INSERT INTO profiles (id, email, name)
VALUES ('your-user-id-here', 'test@example.com', 'Test User')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
```

## Alternative: Manual Profile Creation

If the trigger doesn't work, you can manually create profiles:

```sql
-- For existing users, create profiles manually
INSERT INTO profiles (id, email, created_at, updated_at)
SELECT id, email, now(), now()
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

## Verification Steps

1. **Check tables exist:**

   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name IN ('profiles', 'carts');
   ```

2. **Check policies:**

   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename IN ('profiles', 'carts');
   ```

3. **Test authentication:**
   - Go to `http://localhost:8000/login.html`
   - Try to sign up with a new email
   - Check if profile is created automatically

## Common Issues & Solutions

### Issue: "No rows returned"

**Solution:** RLS policies are too restrictive. Use the temporary disable method above.

### Issue: "Permission denied"

**Solution:** Make sure you're logged in and the policies are correct.

### Issue: "Foreign key violation"

**Solution:** The user doesn't exist in auth.users. Make sure to sign up first.

## Next Steps

After running these SQL commands:

1. **Test signup** at `http://localhost:8000/login.html`
2. **Check browser console** for any remaining errors
3. **Test profile page** at `http://localhost:8000/profile.html`
4. **Test cart functionality** by adding items

The "no rows returned" error should now be fixed! 🎮
