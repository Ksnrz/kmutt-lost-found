import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Thumbnail from '../../components/ui/Thumbnail';
import Badge from '../../components/ui/Badge';
import './ReviewRequestsPage.css';

/**
 * ReviewRequestsPage Component — หน้าตรวจคำขอที่ส่งมายังประกาศของฉัน (RECEIVED REQUESTS)
 * Route URL: /requests/review
 * 
 * 🌟 สอดคล้องกับ ER Diagram:
 * - Entity: POSTS (ความสัมพันธ์ POSTS (0,N) receives (1,1) VERIFY_ITEMS)
 *   - post_id, post_status ('OPEN' | 'CLOSED' | 'CANCELLED'), post_type, custody_type, contact_text
 * - Entity: LOCATION (POSTS (1,1) HAS (0,N) LOCATION)
 *   - building_name, pickup_detail
 * - Entity: VERIFY_ITEMS
 *   - verify_id (PK), post_id (FK), user_id (FK), verify_status, proof_description, created_at
 * - Entity: USERS (USERS (0,N) submit (1,1) VERIFY_ITEMS)
 *   - user_id, first_name, last_name, phone_number, email
 * - Entity: VERIFY_IMAGES (VERIFY_ITEMS (0,N) contain (1,1) VERIFY_IMAGES)
 *   - verify_image_id, verify_image_url
 * 
 * 🌟 ZERO Inline Styles: 100% ควบคุมผ่าน CSS Classes
 */
