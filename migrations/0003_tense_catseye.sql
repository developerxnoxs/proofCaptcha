ALTER TABLE "chat_messages" ADD COLUMN "developer_avatar" text;--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN "avatar" text DEFAULT '/avatars/default-1.svg';--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN "company" text;--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN "location" text;