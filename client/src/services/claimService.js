/**
 * claimService.js — Central Service สำหรับระบบตรวจสอบสิทธิ์สิ่งของ (VERIFY System)
 * สอดคล้องกับข้อตกลงทีมและ Tasks ของ Member C:
 * - C2: POST /api/posts/:id/verify (ส่งคำขอ, แนบรูป, ปฏิเสธ DEPOSITED และโพสต์ของตัวเอง)
 * - C3: GET /api/posts/:id/verify (ให้เจ้าของโพสต์ดูคำขอ)
 * - C4: PUT /api/verify/:id/status (accept / reject)
 * - C5: PATCH /api/verify/:id/cancel (ยกเลิกคำขอตัวเอง เฉพาะ PENDING)
 * - C6: PUT /api/verify/:id/confirm (dual confirm ใน transaction เดียว)
 * พร้อมระบบ LocalStorage Fallback เพื่อให้ทดสอบหน้าบ้านได้เสมอ
 */

const STORAGE_KEY_CLAIMS = 'kmutt_lostfound_claims';
const STORAGE_KEY_POST_STATUS = 'kmutt_lostfound_post_status';

// ข้อมูลเริ่มต้นสำหรับจำลองระบบหากยังไม่มีข้อมูลในเครื่อง
const DEFAULT_CLAIMS = [
  {
    verify_id: '102',
    id: '102',
    post_id: '1',
    postId: '1',
    itemTitle: 'กระเป๋าสตางค์สีดำ',
    postTitle: 'กระเป๋าสตางค์สีดำ',
    requester: 'นักศึกษา B',
    postOwner: 'นายสมเกียรติ มั่นคง (ผู้พบ)',
    date: '24 ก.ย. 2026',
    created_at: '2026-09-24T10:30:00.000Z',
    verify_status: 'PENDING',
    status: 'PENDING',
    proof_description: 'มีรอยถลอกเล็ก ๆ ที่มุมด้านใน และมีบัตรสีฟ้าอยู่หนึ่งใบ',
    description: 'มีรอยถลอกเล็ก ๆ ที่มุมด้านใน และมีบัตรสีฟ้าอยู่หนึ่งใบ',
    evidences: ['หลักฐาน 1', 'หลักฐาน 2'],
    verify_images: ['หลักฐาน 1', 'หลักฐาน 2'],
    finderConfirmed: false,
    receiverConfirmed: false,
    note: '',
    ownerNote: '',
  },
  {
    verify_id: '103',
    id: '103',
    post_id: '1',
    postId: '1',
    itemTitle: 'กระเป๋าสตางค์สีดำ',
    postTitle: 'กระเป๋าสตางค์สีดำ',
    requester: 'นักศึกษา D',
    postOwner: 'นายสมเกียรติ มั่นคง (ผู้พบ)',
    date: '25 ก.ย. 2026',
    created_at: '2026-09-25T14:15:00.000Z',
    verify_status: 'PENDING',
    status: 'PENDING',
    proof_description: 'กระเป๋าตังค์หนังแท้สีดำ มีช่องใส่เหรียญซิปทอง มีเศษบิลซื้อของอยู่ด้านใน',
    description: 'กระเป๋าตังค์หนังแท้สีดำ มีช่องใส่เหรียญซิปทอง มีเศษบิลซื้อของอยู่ด้านใน',
    evidences: ['หลักฐาน 1'],
    verify_images: ['หลักฐาน 1'],
    finderConfirmed: false,
    receiverConfirmed: false,
    note: '',
    ownerNote: '',
  },
];

function getStoredClaims() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLAIMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(DEFAULT_CLAIMS));
      return DEFAULT_CLAIMS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage error:', e);
    return DEFAULT_CLAIMS;
  }
}

function saveClaims(claims) {
  try {
    localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(claims));
    window.dispatchEvent(new CustomEvent('kmutt_claims_updated', { detail: claims }));
  } catch (e) {
    console.warn('LocalStorage write error:', e);
  }
}

