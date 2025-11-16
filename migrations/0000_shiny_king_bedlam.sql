CREATE TABLE IF NOT EXISTS "analytics" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "api_key_id" varchar,
        "date" timestamp NOT NULL,
        "total_challenges" integer DEFAULT 0 NOT NULL,
        "successful_verifications" integer DEFAULT 0 NOT NULL,
        "failed_verifications" integer DEFAULT 0 NOT NULL,
        "average_time_to_solve" integer,
        "unique_ips" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "developer_id" varchar NOT NULL,
        "name" text NOT NULL,
        "sitekey" text NOT NULL,
        "secretkey" text NOT NULL,
        "domain" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "api_keys_sitekey_unique" UNIQUE("sitekey"),
        CONSTRAINT "api_keys_secretkey_unique" UNIQUE("secretkey")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "challenges" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "token" text NOT NULL,
        "difficulty" integer DEFAULT 4 NOT NULL,
        "challenge_data" jsonb NOT NULL,
        "type" text NOT NULL,
        "api_key_id" varchar,
        "validated_domain" text NOT NULL,
        "signature" text NOT NULL,
        "session_fingerprint" varchar(64),
        "is_used" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "expires_at" timestamp NOT NULL,
        CONSTRAINT "challenges_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "developers" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" text NOT NULL,
        "password" text NOT NULL,
        "name" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "developers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verifications" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "challenge_id" varchar,
        "api_key_id" varchar,
        "success" boolean NOT NULL,
        "ip_address" text,
        "user_agent" text,
        "time_to_solve" integer,
        "attempt_data" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics" ADD CONSTRAINT "analytics_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_developer_id_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "challenges" ADD CONSTRAINT "challenges_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verifications" ADD CONSTRAINT "verifications_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verifications" ADD CONSTRAINT "verifications_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;