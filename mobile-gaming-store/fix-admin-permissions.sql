-- Fix Admin Permissions for Messaging System
-- Run this in your Supabase SQL editor

-- First, let's check what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'messages')
ORDER BY tablename, policyname;

-- Drop any conflicting policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert messages to any user" ON messages;
DROP POLICY IF EXISTS "Admins can read all messages" ON messages;

-- Create comprehensive admin policies for profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = 'b34bceb9-af1a-48f3-9460-f0d83d89b10b'
  );

-- Create comprehensive admin policies for messages
CREATE POLICY "Admins can insert messages to any user" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = 'b34bceb9-af1a-48f3-9460-f0d83d89b10b'
  );

CREATE POLICY "Admins can read all messages" ON messages
  FOR SELECT USING (
    auth.uid() = 'b34bceb9-af1a-48f3-9460-f0d83d89b10b'
  );

-- Also allow admins to update messages (for marking as read)
CREATE POLICY "Admins can update all messages" ON messages
  FOR UPDATE USING (
    auth.uid() = 'b34bceb9-af1a-48f3-9460-f0d83d89b10b'
  );

-- Verify the new policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'messages')
ORDER BY tablename, policyname;

-- Test if admin can read profiles (this should return all profiles)
-- Note: You'll need to run this as the admin user
SELECT COUNT(*) as total_profiles FROM profiles; 