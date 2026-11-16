
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
 * ReviewRequestsPage Component — หน้าตรวจคำขอที่ส่งมายังประกาศของฉัน
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

  const [postStatus, setPostStatus] = useState('OPEN');
  const [requests, setRequests] = useState(initialRequests);
  const [selectedId, setSelectedId] = useState(null);
  const [noteText, setNoteText] = useState('');

  // State สำหรับ Toast และ Confirmation Modal
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

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

    const unsubscribe = claimService.subscribe((updatedClaims) => {
      const forPost = updatedClaims.filter(
        (c) =>
          String(c.post_id) === String(targetPostId) ||
          String(c.postId) === String(targetPostId)
      );

      if (forPost.length > 0) {
        setRequests(forPost);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [targetPostId]);

  // ซ่อน Toast อัตโนมัติหลัง 3 วินาที
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  // แสดง Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // เปิด Confirmation Modal
  const askConfirm = ({
    title,
    message,
    confirmText = 'ยืนยัน',
    onConfirm,
  }) => {
    setConfirmModal({
      title,
      message,
      confirmText,
      onConfirm,
    });
  };

  // ยืนยันการทำรายการจาก Modal
  const handleConfirm = async () => {
    if (!confirmModal?.onConfirm) return;

    const onConfirm = confirmModal.onConfirm;
    setConfirmModal(null);

    await onConfirm();
  };

  // เรียก API แล้วแจ้ง error ผ่าน Toast
  const run = async (fn) => {
    try {
      return (await fn()) ?? true;
    } catch (err) {
      showToast(
        err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่',
        'error'
      );
      return false;
    }
  };

  // ค้นหาข้อมูลคำขอที่กำลังถูกเลือก
  const activeRequest =
    requests.find((r) => String(r.id) === String(selectedId)) ||
    requests[0];

  // ค้นหาว่ามีคำขออื่นในโพสต์นี้ที่ได้รับการ ACCEPTED อยู่แล้วหรือไม่
  const acceptedClaim = requests.find((r) => r.status === 'ACCEPTED');
  const isOtherAccepted =
    acceptedClaim && acceptedClaim.id !== activeRequest?.id;

  // จำนวนรายการที่ยังรอตรวจ
  const pendingCount = requests.filter(
    (r) => r.status === 'PENDING'
  ).length;

  // 1. ตอบรับคำขอ
  const handleAccept = async () => {
    if (!activeRequest || isOtherAccepted) return;

    const finalNote =
      noteText.trim() ||
      'อนุมัติคำขอแล้ว กรุณานัดหมายวันเวลาและสถานที่รับมอบสิ่งของ';

    if (
      await run(() =>
        claimService.updateClaimStatus(
          activeRequest.id,
          'ACCEPTED',
          finalNote
        )
      )
    ) {
      setNoteText('');
      showToast('อนุมัติคำขอเรียบร้อยแล้ว');
    }
  };

  // 2. ปฏิเสธคำขอ
  const handleReject = () => {
    if (!activeRequest) return;

    askConfirm({
      title: 'ยืนยันการปฏิเสธคำขอ',
      message: `คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอ #${activeRequest.id}?`,
      confirmText: 'ปฏิเสธคำขอ',
      onConfirm: async () => {
        if (
          await run(() =>
            claimService.updateClaimStatus(
              activeRequest.id,
              'REJECTED',
              noteText
            )
          )
        ) {
          setNoteText('');
          showToast('ปฏิเสธคำขอเรียบร้อยแล้ว');
        }
      },
    });
  };

  // 3. ฝ่ายผู้พบกดยืนยันการส่งมอบ
  const handleConfirmFinder = async (id) => {
    const result = await run(() =>
      claimService.confirmHandover(id, 'finder')
    );

    if (result?.postClosed) {
      setPostStatus('CLOSED');
    }

    if (result) {
      showToast(
        result?.postClosed
          ? 'ยืนยันการส่งมอบครบแล้ว โพสต์ถูกปิดเรียบร้อย'
          : 'ยืนยันการส่งมอบเรียบร้อยแล้ว'
      );
    }
  };

  // 4. ส่งมอบไม่สำเร็จ: ยกเลิกการตอบรับ
  const handleCancelAccepted = (id) => {
    askConfirm({
      title: 'ยืนยันการยกเลิกการตอบรับ',
      message:
        'ต้องการยกเลิกการตอบรับคำขอนี้ใช่หรือไม่? ระบบจะเปิดให้คุณสามารถเลือกคำขออื่นที่ยังรออยู่ได้',
      confirmText: 'ยกเลิกการตอบรับ',
      onConfirm: async () => {
        if (
          await run(() =>
            claimService.updateClaimStatus(
              id,
              'PENDING',
              'ยกเลิกการตอบรับเนื่องจากส่งมอบไม่สำเร็จ'
            )
          )
        ) {
          showToast('ยกเลิกการตอบรับเรียบร้อยแล้ว');
        }
      },
    });
  };

  // 5. รีเซ็ตสถานะกลับมาเป็น PENDING
  const handleResetStatus = async (id) => {
    if (
      await run(() =>
        claimService.updateClaimStatus(id, 'PENDING', '')
      )
    ) {
      setPostStatus('OPEN');
      showToast('รีเซ็ตสถานะเรียบร้อยแล้ว');
    }
  };

  // 6. รีเซ็ตทั้งหมดทั้งโพสต์กลับสู่ค่าเริ่มต้น
  const handleResetAll = () => {
    setPostStatus('OPEN');
    const resetData = claimService.resetAll();
    setRequests(resetData);
    setNoteText('');
    showToast('รีเซ็ตข้อมูลการทดสอบเรียบร้อยแล้ว');
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
      <PageHeader
        tag="RECEIVED REQUESTS"
        title="คำขอที่ส่งมายังประกาศของฉัน"
        subtitle="ตรวจหลักฐานและยืนยันการส่งมอบสิ่งของคืนเจ้าของตามกฎระบบ"
        backText={
          location.state?.from === 'detail'
            ? 'กลับไปหน้ารายละเอียดโพสต์'
            : 'กลับไปหน้าประกาศของฉัน'
        }
        onBack={handleGoBack}
      />

      {/* แบนเนอร์แสดงสถานะโพสต์ */}
      <div className="review-post-banner">
        <div className="review-post-banner-info">
          <span className="review-post-banner-label">
            โพสต์ที่จัดการ:
          </span>
          <strong className="review-post-banner-title">
            {location.state?.post?.title ||
              activeRequest?.itemTitle ||
              'พบกระเป๋าสตางค์สีดำ'}{' '}
            (#{targetPostId})
          </strong>
        </div>

        <div className="review-post-banner-right">
          <div className="review-post-banner-status">
            <span className="review-post-banner-label">
              สถานะโพสต์:
            </span>

            {postStatus === 'OPEN' && (
              <Badge variant="success">
                OPEN · กำลังเปิดรับคำขอ
              </Badge>
            )}

            {postStatus === 'CLOSED' && (
              <Badge variant="completed">
                CLOSED · ส่งมอบสำเร็จแล้ว
              </Badge>
            )}

            {postStatus === 'CANCELLED' && (
              <Badge variant="danger">
                CANCELLED · ยกเลิกโพสต์
              </Badge>
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

      {/* เลย์เอาต์แบ่ง 2 คอลัมน์ */}
      <div className="review-requests-grid">
        {/* คอลัมน์ซ้าย: รายการคำขอ */}
        <Card className="review-list-card">
          <div className="review-list-header">
            <h2 className="review-list-title">คำขอที่ได้รับ</h2>
            <Badge variant="count">
              {pendingCount} รายการรอตรวจ
            </Badge>
          </div>

          <div className="review-items-list">
            {requests.map((item) => {
              const isSelected =
                String(item.id) === String(activeRequest?.id);

              return (
                <div
                  key={item.id}
                  className={`review-item-card ${
                    isSelected ? 'is-selected' : ''
                  }`}
                  onClick={() => setSelectedId(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSelectedId(item.id);
                    }
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
                        <Badge variant="success">
                          ACCEPTED · ตอบรับแล้ว
                        </Badge>
                      )}

                      {item.status === 'REJECTED' && (
                        <Badge variant="danger">
                          REJECTED · ปฏิเสธ
                        </Badge>
                      )}

                      {item.status === 'CANCELLED' && (
                        <Badge variant="neutral">
                          CANCELLED · ยกเลิก
                        </Badge>
                      )}

                      {item.status === 'COMPLETED' && (
                        <Badge variant="completed">
                          COMPLETED · ส่งมอบสำเร็จ
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* คอลัมน์ขวา: รายละเอียดคำขอ */}
        {activeRequest ? (
          <Card className="review-detail-card">
            <h2 className="review-detail-title">
              รายละเอียดคำขอ #{activeRequest.id}
            </h2>

            <p className="review-detail-description">
              <span className="review-description-label">
                คำอธิบาย:{' '}
              </span>
              {activeRequest.description}
            </p>

            <div className="review-evidences-row">
              {(activeRequest.evidences || []).map(
                (evText, idx) => (
                  <div
                    key={idx}
                    className="review-evidence-box"
                  >
                    {evText}
                  </div>
                )
              )}
            </div>

            {/* แจ้งเตือนหากมีคำขออื่นตอบรับอยู่แล้ว */}
            {isOtherAccepted &&
              activeRequest.status === 'PENDING' && (
                <div className="review-status-alert is-blocked">
                  <AlertTriangle
                    size={18}
                    className="review-alert-icon"
                  />
                  <div>
                    มีคำขอ{' '}
                    <strong>
                      #{acceptedClaim.id} ({acceptedClaim.requester})
                    </strong>{' '}
                    ได้รับการตอบรับอยู่แล้ว — ระบบจำกัดตอบรับได้เพียง
                    1 คนต่อโพสต์ในเวลาเดียวกัน
                  </div>
                </div>
              )}

            {/* ขั้นตอนการส่งมอบ */}
            {activeRequest.status === 'ACCEPTED' && (
              <div className="review-handover-box">
                <div className="review-handover-header">
                  <div className="review-handover-title-wrap">
                    <Handshake
                      size={20}
                      className="review-handover-icon"
                    />
                    <strong>
                      ขั้นตอนการส่งมอบสิ่งของ (Dual Confirmation)
                    </strong>
                  </div>
                  <span className="review-handover-badge">
                    รอทั้ง 2 ฝ่ายยืนยัน
                  </span>
                </div>

                <p className="review-handover-sub">
                  ตามกฎระบบ: ทั้งผู้พบและผู้รับต้องยืนยันการส่งมอบ
                  เมื่อยืนยันครบ โพสต์จะเปลี่ยนเป็น{' '}
                  <strong>CLOSED</strong> และคำขออื่นที่ค้างอยู่จะถูก
                  ยกเลิกอัตโนมัติ
                </p>

                <div className="review-handover-steps-grid">
                  {/* ฝ่ายที่ 1: ผู้พบ */}
                  <div
                    className={`handover-step-card ${
                      activeRequest.finderConfirmed ? 'is-done' : ''
                    }`}
                  >
                    <div className="handover-step-header">
                      <span className="step-num">
                        {activeRequest.finderConfirmed ? (
                          <Check size={14} />
                        ) : (
                          '1'
                        )}
                      </span>
                      <span className="step-label">
                        ฝ่ายผู้พบ (คุณ)
                      </span>
                    </div>

                    <p className="step-status-text">
                      {activeRequest.finderConfirmed
                        ? 'ยืนยันการส่งมอบแล้ว'
                        : 'รอยืนยันการส่งของ'}
                    </p>

                    {!activeRequest.finderConfirmed ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          handleConfirmFinder(activeRequest.id)
                        }
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

                  {/* ฝ่ายที่ 2: ผู้รับ */}
                  <div
                    className={`handover-step-card ${
                      activeRequest.receiverConfirmed
                        ? 'is-done'
                        : ''
                    }`}
                  >
                    <div className="handover-step-header">
                      <span className="step-num">
                        {activeRequest.receiverConfirmed ? (
                          <Check size={14} />
                        ) : (
                          '2'
                        )}
                      </span>
                      <span className="step-label">
                        ฝ่ายผู้รับ ({activeRequest.requester})
                      </span>
                    </div>

                    <p className="step-status-text">
                      {activeRequest.receiverConfirmed
                        ? 'ยืนยันได้รับของแล้ว'
                        : 'รอผู้รับยืนยัน'}
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

                {/* ยกเลิกการตอบรับ */}
                <div className="review-handover-cancel-row">
                  <button
                    type="button"
                    className="review-cancel-link"
                    onClick={() =>
                      handleCancelAccepted(activeRequest.id)
                    }
                  >
                    <XCircle
                      size={14}
                      className="review-cancel-icon"
                    />
                    <span>
                      ส่งมอบไม่สำเร็จ? ยกเลิกการตอบรับเพื่อกลับไปเลือก
                      คำขออื่นที่รออยู่
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* สถานะ COMPLETED */}
            {activeRequest.status === 'COMPLETED' && (
              <div className="review-status-alert is-completed">
                <CheckCircle2
                  size={20}
                  className="review-alert-icon"
                />
                <div>
                  <strong>ส่งมอบสำเร็จเรียบร้อยแล้ว!</strong>{' '}
                  ทั้งสองฝ่ายยืนยันครบถ้วน โพสต์ประกาศถูกเปลี่ยนเป็น{' '}
                  <strong>CLOSED</strong> และคำขออื่นที่ค้างอยู่ถูก
                  ยกเลิกแล้ว
                </div>
              </div>
            )}

            {/* สถานะ REJECTED */}
            {activeRequest.status === 'REJECTED' && (
              <div className="review-status-alert is-rejected">
                <XCircle
                  size={18}
                  className="review-alert-icon"
                />
                <span>คำขอนี้ถูกปฏิเสธแล้ว</span>
              </div>
            )}

            {/* สถานะ CANCELLED */}
            {activeRequest.status === 'CANCELLED' && (
              <div className="review-status-alert is-cancelled">
                <Ban
                  size={18}
                  className="review-alert-icon"
                />
                <span>คำขอนี้ถูกยกเลิกแล้ว</span>
              </div>
            )}

            {/* ช่องกรอกหมายเหตุ */}
            <div className="review-note-section">
              <label
                htmlFor="reviewNoteInput"
                className="review-note-title"
              >
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

            {/* ปุ่มปฏิเสธ / อนุมัติคำขอ */}
            <div className="review-detail-actions">
              {activeRequest.status === 'ACCEPTED' && (
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() =>
                    handleResetStatus(activeRequest.id)
                  }
                >
                  <RotateCcw
                    size={13}
                    className="review-btn-icon"
                  />
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
                    title={
                      isOtherAccepted
                        ? 'ไม่สามารถตอบรับได้ เนื่องจากมีคำขออื่นได้รับการตอบรับอยู่แล้ว'
                        : ''
                    }
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

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 10000,
            padding: '14px 20px',
            borderRadius: '10px',
            backgroundColor:
              toast.type === 'error' ? '#dc2626' : '#16a34a',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmModal(null);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-confirm-title"
            aria-describedby="review-confirm-message"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '24px',
              borderRadius: '14px',
              backgroundColor: '#ffffff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <h2
              id="review-confirm-title"
              style={{
                margin: '0 0 12px',
                fontSize: '20px',
                color: '#1f2937',
              }}
            >
              {confirmModal.title}
            </h2>

            <p
              id="review-confirm-message"
              style={{
                margin: '0 0 24px',
                color: '#4b5563',
                lineHeight: 1.6,
              }}
            >
              {confirmModal.message}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
