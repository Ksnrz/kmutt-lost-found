BEGIN;

CREATE TABLE IF NOT EXISTS claim_notifications (
  notification_id SERIAL PRIMARY KEY,
  verify_id INT NOT NULL REFERENCES verify_items(verify_id) ON DELETE CASCADE,
  recipient_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('ACCEPTED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  UNIQUE (verify_id, outcome)
);

CREATE INDEX IF NOT EXISTS claim_notifications_recipient_created
  ON claim_notifications (recipient_id, created_at DESC, notification_id DESC);

COMMIT;
