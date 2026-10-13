-- Media hygiene after partial or full DB/storage mismatches.
-- Run against Postgres (review counts before DELETE in production).

-- Orphan product gallery links (upload row missing)
SELECT pi.id, pi.product_id, pi.upload_id
FROM product_images pi
LEFT JOIN uploads u ON u.id = pi.upload_id
WHERE u.id IS NULL;

DELETE FROM product_images pi
WHERE NOT EXISTS (SELECT 1 FROM uploads u WHERE u.id = pi.upload_id);

-- Stale pending uploads (never completed presign flow)
-- Default: older than 48 hours. Adjust interval as needed.
SELECT id, key, filename, status, created_at
FROM uploads
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '48 hours';

-- DELETE FROM uploads
-- WHERE status = 'pending'
--   AND created_at < NOW() - INTERVAL '48 hours';
-- Note: run a storage orphan sweep separately if you delete pending rows that may have objects in the bucket.

-- Optional job spec (not implemented in app): nightly cron
-- 1. DELETE product_images without uploads (as above)
-- 2. DELETE pending uploads older than 48h after storage headObject miss
-- 3. Log counts; do not auto-delete completed uploads
