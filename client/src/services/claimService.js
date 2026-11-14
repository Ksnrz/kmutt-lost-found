/**
 * claimService.js — Central Service สำหรับระบบตรวจสอบสิทธิ์สิ่งของ (VERIFY System)
 * สอดคล้องกับข้อตกลงทีมและ Tasks ของ Member C:
 * - C2: POST /api/posts/:id/verify (ส่งคำขอ, แนบรูป, ปฏิเสธ DEPOSITED และโพสต์ของตัวเอง)
 * - C3: GET /api/posts/:id/verify (ให้เจ้าของโพสต์ดูคำขอ)
 * - C4: PUT /api/verify/:id/status (accept / reject)
 * - C5: PATCH /api/verify/:id/cancel (ยกเลิกคำขอตัวเอง เฉพาะ PENDING)
 * - C6: PUT /api/verify/:id/confirm (dual confirm ใน transaction เดียว)
 * ทุก request ส่ง JWT ผ่าน apiRequest; LocalStorage ใช้เป็น cache ให้หน้าต่าง ๆ อัปเดตพร้อมกันเท่านั้น
 */
import { apiRequest } from '../api';

const STORAGE_KEY_CLAIMS = 'kmutt_lostfound_claims';
const STORAGE_KEY_POST_STATUS = 'kmutt_lostfound_post_status';

function getStoredClaims() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_CLAIMS)) || [];
  } catch (e) {
    console.warn('LocalStorage error:', e);
    return [];
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

// เก็บคำขอที่ได้จาก Backend ลง cache (แทนที่รายการ id เดิม) เพื่อให้ updateClaimStatus / confirmHandover หาเจอ
function cacheClaims(claims) {
  const ids = new Set(claims.map((c) => String(c.id ?? c.verify_id)));
  const rest = getStoredClaims().filter((c) => !ids.has(String(c.id ?? c.verify_id)));
  saveClaims([...claims, ...rest]);
}

const jsonBody = (body) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const claimService = {
  /**
   * C2: ส่งคำขอตรวจสอบสิทธิ์ (POST /api/posts/:id/verify)
   */
  async submitClaim(payload) {
    const postId = payload.post_id || payload.postId;
    const proof = payload.proof_description || payload.description || '';

    let options;
    if (payload.files && payload.files.length > 0) {
      const formData = new FormData();
      formData.append('proof_description', proof);
      payload.files.forEach((file) => formData.append('images', file));
      options = { method: 'POST', body: formData };
    } else {
      options = { method: 'POST', ...jsonBody({ proof_description: proof }) };
    }

    // error จาก Backend (401, โพสต์ DEPOSITED, ส่งคำขอโพสต์ตัวเอง ฯลฯ) โยนต่อให้หน้าแสดงผล
    const json = await apiRequest(`/posts/${postId}/verify`, options);
    const created = json?.data || json?.verify;

    this.addClaimLocal({
      ...payload,
      id: created?.verify_id,
      verify_id: created?.verify_id,
    });

    return created;
  },

  /**
   * บันทึกคำขอที่เพิ่งส่งลง cache เพื่อให้หน้า "ประกาศของฉัน" แสดงทันที
   */
  addClaimLocal(payload) {
    const newId = String(payload.id || payload.verify_id || `v-${Date.now()}`);
    const newClaim = {
      ...payload,
      id: newId,
      verify_id: newId,
      post_id: String(payload.post_id || payload.postId),
      postId: String(payload.post_id || payload.postId),
      status: 'PENDING',
      verify_status: 'PENDING',
      finderConfirmed: false,
      receiverConfirmed: false,
      created_at: payload.created_at || new Date().toISOString(),
      evidences: payload.evidences || (payload.verify_images ? payload.verify_images.map((img) => img.file_name || 'รูปหลักฐาน') : []),
      requester: payload.requester || 'คุณ (ผู้ใช้ปัจจุบัน)',
      itemTitle: payload.itemTitle || payload.title || '',
      note: '',
      ownerNote: '',
    };

    saveClaims([newClaim, ...getStoredClaims()]);
    return newClaim;
  },

  /**
   * C3: ดึงรายการคำขอทั้งหมดของโพสต์นั้นๆ (GET /api/posts/:id/verify)
   */
  async getClaimsByPost(postId) {
    try {
      const json = await apiRequest(`/posts/${postId}/verify`);
      const claims = json?.requests || json?.data || [];
      cacheClaims(claims);
      return claims;
    } catch (err) {
      console.error('getClaimsByPost failed:', err.message);
      return [];
    }
  },

  /**
   * C4: accept / reject คำขอ (PUT /api/verify/:id/status)
   */
  async updateClaimStatus(claimId, newStatus, note = '') {
    await apiRequest(`/verify/${claimId}/status`, {
      method: 'PUT',
      ...jsonBody({ status: newStatus, note }),
    });

    const currentClaims = getStoredClaims();
    const target = currentClaims.find(c => String(c.id) === String(claimId));
    if (!target) return currentClaims;

    const targetPostId = target.post_id || target.postId;

    const updated = currentClaims.map(c => {
      if (String(c.id) === String(claimId)) {
        const resolvedNote = note?.trim() || (newStatus === 'ACCEPTED' ? 'อนุมัติคำขอแล้ว กรุณานัดหมายวันเวลาและสถานที่รับมอบสิ่งของ' : (newStatus === 'PENDING' ? '' : c.note));
        return {
          ...c,
          status: newStatus,
          verify_status: newStatus,
          note: resolvedNote,
          ownerNote: resolvedNote,
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
    await apiRequest(`/verify/${claimId}/cancel`, {
      method: 'PATCH',
      ...jsonBody({ note }),
    });

    const updated = getStoredClaims().map((c) => {
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
    const json = await apiRequest(`/verify/${claimId}/confirm`, {
      method: 'PUT',
      ...jsonBody({ party }),
    });
    const postClosed = Boolean(json?.postClosed);
    let targetPostId = null;

    const updated = getStoredClaims().map(c => {
      if (String(c.id) === String(claimId)) {
        targetPostId = c.post_id || c.postId;
        return {
          ...c,
          finderConfirmed: party === 'finder' ? true : Boolean(c.finderConfirmed),
          receiverConfirmed: party === 'receiver' ? true : Boolean(c.receiverConfirmed),
          status: postClosed ? 'COMPLETED' : c.status,
          verify_status: postClosed ? 'COMPLETED' : c.verify_status,
        };
      }
      return c;
    });

    if (postClosed && targetPostId) {
      try {
        localStorage.setItem(`${STORAGE_KEY_POST_STATUS}_${targetPostId}`, 'CLOSED');
      } catch (e) {
        console.warn(e);
      }
    }

    saveClaims(updated);
    return { claims: updated, postClosed };
  },

  /**
   * ดึงประวัติคำขอที่ฉันส่ง (GET /api/verify/my-claims)
   */
  async getMyClaims() {
    try {
      const json = await apiRequest('/verify/my-claims');
      const claims = json?.requests || json?.data || [];
      cacheClaims(claims);
      return claims;
    } catch (err) {
      console.error('getMyClaims failed:', err.message);
      return [];
    }
  },

  /**
   * ล้าง cache ในเครื่อง (ข้อมูลจริงอยู่ใน Backend)
   */
  resetAll() {
    saveClaims([]);
    return [];
  },

  subscribe(callback) {
    const handler = (event) => callback(event.detail);
    window.addEventListener('kmutt_claims_updated', handler);
    return () => window.removeEventListener('kmutt_claims_updated', handler);
  },
};
