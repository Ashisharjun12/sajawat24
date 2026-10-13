-- Duplicate of 0002_user_account_deleted (from db:generate). Keep idempotent so migrate succeeds if enum/column already exist.
DO $$ BEGIN
  ALTER TYPE "public"."user_status" ADD VALUE 'deleted';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
