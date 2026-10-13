# Media re-seed after full wipe

Use this order so customer-facing apps get URLs back quickly. All catalog/CMS assets should go through **Admin → Media** (product picker defaults to the **Products** folder).

## 1. Brand

- **Admin → Brand** (`/brand`)
- Upload light/dark logos and optional product trust gallery slide (`BrandLogoPanel`, `BrandProductTrustPanel`)
- Ensure `settings.site_brand` upload IDs are null or point at **completed** uploads

## 2. CMS

- **Admin → Content** (`/content`)
- Web/app banners, announcements, testimonials, social link icons
- Upload via Media library or in-form pickers (same `uploads` API)

## 3. Geo and catalog shell

- City images: **Geo → Cities**
- Category images: **Catalog → Categories**

## 4. Products

- **Catalog → Products → Edit**
- Gallery via product media picker (`imageUploadIds` on save)
- Published products need at least one **image** upload and a price

## 5. Addons and reviews

- Addon images on addon form
- Customer review avatars/photos (JSON photo IDs — no FK; re-pick after wipe)
- Video reviews reference uploads with **ON DELETE RESTRICT** — remove or reassign before deleting media

## 6. Vendor assets

- Re-upload from **vendor app**: shop image (registration/profile), profile avatar, chat attachments
- Not stored in admin Media folders unless you upload copies for reference

## Storage notes

- If the object bucket was emptied, new uploads get new keys automatically
- Orphan objects left in storage after a DB-only wipe are harmless

## Hygiene scripts

See [`scripts/media-orphan-cleanup.sql`](../scripts/media-orphan-cleanup.sql) for orphan `product_images` rows and optional `pending` upload cleanup.
