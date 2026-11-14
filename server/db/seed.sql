-- Seed data for testing KMUTT Lost & Found (Task C1)
-- Run: psql -U postgres -d lostfound -f server/db/seed.sql

-- 1. Insert test users if not existing
INSERT INTO users (user_id, student_id, email, password_hash, first_name, last_name, phone_number)
VALUES 
  (1, '65010001', 'somkiat@kmutt.ac.th', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'สมเกียรติ', 'มั่นคง', '0812345678'),
  (2, '65010002', 'student_b@kmutt.ac.th', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'ประสิทธิ์', 'รักเรียน', '0823456789'),
  (3, '65010003', 'student_d@kmutt.ac.th', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'ดวงพร', 'ใจดี', '0834567890')
ON CONFLICT (student_id) DO NOTHING;

-- Reset sequence to avoid collision
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

-- 2. Insert test posts
-- Post 1: FOUND (SELF_KEPT) -> พร้อมรับคำขอ verify
INSERT INTO posts (post_id, user_id, location_id, post_type, custody_type, title, description, event_date, contact_text, post_status)
VALUES (
  1,
  1,
  (SELECT location_id FROM locations WHERE building_name = 'S4' LIMIT 1),
  'FOUND',
  'SELF_KEPT',
  'พบกระเป๋าสตางค์สีดำ',
  'เจอกระเป๋าสตางค์วางลืมไว้ที่โต๊ะหินอ่อน ใต้ตึก S4 ช่วงพักเที่ยง',
  '2026-09-24',
  '081-234-5678',
  'OPEN'
)
ON CONFLICT (post_id) DO NOTHING;

-- Post 2: FOUND (DEPOSITED) -> ต้องถูกปฏิเสธเมื่อส่งคำขอ verify (กฎ C2)
INSERT INTO posts (post_id, user_id, location_id, post_type, custody_type, title, description, event_date, contact_text, post_status)
VALUES (
  2,
  1,
  (SELECT location_id FROM locations WHERE building_name = 'S1' LIMIT 1),
  'FOUND',
  'DEPOSITED',
  'พบกุญแจรถมอเตอร์ไซค์ Honda',
  'กุญแจพร้อมพวงกุญแจหมี ฝากไว้ที่เคาน์เตอร์ รปภ. อาคารเรียนรวม 1 เรียบร้อยแล้ว ไปติดต่อรับได้เลย',
  '2026-09-25',
  'ติดต่อ รปภ. อาคารเรียนรวม 1',
  'OPEN'
)
ON CONFLICT (post_id) DO NOTHING;

-- Post 3: LOST (custody_type is NULL) -> ของหาย
INSERT INTO posts (post_id, user_id, location_id, post_type, custody_type, title, description, event_date, contact_text, post_status)
VALUES (
  3,
  2,
  (SELECT location_id FROM locations WHERE building_name = 'S10' LIMIT 1),
  'LOST',
  NULL,
  'ทำหูฟัง AirPods Pro ตกหาย',
  'ทำตกแถวโรงอาหารพระจอมเกล้า เคสสีขาวมีสติกเกอร์แมวสีส้ม',
  '2026-09-23',
  '089-999-8888',
  'OPEN'
)
ON CONFLICT (post_id) DO NOTHING;

-- Reset sequence for posts
SELECT setval('posts_post_id_seq', (SELECT MAX(post_id) FROM posts));

-- 3. Insert initial verify items for Post 1 (ผู้ใช้ 2 และ ผู้ใช้ 3 ส่งคำขอมา)
INSERT INTO verify_items (verify_id, post_id, user_id, proof_description, verify_status, created_at)
VALUES 
  (102, 1, 2, 'มีรอยถลอกเล็ก ๆ ที่มุมด้านใน และมีบัตรสีฟ้าอยู่หนึ่งใบ', 'PENDING', '2026-09-24 10:30:00+07'),
  (103, 1, 3, 'กระเป๋าตังค์หนังแท้สีดำ มีช่องใส่เหรียญซิปทอง มีเศษบิลซื้อของอยู่ด้านใน', 'PENDING', '2026-09-25 14:15:00+07')
ON CONFLICT (post_id, user_id) DO NOTHING;

-- Reset sequence for verify_items
SELECT setval('verify_items_verify_id_seq', (SELECT MAX(verify_id) FROM verify_items));

