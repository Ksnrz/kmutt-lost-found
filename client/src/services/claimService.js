/**
 * claimService.js — Central Service สำหรับระบบตรวจสอบสิทธิ์สิ่งของ (VERIFY System)
 * รองรับสถาปัตยกรรม Hybrid: เชื่อมต่อ Backend API (/api/claims) จริง 
 * และมี Fallback ผ่าน LocalStorage เพื่อให้ทดสอบหน้าบ้านได้ลื่นไหลแบบ Real-time
 */

const STORAGE_KEY_CLAIMS = 'kmutt_lostfound_claims';
const STORAGE_KEY_POST_STATUS = 'kmutt_lostfound_post_status';

// ข้อมูลเริ่มต้นสำหรับจำลองระบบหากยังไม่มีข้อมูลในเครื่อง
const DEFAULT_CLAIMS = [
  {
    verify_id: '102',
    id: '102',
    post_id: 'p-101',
    postId: 'p-101',
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
    post_id: 'p-101',
    postId: 'p-101',
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

// Helper: ดึงข้อมูลจาก LocalStorage
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

// Helper: บันทึกข้อมูลลง LocalStorage และกระจาย Event ให้ component อื่นทราบ
function saveClaims(claims) {
  try {
    localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(claims));
    window.dispatchEvent(new CustomEvent('kmutt_claims_updated', { detail: claims }));
  } catch (e) {
    console.warn('LocalStorage write error:', e);
  }
}

export const claimService = {
  /**
   * 1. ส่งคำขอตรวจสอบสิทธิ์ (หน้า 6: ClaimRequestPage)
   * เมื่อผู้ใช้กด "ส่งคำขอ" ➔ คำขอจะถูกบันทึกและวิ่งไปหน้า 7 ทันที!
   */
  async submitClaim(payload) {
    // พยายามส่งไปยัง Backend API ก่อน
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': '1',
        },
        body: JSON.stringify({
          post_id: payload.post_id || payload.postId || 1,
          proof_description: payload.proof_description || payload.description,
          images: payload.images || payload.evidences || [],
        }),
      });

      if (res.ok) {
        const json = await res.json();
        // ซิงก์ลง Storage ด้วยเพื่อให้ UI หน้าบ้านอัปเดตทันที
        this.addClaimLocal(payload);
        return json.data;
      }
    } catch {
      // หากเซิร์ฟเวอร์ยังไม่เปิด ให้ทำงานผ่าน LocalStorage ทันที
    }

    return this.addClaimLocal(payload);
  },

  /**
   * บันทึกคำขอลง LocalStorage (Fallback / Immediate UI sync)
   */
  addClaimLocal(payload) {
    const currentClaims = getStoredClaims();
    const newId = payload.id || payload.verify_id || `v-${Date.now()}`;
    const newClaim = {
      ...payload,
      id: newId,
      verify_id: newId,
      post_id: String(payload.post_id || payload.postId || 'p-101'),
      postId: String(payload.post_id || payload.postId || 'p-101'),
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
   * 2. ดึงรายการคำขอทั้งหมดของโพสต์นั้นๆ (หน้า 7: ReviewRequestsPage)
   */
  async getClaimsByPost(postId = 'p-101') {
    try {
      const res = await fetch(`/api/claims/post/${postId}`, {
        headers: { 'x-test-user': '1' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          return json.data;
        }
      }
    } catch {
      // Backend not running -> fallback
    }

    const all = getStoredClaims();
    return all.filter(c => String(c.post_id) === String(postId) || String(c.postId) === String(postId));
  },

  /**
   * 3. อัปเดตสถานะคำขอ (อนุมัติ ACCEPTED / ปฏิเสธ REJECTED / ยกเลิก CANCELLED)
   * กฎ Business Logic:
   * เมื่อผู้พบกด "อนุมัติ" (ACCEPTED) คำขอของคนอื่นในโพสต์เดียวกันจะถูกเปลี่ยนเป็น CANCELLED อัตโนมัติ!
   */
  async updateClaimStatus(claimId, newStatus, note = '') {
    try {
      await fetch(`/api/claims/${claimId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': '1',
        },
        body: JSON.stringify({ status: newStatus, note }),
      });
    } catch {
      // fallback to local logic
    }

    const currentClaims = getStoredClaims();
    const target = currentClaims.find(c => String(c.id) === String(claimId));
    if (!target) return currentClaims;

    const targetPostId = target.post_id || target.postId;

    const updated = currentClaims.map(c => {
      // คำขอที่ถูกคลิก
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

      // กฎ 1 คำขอต่อ 1 โพสต์: คำขออื่นในโพสต์เดียวกันที่ยังรออยู่ (PENDING) ให้เป็น CANCELLED อัตโนมัติเมื่อมีการตอบรับ
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
   * 4. ยืนยันการส่งมอบ (Dual Confirmation)
   * กฎ Business Logic:
   * เมื่อทั้งผู้พบและผู้รับกดยืนยันครบทั้ง 2 ฝ่าย ➔ สั่งปิดโพสต์เป็น 'CLOSED' และคำขอเป็น 'COMPLETED'
   */
  async confirmHandover(claimId, party = 'finder') {
    try {
      await fetch(`/api/claims/${claimId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': '1',
        },
        body: JSON.stringify({ party }),
      });
    } catch {
      // fallback
    }

    const currentClaims = getStoredClaims();
    let willClosePost = false;
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
   * 5. ดึงประวัติคำขอที่ฉันส่ง (สำหรับหน้า Account: แท็บ "คำขอที่ฉันส่ง")
   */
  async getMyClaims() {
    try {
      const res = await fetch('/api/claims/my-claims', {
        headers: { 'x-test-user': '1' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          return json.data;
        }
      }
    } catch {
      // fallback
    }

    return getStoredClaims();
  },

  /**
   * 6. รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นสำหรับการทดสอบเดโม
   */
  resetAll() {
    try {
      localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(DEFAULT_CLAIMS));
      localStorage.removeItem(`${STORAGE_KEY_POST_STATUS}_p-101`);
      localStorage.removeItem('receiver_confirmed_102');
      localStorage.removeItem('receiver_confirmed_103');
      window.dispatchEvent(new CustomEvent('kmutt_claims_updated', { detail: DEFAULT_CLAIMS }));
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_CLAIMS;
  },

  /**
   * Subscribe เพื่อรับการแจ้งเตือนแบบ Real-time เมื่อมีการเปลี่ยนแปลงคำขอ
   */
  subscribe(callback) {
    const handler = (event) => callback(event.detail);
    window.addEventListener('kmutt_claims_updated', handler);
    return () => window.removeEventListener('kmutt_claims_updated', handler);
  },
};
