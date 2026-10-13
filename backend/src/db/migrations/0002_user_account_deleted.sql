-- Additive only: safe on DBs that already have users/orders data.
-- Do not drop or recreate user_status; existing rows keep active/blocked.
DO $$ BEGIN
  ALTER TYPE "user_status" ADD VALUE 'deleted';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
