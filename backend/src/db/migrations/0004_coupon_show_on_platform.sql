-- Coupons can be hidden from customer-facing lists (product page offers, offers list, checkout list)
-- while still working when the customer types the code. Default true keeps every existing coupon listed.
-- Idempotent so migrate succeeds if the column was already added.
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "show_on_platform" boolean DEFAULT true NOT NULL;
