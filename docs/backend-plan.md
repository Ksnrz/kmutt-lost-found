# KMUTT Lost & Found — Backend Plan

Backend ใช้ **Express + PostgreSQL** ทำ 3 คน
ต้องทำรากฐาน (โครง server + DB + auth) ให้เสร็จก่อน แล้วค่อยแยกกันทำ posts / verify / account

## 1. Workflow ของเว็บ

**เจอของ (ผู้พบ)**
1. login แล้วสร้างโพสต์ "เจอของ": ชื่อของ, รายละเอียด, วันที่พบ, รูป, ตึก, ช่องทางติดต่อ
2. เลือกวิธีเก็บ
   - **ฝากไว้**: location = ตึกที่ฝาก โพสต์ยัง `OPEN` แต่**ไม่รับคำขอ verify** เจ้าของไปรับเองที่จุดฝาก แล้วคนโพสต์กดปิดโพสต์เอง
   - **เก็บไว้เอง**: location = ตึกที่เจอ แล้วไปข้อ 3
3. เจ้าของส่งคำขอ (verify) พร้อมรายละเอียดตำหนิและรูปหลักฐาน → `PENDING`
4. ผู้พบตรวจคำขอแล้วกด `ACCEPTED` / `REJECTED` (อนุมัติได้แค่ 1 คนต่อโพสต์)
5. นัดส่งมอบ ทั้ง 2 ฝ่ายกดยืนยัน → คำขอ `COMPLETED`, โพสต์ `CLOSED`, คำขออื่นที่ค้างถูกยกเลิกอัตโนมัติ

**ทำของหาย (เจ้าของ)**
1. ค้นหาโพสต์ "เจอของ" ก่อน ถ้าเจอ ก็ทำตามข้อ 3–5 ด้านบน
2. ถ้าไม่เจอ ให้สร้างโพสต์ "ของหาย" ระบุลักษณะของและตึกที่น่าจะทำหาย
3. คนที่เจอของส่ง verify เข้ามาในโพสต์นั้นพร้อมรูปของที่เจอ (แบบ ข) หรือสร้างโพสต์ "เจอของ" ใหม่ (แบบ ค) *ยังไม่ได้ตัดสินใจ ดูข้อ 6*

## 2. Database (`server/db/schema.sql`)

| ตาราง | เก็บอะไร |
|---|---|
| `users` | student_id, email, password_hash, first_name, last_name, phone_number |
| `locations` | ตึก (S1–S15, N1–N20 ใส่ไว้แล้ว) + open_hours, pickup_* สำหรับตึกที่เป็นจุดฝาก |
| `posts` | user_id, location_id, post_type (LOST/FOUND), custody_type (DEPOSITED/SELF_KEPT), title, description, event_date, contact_text, post_status (OPEN/CLOSED/CANCELLED) |
| `item_images` | รูปของโพสต์ (หลายรูปต่อโพสต์) |
| `verify_items` | คำขอ: post_id, user_id, proof_description, note, finder_confirmed, receiver_confirmed, verify_status (PENDING/ACCEPTED/REJECTED/CANCELLED/COMPLETED) |
| `verify_images` | รูปหลักฐานของคำขอ |

กฎที่ DB บังคับให้เอง:
- โพสต์ LOST ไม่มี custody_type ส่วนโพสต์ FOUND ต้องมี
- 1 โพสต์มีคำขอ `ACCEPTED` ได้แค่ 1 อัน
- คนเดียวกันส่งคำขอซ้ำในโพสต์เดิมไม่ได้

กฎที่ backend ต้องเขียนเอง:
- ห้ามส่ง verify เข้าโพสต์ที่ `DEPOSITED`
- ยืนยันครบทั้ง 2 ฝ่าย → ปิดโพสต์และยกเลิกคำขออื่นที่ค้าง

ค่าในโค้ด frontend เป็นภาษาไทย (`ของหาย` / `เจอของ`) ส่วน DB ใช้ `LOST` / `FOUND` ต้องแปลงค่าตอนเชื่อม API

**วิธีสร้าง DB** (ใส่รหัสผ่าน postgres ของเครื่องตัวเอง):
```bash
createdb -U postgres lostfound
psql -U postgres -d lostfound -f server/db/schema.sql
```
⚠️ ไฟล์เริ่มด้วย `DROP TABLE` ถ้ารันซ้ำ ข้อมูลหายหมด

## 3. ลำดับการทำ

1. **โครง server** (คนเดียวทำ): Express app, `db.js` (pg Pool), `.env.example`, middleware จัดการ error, `GET /api/health`
2. **`requireAuth` middleware**: อ่าน JWT แล้วใส่ `req.user.user_id` ทำให้เสร็จก่อนอย่างอื่น
3. **ของที่ใช้ร่วมกัน**: อัปโหลดรูป (multer ทำไว้ที่เดียว ทั้ง posts และ verify ใช้) + `GET /api/locations`
4. **แยกกันทำ** posts / verify / account

ระหว่างรอ `requireAuth` ใช้ middleware ปลอม `req.user = { user_id: 1 }` ไปก่อนได้

## 4. แบ่งงาน

| คน | งาน | ต้องรอ |
|---|---|---|
| A | auth (register/login/JWT) + Account (`GET /api/me`, โพสต์ของฉัน, คำขอของฉัน) | ไม่ต้องรอใคร |
| B | posts: สร้าง, list (filter ประเภท/ตึก), ดูรายละเอียด, ปิดโพสต์ | requireAuth, upload |
| C | verify: ส่งคำขอ, accept/reject, dual confirm | requireAuth, upload, มีโพสต์ใน DB |

C ไม่ต้องรอ API ของ B: `INSERT` โพสต์ทดสอบลง DB ตรงๆ ไปก่อนได้

## 5. ข้อตกลงร่วม

- โครง folder:
  ```
  server/
    src/index.js
    src/db.js
    src/middleware/auth.js
    src/routes/        # 1 ไฟล์ต่อ resource: auth.js, posts.js, verify.js ...
    db/schema.sql
    .env.example       # commit ได้ ส่วน .env ห้าม commit
  ```
- ทุก route ขึ้นต้นด้วย `/api/...` ส่วน client ตั้ง proxy ใน `vite.config.js`: `server: { proxy: { '/api': 'http://localhost:3000' } }`
- ถ้า error ตอบ `{ "error": "ข้อความ" }` status code: 400 ข้อมูลผิด, 401 ยังไม่ login, 403 ไม่ใช่เจ้าของ, 404 ไม่พบ
- จะแก้ schema ต้องทำผ่าน PR แล้วบอกทุกคน (ทุกคนต้องรัน schema ใหม่)
- แต่ละคนใช้ branch ของตัวเอง (`feat/auth`, `feat/posts`, `feat/verify`) แล้ว PR เข้า main

## 6. ยังต้องตัดสินใจ

- โพสต์ "ของหาย": คนที่เจอของส่ง verify เข้าโพสต์นั้นเลย (ข) หรือสร้างโพสต์ "เจอของ" ใหม่ (ค)? schema รองรับทั้ง 2 แบบ เป็นเรื่องฝั่ง backend/UI อย่างเดียว
- schema.sql ยังไม่ได้รันทดสอบ ใครรันก่อนช่วยเช็คด้วยว่าไม่มี error
