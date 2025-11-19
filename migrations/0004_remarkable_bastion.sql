ALTER TABLE "developers" ALTER COLUMN "avatar" SET DEFAULT '/avatars/avatar-1.png';--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "media_url" text;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "media_type" text;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "media_name" text;