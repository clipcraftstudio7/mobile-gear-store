-- Supabase Messages Table Setup
-- Run this in your Supabase SQL editor

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'system',
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages table
-- Users can read their own messages
CREATE POLICY "Users can read their own messages" ON messages
  FOR SELECT USING (auth.uid() = receiver_id);

-- Users can update their own messages (mark as read)
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Admins can insert messages (broadcast)
CREATE POLICY "Admins can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Admins can read messages they sent
CREATE POLICY "Admins can read messages they sent" ON messages
  FOR SELECT USING (auth.uid() = sender_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 