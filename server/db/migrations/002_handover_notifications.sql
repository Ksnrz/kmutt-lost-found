BEGIN;

ALTER TABLE claim_notifications
  DROP CONSTRAINT IF EXISTS claim_notifications_outcome_check,
  DROP CONSTRAINT IF EXISTS claim_notifications_verify_id_outcome_key,
  ADD CONSTRAINT claim_notifications_outcome_check
    CHECK (outcome IN ('ACCEPTED', 'REJECTED', 'HANDOVER_CONFIRMED', 'HANDOVER_CANCELLED'));

CREATE UNIQUE INDEX IF NOT EXISTS claim_notifications_unique_decision
  ON claim_notifications (verify_id, outcome)
  WHERE outcome IN ('ACCEPTED', 'REJECTED');

COMMIT;
