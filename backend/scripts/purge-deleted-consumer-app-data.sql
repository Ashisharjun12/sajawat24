-- One-off: purge app data for users already tombstoned before purge-on-delete shipped.
-- Safe to re-run. Does not delete orders.

DELETE FROM notification_inbox
WHERE user_id IN (SELECT id FROM users WHERE status = 'deleted');

DELETE FROM user_notification_preferences
WHERE user_id IN (SELECT id FROM users WHERE status = 'deleted');

DELETE FROM user_push_devices
WHERE user_id IN (SELECT id FROM users WHERE status = 'deleted');

DELETE FROM wishlist_items
WHERE user_id IN (SELECT id FROM users WHERE status = 'deleted');

DELETE FROM customer_addresses
WHERE user_id IN (SELECT id FROM users WHERE status = 'deleted');

DELETE FROM refund_requests
WHERE user_id IN (SELECT id FROM users WHERE status = 'deleted');

DELETE FROM carts
WHERE user_id IN (SELECT id FROM users WHERE status = 'deleted');
