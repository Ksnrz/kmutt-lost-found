import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ============================================================
// 1. POST /api/claims — ส่งคำขอตรวจสอบสิทธิ์ (หน้า 6: ClaimRequestPage)
// บันทึกลงตาราง verify_items และ verify_images
// ============================================================
router.post('/', requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.user.user_id;
    const { post_id, proof_description, images = [] } = req.body;

    if (!post_id || !proof_description?.trim()) {
      return res.status(400).json({ error: 'post_id and proof_description are required' });
    }

    await client.query('BEGIN');

    // ตรวจสอบว่าโพสต์นี้มีอยู่จริงและสถานะยังเปิดอยู่ (OPEN)
    const postRes = await client.query(
      'SELECT post_id, post_status FROM posts WHERE post_id = $1',
      [post_id]
    );

    if (postRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Post not found' });
    }

    if (postRes.rows[0].post_status !== 'OPEN') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This post is already closed or cancelled' });
    }

    // 1. บันทึกคำขอลงตาราง verify_items
    const verifyRes = await client.query(
      `INSERT INTO verify_items (post_id, user_id, proof_description, verify_status)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING verify_id, post_id, user_id, proof_description, verify_status, created_at`,
      [post_id, userId, proof_description.trim()]
    );
    const newVerify = verifyRes.rows[0];

    // 2. บันทึกรูปภาพหลักฐานลงตาราง verify_images (ถ้ามี)
    const savedImages = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const imgUrl of images) {
        if (!imgUrl) continue;
        const imgRes = await client.query(
          `INSERT INTO verify_images (verify_id, verify_image_url)
           VALUES ($1, $2)
           RETURNING verify_image_id, verify_image_url`,
          [newVerify.verify_id, typeof imgUrl === 'string' ? imgUrl : imgUrl.previewUrl || imgUrl.url]
        );
        savedImages.push(imgRes.rows[0]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      ok: true,
      data: {
        ...newVerify,
        images: savedImages,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ============================================================
// 2. GET /api/claims/post/:postId — ดึงคำขอสำหรับหน้ารีวิวของผู้พบ (หน้า 7: ReviewRequestsPage)
// ============================================================
router.get('/post/:postId', requireAuth, async (req, res, next) => {
  try {
    const { postId } = req.params;

    const query = `
      SELECT 
        v.verify_id,
        v.verify_id AS id,
        v.post_id,
        v.post_id AS "postId",
        v.user_id,
        v.proof_description,
        v.proof_description AS description,
        v.note,
        v.finder_confirmed,
        v.finder_confirmed AS "finderConfirmed",
        v.receiver_confirmed,
        v.receiver_confirmed AS "receiverConfirmed",
        v.verify_status,
        v.verify_status AS status,
        v.created_at,
        p.title AS "itemTitle",
        COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.student_id, 'นักศึกษา') AS requester,
        COALESCE(
          (SELECT json_agg(vi.verify_image_url) 
           FROM verify_images vi 
           WHERE vi.verify_id = v.verify_id),
          '[]'::json
        ) AS evidences,
        COALESCE(
          (SELECT json_agg(json_build_object('verify_image_id', vi.verify_image_id, 'verify_image_url', vi.verify_image_url)) 
           FROM verify_images vi 
           WHERE vi.verify_id = v.verify_id),
          '[]'::json
        ) AS verify_images
      FROM verify_items v
      JOIN posts p ON v.post_id = p.post_id
      JOIN users u ON v.user_id = u.user_id
      WHERE v.post_id = $1
      ORDER BY v.created_at ASC
    `;

    const result = await pool.query(query, [postId]);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 3. PUT /api/claims/:id/status — อนุมัติ / ปฏิเสธ / ยกเลิกคำขอ
// กฎ Business Logic: เมื่อผู้พบกดยอมรับ (ACCEPTED) คำขออื่นในโพสต์เดียวกันต้องถูก CANCELLED อัตโนมัติ
// ============================================================
router.put('/:id/status', requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, note = '' } = req.body;

    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    await client.query('BEGIN');

    // ดึงข้อมูลคำขอปัจจุบันเพื่อหา post_id
    const currentRes = await client.query(
      'SELECT verify_id, post_id, verify_status FROM verify_items WHERE verify_id = $1',
      [id]
    );

    if (currentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Claim not found' });
    }

    const { post_id: postId } = currentRes.rows[0];

    // กรณีเลือก ACCEPTED: ต้องปฏิบัติตามกฎ 1 คนต่อโพสต์
    if (status === 'ACCEPTED') {
      // 1. อัปเดตคำขอนี้เป็น ACCEPTED
      await client.query(
        `UPDATE verify_items 
         SET verify_status = 'ACCEPTED', note = $1, finder_confirmed = false, receiver_confirmed = false
         WHERE verify_id = $2`,
        [note, id]
      );

      // 2. ยกเลิก (CANCELLED) คำขออื่นที่ยังค้างอยู่ในโพสต์เดียวกันโดยอัตโนมัติ
      await client.query(
        `UPDATE verify_items
         SET verify_status = 'CANCELLED',
             note = 'ระบบยกเลิกอัตโนมัติเนื่องจากผู้พบได้ตอบรับคำขออื่นในโพสต์นี้แล้ว'
         WHERE post_id = $1 AND verify_id != $2 AND verify_status = 'PENDING'`,
        [postId, id]
      );
    } else {
      // กรณี REJECTED, CANCELLED หรือรีเซ็ตกลับเป็น PENDING
      await client.query(
        `UPDATE verify_items 
         SET verify_status = $1, note = $2
         WHERE verify_id = $3`,
        [status, note, id]
      );
    }

    await client.query('COMMIT');

    // ดึงข้อมูลคำขอที่อัปเดตแล้วส่งกลับ
    const updatedRes = await client.query(
      'SELECT * FROM verify_items WHERE verify_id = $1',
      [id]
    );

    res.json({ ok: true, data: updatedRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ============================================================
// 4. PUT /api/claims/:id/confirm — ยืนยันการส่งมอบ (Dual Confirmation)
// กฎ Business Logic: เมื่อทั้ง finder และ receiver ยืนยันครบ ➔ ปิดโพสต์เป็น CLOSED และคำขอเป็น COMPLETED
// ============================================================
router.put('/:id/confirm', requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { party } = req.body; // 'finder' หรือ 'receiver'

    if (!['finder', 'receiver'].includes(party)) {
      return res.status(400).json({ error: 'Party must be "finder" or "receiver"' });
    }

    await client.query('BEGIN');

    const checkRes = await client.query(
      'SELECT verify_id, post_id, finder_confirmed, receiver_confirmed, verify_status FROM verify_items WHERE verify_id = $1',
      [id]
    );

    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Claim not found' });
    }

    const current = checkRes.rows[0];
    const newFinderConfirmed = party === 'finder' ? true : current.finder_confirmed;
    const newReceiverConfirmed = party === 'receiver' ? true : current.receiver_confirmed;
    const isBothConfirmed = newFinderConfirmed && newReceiverConfirmed;

    // อัปเดตสถานะยืนยัน
    const updateVerifyQuery = `
      UPDATE verify_items
      SET finder_confirmed = $1,
          receiver_confirmed = $2,
          verify_status = CASE WHEN $3 = true THEN 'COMPLETED' ELSE verify_status END
      WHERE verify_id = $4
      RETURNING *
    `;

    const updateVerifyRes = await client.query(updateVerifyQuery, [
      newFinderConfirmed,
      newReceiverConfirmed,
      isBothConfirmed,
      id,
    ]);

    // เมื่อยืนยันครบทั้ง 2 ฝ่าย ➔ สั่งปิดโพสต์ประกาศเป็น CLOSED
    if (isBothConfirmed) {
      await client.query(
        "UPDATE posts SET post_status = 'CLOSED' WHERE post_id = $1",
        [current.post_id]
      );

      // ยกเลิกคำขออื่นๆ ที่อาจตกค้าง
      await client.query(
        `UPDATE verify_items
         SET verify_status = 'CANCELLED',
             note = 'ระบบยกเลิกอัตโนมัติเนื่องจากส่งมอบสิ่งของสำเร็จเสร็จสิ้นแล้ว'
         WHERE post_id = $1 AND verify_id != $2 AND verify_status != 'COMPLETED'`,
        [current.post_id, id]
      );
    }

    await client.query('COMMIT');

    res.json({
      ok: true,
      data: updateVerifyRes.rows[0],
      postClosed: isBothConfirmed,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ============================================================
// 5. GET /api/claims/my-claims — ดึงประวัติคำขอที่ผู้ใช้ส่ง (หน้า Account: แท็บ "คำขอที่ฉันส่ง")
// ============================================================
router.get('/my-claims', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const query = `
      SELECT 
        v.verify_id,
        v.verify_id AS id,
        v.post_id,
        v.post_id AS "postId",
        v.proof_description,
        v.proof_description AS description,
        v.note,
        v.note AS "ownerNote",
        v.finder_confirmed AS "finderConfirmed",
        v.receiver_confirmed AS "receiverConfirmed",
        v.verify_status,
        v.verify_status AS status,
        v.created_at,
        p.title AS "itemTitle",
        p.title AS "postTitle",
        p.post_type AS "typeEn",
        p.post_status,
        COALESCE(NULLIF(TRIM(CONCAT(owner.first_name, ' ', owner.last_name)), ''), owner.student_id, 'ผู้พบ') AS "postOwner",
        loc.building_name AS location
      FROM verify_items v
      JOIN posts p ON v.post_id = p.post_id
      JOIN users owner ON p.user_id = owner.user_id
      LEFT JOIN locations loc ON p.location_id = loc.location_id
      WHERE v.user_id = $1
      ORDER BY v.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
