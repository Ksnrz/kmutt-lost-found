-- KMUTT Lost & Found schema (matches the ER diagram + fields the frontend already uses).
-- Run: psql -U postgres -d lostfound -f server/db/schema.sql
-- Rerunning drops all data (dev only).

DROP TABLE IF EXISTS verify_images, verify_items, item_images, posts, locations, users CASCADE;

CREATE TABLE users (
  user_id       SERIAL PRIMARY KEY,
  student_id    VARCHAR(20)  NOT NULL UNIQUE,   -- Register page
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,          -- bcrypt hash, never the raw password
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  phone_number  VARCHAR(20),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ตึก: where the item was found/lost, or where it is deposited.
-- pickup_* / open_hours are only filled for buildings that act as a deposit point.
CREATE TABLE locations (
  location_id   SERIAL PRIMARY KEY,
  building_name VARCHAR(100) NOT NULL UNIQUE,
  open_hours    VARCHAR(100),
  pickup_detail TEXT,
  pickup_name   VARCHAR(100),
  pickup_phone  VARCHAR(20)
);

CREATE TABLE posts (
  post_id      SERIAL PRIMARY KEY,
  user_id      INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  location_id  INT          NOT NULL REFERENCES locations(location_id),
  post_type    VARCHAR(10)  NOT NULL CHECK (post_type IN ('LOST', 'FOUND')),   -- ของหาย / เจอของ
  custody_type VARCHAR(20)  CHECK (custody_type IN ('DEPOSITED', 'SELF_KEPT')), -- ฝากไว้ / เก็บไว้เอง
  title        VARCHAR(200) NOT NULL,
  description  TEXT         NOT NULL,
  event_date   DATE         NOT NULL,                                           -- วันที่พบ / หาย
  contact_text VARCHAR(200) NOT NULL,
  post_status  VARCHAR(20)  NOT NULL DEFAULT 'OPEN'
               CHECK (post_status IN ('OPEN', 'CLOSED', 'CANCELLED')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  -- DEPOSITED posts stay OPEN (still listed) but take no verify requests; the poster closes it manually.
  -- only FOUND posts have custody; LOST posts must leave it empty
  CHECK ((post_type = 'FOUND') = (custody_type IS NOT NULL))
);

CREATE TABLE item_images (
  item_image_id  SERIAL PRIMARY KEY,
  post_id        INT  NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  item_image_url TEXT NOT NULL
);

-- FOUND post: the owner proves it's theirs.  LOST post: the finder shows what they found.
CREATE TABLE verify_items (
  verify_id          SERIAL PRIMARY KEY,
  post_id            INT     NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  user_id            INT     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,  -- who submitted
  proof_description  TEXT    NOT NULL,
  note               TEXT,                               -- หมายเหตุ / นัดรับ from the post owner
  finder_confirmed   BOOLEAN NOT NULL DEFAULT false,
  receiver_confirmed BOOLEAN NOT NULL DEFAULT false,
  verify_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                     CHECK (verify_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)                              -- one request per person per post
);

CREATE TABLE verify_images (
  verify_image_id  SERIAL PRIMARY KEY,
  verify_id        INT  NOT NULL REFERENCES verify_items(verify_id) ON DELETE CASCADE,
  verify_image_url TEXT NOT NULL
);

-- กฎ 1 คนต่อโพสต์: the DB refuses a second ACCEPTED request on the same post
CREATE UNIQUE INDEX one_accepted_verify_per_post
  ON verify_items (post_id) WHERE verify_status = 'ACCEPTED';

CREATE INDEX ON posts (post_status, post_type);
CREATE INDEX ON item_images (post_id);
CREATE INDEX ON verify_items (post_id);
CREATE INDEX ON verify_images (verify_id);

-- Buildings from client/src/pages/Map.jsx. Add open_hours/pickup_* for deposit points later.
INSERT INTO locations (building_name) VALUES
  ('S1'),('S2'),('S3'),('S4'),('S5'),('S6'),('S7'),('S8'),('S9'),('S10'),
  ('S11'),('S12'),('S13'),('S14'),('S15'),
  ('N1'),('N2'),('N3'),('N4'),('N5'),('N6'),('N7'),('N8'),('N9'),('N10'),
  ('N11'),('N12'),('N13'),('N14'),('N15'),('N16'),('N17'),('N18'),('N19'),('N20');
