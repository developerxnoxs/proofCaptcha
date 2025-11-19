-- Add media support to chat messages
ALTER TABLE chat_messages
ADD COLUMN media_url TEXT,
ADD COLUMN media_type TEXT,
ADD COLUMN media_name TEXT;
