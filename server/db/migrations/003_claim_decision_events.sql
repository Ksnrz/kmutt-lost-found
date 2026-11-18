-- A new decision after a claim returns to PENDING is a new event.
-- The locked status transition prevents duplicate notifications on retries.
DROP INDEX IF EXISTS claim_notifications_unique_decision;
