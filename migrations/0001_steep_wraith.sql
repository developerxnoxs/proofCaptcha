CREATE TABLE IF NOT EXISTS "country_analytics" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "api_key_id" varchar,
        "country" text NOT NULL,
        "country_name" text NOT NULL,
        "date" timestamp NOT NULL,
        "total_verifications" integer DEFAULT 0 NOT NULL,
        "successful_verifications" integer DEFAULT 0 NOT NULL,
        "failed_verifications" integer DEFAULT 0 NOT NULL,
        "average_time_to_solve" integer,
        "unique_ips" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "theme" text DEFAULT 'light' NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "settings" jsonb;--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN IF NOT EXISTS "is_email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN IF NOT EXISTS "verification_code" text;--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN IF NOT EXISTS "verification_code_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN IF NOT EXISTS "reset_password_code" text;--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN IF NOT EXISTS "reset_password_code_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "verifications" ADD COLUMN IF NOT EXISTS "country" text;--> statement-breakpoint
ALTER TABLE "verifications" ADD COLUMN IF NOT EXISTS "country_name" text;--> statement-breakpoint
ALTER TABLE "verifications" ADD COLUMN IF NOT EXISTS "region" text;--> statement-breakpoint
ALTER TABLE "verifications" ADD COLUMN IF NOT EXISTS "city" text;--> statement-breakpoint
ALTER TABLE "verifications" ADD COLUMN IF NOT EXISTS "latitude" text;--> statement-breakpoint
ALTER TABLE "verifications" ADD COLUMN IF NOT EXISTS "longitude" text;--> statement-breakpoint
ALTER TABLE "verifications" ADD COLUMN IF NOT EXISTS "timezone" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "country_analytics" ADD CONSTRAINT "country_analytics_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;