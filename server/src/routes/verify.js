import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

// ============================================================
// C2: POST /api/posts/:id/verify — ส่งคำขอตรวจสอบสิทธิ์
// กฎ:
// 1. ปฏิเสธโพสต์ที่เป็น DEPOSITED (400)
// 2. ปฏิเสธโพสต์ของตนเอง (403)
// 3. แนบรูปภาพหลักฐาน (upload middleware / req.files)
// ============================================================
router.post('/posts/:id/verify', requireAuth, upload.array('images', 5), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const postId = Number(req.params.id);
    const userId = req.user.user_id;
    const { proof_description, description } = req.body;
    const descText = (proof_description || description || '').trim();

    if (!descText) {
      return res.status(400).json({ error: 'กรุณาระบุรายละเอียดตำหนิหรือข้อมูลยืนยันความเป็นเจ้าของ' });
    }

    await client.query('BEGIN');

    // 1. ตรวจสอบว่ามีโพสต์นี้จริงหรือไม่
    const postRes = await client.query(
      `SELECT post_id, user_id, custody_type, post_status 
       FROM posts 
       WHERE post_id = $1`,
      [postId]
    );

    if (postRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบประกาศนี้' });
    }

    const post = postRes.rows[0];

    // ตรวจสอบสถานะโพสต์
    if (post.post_status !== 'OPEN') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'ประกาศนี้ปิดรับคำขอหรือถูกยกเลิกแล้ว' });
    }

    // กฎ C2.1: ปฏิเสธโพสต์ที่เป็น DEPOSITED
    if (post.custody_type === 'DEPOSITED') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'สิ่งของนี้ถูกฝากไว้ที่จุดรับฝากแล้ว กรุณาติดต่อรับของ ณ สถานที่ที่ระบุในประกาศโดยตรง (ไม่รับคำขอ verify)',
      });
    }

    // กฎ C2.2: ปฏิเสธโพสต์ของตนเอง
    if (post.user_id === userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'คุณไม่สามารถส่งคำขอตรวจสอบสิทธิ์ให้กับประกาศของตนเองได้',
      });
    }

    // ตรวจสอบการส่งซ้ำ (UNIQUE constraint post_id, user_id)
    const existingRes = await client.query(
      `SELECT verify_id FROM verify_items WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );

    if (existingRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'คุณได้ส่งคำขอสำหรับประกาศนี้ไปแล้ว' });
    }

    // 2. บันทึกคำขอลงตาราง verify_items
    const verifyRes = await client.query(
      `INSERT INTO verify_items (post_id, user_id, proof_description, verify_status)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING *`,
      [postId, userId, descText]
    );
    const newVerify = verifyRes.rows[0];

    // 3. บันทึกรูปภาพหลักฐานลงตาราง verify_images
    const savedImages = [];

    // รูปจาก Multer uploads
    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = `/uploads/${file.filename}`;
        const imgRes = await client.query(
          `INSERT INTO verify_images (verify_id, verify_image_url)
           VALUES ($1, $2)
           RETURNING *`,
          [newVerify.verify_id, imageUrl]
        );
        savedImages.push(imgRes.rows[0]);
      }
    }

    // รูปจาก Body images (กรณี JSON data หรือ URL ที่ส่งมา)
    if (req.body.images) {
      let bodyImages = req.body.images;
      if (typeof bodyImages === 'string') {
        try {
          bodyImages = JSON.parse(bodyImages);
        } catch {
          bodyImages = [bodyImages];
        }
      }
      if (Array.isArray(bodyImages)) {
        for (const img of bodyImages) {
          const imgUrl = typeof img === 'string' ? img : img.verify_image_url || img.previewUrl || img.url;
          if (!imgUrl) continue;
          const imgRes = await client.query(
            `INSERT INTO verify_images (verify_id, verify_image_url)
             VALUES ($1, $2)
             RETURNING *`,
            [newVerify.verify_id, imgUrl]
          );
          savedImages.push(imgRes.rows[0]);
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'ส่งคำขอตรวจสอบสิทธิ์สำเร็จ',
      ok: true,
      data: {
        ...newVerify,
        images: savedImages,
      },
      verify: newVerify,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ============================================================
// C3: GET /api/posts/:id/verify — ให้เจ้าของโพสต์ดูคำขอทั้งหมดของโพสต์นั้น
// กฎ: เฉพาะเจ้าของโพสต์เท่านั้นที่ดูได้ ถ้าไม่ใช่ ให้ตอบ 403 Forbidden
// ============================================================
router.get('/posts/:id/verify', requireAuth, async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.user.user_id;

    // ตรวจสอบว่ามีโพสต์และผู้เรียกคือเจ้าของโพสต์หรือไม่
    const postRes = await pool.query(
      `SELECT post_id, user_id, title, post_status FROM posts WHERE post_id = $1`,
      [postId]
    );

    if (postRes.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบประกาศนี้' });
    }

    const post = postRes.rows[0];

    // กฎ C3: ตรวจสอบสิทธิ์ว่าใช่เจ้าของโพสต์หรือไม่
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'คุณไม่ใช่เจ้าของประกาศนี้ ไม่มีสิทธิ์ดูคำขอ' });
    }

    // ดึงคำขอทั้งหมดของโพสต์นี้ พร้อมข้อมูลผู้ส่งและรูปหลักฐาน
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
        u.student_id,
        u.phone_number AS "requesterPhone",
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

    res.json({
      ok: true,
      post,
      requests: result.rows,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// C4: PUT/PATCH /api/verify/:id/status — accept / reject คำขอ
// กฎ: เฉพาะเจ้าของโพสต์เท่านั้นที่กดยอมรับหรือปฏิเสธได้
// ============================================================
const handleStatusUpdate = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const verifyId = Number(req.params.id);
    const userId = req.user.user_id;
    const { status, note = '' } = req.body;

    const validStatuses = ['ACCEPTED', 'REJECTED', 'PENDING'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'สถานะไม่ถูกต้อง (ต้องเป็น ACCEPTED, REJECTED หรือ PENDING)' });
    }

    await client.query('BEGIN');

    // ตรวจสอบคำขอและหาเจ้าของโพสต์
    const checkRes = await client.query(
      `SELECT v.verify_id, v.post_id, v.verify_status, p.user_id AS post_owner_id, p.post_status
       FROM verify_items v
       JOIN posts p ON v.post_id = p.post_id
       WHERE v.verify_id = $1`,
      [verifyId]
    );

    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบคำขอนี้' });
    }

    const { post_id: postId, post_owner_id: postOwnerId, post_status: postStatus } = checkRes.rows[0];

    // ตรวจสอบว่าเป็นเจ้าของโพสต์หรือไม่
    if (postOwnerId !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'คุณไม่ใช่เจ้าของประกาศ ไม่มีสิทธิ์ตอบรับหรือปฏิเสธคำขอนี้' });
    }

    // ตรวจสอบว่าโพสต์ยังเปิดอยู่หรือไม่
    if (postStatus !== 'OPEN') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'ประกาศนี้ไม่ได้เปิดรับคำขออยู่' });
    }

    if (status === 'ACCEPTED') {
      // ตรวจสอบว่ามีคำขออื่นที่ได้รับการ ACCEPTED ไปก่อนแล้วหรือไม่
      const otherAccepted = await client.query(
        `SELECT verify_id FROM verify_items WHERE post_id = $1 AND verify_status = 'ACCEPTED' AND verify_id != $2`,
        [postId, verifyId]
      );

      if (otherAccepted.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'มีคำขออื่นได้รับการตอบรับในประกาศนี้อยู่แล้ว (ตอบรับได้เพียง 1 คนต่อโพสต์)',
        });
      }

      await client.query(
        `UPDATE verify_items
         SET verify_status = 'ACCEPTED', note = $1, finder_confirmed = false, receiver_confirmed = false
         WHERE verify_id = $2`,
        [note, verifyId]
      );
    } else {
      await client.query(
        `UPDATE verify_items
         SET verify_status = $1, note = $2
         WHERE verify_id = $3`,
        [status, note, verifyId]
      );
    }

    await client.query('COMMIT');

    const updatedRes = await client.query(
      `SELECT * FROM verify_items WHERE verify_id = $1`,
      [verifyId]
    );

    res.json({
      message: 'อัปเดตสถานะคำขอสำเร็จ',
      ok: true,
      verify: updatedRes.rows[0],
      data: updatedRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

router.put('/verify/:id/status', requireAuth, handleStatusUpdate);
router.patch('/verify/:id/status', requireAuth, handleStatusUpdate);

// ============================================================
// C5: PATCH/PUT /api/verify/:id/cancel — ยกเลิกคำขอตัวเอง (เฉพาะที่ยัง PENDING)
// กฎ:
// 1. ผู้ส่งคำขอเท่านั้นที่มีสิทธิ์ยกเลิก (403)
// 2. ยกเลิกได้เฉพาะตอนที่ยังเป็น PENDING เท่านั้น (400)
// ============================================================
const handleCancelClaim = async (req, res, next) => {
  try {
    const verifyId = Number(req.params.id);
    const userId = req.user.user_id;
    const { note = 'ผู้ส่งขอยกเลิกคำขอด้วยตนเอง' } = req.body;

    const checkRes = await pool.query(
      `SELECT verify_id, user_id, verify_status FROM verify_items WHERE verify_id = $1`,
      [verifyId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบคำขอนี้' });
    }

    const verify = checkRes.rows[0];

    // กฎ C5.1: คนส่งคำขอเท่านั้น
    if (verify.user_id !== userId) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ยกเลิกคำขอนี้ เนื่องจากไม่ใช่ผู้ส่งคำขอ' });
    }

    // กฎ C5.2: เฉพาะที่ยัง PENDING เท่านั้น
    if (verify.verify_status !== 'PENDING') {
      return res.status(400).json({ error: 'สามารถยกเลิกได้เฉพาะคำขอที่อยู่ในสถานะ PENDING เท่านั้น' });
    }

    const updateRes = await pool.query(
      `UPDATE verify_items
       SET verify_status = 'CANCELLED', note = $1
       WHERE verify_id = $2
       RETURNING *`,
      [note, verifyId]
    );

    res.json({
      message: 'ยกเลิกคำขอสำเร็จเรียบร้อยแล้ว',
      ok: true,
      verify: updateRes.rows[0],
      data: updateRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

router.patch('/verify/:id/cancel', requireAuth, handleCancelClaim);
router.put('/verify/:id/cancel', requireAuth, handleCancelClaim);

// ============================================================
// C6: PUT/PATCH /api/verify/:id/confirm — dual confirm
// กฎ: ยืนยันครบทั้ง 2 ฝ่ายแล้ว ให้ปิดโพสต์และยกเลิกคำขออื่นที่ค้าง
// ต้องทำใน transaction เดียว (BEGIN ... COMMIT)
// ============================================================
const handleDualConfirm = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const verifyId = Number(req.params.id);
    const userId = req.user.user_id;
    let { party } = req.body; // 'finder' | 'receiver'

    await client.query('BEGIN');

    // ดึงข้อมูลคำขอและโพสต์พร้อมกัน
    const checkRes = await client.query(
      `SELECT 
         v.verify_id, 
         v.post_id, 
         v.user_id AS requester_id, 
         v.verify_status, 
         v.finder_confirmed, 
         v.receiver_confirmed,
         p.user_id AS post_owner_id,
         p.post_status
       FROM verify_items v
       JOIN posts p ON v.post_id = p.post_id
       WHERE v.verify_id = $1
       FOR UPDATE`,
      [verifyId]
    );

    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบคำขอนี้' });
    }

    const current = checkRes.rows[0];

    // คำขอต้องได้รับการ ACCEPTED มาก่อน
    if (current.verify_status !== 'ACCEPTED' && current.verify_status !== 'COMPLETED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'คำขอนี้ยังไม่ได้รับการอนุมัติ ไม่สามารถยืนยันการส่งมอบได้' });
    }

    // ระบุฝ่ายโดยอัตโนมัติหากไม่ได้ส่งมาใน body
    if (!party) {
      if (userId === current.post_owner_id) {
        party = 'finder';
      } else if (userId === current.requester_id) {
        party = 'receiver';
      }
    }

    if (!['finder', 'receiver'].includes(party)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'คุณไม่มีส่วนเกี่ยวข้องกับการส่งมอบสิ่งของนี้ (ไม่ใช่ผู้พบหรือผู้รับ)' });
    }

    // ตรวจสอบสิทธิ์ว่าตรงกับผู้ที่ล็อกอินอยู่จริง
    if (party === 'finder' && userId !== current.post_owner_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'คุณไม่ใช่ผู้พบ (เจ้าของโพสต์) สำหรับรายการนี้' });
    }
    if (party === 'receiver' && userId !== current.requester_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'คุณไม่ใช่ผู้รับ (ผู้ส่งคำขอ) สำหรับรายการนี้' });
    }

    const newFinderConfirmed = party === 'finder' ? true : current.finder_confirmed;
    const newReceiverConfirmed = party === 'receiver' ? true : current.receiver_confirmed;
    const isBothConfirmed = newFinderConfirmed && newReceiverConfirmed;

    // 1. อัปเดตสถานะการยืนยัน
    const updateVerifyRes = await client.query(
      `UPDATE verify_items
       SET finder_confirmed = $1,
           receiver_confirmed = $2,
           verify_status = CASE WHEN $3 = true THEN 'COMPLETED' ELSE verify_status END
       WHERE verify_id = $4
       RETURNING *`,
      [newFinderConfirmed, newReceiverConfirmed, isBothConfirmed, verifyId]
    );

    // 2. เมื่อยืนยันครบทั้ง 2 ฝ่าย -> ปิดโพสต์ และยกเลิกคำขออื่นที่ค้าง ใน TRANSACTION เดียวกัน
    if (isBothConfirmed) {
      // ปิดโพสต์ประกาศเป็น CLOSED
      await client.query(
        `UPDATE posts 
         SET post_status = 'CLOSED' 
         WHERE post_id = $1`,
        [current.post_id]
      );

      // ยกเลิกคำขออื่นที่ยังค้างอยู่ในโพสต์เดียวกัน
      await client.query(
        `UPDATE verify_items
         SET verify_status = 'CANCELLED',
             note = 'ระบบยกเลิกอัตโนมัติเนื่องจากส่งมอบสิ่งของสำเร็จเสร็จสิ้นแล้ว'
         WHERE post_id = $1 AND verify_id != $2 AND verify_status != 'COMPLETED'`,
        [current.post_id, verifyId]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: isBothConfirmed
        ? 'ยืนยันครบทั้ง 2 ฝ่ายแล้ว ส่งมอบสำเร็จและปิดโพสต์เรียบร้อยแล้ว'
        : 'บันทึกการยืนยันเรียบร้อยแล้ว (กำลังรออีกฝ่ายยืนยัน)',
      ok: true,
      verify: updateVerifyRes.rows[0],
      data: updateVerifyRes.rows[0],
      postClosed: isBothConfirmed,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

router.put('/verify/:id/confirm', requireAuth, handleDualConfirm);
router.patch('/verify/:id/confirm', requireAuth, handleDualConfirm);

// ============================================================
// ดึงคำขอที่ฉันส่ง (สำหรับหน้า Account: แท็บ "คำขอที่ฉันส่ง")
// ============================================================
router.get('/verify/my-claims', requireAuth, async (req, res, next) => {
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
    res.json({ ok: true, requests: result.rows, data: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
