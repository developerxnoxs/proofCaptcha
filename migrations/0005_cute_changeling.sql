ALTER TABLE "chat_messages" ALTER COLUMN "content" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN "role" text DEFAULT 'developer' NOT NULL;