async function safeJson(res) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export const claimService = {
  /**
   * C2: ส่งคำขอตรวจสอบสิทธิ์ (POST /api/posts/:id/verify)
   */
  async submitClaim(payload) {
    const postId = payload.post_id || payload.postId || 1;
    let backendSuccess = false;
    let backendData = null;

    try {
      let res;
      // กรณีมีไฟล์จริง ให้ส่งแบบ FormData
      if (payload.files && payload.files.length > 0) {
        const formData = new FormData();
        formData.append('proof_description', payload.proof_description || payload.description || '');
        payload.files.forEach((file) => {
          formData.append('images', file);
        });

        res = await fetch(`/api/posts/${postId}/verify`, {
          method: 'POST',
          headers: {
            'x-test-user': '2', // ผู้ส่งคำขอ (เช่น นักศึกษา B)
          },
          body: formData,
        });
      } else {
        res = await fetch(`/api/posts/${postId}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-test-user': '2',
          },
          body: JSON.stringify({
            proof_description: payload.proof_description || payload.description,
            images: payload.images || payload.evidences || [],
          }),
        });
      }

      const json = await safeJson(res);

      if (res.ok) {
        backendSuccess = true;
        backendData = json?.data || json?.verify;
      } else if (json && json.error) {
        // ข้อผิดพลาดจาก Express Backend เช่น โพสต์ DEPOSITED หรือส่งคำขอโพสต์ตัวเอง
        throw new Error(json.error);
      }
    } catch (err) {
      // หากเป็นข้อผิดพลาดจาก Business Logic ให้โยนแจ้งเตือนผู้ใช้ทันที
      if (
        err.message &&
        !err.message.includes('Failed to fetch') &&
        !err.message.includes('JSON')
      ) {
        throw err;
      }
      // เซิร์ฟเวอร์ Backend ยังไม่ได้รัน หรือ Proxy ล้มเหลว -> ตกไปใช้ LocalStorage Fallback อัตโนมัติ
    }

    const localClaim = this.addClaimLocal({
      ...payload,
      id: backendData?.verify_id || payload.id,
      verify_id: backendData?.verify_id || payload.verify_id,
    });

    return backendSuccess ? backendData : localClaim;
  },

  /**
   * บันทึกคำขอลง LocalStorage (Fallback / Real-time sync)
   */
  addClaimLocal(payload) {
    const currentClaims = getStoredClaims();
    const newId = String(payload.id || payload.verify_id || `v-${Date.now()}`);
    const newClaim = {
      ...payload,
      id: newId,
      verify_id: newId,
      post_id: String(payload.post_id || payload.postId || '1'),
      postId: String(payload.post_id || payload.postId || '1'),
      status: 'PENDING',
      verify_status: 'PENDING',
      finderConfirmed: false,
      receiverConfirmed: false,
      created_at: payload.created_at || new Date().toISOString(),
      evidences: payload.evidences || (payload.verify_images ? payload.verify_images.map(img => img.file_name || 'รูปหลักฐาน') : ['หลักฐาน 1']),
      requester: payload.requester || 'คุณ (ผู้ใช้ปัจจุบัน)',
      postOwner: payload.postOwner || 'นายสมเกียรติ มั่นคง (ผู้พบ)',
      itemTitle: payload.itemTitle || payload.title || 'กระเป๋าสตางค์สีดำ',
      note: '',
      ownerNote: '',
    };

    const updated = [newClaim, ...currentClaims];
    saveClaims(updated);
    return newClaim;
  },

  /**
   * C3: ดึงรายการคำขอทั้งหมดของโพสต์นั้นๆ (GET /api/posts/:id/verify)
   */
  async getClaimsByPost(postId = '1') {
    try {
      const res = await fetch(`/api/posts/${postId}/verify`, {
        headers: { 'x-test-user': '1' }, // เจ้าของโพสต์
      });
      if (res.ok) {
        const json = await safeJson(res);
        const claims = json?.requests || json?.data;
        if (Array.isArray(claims) && claims.length > 0) {
          return claims;
        }
      }
    } catch {
      // Backend offline -> fallback
    }

    const all = getStoredClaims();
    return all.filter(c => String(c.post_id) === String(postId) || String(c.postId) === String(postId));
  },

  /**
   * C4: accept / reject คำขอ (PUT /api/verify/:id/status)
   */
  async updateClaimStatus(claimId, newStatus, note = '') {
    try {
      const res = await fetch(`/api/verify/${claimId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': '1', // เจ้าของโพสต์
        },
        body: JSON.stringify({ status: newStatus, note }),
      });
      if (!res.ok) {
        const errJson = await safeJson(res);
        if (errJson?.error) {
          console.warn('API updateClaimStatus warning:', errJson.error);
        }
      }
    } catch {
      // fallback
    }

    const currentClaims = getStoredClaims();
    const target = currentClaims.find(c => String(c.id) === String(claimId));
    if (!target) return currentClaims;

    const targetPostId = target.post_id || target.postId;

    const updated = currentClaims.map(c => {
      if (String(c.id) === String(claimId)) {
        return {
          ...c,
          status: newStatus,
          verify_status: newStatus,
          note: note || c.note,
          ownerNote: note || c.ownerNote,
          finderConfirmed: false,
          receiverConfirmed: false,
        };
      }

      // กฎข้อ 1: 1 คำขอต่อ 1 โพสต์ (คำขออื่นที่รออยู่ให้เป็น CANCELLED เมื่อมีการตอบรับ)
      if (newStatus === 'ACCEPTED' && (String(c.post_id) === String(targetPostId) || String(c.postId) === String(targetPostId))) {
        if (c.status === 'PENDING' || c.verify_status === 'PENDING') {
          return {
            ...c,
            status: 'CANCELLED',
            verify_status: 'CANCELLED',
            note: 'ระบบยกเลิกอัตโนมัติเนื่องจากผู้พบได้ตอบรับคำขออื่นในโพสต์นี้แล้ว',
            ownerNote: 'ระบบยกเลิกอัตโนมัติเนื่องจากผู้พบได้ตอบรับคำขออื่นในโพสต์นี้แล้ว',
          };
        }
      }

      return c;
    });

    saveClaims(updated);
    return updated;
  },

  /**
   * C5: ยกเลิกคำขอตัวเอง (PATCH /api/verify/:id/cancel)
   * เฉพาะคำขอที่ยังอยู่ในสถานะ PENDING เท่านั้น
   */
  async cancelClaim(claimId, note = 'ผู้ส่งขอยกเลิกคำขอด้วยตนเอง') {
    try {
      const res = await fetch(`/api/verify/${claimId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': '2', // ผู้ส่งคำขอ
        },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        const errJson = await safeJson(res);
        if (errJson?.error) {
          throw new Error(errJson.error);
        }
      }
    } catch (err) {
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('JSON')) {
        throw err;
      }
    }

    const currentClaims = getStoredClaims();
    const updated = currentClaims.map((c) => {
      if (String(c.id) === String(claimId)) {
        return {
          ...c,
          status: 'CANCELLED',
          verify_status: 'CANCELLED',
          note: note || c.note,
          ownerNote: note || c.ownerNote,
        };
      }
      return c;
    });

    saveClaims(updated);
    return updated;
  },

  /**
   * C6: Dual Confirmation (PUT /api/verify/:id/confirm)
   * ยืนยันครบทั้ง 2 ฝ่ายใน Transaction เดียว -> ปิดโพสต์ และยกเลิกคำขออื่นที่ค้าง
   */
  async confirmHandover(claimId, party = 'finder') {
    let apiPostClosed = false;

    try {
      const res = await fetch(`/api/verify/${claimId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': party === 'finder' ? '1' : '2',
        },
        body: JSON.stringify({ party }),
      });
      if (res.ok) {
        const json = await safeJson(res);
        apiPostClosed = Boolean(json?.postClosed);
      }
    } catch {
      // fallback
    }

    const currentClaims = getStoredClaims();
    let willClosePost = apiPostClosed;
    let targetPostId = null;

    const updated = currentClaims.map(c => {
      if (String(c.id) === String(claimId)) {
        targetPostId = c.post_id || c.postId;
        const newFinder = party === 'finder' ? true : Boolean(c.finderConfirmed);
        const newReceiver = party === 'receiver' ? true : Boolean(c.receiverConfirmed);
        const isBoth = newFinder && newReceiver;

        if (isBoth) {
          willClosePost = true;
        }

        return {
          ...c,
          finderConfirmed: newFinder,
          receiverConfirmed: newReceiver,
          status: isBoth ? 'COMPLETED' : c.status,
          verify_status: isBoth ? 'COMPLETED' : c.verify_status,
        };
      }
      return c;
    });

    // หากยืนยันครบทั้ง 2 ฝ่าย ให้ปิดโพสต์และยกเลิกคำขออื่นที่ค้าง
    if (willClosePost && targetPostId) {
      try {
        localStorage.setItem(`${STORAGE_KEY_POST_STATUS}_${targetPostId}`, 'CLOSED');
      } catch (e) {
        console.warn(e);
      }
    }

    saveClaims(updated);
    return { claims: updated, postClosed: willClosePost };
  },

  /**
   * ดึงประวัติคำขอที่ฉันส่ง (GET /api/verify/my-claims)
   */
  async getMyClaims() {
    try {
      const res = await fetch('/api/verify/my-claims', {
        headers: { 'x-test-user': '2' },
      });
      if (res.ok) {
        const json = await safeJson(res);
        const claims = json?.requests || json?.data;
        if (Array.isArray(claims) && claims.length > 0) {
          return claims;
        }
      }
    } catch {
      // fallback
    }

    return getStoredClaims();
  },

  /**
   * รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นสำหรับการทดสอบ
   */
  resetAll() {
    try {
      localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(DEFAULT_CLAIMS));
      localStorage.removeItem(`${STORAGE_KEY_POST_STATUS}_1`);
      localStorage.removeItem(`${STORAGE_KEY_POST_STATUS}_p-101`);
      localStorage.removeItem('receiver_confirmed_102');
      localStorage.removeItem('receiver_confirmed_103');
      window.dispatchEvent(new CustomEvent('kmutt_claims_updated', { detail: DEFAULT_CLAIMS }));
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_CLAIMS;
  },

  subscribe(callback) {
    const handler = (event) => callback(event.detail);
    window.addEventListener('kmutt_claims_updated', handler);
    return () => window.removeEventListener('kmutt_claims_updated', handler);
  },
};
