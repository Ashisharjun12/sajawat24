export type AnalyticsTableSpec = {
    name: string;
    description: string;
    columns: Array<{ name: string; type: string; description: string }>;
};

/** Tables/columns the analytics agent may query. PII columns are omitted. */
export const ANALYTICS_SCHEMA: AnalyticsTableSpec[] = [
    {
        name: "orders",
        description: "Customer bookings. Money is integer paise (divide by 100 for rupees). GMV for completed work uses status COMPLETED.",
        columns: [
            { name: "id", type: "uuid", description: "Order id" },
            { name: "reference", type: "text", description: "Public booking reference" },
            { name: "user_id", type: "uuid", description: "Customer user id" },
            { name: "status", type: "text", description: "DRAFT PENDING_PAYMENT CONFIRMED ASSIGNED EN_ROUTE ON_SITE COMPLETED CANCELLED DISPUTED" },
            { name: "payment_method", type: "text", description: "COD ONLINE PREPAID" },
            { name: "source", type: "text", description: "web or admin" },
            { name: "is_custom_package", type: "boolean", description: "Admin custom package" },
            { name: "city_id", type: "uuid", description: "Service city id" },
            { name: "pincode", type: "text", description: "Delivery pincode" },
            { name: "fulfillment_type", type: "text", description: "scheduled or instant" },
            { name: "dispatch_status", type: "text", description: "Dispatch state" },
            { name: "scheduled_at", type: "timestamptz", description: "Service datetime" },
            { name: "subtotal_paise", type: "int", description: "Line subtotal in paise" },
            { name: "discount_paise", type: "int", description: "Discount in paise" },
            { name: "coupon_id", type: "uuid", description: "Applied coupon id" },
            { name: "coupon_code", type: "text", description: "Applied coupon code" },
            { name: "customer_name", type: "text", description: "Customer display name only" },
            { name: "city_name", type: "text", description: "City name snapshot" },
            { name: "collection_status", type: "text", description: "COD collection state" },
            { name: "created_at", type: "timestamptz", description: "When the order was placed" },
            { name: "updated_at", type: "timestamptz", description: "Last update" },
        ],
    },
    {
        name: "order_items",
        description: "Line items on an order. product_name is denormalized.",
        columns: [
            { name: "id", type: "uuid", description: "Line id" },
            { name: "order_id", type: "uuid", description: "FK orders.id" },
            { name: "product_id", type: "uuid", description: "FK products.id" },
            { name: "product_name", type: "text", description: "Product name at purchase" },
            { name: "quantity", type: "int", description: "Qty" },
            { name: "product_paise", type: "int", description: "Product amount paise" },
            { name: "addons_paise", type: "int", description: "Add-on amount paise" },
            { name: "line_total_paise", type: "int", description: "Line total paise" },
            { name: "created_at", type: "timestamptz", description: "Created" },
        ],
    },
    {
        name: "products",
        description: "Catalog packages. Image URLs are not a column — use get-known-metric catalog_products or top_products. Media library images: catalog_media. Never query uploads or product_images.",
        columns: [
            { name: "id", type: "uuid", description: "Product id" },
            { name: "name", type: "text", description: "Name" },
            { name: "slug", type: "text", description: "Slug" },
            { name: "category_id", type: "uuid", description: "FK categories.id" },
            { name: "is_active", type: "boolean", description: "Listed" },
            { name: "scheduled_enabled", type: "boolean", description: "Scheduled booking" },
            { name: "instant_enabled", type: "boolean", description: "Instant booking" },
            { name: "price_paise", type: "int", description: "Base price paise" },
            { name: "review_count", type: "int", description: "Review count" },
            { name: "created_at", type: "timestamptz", description: "Created" },
            { name: "updated_at", type: "timestamptz", description: "Last catalog edit" },
        ],
    },
    {
        name: "addons",
        description: "Catalog add-ons. Image URLs are not a column — use get-known-metric catalog_addons. Never query uploads.",
        columns: [
            { name: "id", type: "uuid", description: "Addon id" },
            { name: "name", type: "text", description: "Name" },
            { name: "slug", type: "text", description: "Slug" },
            { name: "is_active", type: "boolean", description: "Listed" },
            { name: "price_paise", type: "int", description: "Price paise. 0 means free." },
            { name: "compare_at_paise", type: "int", description: "Compare-at paise" },
            { name: "max_quantity", type: "int", description: "Max qty per booking" },
            { name: "color_id", type: "uuid", description: "FK addon_colors.id" },
            { name: "created_at", type: "timestamptz", description: "Created" },
            { name: "updated_at", type: "timestamptz", description: "Last catalog edit" },
        ],
    },
    {
        name: "addon_colors",
        description: "Addon color options.",
        columns: [
            { name: "id", type: "uuid", description: "Color id" },
            { name: "name", type: "text", description: "Color name" },
            { name: "slug", type: "text", description: "Slug" },
            { name: "hex", type: "text", description: "Hex color" },
        ],
    },
    {
        name: "product_addons",
        description: "Which addons are attached to which products.",
        columns: [
            { name: "product_id", type: "uuid", description: "FK products.id" },
            { name: "addon_id", type: "uuid", description: "FK addons.id" },
        ],
    },
    {
        name: "categories",
        description: "Catalog categories. parent_id is null for roots.",
        columns: [
            { name: "id", type: "uuid", description: "Category id" },
            { name: "name", type: "text", description: "Name" },
            { name: "slug", type: "text", description: "Slug" },
            { name: "parent_id", type: "uuid", description: "Parent category" },
            { name: "is_active", type: "boolean", description: "Active" },
            { name: "updated_at", type: "timestamptz", description: "Last catalog edit" },
        ],
    },
    {
        name: "cities",
        description: "Service cities. Prefer get-known-metric catalog_cities for 'list cities'.",
        columns: [
            { name: "id", type: "uuid", description: "City id" },
            { name: "name", type: "text", description: "Name" },
            { name: "slug", type: "text", description: "Slug" },
            { name: "state", type: "text", description: "State" },
            { name: "is_active", type: "boolean", description: "Active" },
        ],
    },
    {
        name: "coupons",
        description: "Promotion codes. Do not invent redemption logic beyond this table.",
        columns: [
            { name: "id", type: "uuid", description: "Coupon id" },
            { name: "code", type: "text", description: "Code" },
            { name: "name", type: "text", description: "Internal name" },
            { name: "type", type: "text", description: "flat or percent" },
            { name: "value_paise", type: "int", description: "Flat amount paise" },
            { name: "percent_bps", type: "int", description: "Percent in basis points" },
            { name: "min_order_paise", type: "int", description: "Min order paise" },
            { name: "city_id", type: "uuid", description: "Optional city restriction" },
        ],
    },
    {
        name: "users",
        description: "Accounts. Only id, name, role, status, created_at are allowed. Never select phone or email.",
        columns: [
            { name: "id", type: "uuid", description: "User id" },
            { name: "name", type: "text", description: "Display name" },
            { name: "role", type: "text", description: "user vendor vendor_staff admin" },
            { name: "status", type: "text", description: "active blocked deleted" },
            { name: "created_at", type: "timestamptz", description: "Created" },
        ],
    },
];