export default function ReviewRequestsPage({
  // ข้อมูลจำลองสอดคล้องกับ Entity: VERIFY_ITEMS, USERS, POSTS ตาม ER Diagram
  initialRequests = [
    {
      verify_id: '102',
      id: '102',
      post_id: 'p-101',
      postId: 'p-101',
      itemTitle: 'กระเป๋าสตางค์สีดำ',
      requester: 'ภัทรพล สุขเกษม (นักศึกษา B)',
      first_name: 'ภัทรพล',
      last_name: 'สุขเกษม',
      phone_number: '089-123-4567',
      email: 'pattarapol.b@mail.kmutt.ac.th',
      created_at: '24 ก.ย. 2026',
      date: '24 ก.ย. 2026',
      verify_status: 'PENDING', // 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
      status: 'PENDING',
      proof_description: 'มีรอยถลอกเล็ก ๆ ที่มุมด้านใน และมีบัตรสีฟ้าอยู่หนึ่งใบ',
      description: 'มีรอยถลอกเล็ก ๆ ที่มุมด้านใน และมีบัตรสีฟ้าอยู่หนึ่งใบ',
      verify_images: ['ภาพหลักฐานบัตรสีฟ้า', 'ภาพรอยถลอกมุมกระเป๋า'],
      evidences: ['ภาพหลักฐานบัตรสีฟ้า', 'ภาพรอยถลอกมุมกระเป๋า'],
      finderConfirmed: false,
      receiverConfirmed: false,
      note: '',
    },
    {
      verify_id: '103',
      id: '103',
      post_id: 'p-101',
      postId: 'p-101',
      itemTitle: 'กระเป๋าสตางค์สีดำ',
      requester: 'กานดา วิริยะ (นักศึกษา D)',
      first_name: 'กานดา',
      last_name: 'วิริยะ',
      phone_number: '086-987-6543',
      email: 'kanda.w@mail.kmutt.ac.th',
      created_at: '25 ก.ย. 2026',
      date: '25 ก.ย. 2026',
      verify_status: 'PENDING',
      status: 'PENDING',
      proof_description: 'กระเป๋าตังค์หนังแท้สีดำ มีช่องใส่เหรียญซิปทอง มีเศษบิลซื้อของอยู่ด้านใน',
      description: 'กระเป๋าตังค์หนังแท้สีดำ มีช่องใส่เหรียญซิปทอง มีเศษบิลซื้อของอยู่ด้านใน',
      verify_images: ['รูปใบเสร็จที่เคยซื้อ', 'รูปบัตรสะสมแต้ม'],
      evidences: ['รูปใบเสร็จที่เคยซื้อ', 'รูปบัตรสะสมแต้ม'],
      finderConfirmed: false,
      receiverConfirmed: false,
      note: '',
    },
  ],
  // ข้อมูลโพสต์ที่กำลังจัดการ (ดึงมาจาก POSTS + LOCATION)
  postInfo = {
    post_id: 'p-101',
    title: 'พบกระเป๋าสตางค์สีดำ',
    post_type: 'ประกาศเจอของ (FOUND)',
    custody_type: 'ผู้พบเก็บรักษาเอง',
    contact_text: 'LINE: @finder_kmutt · โทร 081-999-8888',
    building_name: 'อาคาร S4 ชั้น 1',
    pickup_detail: 'โถงประชาสัมพันธ์หน้าลิฟต์',
  },
  onBack,
}) {
  const navigate = useNavigate();

  // State 1: สถานะของโพสต์ประกาศหลัก (ตรงกับ post_status ใน Entity POSTS: 'OPEN' | 'CLOSED' | 'CANCELLED')
  const [postStatus, setPostStatus] = useState('OPEN');

  // State 2: รายการคำขอทั้งหมด (Entity VERIFY_ITEMS)
  const [requests, setRequests] = useState(initialRequests);

  // State 3: รหัสคำขอที่กำลังเลือกดูรายละเอียดอยู่ (verify_id)
  const [selectedId, setSelectedId] = useState('102');

  // State 4: ข้อความในช่อง "หมายเหตุสำหรับผู้ส่ง"
  const [noteText, setNoteText] = useState('');

  // ค้นหาข้อมูลคำขอที่กำลังถูกเลือก
  const activeRequest = requests.find((r) => r.id === selectedId) || requests[0];

  // ค้นหาว่ามีคำขออื่นในโพสต์นี้ที่ได้รับการ ACCEPTED อยู่แล้วหรือไม่ (กฎ 1 คนต่อโพสต์)
  const acceptedClaim = requests.find((r) => r.status === 'ACCEPTED');
  const isOtherAccepted = acceptedClaim && acceptedClaim.id !== activeRequest?.id;

  // จำนวนรายการที่ยังรอตรวจ (PENDING)
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  // 1. ตอบรับคำขอ (ACCEPTED) — ล็อกให้ตอบรับได้ทีละ 1 คนต่อโพสต์
  const handleAccept = () => {
    if (!activeRequest || isOtherAccepted) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === activeRequest.id
          ? {
              ...r,
              status: 'ACCEPTED',
              verify_status: 'ACCEPTED',
              note: noteText,
              finderConfirmed: false,
              receiverConfirmed: false,
            }
          : r
      )
    );

    setNoteText('');
  };

  // 2. ปฏิเสธคำขอ (REJECTED)
  const handleReject = () => {
    if (!activeRequest) return;

    const confirmReject = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอ #${activeRequest.id}?`);
    if (!confirmReject) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === activeRequest.id
          ? { ...r, status: 'REJECTED', verify_status: 'REJECTED', note: noteText }
          : r
      )
    );

    setNoteText('');
  };

  // 3. ฝ่ายผู้พบ (คุณ) กดยืนยันการส่งมอบ
  const handleConfirmFinder = (id) => {
    setRequests((prev) => {
      const target = prev.find((r) => r.id === id);
      if (!target) return prev;
      const willComplete = target.receiverConfirmed;

      if (willComplete) {
        setPostStatus('CLOSED');
      }

      return prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            finderConfirmed: true,
            status: willComplete ? 'COMPLETED' : r.status,
            verify_status: willComplete ? 'COMPLETED' : r.verify_status,
          };
        }
        if (willComplete && r.status === 'PENDING') {
          return {
            ...r,
            status: 'CANCELLED',
            verify_status: 'CANCELLED',
            note: 'ระบบยกเลิกอัตโนมัติเนื่องจากส่งมอบสิ่งของสำเร็จแล้ว',
          };
        }
        return r;
      });
    });
  };

  // 4. จำลองฝ่ายผู้รับ กดยืนยันว่าได้รับของแล้ว (Dual Confirmation)
  const handleConfirmReceiver = (id) => {
    setRequests((prev) => {
      const target = prev.find((r) => r.id === id);
      if (!target) return prev;
      const willComplete = target.finderConfirmed;

      if (willComplete) {
        setPostStatus('CLOSED');
      }

      return prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            receiverConfirmed: true,
            status: willComplete ? 'COMPLETED' : r.status,
            verify_status: willComplete ? 'COMPLETED' : r.verify_status,
          };
        }
        if (willComplete && r.status === 'PENDING') {
          return {
            ...r,
            status: 'CANCELLED',
            verify_status: 'CANCELLED',
            note: 'ระบบยกเลิกอัตโนมัติเนื่องจากส่งมอบสิ่งของสำเร็จแล้ว',
          };
        }
        return r;
      });
    });
  };

  // 5. ส่งมอบไม่สำเร็จ ➔ ยกเลิกการตอบรับ (CANCELLED) เพื่อให้กลับไปเลือกคำขออื่นที่รออยู่ได้
  const handleCancelAccepted = (id) => {
    const confirmCancel = window.confirm('ต้องการยกเลิกการตอบรับคำขอนี้ใช่หรือไม่? (ระบบจะเปิดให้คุณสามารถเลือกคำขออื่นที่ยังรออยู่ได้)');
    if (!confirmCancel) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'CANCELLED',
              verify_status: 'CANCELLED',
              note: 'ยกเลิกการตอบรับเนื่องจากส่งมอบไม่สำเร็จ',
              finderConfirmed: false,
              receiverConfirmed: false,
            }
          : r
      )
    );
  };

  // 6. รีเซ็ตสถานะกลับมาเป็น PENDING (เพื่อให้อาจารย์หรือทีมงานทดสอบฟังก์ชันได้สะดวก)
  const handleResetStatus = (id) => {
    setPostStatus('OPEN');
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'PENDING',
              verify_status: 'PENDING',
              note: '',
              finderConfirmed: false,
              receiverConfirmed: false,
            }
          : r
      )
    );
  };

  // 7. รีเซ็ตทั้งหมดทั้งโพสต์
  const handleResetAll = () => {
    setPostStatus('OPEN');
    setRequests(initialRequests);
    setNoteText('');
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/account');
    }
  };

  return (
    <div className="review-requests-container">
      {/* ส่วนหัวหน้าเว็บ */}
      <PageHeader
        tag="RECEIVED REQUESTS"
        title="คำขอที่ส่งมายังประกาศของฉัน"
        subtitle="ตรวจหลักฐานและยืนยันการส่งมอบสิ่งของคืนเจ้าของตามกฎระบบ"
        backText="กลับไปรายการประกาศ"
        onBack={handleGoBack}
      />

      {/* แบนเนอร์แสดงข้อมูล Entity POSTS + LOCATION ตาม ER Diagram */}
      <div className="review-post-banner">
        <div className="review-post-banner-info">
          <span className="review-post-banner-label">โพสต์ที่กำลังจัดการ (POSTS):</span>
          <strong className="review-post-banner-title">
            {postInfo.title} (รหัส #{postInfo.post_id} · {postInfo.building_name})
          </strong>
        </div>
        <div className="review-post-banner-right">
          <div className="review-post-banner-status">
            <span className="review-post-banner-label">post_status:</span>
            {postStatus === 'OPEN' && (
              <Badge variant="success">OPEN · เปิดรับคำขอ</Badge>
            )}
            {postStatus === 'CLOSED' && (
              <Badge variant="completed">CLOSED · ส่งมอบสำเร็จแล้ว</Badge>
            )}
            {postStatus === 'CANCELLED' && (
              <Badge variant="danger">CANCELLED · ยกเลิกโพสต์</Badge>
            )}
          </div>
          {postStatus === 'CLOSED' && (
            <button
              type="button"
              className="review-post-reset-btn"
              onClick={handleResetAll}
            >
              ↺ รีเซ็ตการทดสอบ
            </button>
          )}
        </div>
      </div>

      {/* เลย์เอาต์แบ่ง 2 คอลัมน์ */}
      <div className="review-requests-grid">
        {/* ========================================================
            คอลัมน์ซ้าย: การ์ดรายการคำขอที่ได้รับ (VERIFY_ITEMS)
            ======================================================== */}
        <Card className="review-list-card">
          <div className="review-list-header">
            <h2 className="review-list-title">คำขอที่ได้รับ</h2>
            <Badge variant="count">
              {pendingCount} รายการรอตรวจ
            </Badge>
          </div>

          <div className="review-items-list">
            {requests.map((item) => {
              const isSelected = item.id === activeRequest?.id;

              return (
                <div
                  key={item.id}
                  className={`review-item-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSelectedId(item.id);
                  }}
                >
                  <Thumbnail text="รูปคำขอ" />

                  <div className="review-item-info">
                    <h3 className="review-item-title">
                      {item.itemTitle} · #{item.verify_id || item.id}
                    </h3>
                    <p className="review-item-meta">
                      โดย {item.requester} · {item.created_at || item.date}
                    </p>

                    <div className="review-item-badge-wrap">
                      {item.status === 'PENDING' && (
                        <Badge variant="pending">PENDING · รอตรวจ</Badge>
                      )}
                      {item.status === 'ACCEPTED' && (
                        <Badge variant="success">ACCEPTED · ตอบรับแล้ว</Badge>
                      )}
                      {item.status === 'REJECTED' && (
                        <Badge variant="danger">REJECTED · ปฏิเสธ</Badge>
                      )}
                      {item.status === 'CANCELLED' && (
                        <Badge variant="neutral">CANCELLED · ยกเลิก</Badge>
                      )}
                      {item.status === 'COMPLETED' && (
                        <Badge variant="completed">COMPLETED · ส่งมอบสำเร็จ</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ========================================================
            คอลัมน์ขวา: รายละเอียดคำขอ (VERIFY_ITEMS + USERS + VERIFY_IMAGES)
            ======================================================== */}
        {activeRequest ? (
          <Card className="review-detail-card">
            <div className="review-detail-header-row">
              <h2 className="review-detail-title">
                รายละเอียดคำขอ #{activeRequest.verify_id || activeRequest.id}
              </h2>
              {activeRequest.status === 'PENDING' && (
                <Badge variant="pending">PENDING · รอตรวจ</Badge>
              )}
              {activeRequest.status === 'ACCEPTED' && (
                <Badge variant="success">ACCEPTED · ตอบรับแล้ว</Badge>
              )}
              {activeRequest.status === 'REJECTED' && (
                <Badge variant="danger">REJECTED · ปฏิเสธ</Badge>
              )}
              {activeRequest.status === 'CANCELLED' && (
                <Badge variant="neutral">CANCELLED · ยกเลิก</Badge>
              )}
              {activeRequest.status === 'COMPLETED' && (
                <Badge variant="completed">COMPLETED · สำเร็จ</Badge>
              )}
            </div>

            {/* ข้อมูลผู้ส่งคำขอจาก Entity USERS */}
            <p className="review-detail-description">
              <span className="review-description-label">ผู้ส่งคำขอ (USERS): </span>
              {activeRequest.requester}
              {activeRequest.phone_number && (
                <span> · โทร: {activeRequest.phone_number}</span>
              )}
            </p>

            {/* คำอธิบายตำหนิจาก Entity VERIFY_ITEMS: proof_description */}
            <p className="review-detail-description">
              <span className="review-description-label">รายละเอียดตำหนิ (proof_description): </span>
              {activeRequest.proof_description || activeRequest.description}
            </p>

            {/* รูปภาพหลักฐานจาก Entity VERIFY_IMAGES */}
            <p className="review-detail-description">
              <span className="review-description-label">รูปภาพหลักฐาน (VERIFY_IMAGES):</span>
            </p>
            <div className="review-evidences-row">
              {(activeRequest.verify_images || activeRequest.evidences).map((evText, idx) => (
                <div key={idx} className="review-evidence-box">
                  {evText}
                </div>
              ))}
            </div>

            {/* ========================================================
                กฎข้อที่ 1: แจ้งเตือนหากมีคำขออื่นตอบรับอยู่แล้ว
                ======================================================== */}
            {isOtherAccepted && activeRequest.status === 'PENDING' && (
              <div className="review-status-alert is-blocked">
                ⚠️ มีคำขอ <strong>#{acceptedClaim.verify_id || acceptedClaim.id} ({acceptedClaim.requester})</strong> ได้รับการตอบรับอยู่แล้ว — ระบบจำกัดตอบรับได้เพียง 1 คนต่อโพสต์ในเวลาเดียวกัน
              </div>
            )}

            {/* ========================================================
                กฎข้อที่ 2 & 3: ขั้นตอนการส่งมอบ (Dual Confirmation)
                ======================================================== */}
            {activeRequest.status === 'ACCEPTED' && (
              <div className="review-handover-box">
                <div className="review-handover-header">
                  <strong>🤝 ขั้นตอนการส่งมอบสิ่งของ (Dual Confirmation)</strong>
                  <span className="review-handover-badge">รอทั้ง 2 ฝ่ายยืนยัน</span>
                </div>
                <p className="review-handover-sub">
                  ตามกฎระบบ: ทั้งผู้พบและผู้รับต้องยืนยันการส่งมอบ เมื่อยืนยันครบ post_status จะเปลี่ยนเป็น <strong>CLOSED</strong> และคำขออื่นที่ค้างอยู่จะถูกยกเลิกอัตโนมัติ
                </p>

                <div className="review-handover-steps-grid">
                  {/* ฝ่ายที่ 1: ผู้พบ (คุณ) */}
                  <div className={`handover-step-card ${activeRequest.finderConfirmed ? 'is-done' : ''}`}>
                    <div className="handover-step-header">
                      <span className="step-num">{activeRequest.finderConfirmed ? '✓' : '1'}</span>
                      <span className="step-label">ฝ่ายผู้พบ (คุณ)</span>
                    </div>
                    <p className="step-status-text">
                      {activeRequest.finderConfirmed ? 'ยืนยันการส่งมอบแล้ว' : 'รอยืนยันการส่งของ'}
                    </p>
                    {!activeRequest.finderConfirmed ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleConfirmFinder(activeRequest.id)}
                      >
                        ยืนยันการส่งมอบ
                      </Button>
                    ) : (
                      <span className="handover-confirmed-tag">✓ ยืนยันแล้ว</span>
                    )}
                  </div>

                  {/* ฝ่ายที่ 2: ผู้รับ (นักศึกษา) */}
                  <div className={`handover-step-card ${activeRequest.receiverConfirmed ? 'is-done' : ''}`}>
                    <div className="handover-step-header">
                      <span className="step-num">{activeRequest.receiverConfirmed ? '✓' : '2'}</span>
                      <span className="step-label">ฝ่ายผู้รับ ({activeRequest.first_name || activeRequest.requester})</span>
                    </div>
                    <p className="step-status-text">
                      {activeRequest.receiverConfirmed ? 'ยืนยันได้รับของแล้ว' : 'รอผู้รับยืนยัน'}
                    </p>
                    {!activeRequest.receiverConfirmed ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleConfirmReceiver(activeRequest.id)}
                      >
                        จำลอง: ผู้รับยืนยัน
                      </Button>
                    ) : (
                      <span className="handover-confirmed-tag">✓ ยืนยันแล้ว</span>
                    )}
                  </div>
                </div>

                {/* กฎข้อที่ 4: ส่งมอบไม่สำเร็จ สามารถยกเลิกได้ */}
                <div className="review-handover-cancel-row">
                  <button
                    type="button"
                    className="review-cancel-link"
                    onClick={() => handleCancelAccepted(activeRequest.id)}
                  >
                    ✕ ส่งมอบไม่สำเร็จ? ยกเลิกการตอบรับเพื่อกลับไปเลือกคำขออื่นที่รออยู่
                  </button>
                </div>
              </div>
            )}

            {/* แสดงสถานะเมื่อส่งมอบสำเร็จ (COMPLETED) */}
            {activeRequest.status === 'COMPLETED' && (
              <div className="review-status-alert is-completed">
                🎉 <strong>ส่งมอบสำเร็จเรียบร้อยแล้ว!</strong> ทั้งสองฝ่ายยืนยันครบถ้วน โพสต์ประกาศถูกเปลี่ยนเป็น <strong>CLOSED</strong> และคำขออื่นที่ค้างอยู่ถูกยกเลิกแล้ว
              </div>
            )}

            {/* แสดงสถานะเมื่อถูกปฏิเสธ (REJECTED) */}
            {activeRequest.status === 'REJECTED' && (
              <div className="review-status-alert is-rejected">
                ✕ คำขอนี้ถูกปฏิเสธแล้ว
              </div>
            )}

            {/* แสดงสถานะเมื่อถูกยกเลิก (CANCELLED) */}
            {activeRequest.status === 'CANCELLED' && (
              <div className="review-status-alert is-cancelled">
                ⊘ คำขอนี้ถูกยกเลิกแล้ว
              </div>
            )}

            {/* ช่องกรอกหมายเหตุ */}
            <div className="review-note-section">
              <label htmlFor="reviewNoteInput" className="review-note-title">
                หมายเหตุสำหรับผู้ส่ง (เหตุผลหรือนัดรับ)
              </label>
              <input
                id="reviewNoteInput"
                type="text"
                className="review-note-input"
                placeholder="ระบุสถานที่นัดรับ เวลา หรือเหตุผลประกอบ..."
                value={noteText || activeRequest.note || ''}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={activeRequest.status !== 'PENDING'}
              />
              <p className="review-note-helper">
                หมายเหตุนี้จะแสดงในหน้าตารางคำขอ (My Requests) ของผู้ส่งคำขอ
              </p>
            </div>

            {/* ปุ่มกดปฏิเสธ / ตอบรับคำขอ */}
            <div className="review-detail-actions">
              {activeRequest.status !== 'PENDING' && (
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => handleResetStatus(activeRequest.id)}
                >
                  ↺ รีเซ็ตเพื่อตรวจใหม่
                </Button>
              )}

              {activeRequest.status === 'PENDING' && (
                <>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={handleReject}
                  >
                    ปฏิเสธ
                  </Button>
                  <Button
                    variant="primary"
                    type="button"
                    onClick={handleAccept}
                    disabled={Boolean(isOtherAccepted)}
                    title={isOtherAccepted ? 'ไม่สามารถตอบรับได้ เนื่องจากมีคำขออื่นได้รับการตอบรับอยู่แล้ว' : ''}
                  >
                    ตอบรับคำขอ
                  </Button>
                </>
              )}
            </div>
          </Card>
        ) : (
          <Card className="review-detail-card">
            <p>กรุณาเลือกคำขอที่ต้องการตรวจสอบ</p>
          </Card>
        )}
      </div>
    </div>
  );
}
