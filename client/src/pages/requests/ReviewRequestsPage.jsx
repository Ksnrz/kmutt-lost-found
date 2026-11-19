import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Handshake,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Ban,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Thumbnail from '../../components/ui/Thumbnail';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { claimService } from '../../services/claimService';
import { apiRequest } from '../../api';
import './ReviewRequestsPage.css';

// only our own uploads are shown as images/links (never an arbitrary URL from a claim)
const evidenceUrls = (claim) =>
  (claim?.evidences || []).filter((u) => typeof u === 'string' && u.startsWith('/uploads/'));

/**
 * ReviewRequestsPage Component — หน้าตรวจคำขอที่ส่งมายังประกาศของฉัน (RECEIVED REQUESTS)
 * Route URL: /posts/:postId/review
 */
export default function ReviewRequestsPage() {
  const navigate = useNavigate();
  const { postId: targetPostId } = useParams();
  const location = useLocation();

  // State 1: โพสต์ประกาศหลัก (ชื่อ + post_status 'OPEN' | 'CLOSED' | 'CANCELLED') โหลดจาก server
  const [post, setPost] = useState(null);
  const postStatus = post?.post_status;
  const setPostStatus = (post_status) => setPost((prev) => ({ ...prev, post_status }));

  // State 2: รายการคำขอทั้งหมด
  const [requests, setRequests] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const [requestsStatus, setRequestsStatus] = useState(null);

  // State 3: รหัสคำขอที่กำลังเลือกดูรายละเอียดอยู่
  const [selectedId, setSelectedId] = useState(null);

  // State 4: ข้อความในช่อง "หมายเหตุสำหรับผู้ส่ง"
  const [noteText, setNoteText] = useState('');

  // เชื่อมต่อ State กลางและรับข้อมูลแบบ Real-time จาก claimService
  useEffect(() => {
    let isMounted = true;
    apiRequest(`/posts/${targetPostId}`)
      .then((data) => isMounted && setPost(data.post))
      .catch(() => {});
    claimService.getClaimsByPost(targetPostId).then((data) => {
      if (isMounted && data) {
        setRequests(data);
        setRequestsStatus({ postId: targetPostId });
        if (data[0]?.id || data[0]?.verify_id) {
          setSelectedId(String(data[0].id || data[0].verify_id));
        }
      }
    }).catch((err) => {
      if (isMounted) setRequestsStatus({
        postId: targetPostId,
        error: err.message || 'ไม่สามารถโหลดคำขอได้',
      });
    });

    // ซิงก์ข้อมูลทันทีเมื่อมีการส่งคำขอใหม่จากหน้า 6 หรือมีการอัปเดตจากหน้าอื่น
    const unsubscribe = claimService.subscribe((updatedClaims) => {
      if (!isMounted || !Array.isArray(updatedClaims)) return;
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
  const hasRequests = requests.length > 0;
  const currentRequestsStatus = requestsStatus?.postId === targetPostId ? requestsStatus : null;

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
  const handleReject = () => {
    if (!activeRequest) return;

    setConfirmation({
      title: 'ยืนยันการปฏิเสธคำขอ',
      description: `ต้องการปฏิเสธคำขอ #${activeRequest.id} ใช่หรือไม่?`,
      confirmText: 'ปฏิเสธคำขอ',
      icon: XCircle,
      onConfirm: async () => {
        await claimService.updateClaimStatus(activeRequest.id, 'REJECTED', noteText);
        setNoteText('');
      },
    });
  };

  // 3. ฝ่ายผู้พบ (คุณ) กดยืนยันการส่งมอบ (Dual Confirmation)
  const handleConfirmFinder = async (id) => {
    const result = await run(() => claimService.confirmHandover(id, 'finder'));
    if (result?.postClosed) {
      setPostStatus('CLOSED');
    }
  };

  // 4. ส่งมอบไม่สำเร็จ ➔ ยกเลิกการตอบรับ (CANCELLED) เพื่อให้กลับไปเลือกคำขออื่นที่รออยู่ได้
  const handleCancelAccepted = (id) => setConfirmation({
    title: 'ยืนยันการยกเลิกการส่งมอบ',
    description: 'ต้องการยกเลิกการส่งมอบใช่หรือไม่? คำขอนี้จะกลับไปอยู่ในสถานะรอตรวจ และคุณสามารถเลือกคำขออื่นได้',
    confirmText: 'ยืนยันการยกเลิก',
    icon: XCircle,
    onConfirm: () => claimService.updateClaimStatus(id, 'PENDING', 'ยกเลิกการตอบรับเนื่องจากส่งมอบไม่สำเร็จ'),
  });

  const fromReceivedRequests = ['/requests/review', '/account'].includes(location.state?.from);

  const handleGoBack = () => {
    if (fromReceivedRequests) {
      navigate('/requests/review');
    } else {
      navigate(`/posts/${targetPostId}`);
    }
  };

  return (
    <div className="review-requests-container">
      {/* ส่วนหัวหน้าเว็บ */}
      <PageHeader
        tag="RECEIVED REQUESTS"
        title="คำขอที่ส่งมายังประกาศของฉัน"
        subtitle="ตรวจหลักฐานและยืนยันการส่งมอบสิ่งของคืนเจ้าของ"
        backText={fromReceivedRequests ? 'กลับไปหน้ารออนุมัติ' : 'กลับไปหน้ารายละเอียดโพสต์'}
        onBack={handleGoBack}
      />
      {confirmation && <ConfirmModal {...confirmation} onClose={() => setConfirmation(null)} />}

      {/* แบนเนอร์แสดงสถานะโพสต์ */}
      <div className="review-post-banner">
        <div className="review-post-banner-info">
          <span className="review-post-banner-label">โพสต์ที่จัดการ:</span>
          <strong className="review-post-banner-title">
            {post?.title ?? '...'} (#{targetPostId})
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
        </div>
      </div>

      {/* เลย์เอาต์แบ่ง 2 คอลัมน์ตาม Figma */}
      {!currentRequestsStatus && <p role="status">กำลังโหลดคำขอ…</p>}
      {currentRequestsStatus?.error && <p role="alert">{currentRequestsStatus.error}</p>}
      {currentRequestsStatus && !currentRequestsStatus.error && (
      <div className={`review-requests-grid${hasRequests ? '' : ' is-empty'}`}>
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
            {!hasRequests && <EmptyState title="ยังไม่มีคำขอสำหรับประกาศนี้" />}
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
                  <Thumbnail text="ไม่มีรูป" src={evidenceUrls(item)[0]} />

                  <div className="review-item-info">
                    <h3 className="review-item-title">
                      {item.itemTitle} · #{item.id}
                    </h3>
                    <p className="review-item-meta">
                      โดย {item.requester} ·{' '}
                      {new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
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
              {evidenceUrls(activeRequest).map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="review-evidence-box">
                  <img src={url} alt="รูปหลักฐาน" />
                </a>
              ))}
              {evidenceUrls(activeRequest).length === 0 && (
                <div className="review-evidence-box">
                  <EmptyState compact as="p" title="ไม่มีรูปหลักฐาน" />
                </div>
              )}
            </div>

            {/* ========================================================
                กฎข้อที่ 1: แจ้งเตือนหากมีคำขออื่นตอบรับอยู่แล้ว
                ======================================================== */}
            {isOtherAccepted && activeRequest.status === 'PENDING' && (
              <div className="review-status-alert is-blocked">
                <AlertTriangle size={18} className="review-alert-icon" />
                <div>มีคำขอที่ได้รับการอนุมัติแล้ว</div>
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
                  เมื่อทั้งผู้พบและผู้รับยืนยันการส่งมอบแล้ว ระบบจะปิดประกาศอัตโนมัติ
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
                  <Button
                    variant="secondary"
                    className="review-cancel-handover"
                    onClick={() => handleCancelAccepted(activeRequest.id)}
                  >
                    <XCircle size={18} aria-hidden="true" />
                    ยกเลิกการส่งมอบ
                  </Button>
                </div>
              </div>
            )}

            {/* แสดงสถานะเมื่อส่งมอบสำเร็จ (COMPLETED) */}
            {activeRequest.status === 'COMPLETED' && (
              <div className="review-status-alert is-completed">
                <CheckCircle2 size={20} className="review-alert-icon" />
                <div>
                   <strong>ส่งมอบสำเร็จแล้ว ระบบปิดประกาศเรียบร้อย</strong>
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
            {activeRequest.status === 'PENDING' && (
              <div className="review-detail-actions">
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
              </div>
            )}
          </Card>
        ) : hasRequests ? (
          <Card className="review-detail-card">
            <p>กรุณาเลือกคำขอที่ต้องการตรวจสอบ</p>
          </Card>
        ) : null}
      </div>
      )}
    </div>
  );
}
