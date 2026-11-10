-- Structured address details + receiver contact. All nullable: addresses saved before this keep working
-- (address_line still holds the full composed line). Idempotent so migrate succeeds if already applied.
ALTER TABLE "customer_addresses" ADD COLUMN IF NOT EXISTS "house_floor" text;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD COLUMN IF NOT EXISTS "building_block" text;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD COLUMN IF NOT EXISTS "receiver_name" text;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD COLUMN IF NOT EXISTS "receiver_phone" text;
