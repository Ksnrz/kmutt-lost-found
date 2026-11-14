import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Handshake,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Ban,
  RotateCcw,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Thumbnail from '../../components/ui/Thumbnail';
import Badge from '../../components/ui/Badge';
import { claimService } from '../../services/claimService';
import './ReviewRequestsPage.css';

/**
 * ReviewRequestsPage Component — หน้าตรวจคำขอที่ส่งมายังประกาศของฉัน (RECEIVED REQUESTS)
 * Route URL: /requests/review
 */
export default function ReviewRequestsPage({
  initialRequests = [],
  onBack,
}) {
  const navigate = useNavigate();
  const { postId: routePostId } = useParams();
  const location = useLocation();
  const targetPostId = routePostId || location.state?.postId || 'p-101';

  // State 1: สถานะของโพสต์ประกาศหลัก ('OPEN' | 'CLOSED' | 'CANCELLED')
  const [postStatus, setPostStatus] = useState('OPEN');

  // State 2: รายการคำขอทั้งหมด
  const [requests, setRequests] = useState(initialRequests);

  // State 3: รหัสคำขอที่กำลังเลือกดูรายละเอียดอยู่
  const [selectedId, setSelectedId] = useState(null);

  // State 4: ข้อความในช่อง "หมายเหตุสำหรับผู้ส่ง"
  const [noteText, setNoteText] = useState('');

  // เชื่อมต่อ State กลางและรับข้อมูลแบบ Real-time จาก claimService
  useEffect(() => {
    let isMounted = true;
    claimService.getClaimsByPost(targetPostId).then((data) => {
      if (isMounted && data) {
        setRequests(data);
        if (data[0]?.id || data[0]?.verify_id) {
          setSelectedId(String(data[0].id || data[0].verify_id));
        }
      }
    });

    // ซิงก์ข้อมูลทันทีเมื่อมีการส่งคำขอใหม่จากหน้า 6 หรือมีการอัปเดตจากหน้าอื่น
    const unsubscribe = claimService.subscribe((updatedClaims) => {
      const forPost = updatedClaims.filter(c => String(c.post_id) === String(targetPostId) || String(c.postId) === String(targetPostId));
      if (forPost.length > 0) {
        setRequests(forPost);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [targetPostId]);

  // เรียก API แล้วแจ้ง error ให้ผู้ใช้เห็น (คืนค่า undefined เมื่อไม่สำเร็จ)
  const run = async (fn) => {
    try {
      return (await fn()) ?? true;
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  };

  // ค้นหาข้อมูลคำขอที่กำลังถูกเลือก
  const activeRequest = requests.find((r) => r.id === selectedId) || requests[0];

  // ค้นหาว่ามีคำขออื่นในโพสต์นี้ที่ได้รับการ ACCEPTED อยู่แล้วหรือไม่ (กฎ 1 คนต่อโพสต์)
  const acceptedClaim = requests.find((r) => r.status === 'ACCEPTED');
  const isOtherAccepted = acceptedClaim && acceptedClaim.id !== activeRequest?.id;

  // จำนวนรายการที่ยังรอตรวจ (PENDING)
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  // 1. ตอบรับคำขอ (ACCEPTED / อนุมัติคำขอ) — ล็อกให้ตอบรับได้ทีละ 1 คนต่อโพสต์
  // กฎ Business Logic: คำขออื่นที่รออยู่จะถูก CANCELLED อัตโนมัติทันที
  const handleAccept = async () => {
    if (!activeRequest || isOtherAccepted) return;

    const finalNote = noteText.trim() || 'อนุมัติคำขอแล้ว กรุณานัดหมายวันเวลาและสถานที่รับมอบสิ่งของ';
    if (await run(() => claimService.updateClaimStatus(activeRequest.id, 'ACCEPTED', finalNote))) setNoteText('');
  };

  // 2. ปฏิเสธคำขอ (REJECTED)
  const handleReject = async () => {
    if (!activeRequest) return;

    const confirmReject = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอ #${activeRequest.id}?`);
    if (!confirmReject) return;

    if (await run(() => claimService.updateClaimStatus(activeRequest.id, 'REJECTED', noteText))) setNoteText('');
  };

  // 3. ฝ่ายผู้พบ (คุณ) กดยืนยันการส่งมอบ (Dual Confirmation)
  const handleConfirmFinder = async (id) => {
    const result = await run(() => claimService.confirmHandover(id, 'finder'));
    if (result?.postClosed) {
      setPostStatus('CLOSED');
    }
  };

  // 4. ส่งมอบไม่สำเร็จ ➔ ยกเลิกการตอบรับ (CANCELLED) เพื่อให้กลับไปเลือกคำขออื่นที่รออยู่ได้
  const handleCancelAccepted = async (id) => {
    const confirmCancel = window.confirm('ต้องการยกเลิกการตอบรับคำขอนี้ใช่หรือไม่? (ระบบจะเปิดให้คุณสามารถเลือกคำขออื่นที่ยังรออยู่ได้)');
    if (!confirmCancel) return;

    await run(() => claimService.updateClaimStatus(id, 'CANCELLED', 'ยกเลิกการตอบรับเนื่องจากส่งมอบไม่สำเร็จ'));
  };

  // 5. รีเซ็ตสถานะกลับมาเป็น PENDING 
  const handleResetStatus = async (id) => {
    if (await run(() => claimService.updateClaimStatus(id, 'PENDING', ''))) setPostStatus('OPEN');
  };

  // 6. รีเซ็ตทั้งหมดทั้งโพสต์กลับสู่ค่าเริ่มต้น
  const handleResetAll = () => {
    setPostStatus('OPEN');
    const resetData = claimService.resetAll();
    setRequests(resetData);
    setNoteText('');
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (location.state?.from) {
      navigate(location.state.from);
    } else if (targetPostId && targetPostId !== 'p-101') {
      navigate(`/posts/${targetPostId}`);
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
        backText={location.state?.from === 'detail' ? 'กลับไปหน้ารายละเอียดโพสต์' : 'กลับไปหน้าประกาศของฉัน'}
        onBack={handleGoBack}
      />

      {/* แบนเนอร์แสดงสถานะโพสต์ */}
      <div className="review-post-banner">
        <div className="review-post-banner-info">
          <span className="review-post-banner-label">โพสต์ที่จัดการ:</span>
          <strong className="review-post-banner-title">
            {location.state?.post?.title || activeRequest?.itemTitle || 'พบกระเป๋าสตางค์สีดำ'} (#{targetPostId})
          </strong>
        </div>
        <div className="review-post-banner-right">
          <div className="review-post-banner-status">
            <span className="review-post-banner-label">สถานะโพสต์:</span>
            {postStatus === 'OPEN' && (
              <Badge variant="success">OPEN · กำลังเปิดรับคำขอ</Badge>
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
              <RotateCcw size={13} className="review-btn-icon" />
              <span>รีเซ็ตการทดสอบ</span>
            </button>
          )}
        </div>
      </div>

      {/* เลย์เอาต์แบ่ง 2 คอลัมน์ตาม Figma */}
      <div className="review-requests-grid">
        {/* ========================================================
            คอลัมน์ซ้าย: การ์ดรายการคำขอที่ได้รับ 
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
                  <Thumbnail text="รูปโพสต์" />

                  <div className="review-item-info">
                    <h3 className="review-item-title">
                      {item.itemTitle} · #{item.id}
                    </h3>
                    <p className="review-item-meta">
                      โดย {item.requester} · {item.date}
                    </p>

                    <div className="review-item-badge-wrap">
                      {item.status === 'PENDING' && (
                        <Badge variant="pending">PENDING</Badge>
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
            คอลัมน์ขวา: รายละเอียดคำขอ (ตาม Figma เป๊ะ)
            ======================================================== */}
        {activeRequest ? (
          <Card className="review-detail-card">
            <h2 className="review-detail-title">
              รายละเอียดคำขอ #{activeRequest.id}
            </h2>

            {/* คำอธิบายตำหนิตรงตาม Figma */}
            <p className="review-detail-description">
              <span className="review-description-label">คำอธิบาย: </span>
              {activeRequest.description}
            </p>

            {/* กล่องแสดงรูปหลักฐานตรงตาม Figma */}
            <div className="review-evidences-row">
              {activeRequest.evidences.map((evText, idx) => (
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
                <AlertTriangle size={18} className="review-alert-icon" />
                <div>
                  มีคำขอ <strong>#{acceptedClaim.id} ({acceptedClaim.requester})</strong> ได้รับการตอบรับอยู่แล้ว — ระบบจำกัดตอบรับได้เพียง 1 คนต่อโพสต์ในเวลาเดียวกัน
                </div>
              </div>
            )}

            {/* ========================================================
                กฎข้อที่ 2 & 3: ขั้นตอนการส่งมอบ (Dual Confirmation พร้อม Lucide Icon)
                ======================================================== */}
            {activeRequest.status === 'ACCEPTED' && (
              <div className="review-handover-box">
                <div className="review-handover-header">
                  <div className="review-handover-title-wrap">
                    <Handshake size={20} className="review-handover-icon" />
                    <strong>ขั้นตอนการส่งมอบสิ่งของ (Dual Confirmation)</strong>
                  </div>
                  <span className="review-handover-badge">รอทั้ง 2 ฝ่ายยืนยัน</span>
                </div>
                <p className="review-handover-sub">
                  ตามกฎระบบ: ทั้งผู้พบและผู้รับต้องยืนยันการส่งมอบ เมื่อยืนยันครบ โพสต์จะเปลี่ยนเป็น <strong>CLOSED</strong> และคำขออื่นที่ค้างอยู่จะถูกยกเลิกอัตโนมัติ
                </p>

                <div className="review-handover-steps-grid">
                  {/* ฝ่ายที่ 1: ผู้พบ (คุณ) */}
                  <div className={`handover-step-card ${activeRequest.finderConfirmed ? 'is-done' : ''}`}>
                    <div className="handover-step-header">
                      <span className="step-num">
                        {activeRequest.finderConfirmed ? <Check size={14} /> : '1'}
                      </span>
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
                      <span className="handover-confirmed-tag">
                        <CheckCircle2 size={13} />
                        <span>ยืนยันแล้ว</span>
                      </span>
                    )}
                  </div>

                  {/* ฝ่ายที่ 2: ผู้รับ (นักศึกษา) */}
                  <div className={`handover-step-card ${activeRequest.receiverConfirmed ? 'is-done' : ''}`}>
                    <div className="handover-step-header">
                      <span className="step-num">
                        {activeRequest.receiverConfirmed ? <Check size={14} /> : '2'}
                      </span>
                      <span className="step-label">ฝ่ายผู้รับ ({activeRequest.requester})</span>
                    </div>
                    <p className="step-status-text">
                      {activeRequest.receiverConfirmed ? 'ยืนยันได้รับของแล้ว' : 'รอผู้รับยืนยัน'}
                    </p>
                    {activeRequest.receiverConfirmed ? (
                      <span className="handover-confirmed-tag">
                        <CheckCircle2 size={13} />
                        <span>ยืนยันแล้ว</span>
                      </span>
                    ) : (
                      <span className="handover-waiting-tag">
                        <span>รอผู้รับยืนยัน</span>
                      </span>
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
                    <XCircle size={14} className="review-cancel-icon" />
                    <span>ส่งมอบไม่สำเร็จ? ยกเลิกการตอบรับเพื่อกลับไปเลือกคำขออื่นที่รออยู่</span>
                  </button>
                </div>
              </div>
            )}

            {/* แสดงสถานะเมื่อส่งมอบสำเร็จ (COMPLETED) */}
            {activeRequest.status === 'COMPLETED' && (
              <div className="review-status-alert is-completed">
                <CheckCircle2 size={20} className="review-alert-icon" />
                <div>
                  <strong>ส่งมอบสำเร็จเรียบร้อยแล้ว!</strong> ทั้งสองฝ่ายยืนยันครบถ้วน โพสต์ประกาศถูกเปลี่ยนเป็น <strong>CLOSED</strong> และคำขออื่นที่ค้างอยู่ถูกยกเลิกแล้ว
                </div>
              </div>
            )}

            {/* แสดงสถานะเมื่อถูกปฏิเสธ (REJECTED) */}
            {activeRequest.status === 'REJECTED' && (
              <div className="review-status-alert is-rejected">
                <XCircle size={18} className="review-alert-icon" />
                <span>คำขอนี้ถูกปฏิเสธแล้ว</span>
              </div>
            )}

            {/* แสดงสถานะเมื่อถูกยกเลิก (CANCELLED) */}
            {activeRequest.status === 'CANCELLED' && (
              <div className="review-status-alert is-cancelled">
                <Ban size={18} className="review-alert-icon" />
                <span>คำขอนี้ถูกยกเลิกแล้ว</span>
              </div>
            )}

            {/* ช่องกรอกหมายเหตุ */}
            <div className="review-note-section">
              <label htmlFor="reviewNoteInput" className="review-note-title">
                หมายเหตุสำหรับผู้ส่ง
              </label>
              <input
                id="reviewNoteInput"
                type="text"
                className="review-note-input"
                placeholder="ระบุเหตุผลหรือขั้นตอนนัดรับ"
                value={noteText || activeRequest.note || ''}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={activeRequest.status !== 'PENDING'}
              />
              <p className="review-note-helper">
                เมื่อส่งของคืนจริงแล้ว จึงกดยืนยันการส่งคืนและปิดสถานะ
              </p>
            </div>

            {/* ปุ่มกดปฏิเสธ / อนุมัติคำขอ*/}
            <div className="review-detail-actions">
              {activeRequest.status !== 'PENDING' && (
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => handleResetStatus(activeRequest.id)}
                >
                  <RotateCcw size={13} className="review-btn-icon" />
                  <span>รีเซ็ตเพื่อตรวจใหม่</span>
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
                    อนุมัติคำขอ
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