export const ANALYTICS_TABLES = new Map(
    ANALYTICS_SCHEMA.map((table) => [table.name, new Set(table.columns.map((col) => col.name))]),
);

export const BLOCKED_IDENTIFIERS = new Set([
    "customer_phone",
    "customer_email",
    "address_line",
    "landmark",
    "phone",
    "email",
    "password_hash",
    "google_id",
    "avatar",
    "admin_notes",
    "idempotency_key",
    "delivery_latitude",
    "delivery_longitude",
    "upload_id",
    "uploads",
    "product_images",
    "optimized_key",
    "thumbnail_key",
    "image_upload_id",
]);

export const KNOWN_METRICS = [
    {
        id: "order_stats",
        description: "Order count, GMV, and counts by status for a date range. Use for volume and revenue.",
    },
    {
        id: "top_products",
        description: "Top sold products by line GMV for a date range, with imageUrl. Use ProductGrid. If empty, Callout — never an empty table.",
    },
    {
        id: "catalog_products",
        description: "Active catalog packages with imageUrl and priceLabel. Dates are ignored. Use for 'show products' questions, not sales rank.",
    },
    {
        id: "catalog_addons",
        description: "Active catalog add-ons with imageUrl, priceLabel, color. Dates ignored. Use for 'list addons' / 'show addons'. Never ProductCard.",
    },
    {
        id: "catalog_media",
        description: "Completed media-library files with imageUrl, filename, kind. Dates ignored. Use for 'show media', 'list images', 'all photos'. Never SQL against uploads.",
    },
    {
        id: "recent_edits",
        description: "Latest admin audit-log edits (who, action, entity, summary, when). Use for 'last time I edited', 'recent platform changes'. If the date window is empty, returns the latest edits anyway. Never invent rows. If empty, Callout.",
    },
    {
        id: "catalog_cities",
        description: "Active service cities with name, slug, state, and imageUrl (circle thumbnail). Dates ignored. Use for 'list cities' / 'show cities' / 'cities with images'. If empty, Callout.",
    },
] as const;

export type KnownMetricId = (typeof KNOWN_METRICS)[number]["id"];
