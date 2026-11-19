-- Extra contact (IG / Line / Facebook) on the profile, shown to the poster once a claim is accepted.
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_info VARCHAR(200);
