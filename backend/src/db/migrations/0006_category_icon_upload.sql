-- Custom bar icon per top-level category (admin upload). Nullable: categories without one keep
-- using icon_key + icon_tone. Idempotent so migrate succeeds if already applied.
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "icon_upload_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_icon_upload_id_uploads_id_fk" FOREIGN KEY ("icon_upload_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
