CREATE TYPE "public"."user_role" AS ENUM('user', 'vendor', 'vendor_staff', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."vendor_onboarding_status" AS ENUM('PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."vendor_member_kind" AS ENUM('OWNER', 'WORKER');--> statement-breakpoint
CREATE TYPE "public"."vendor_member_status" AS ENUM('invited', 'active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('image', 'video', 'file');--> statement-breakpoint
CREATE TYPE "public"."optimize_status" AS ENUM('none', 'queued', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."upload_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."collection_method" AS ENUM('cash', 'online');--> statement-breakpoint
CREATE TYPE "public"."collection_status" AS ENUM('not_required', 'pending', 'collected_cash', 'collected_online');--> statement-breakpoint
CREATE TYPE "public"."order_source" AS ENUM('web', 'admin');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('DRAFT', 'PENDING_PAYMENT', 'CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED', 'CANCELLED', 'DISPUTED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('COD', 'ONLINE', 'PREPAID');--> statement-breakpoint
CREATE TYPE "public"."refund_request_status" AS ENUM('requested', 'rejected', 'processing', 'completed');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('sms', 'email', 'push', 'in_app', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('critical', 'standard', 'promotional');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'SCHEDULED', 'SENT', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."notification_template_type" AS ENUM('transactional', 'promotional');--> statement-breakpoint
CREATE TYPE "public"."push_device_platform" AS ENUM('android', 'ios');--> statement-breakpoint
CREATE TYPE "public"."payment_intent_status" AS ENUM('created', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('razorpay', 'cashfree');--> statement-breakpoint
CREATE TYPE "public"."ledger_account" AS ENUM('platform_cash', 'order_escrow', 'vendor_pending', 'vendor_payable', 'vendor_cod_due', 'platform_revenue');--> statement-breakpoint
CREATE TYPE "public"."collection_session_status" AS ENUM('created', 'paid', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."vendor_payout_method_type" AS ENUM('bank', 'upi');--> statement-breakpoint
CREATE TYPE "public"."payout_request_status" AS ENUM('pending', 'processing', 'paid', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."assignment_source" AS ENUM('admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."assignment_vendor_response" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."dispatch_offer_status" AS ENUM('offered', 'accepted', 'declined', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."dispatch_status" AS ENUM('idle', 'searching', 'offering', 'accepted', 'exhausted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_type" AS ENUM('scheduled', 'instant');--> statement-breakpoint
CREATE TYPE "public"."geo_point_source" AS ENUM('geocode_google', 'geocode_ola', 'place_pin', 'geocode_manual', 'pincode_centroid', 'device');--> statement-breakpoint
CREATE TYPE "public"."conversation_context_type" AS ENUM('order', 'vendor', 'product', 'none');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('open', 'pending', 'closed');--> statement-breakpoint
CREATE TYPE "public"."conversation_type" AS ENUM('booking', 'vendor_support', 'customer_support', 'complaint');--> statement-breakpoint
CREATE TYPE "public"."message_sender_role" AS ENUM('customer', 'vendor', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'file', 'system');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('customer', 'vendor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."coupon_scope" AS ENUM('entire_cart', 'products', 'categories');--> statement-breakpoint
CREATE TYPE "public"."coupon_type" AS ENUM('flat', 'percent');--> statement-breakpoint
CREATE TYPE "public"."coupon_target_type" AS ENUM('product', 'category');--> statement-breakpoint
CREATE TYPE "public"."customer_review_source" AS ENUM('admin', 'customer');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('draft', 'published', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."cms_announcement_tone" AS ENUM('info', 'promo', 'warning');--> statement-breakpoint
CREATE TYPE "public"."cms_placement" AS ENUM('announcement_bar', 'home_hero', 'home_mid', 'home_end');--> statement-breakpoint
CREATE TYPE "public"."cms_status" AS ENUM('draft', 'published', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."cms_home_block_type" AS ENUM('category_row', 'product_rail');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text,
	"email" text,
	"password_hash" text,
	"google_id" text,
	"name" text NOT NULL,
	"avatar" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"phone_verified_at" timestamp with time zone,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_has_identity" CHECK ("users"."phone" is not null or "users"."email" is not null or "users"."google_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "admin_email_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"new_email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone,
	"new_password_hash" text
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" text NOT NULL,
	"address_line" text NOT NULL,
	"landmark" text,
	"pincode" text NOT NULL,
	"city_id" uuid,
	"city_name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"geo_source" "geo_point_source",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"city_id" uuid NOT NULL,
	"shop_address" text NOT NULL,
	"pincode" text NOT NULL,
	"alt_phone" text,
	"shop_image_upload_id" uuid,
	"onboarding_status" "vendor_onboarding_status" DEFAULT 'PENDING' NOT NULL,
	"is_on_duty" boolean DEFAULT false NOT NULL,
	"duty_changed_at" timestamp with time zone,
	"base_latitude" double precision,
	"base_longitude" double precision,
	"base_geo_source" "geo_point_source",
	"service_radius_km" numeric(6, 2) DEFAULT '15' NOT NULL,
	"last_offered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"user_id" uuid,
	"invited_phone" text NOT NULL,
	"display_name" text NOT NULL,
	"kind" "vendor_member_kind" DEFAULT 'WORKER' NOT NULL,
	"status" "vendor_member_status" DEFAULT 'invited' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_field_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"family_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"device" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"state" text NOT NULL,
	"image_upload_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cities_name_unique" UNIQUE("name"),
	CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pincodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"city_id" uuid NOT NULL,
	"is_serviceable" boolean DEFAULT true NOT NULL,
	"locality" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pincodes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "media_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploaded_by" uuid,
	"folder_id" uuid,
	"kind" "media_kind" NOT NULL,
	"key" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer,
	"status" "upload_status" DEFAULT 'pending' NOT NULL,
	"width" integer,
	"height" integer,
	"duration_ms" integer,
	"thumbnail_key" text,
	"optimized_key" text,
	"optimized_at" timestamp with time zone,
	"optimize_status" "optimize_status" DEFAULT 'none' NOT NULL,
	"provider_upload_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uploads_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" uuid,
	"image_upload_id" uuid,
	"icon_key" text,
	"icon_tone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"upload_id" uuid NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_images_product_upload" UNIQUE("product_id","upload_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"category_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"scheduled_enabled" boolean DEFAULT true NOT NULL,
	"instant_enabled" boolean DEFAULT false NOT NULL,
	"instant_show_badge" boolean DEFAULT true NOT NULL,
	"instant_badge_label" text,
	"instant_pdp_note" text,
	"instant_eta_minutes" integer,
	"payment_cod" boolean DEFAULT true NOT NULL,
	"payment_online" boolean DEFAULT false NOT NULL,
	"price_paise" integer,
	"compare_at_paise" integer,
	"includes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"delivery_setup" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"care_instructions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"faqs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rating_avg" numeric(3, 2),
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "addon_colors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"hex" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addon_colors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_upload_id" uuid,
	"color_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"price_paise" integer,
	"compare_at_paise" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_addons" (
	"product_id" uuid NOT NULL,
	"addon_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_addons_product_id_addon_id_pk" PRIMARY KEY("product_id","addon_id")
);
--> statement-breakpoint
CREATE TABLE "addon_city_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"addon_id" uuid NOT NULL,
	"city_id" uuid NOT NULL,
	"price_paise" integer NOT NULL,
	"compare_at_paise" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addon_city_prices_addon_city" UNIQUE("addon_id","city_id")
);
--> statement-breakpoint
CREATE TABLE "city_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"city_id" uuid NOT NULL,
	"price_paise" integer NOT NULL,
	"compare_at_paise" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "city_prices_product_city" UNIQUE("product_id","city_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_section_city_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"city_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_section_city_overrides_section_city" UNIQUE("section_id","city_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_section_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"city_id" uuid,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"badge_color" text DEFAULT 'amber' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_sections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cart_item_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_item_id" uuid NOT NULL,
	"addon_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_item_addons_item_addon" UNIQUE("cart_item_id","addon_id")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_cart_product" UNIQUE("cart_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"guest_key" text,
	"city_id" uuid,
	"pincode" text,
	"fulfillment_type" "fulfillment_type",
	"delivery_latitude" double precision,
	"delivery_longitude" double precision,
	"scheduled_at" timestamp with time zone,
	"applied_coupon_id" uuid,
	"applied_coupon_code" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carts_guest_key_unique" UNIQUE("guest_key"),
	CONSTRAINT "carts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "order_item_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"addon_id" uuid NOT NULL,
	"addon_name" text NOT NULL,
	"price_paise" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_item_addons_item_addon" UNIQUE("order_item_id","addon_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"image_url" text,
	"quantity" integer NOT NULL,
	"product_paise" integer NOT NULL,
	"addons_paise" integer NOT NULL,
	"line_total_paise" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "order_status" NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"source" "order_source" DEFAULT 'web' NOT NULL,
	"created_by_admin_id" uuid,
	"admin_notes" text,
	"is_custom_package" boolean DEFAULT false NOT NULL,
	"city_id" uuid NOT NULL,
	"pincode" text NOT NULL,
	"fulfillment_type" "fulfillment_type" DEFAULT 'scheduled' NOT NULL,
	"dispatch_status" "dispatch_status" DEFAULT 'idle' NOT NULL,
	"dispatch_exhausted_at" timestamp with time zone,
	"delivery_latitude" double precision,
	"delivery_longitude" double precision,
	"delivery_geo_source" "geo_point_source",
	"delivery_geo_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"coupon_id" uuid,
	"coupon_code" text,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text NOT NULL,
	"address_line" text NOT NULL,
	"landmark" text,
	"city_name" text NOT NULL,
	"idempotency_key" text,
	"collection_status" "collection_status" DEFAULT 'not_required' NOT NULL,
	"collection_method" "collection_method",
	"collected_at" timestamp with time zone,
	"ledger_posted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_reference_unique" UNIQUE("reference"),
	CONSTRAINT "orders_user_idempotency" UNIQUE("user_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "refund_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_paise" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "refund_request_status" DEFAULT 'requested' NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"admin_note" text,
	"reviewed_by" uuid,
	"gateway_refund_id" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"summary" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text,
	"attempt" integer DEFAULT 1 NOT NULL,
	"error" text,
	"status" "notification_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_template_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"type" "notification_template_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"editable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event" text NOT NULL,
	"template_id" uuid,
	"channel" "notification_channel" NOT NULL,
	"priority" "notification_priority" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "notification_status" DEFAULT 'PENDING' NOT NULL,
	"idempotency_key" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "notifications_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"queue" text NOT NULL,
	"payload" jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"sms" boolean DEFAULT true NOT NULL,
	"email" boolean DEFAULT true NOT NULL,
	"push" boolean DEFAULT true NOT NULL,
	"in_app" boolean DEFAULT true NOT NULL,
	"whatsapp" boolean DEFAULT false NOT NULL,
	"promotional_email" boolean DEFAULT false NOT NULL,
	"promotional_sms" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_push_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expo_push_token" text NOT NULL,
	"platform" "push_device_platform" NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_ref" text NOT NULL,
	"amount_paise" integer NOT NULL,
	"status" "payment_intent_status" DEFAULT 'created' NOT NULL,
	"provider_payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_intents_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "order_financials" (
	"order_id" uuid PRIMARY KEY NOT NULL,
	"gross_paise" integer NOT NULL,
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"platform_percent_snapshot" integer NOT NULL,
	"platform_fee_paise" integer NOT NULL,
	"vendor_share_paise" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"vendor_id" uuid,
	"debit_account" "ledger_account" NOT NULL,
	"credit_account" "ledger_account" NOT NULL,
	"amount_paise" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_idempotency_key" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "collection_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_ref" text NOT NULL,
	"amount_paise" integer NOT NULL,
	"status" "collection_session_status" DEFAULT 'created' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"qr_payload" jsonb,
	"provider_payment_id" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_payout_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"type" "vendor_payout_method_type" NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"account_holder_name" text NOT NULL,
	"bank_name" text,
	"account_number_last4" text,
	"account_number_encrypted" text,
	"ifsc" text,
	"upi_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payout_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"payout_method_id" uuid,
	"amount_paise" integer NOT NULL,
	"status" "payout_request_status" DEFAULT 'pending' NOT NULL,
	"provider" text,
	"provider_ref" text,
	"failure_reason" text,
	"processed_at" timestamp with time zone,
	"processed_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"vendor_response" "assignment_vendor_response" DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp with time zone,
	"source" "assignment_source" DEFAULT 'admin' NOT NULL,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "dispatch_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"distance_meters" integer,
	"status" "dispatch_offer_status" DEFAULT 'offered' NOT NULL,
	"offered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"responded_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "participant_role" NOT NULL,
	"last_read_at" timestamp with time zone,
	"last_read_message_id" uuid,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "conversation_type" NOT NULL,
	"status" "conversation_status" DEFAULT 'open' NOT NULL,
	"subject" text,
	"topic_key" text,
	"context_type" "conversation_context_type",
	"context_id" uuid,
	"last_message_at" timestamp with time zone,
	"last_message_preview" text,
	"message_count" integer DEFAULT 0 NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by" uuid,
	"assigned_admin_id" uuid,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sequence" bigint NOT NULL,
	"sender_user_id" uuid,
	"sender_role" "message_sender_role" NOT NULL,
	"body" text,
	"message_type" "message_type" DEFAULT 'text' NOT NULL,
	"attachment_url" text,
	"client_message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "coupon_type" NOT NULL,
	"value_paise" integer,
	"percent_bps" integer,
	"max_discount_paise" integer,
	"min_order_paise" integer DEFAULT 0 NOT NULL,
	"max_uses" integer NOT NULL,
	"max_uses_per_user" integer NOT NULL,
	"city_id" uuid,
	"scope" "coupon_scope" DEFAULT 'entire_cart' NOT NULL,
	"first_order_only" boolean DEFAULT false NOT NULL,
	"allowed_payment_methods" text[] DEFAULT ARRAY['online','cod']::text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "coupon_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"target_type" "coupon_target_type" NOT NULL,
	"target_id" uuid NOT NULL,
	CONSTRAINT "coupon_targets_coupon_type_id" UNIQUE("coupon_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"discount_paise" integer NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_redemptions_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "customer_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"reviewer_name" text NOT NULL,
	"reviewer_city" text,
	"reviewer_avatar_upload_id" uuid,
	"photo_upload_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"status" "review_status" DEFAULT 'draft' NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"source" "customer_review_source" DEFAULT 'admin' NOT NULL,
	"order_id" uuid,
	"user_id" uuid,
	"created_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"upload_id" uuid NOT NULL,
	"caption" text,
	"status" "review_status" DEFAULT 'draft' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement" "cms_placement" NOT NULL,
	"city_id" uuid,
	"platforms" text[] DEFAULT ARRAY['web','mobile']::text[] NOT NULL,
	"status" "cms_status" DEFAULT 'draft' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"title" text,
	"subtitle" text,
	"tag" text,
	"image_upload_id" uuid,
	"mobile_image_upload_id" uuid,
	"alt" text,
	"cta_label" text,
	"href" text,
	"secondary_label" text,
	"secondary_href" text,
	"message" text,
	"tone" "cms_announcement_tone",
	"accent_color" text,
	"dismissible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote" text NOT NULL,
	"reviewer_name" text NOT NULL,
	"reviewer_city" text,
	"rating" integer DEFAULT 5 NOT NULL,
	"accent_color" text,
	"avatar_upload_id" uuid,
	"city_id" uuid,
	"platforms" text[] DEFAULT ARRAY['web','mobile']::text[] NOT NULL,
	"status" "cms_status" DEFAULT 'draft' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_home_block_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_home_block_categories_block_category" UNIQUE("block_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "cms_home_layout_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "cms_home_block_type" NOT NULL,
	"city_id" uuid,
	"status" "cms_status" DEFAULT 'draft' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"platforms" text[] DEFAULT ARRAY['web','mobile']::text[] NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"title" text,
	"subtitle" text,
	"show_title" boolean DEFAULT true NOT NULL,
	"show_subtitle" boolean DEFAULT true NOT NULL,
	"section_id" uuid,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_home_faq_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"status" "cms_status" DEFAULT 'draft' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"platforms" text[] DEFAULT ARRAY['web','mobile']::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"href" text NOT NULL,
	"icon_preset" text,
	"icon_upload_id" uuid,
	"status" "cms_status" DEFAULT 'draft' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"platforms" text[] DEFAULT ARRAY['web','mobile']::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_footer_column_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"column_id" uuid NOT NULL,
	"label" text NOT NULL,
	"link_type" text DEFAULT 'custom' NOT NULL,
	"page_id" uuid,
	"href" text DEFAULT '' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_footer_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"status" "cms_status" DEFAULT 'draft' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"platforms" text[] DEFAULT ARRAY['web','mobile']::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" "cms_status" DEFAULT 'draft' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"platforms" text[] DEFAULT ARRAY['web','mobile']::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_email_change_requests" ADD CONSTRAINT "admin_email_change_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_shop_image_upload_id_uploads_id_fk" FOREIGN KEY ("shop_image_upload_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_members" ADD CONSTRAINT "vendor_members_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_members" ADD CONSTRAINT "vendor_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_field_assignments" ADD CONSTRAINT "order_field_assignments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_field_assignments" ADD CONSTRAINT "order_field_assignments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_field_assignments" ADD CONSTRAINT "order_field_assignments_member_id_vendor_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."vendor_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_field_assignments" ADD CONSTRAINT "order_field_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_image_upload_id_uploads_id_fk" FOREIGN KEY ("image_upload_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pincodes" ADD CONSTRAINT "pincodes_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parent_id_media_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media_folders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_folder_id_media_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."media_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_image_upload_id_uploads_id_fk" FOREIGN KEY ("image_upload_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_upload_id_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addons" ADD CONSTRAINT "addons_image_upload_id_uploads_id_fk" FOREIGN KEY ("image_upload_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addons" ADD CONSTRAINT "addons_color_id_addon_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."addon_colors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_city_prices" ADD CONSTRAINT "addon_city_prices_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_city_prices" ADD CONSTRAINT "addon_city_prices_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "city_prices" ADD CONSTRAINT "city_prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "city_prices" ADD CONSTRAINT "city_prices_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_section_city_overrides" ADD CONSTRAINT "catalog_section_city_overrides_section_id_catalog_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."catalog_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_section_city_overrides" ADD CONSTRAINT "catalog_section_city_overrides_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_section_products" ADD CONSTRAINT "catalog_section_products_section_id_catalog_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."catalog_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_section_products" ADD CONSTRAINT "catalog_section_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_section_products" ADD CONSTRAINT "catalog_section_products_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item_addons" ADD CONSTRAINT "cart_item_addons_cart_item_id_cart_items_id_fk" FOREIGN KEY ("cart_item_id") REFERENCES "public"."cart_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item_addons" ADD CONSTRAINT "cart_item_addons_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_applied_coupon_id_coupons_id_fk" FOREIGN KEY ("applied_coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_addons" ADD CONSTRAINT "order_item_addons_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_addons" ADD CONSTRAINT "order_item_addons_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_inbox" ADD CONSTRAINT "notification_inbox_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_template_versions" ADD CONSTRAINT "notification_template_versions_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications_outbox" ADD CONSTRAINT "notifications_outbox_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_push_devices" ADD CONSTRAINT "user_push_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_financials" ADD CONSTRAINT "order_financials_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_sessions" ADD CONSTRAINT "collection_sessions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payout_methods" ADD CONSTRAINT "vendor_payout_methods_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_payout_method_id_vendor_payout_methods_id_fk" FOREIGN KEY ("payout_method_id") REFERENCES "public"."vendor_payout_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_processed_by_admin_id_users_id_fk" FOREIGN KEY ("processed_by_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_offers" ADD CONSTRAINT "dispatch_offers_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_offers" ADD CONSTRAINT "dispatch_offers_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_admin_id_users_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_targets" ADD CONSTRAINT "coupon_targets_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_reviewer_avatar_upload_id_uploads_id_fk" FOREIGN KEY ("reviewer_avatar_upload_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_reviews" ADD CONSTRAINT "video_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_reviews" ADD CONSTRAINT "video_reviews_upload_id_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_reviews" ADD CONSTRAINT "video_reviews_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_banners" ADD CONSTRAINT "cms_banners_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_banners" ADD CONSTRAINT "cms_banners_image_upload_id_uploads_id_fk" FOREIGN KEY ("image_upload_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_banners" ADD CONSTRAINT "cms_banners_mobile_image_upload_id_uploads_id_fk" FOREIGN KEY ("mobile_image_upload_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_testimonials" ADD CONSTRAINT "cms_testimonials_avatar_upload_id_uploads_id_fk" FOREIGN KEY ("avatar_upload_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_testimonials" ADD CONSTRAINT "cms_testimonials_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_home_block_categories" ADD CONSTRAINT "cms_home_block_categories_block_id_cms_home_layout_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."cms_home_layout_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_home_block_categories" ADD CONSTRAINT "cms_home_block_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_home_layout_blocks" ADD CONSTRAINT "cms_home_layout_blocks_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_home_layout_blocks" ADD CONSTRAINT "cms_home_layout_blocks_section_id_catalog_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."catalog_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_social_links" ADD CONSTRAINT "cms_social_links_icon_upload_id_uploads_id_fk" FOREIGN KEY ("icon_upload_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_footer_column_links" ADD CONSTRAINT "cms_footer_column_links_column_id_cms_footer_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."cms_footer_columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_footer_column_links" ADD CONSTRAINT "cms_footer_column_links_page_id_cms_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."cms_pages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_email_change_requests_user_id_idx" ON "admin_email_change_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_email_change_requests_token_hash_idx" ON "admin_email_change_requests" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_members_vendor_user_uidx" ON "vendor_members" USING btree ("vendor_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_members_vendor_phone_uidx" ON "vendor_members" USING btree ("vendor_id","invited_phone");--> statement-breakpoint
CREATE UNIQUE INDEX "order_field_assignments_order_member_uidx" ON "order_field_assignments" USING btree ("order_id","member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_folders_root_slug" ON "media_folders" USING btree ("slug") WHERE "media_folders"."parent_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "media_folders_parent_slug" ON "media_folders" USING btree ("parent_id","slug") WHERE "media_folders"."parent_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "addon_colors_name_lower_idx" ON "addon_colors" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_section_products_global_uniq" ON "catalog_section_products" USING btree ("section_id","product_id") WHERE "catalog_section_products"."city_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_section_products_city_uniq" ON "catalog_section_products" USING btree ("section_id","product_id","city_id") WHERE "catalog_section_products"."city_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_templates_key_channel_locale" ON "notification_templates" USING btree ("key","channel","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "user_push_devices_expo_push_token_unique" ON "user_push_devices" USING btree ("expo_push_token");--> statement-breakpoint
CREATE INDEX "cms_home_faq_items_status_sort_idx" ON "cms_home_faq_items" USING btree ("status","sort_index");--> statement-breakpoint
CREATE INDEX "cms_social_links_status_sort_idx" ON "cms_social_links" USING btree ("status","sort_index");--> statement-breakpoint
CREATE INDEX "cms_footer_columns_status_sort_idx" ON "cms_footer_columns" USING btree ("status","sort_index");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_pages_slug_unique" ON "cms_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cms_pages_status_sort_idx" ON "cms_pages" USING btree ("status","sort_index");