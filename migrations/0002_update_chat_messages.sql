-- Migration: Update chat_messages table schema
-- Remove encryption fields and add plain text content field
-- Since this is a new feature, we'll drop and recreate the table

DROP TABLE IF EXISTS "chat_messages";

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "developer_id" varchar NOT NULL REFERENCES "developers"("id"),
  "developer_name" text NOT NULL,
  "developer_email" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "chat_messages_created_at_idx" ON "chat_messages"("created_at");
CREATE INDEX IF NOT EXISTS "chat_messages_developer_id_idx" ON "chat_messages"("developer_id");
