
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation, useOutletContext } from 'react-router-dom';
import { Handshake, CheckCircle2, Check, Lock } from 'lucide-react';

import ConfirmModal from '../components/ui/ConfirmModal';
import { cancelPostConfirmation } from '../components/ui/confirmPresets';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

import { claimService } from '../services/claimService';
import { api, apiRequest } from '../api';

import './PostDetail.css';

function PostDetail() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const locationState = useLocation();
  const { markClaimRead } = useOutletContext();

  const navPost = locationState?.state?.post;
  const claim = locationState?.state?.claim;
  const from = locationState.state?.from;
  const fromAccount = from === 'account';

  const backTo = fromAccount
    ? claim
      ? `/profile?claim=${claim.verify_id}`
      : '/account'
    : typeof from === 'string' && from.startsWith('/posts?')
      ? from
      : '/posts';

  const backText = fromAccount
    ? claim
      ? 'กลับไปหน้าคำขอของฉัน'
      : 'กลับไปหน้าประกาศของฉัน'
    : 'กลับไปรายการประกาศ';

  const [apiPost, setApiPost] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  // เก็บ index ของรูปที่กำลังแสดงเป็นรูปหลัก
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await apiRequest(`/posts/${postId}`);
        setApiPost(data.post);

        // เมื่อเปลี่ยนโพสต์ ให้กลับไปแสดงรูปแรก
        setSelectedImageIndex(0);
      } catch (err) {
        setError(err.message || 'โหลดรายละเอียดโพสต์ไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    api('/api/me')
      .then(setMe)
      .catch(() => setMe(null));
  }, [postId]);

  useEffect(() => {
    if (loading || !locationState.state?.readClaimOnOpen || !claim) return;

    navigate(locationState.pathname + locationState.search, {
      replace: true,
      state: { ...locationState.state, readClaimOnOpen: false },
    });

    if (
      error ||
      String(apiPost?.post_id) !== String(postId) ||
      String(claim.post_id) !== String(postId)
    ) {
      return;
    }

    markClaimRead(claim.verify_id).catch(() => {
      setToast({
        message: 'ไม่สามารถบันทึกว่าอ่านแล้วได้ กรุณาเปิดคำขออีกครั้ง',
        type: 'error',
      });
    });
  }, [
    loading,
    error,
    apiPost,
    postId,
    claim,
    locationState,
    markClaimRead,
    navigate,
  ]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleCancelPost = () =>
    setConfirmModal({
      ...cancelPostConfirmation,
      onConfirm: async () => {
        await apiRequest(`/posts/${postId}/cancel`, {
          method: 'PATCH',
        });

        setApiPost((prev) => ({
          ...prev,
          post_status: 'CANCELLED',
        }));

        showToast('ยกเลิกประกาศสำเร็จ!', 'success');
      },
    });

  const handleReceiverConfirm = () => {
    setConfirmModal({
      title: 'ยืนยันการรับสิ่งของ',
      description: 'คุณตรวจสอบและได้รับสิ่งของครบถ้วนแล้วใช่หรือไม่?',
      confirmText: 'ยืนยันการรับ',
      icon: CheckCircle2,
      onConfirm: async () => {
        const claimId = claim.id || claim.verify_id;
        const targetPostId = post.id || claim.post_id;

        const result = await claimService.confirmHandover(
          claimId,
          'receiver'
        );

        navigate('/account', {
          state: {
            successMessage: result?.postClosed
              ? 'ยืนยันได้รับของเรียบร้อยแล้ว การส่งมอบสำเร็จสมบูรณ์!'
              : 'ยืนยันได้รับของแล้ว กำลังรอผู้พบยืนยันการส่งมอบ',
            confirmedClaimId: claimId,
            closedPostId: result?.postClosed ? targetPostId : null,
          },
        });
      },
    });
  };

  if (loading) {
    return (
      <div className="postdetail-page">
        <div className="postdetail-container">
          กำลังโหลดรายละเอียดโพสต์...
        </div>
      </div>
    );
  }

  if (!apiPost) {
    return (
      <div className="postdetail-page">
        <div className="postdetail-container">
          <PageHeader
            backText={backText}
            onBack={() => navigate(backTo)}
            tag="POST"
            title="รายละเอียดโพสต์"
            subtitle={error || 'ไม่พบประกาศนี้'}
          />
        </div>
      </div>
    );
  }

  const isOwner =
    locationState?.state?.isOwner ||
    (me && Number(me.user_id) === Number(apiPost.user_id));

  const images = apiPost.images || [];

  const imageUrl = (img) =>
    `http://localhost:3000${img.item_image_url}`;

  // รูปที่ถูกเลือกอยู่ในขณะนี้
  const selectedImage = images[selectedImageIndex];

  const isDeposited = apiPost.custody_type === 'DEPOSITED';

  const post = {
    id: apiPost.post_id,
    post_id: apiPost.post_id,
    title: apiPost.title,
    type: apiPost.post_type === 'LOST' ? 'ของหาย' : 'พบของ',
    typeEn: apiPost.post_type,
    building: apiPost.building_name || '-',
    status: String(apiPost.post_status || 'OPEN')
      .trim()
      .toLowerCase(),
    date: formatDate(apiPost.created_at),
    description: apiPost.description,
    location: apiPost.building_name || '-',
    eventDate: formatDate(apiPost.event_date),

    finderName:
      navPost?.finderName ||
      navPost?.postOwner ||
      'นักศึกษา มจธ.',

    custodyType:
      apiPost.custody_type === 'DEPOSITED'
        ? 'ฝากไว้'
        : apiPost.custody_type === 'SELF_KEPT'
          ? 'ผู้พบเก็บไว้เอง'
          : 'ไม่มีข้อมูล',

    pickupDetail: apiPost.pickup_detail || '-',
    pickupName: apiPost.pickup_name || '-',
    pickupPhone: apiPost.pickup_phone || '-',
    openHours: apiPost.open_hours || '-',

    contact: apiPost.contact_text || '-',
    depositBuilding: apiPost.deposit_building_name,
    depositDetail: apiPost.deposit_detail,

    // เก็บรูปแรกไว้รองรับส่วนอื่นที่อาจใช้งาน
    imageUrl: images[0] ? imageUrl(images[0]) : null,
  };

  return (
    <div className="postdetail-page">
      <div className="postdetail-container">

        <PageHeader
          backText={backText}
          onBack={() => navigate(backTo)}
          tag={`POST / ${post.typeEn} / ${post.building}`}
          title={post.title}
          subtitle={`โพสต์เมื่อ ${post.date}`}
          status={
            isDeposited
              ? <StatusBadge status="closed" customText={`ฝากไว้แล้ว • ติดต่อรับที่ ${post.depositBuilding}`} />
              : <StatusBadge status={post.status} />
          }
        />

        <div className="postdetail-layout">

          <div className="postdetail-main">

            {/* IMAGE GALLERY */}
            <div className="postdetail-gallery">

              {/* รูปหลัก */}
              <div className="postdetail-main-image">
                {selectedImage ? (
                  <img
                    key={selectedImage.item_image_id}
                    src={imageUrl(selectedImage)}
                    alt={`${post.title} รูปที่ ${selectedImageIndex + 1}`}
                  />
                ) : (
                  <span>ไม่มีรูปภาพของสิ่งของ</span>
                )}
              </div>

              {/* รูปย่อยทั้งหมด */}
              {images.length > 1 && (
                <div className="postdetail-thumbnails">
                  {images.map((img, index) => (
                    <button
                      type="button"
                      className={`postdetail-thumb ${
                        selectedImageIndex === index
                          ? 'active'
                          : ''
                      }`}
                      key={img.item_image_id}
                      onClick={() => setSelectedImageIndex(index)}
                      aria-label={`ดูรูปที่ ${index + 1}`}
                    >
                      <img
                        src={imageUrl(img)}
                        alt={`${post.title} รูปที่ ${index + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* จำนวนรูป */}
              {images.length > 0 && (
                <div className="postdetail-image-counter">
                  รูปที่ {selectedImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            <Card className="postdetail-desc-card">
              <h2 className="postdetail-desc-title">
                {post.title}
              </h2>

              <p className="postdetail-desc-text">
                {post.description}
              </p>

              <div className="postdetail-desc-meta">
                <span>สถานที่พบ: {post.location}</span>
                <span className="postdetail-meta-sep">|</span>
                <span>วันที่: {post.eventDate}</span>
              </div>
            </Card>
          </div>

          <div className="postdetail-sidebar">
            <Card className="postdetail-sidebar-card">

              <h2 className="custody-title">
                ข้อมูลการรับของ
              </h2>

              <div className="custody-info-list">
                <div className="custody-info-row">
                  <span className="custody-label">ผู้พบ:</span>
                  <span className="custody-value">
                    {post.finderName}
                  </span>
                </div>

                <div className="custody-info-row">
                  <span className="custody-label">
                    สถานะการเก็บ:
                  </span>
                  <span className="custody-value">
                    {post.custodyType}
                  </span>
                </div>

                {isDeposited && (
                  <>
                    <div className="custody-info-row">
                      <span className="custody-label">สถานที่ฝาก:</span>
                      <span className="custody-value">
                        {post.depositBuilding}
                      </span>
                    </div>

                    {post.depositDetail && (
                      <div className="custody-info-row">
                        <span className="custody-label">รายละเอียดที่รับฝาก:</span>
                        <span className="custody-value">
                          {post.depositDetail}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {isDeposited && (
                <>
                  <hr className="custody-divider" />

                  <h3 className="custody-title">
                    ข้อมูลจุดรับของ
                  </h3>

                  <div className="custody-info-list">
                    <div className="custody-info-row">
                      <span className="custody-label">
                        จุดรับของ:
                      </span>
                      <span className="custody-value">
                        {post.pickupDetail}
                      </span>
                    </div>

                    <div className="custody-info-row">
                      <span className="custody-label">
                        ผู้ดูแลจุดรับ:
                      </span>
                      <span className="custody-value">
                        {post.pickupName}
                      </span>
                    </div>

                    <div className="custody-info-row">
                      <span className="custody-label">
                        เบอร์โทร:
                      </span>
                      <span className="custody-value">
                        {post.pickupPhone}
                      </span>
                    </div>

                    <div className="custody-info-row">
                      <span className="custody-label">
                        เวลาทำการ:
                      </span>
                      <span className="custody-value">
                        {post.openHours}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <hr className="custody-divider" />

              <div className="custody-contact-block">
                <span className="custody-label">
                  ช่องทางติดต่อ
                </span>
                <div className="custody-phone">
                  {post.contact}
                </div>
              </div>

              {isOwner ? (
                <div className="postdetail-owner-actions">

                  <button
                    type="button"
                    className="btn-claim"
                    onClick={() =>
                      navigate(`/posts/${postId}/review`, {
                        state: {
                          postId,
                          post,
                          from: 'detail',
                        },
                      })
                    }
                  >
                    ตรวจคำขอตรวจสอบสิทธิ์
                  </button>

                  <button
                    type="button"
                    className="btn-claim btn-claim-secondary"
                    onClick={() =>
                      navigate(`/posts/${postId}/edit`, {
                        state: {
                          post,
                          from: 'account',
                        },
                      })
                    }
                  >
                    แก้ไขประกาศ
                  </button>

                  {post.status === 'open' && (
                    <button
                      type="button"
                      className="btn-claim btn-claim-secondary"
                      onClick={handleCancelPost}
                    >
                      ยกเลิกประกาศ
                    </button>
                  )}

                  {error && (
                    <p style={{ color: 'red' }}>{error}</p>
                  )}
                </div>
              ) : claim ? (

                claim.status === 'ACCEPTED' ||
                claim.status === 'COMPLETED' ? (

                  <div className="review-handover-box postdetail-handover-card">
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

                      <span
                        className={`review-handover-badge ${
                          claim.status === 'COMPLETED' ||
                          claim.receiverConfirmed
                            ? 'is-completed'
                            : ''
                        }`}
                      >
                        {claim.status === 'COMPLETED' ||
                        claim.receiverConfirmed
                          ? 'ส่งมอบสำเร็จ'
                          : 'รอทั้ง 2 ฝ่ายยืนยัน'}
                      </span>
                    </div>

                    <p className="review-handover-sub">
                      เมื่อทั้งผู้พบและผู้รับยืนยันการส่งมอบแล้ว ระบบจะปิดประกาศอัตโนมัติ
                    </p>

                    {claim.ownerNote && (
                      <div className="receiver-handover-note">
                        <strong>
                          สถานที่ / ข้อมูลนัดรับจากผู้พบ:
                        </strong>
                        <p>{claim.ownerNote}</p>
                      </div>
                    )}

                    <div className="review-handover-steps-grid">

                      <div className="handover-step-card is-done">
                        <div className="handover-step-header">
                          <span className="step-num">
                            <Check size={14} />
                          </span>

                          <span
                            className="step-label"
                            title={`ฝ่ายผู้พบ (${post.finderName})`}
                          >
                            ฝ่ายผู้พบ ({post.finderName})
                          </span>
                        </div>

                        <p className="step-status-text">
                          อนุมัติคำขอแล้ว
                        </p>

                        <span className="handover-confirmed-tag">
                          <CheckCircle2 size={13} />
                          <span>อนุมัติแล้ว</span>
                        </span>
                      </div>

                      <div
                        className={`handover-step-card ${
                          claim.status === 'COMPLETED' ||
                          claim.receiverConfirmed
                            ? 'is-done'
                            : ''
                        }`}
                      >
                        <div className="handover-step-header">
                          <span className="step-num">
                            {claim.status === 'COMPLETED' ||
                            claim.receiverConfirmed ? (
                              <Check size={14} />
                            ) : (
                              '2'
                            )}
                          </span>

                          <span className="step-label">
                            ฝ่ายผู้รับ (คุณ)
                          </span>
                        </div>

                        <p className="step-status-text">
                          {claim.status === 'COMPLETED' ||
                          claim.receiverConfirmed
                            ? 'ยืนยันได้รับของแล้ว'
                            : 'รอยืนยันการรับสิ่งของ'}
                        </p>

                        {claim.status !== 'COMPLETED' &&
                        !claim.receiverConfirmed ? (
                          <Button
                            variant="primary"
                            size="sm"
                            className="btn-handover-action"
                            onClick={handleReceiverConfirm}
                          >
                            ยืนยันการรับมอบ
                          </Button>
                        ) : (
                          <span className="handover-confirmed-tag">
                            <CheckCircle2 size={13} />
                            <span>ยืนยันแล้ว</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {claim.status !== 'COMPLETED' &&
                      !claim.receiverConfirmed && (
                        <p className="receiver-confirm-warning">
                          * เมื่อกดยืนยันแล้ว การส่งมอบจะเสร็จสิ้นสมบูรณ์
                          และโพสต์จะปิดโดยอัตโนมัติ
                        </p>
                      )}
                  </div>

                ) : (

                  <div className="postdetail-claim-status-block">
                    <div className="claim-status-header">
                      <span className="claim-status-label">
                        สถานะคำขอของคุณ:
                      </span>

                      {claim.status === 'PENDING' && (
                        <Badge variant="pending">
                          PENDING · รอตรวจ
                        </Badge>
                      )}

                      {claim.status === 'REJECTED' && (
                        <Badge variant="danger">
                          REJECTED · ปฏิเสธ
                        </Badge>
                      )}

                      {claim.status === 'CANCELLED' && (
                        <Badge variant="neutral">
                          CANCELLED · ยกเลิก
                        </Badge>
                      )}
                    </div>

                    <div className="claim-status-body">
                      {claim.status === 'PENDING' && (
                        <div className="claim-pending-box">
                          <p className="claim-status-desc">
                            คำขอของคุณอยู่ระหว่างรอผู้พบตรวจสอบ
                            ความถูกต้องของหลักฐาน
                          </p>

                          <p className="claim-pending-hint">
                            ⏳{' '}
                            <em>
                              ปุ่มยืนยันรับของจะแสดงหลังจากผู้พบ
                              อนุมัติคำขอของคุณแล้วเท่านั้น
                            </em>
                          </p>
                        </div>
                      )}

                      {claim.status === 'REJECTED' && (
                        <div className="claim-rejected-box">
                          <p className="claim-status-desc">
                            ผู้พบได้ปฏิเสธคำขอนี้
                          </p>

                          {claim.ownerNote && (
                            <div className="claim-owner-note">
                              <strong>เหตุผล:</strong>
                              <p>{claim.ownerNote}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {claim.status === 'CANCELLED' && (
                        <p className="claim-status-desc">
                          คำขอนี้หรือโพสต์ถูกยกเลิกแล้ว
                        </p>
                      )}
                    </div>
                  </div>
                )

              ) : (

                post.status === 'cancelled' ? (
                  <p className="postdetail-closed-desc">
                    ประกาศนี้ถูกยกเลิกแล้ว ไม่สามารถดำเนินการต่อได้
                  </p>
                ) : post.status === 'closed' ||
                  post.status === 'completed' ? (

                  <div className="postdetail-closed-box">
                    <div className="postdetail-closed-badge">
                      <Lock size={15} />
                      <span>ปิดรับคำขอแล้ว</span>
                    </div>

                    <p className="postdetail-closed-desc">
                      สิ่งของนี้ได้รับการส่งมอบคืนเจ้าของเรียบร้อยแล้ว
                      ขอขอบคุณทุกท่านที่ช่วยเหลือครับ
                    </p>
                  </div>
                ) : isDeposited ? (
                  <div className="postdetail-closed-box">
                    <div className="postdetail-closed-badge">
                      <Lock size={15} />
                      <span>ปิดรับคำขอ · ฝากไว้แล้ว</span>
                    </div>
                    <p className="postdetail-closed-desc">
                      สิ่งของนี้ฝากไว้ที่ {post.depositBuilding}
                      หากเป็นของคุณ ติดต่อรับได้ที่จุดฝากโดยตรง
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-claim"
                      onClick={() =>
                        navigate(`/posts/${postId}/claim`, {
                          state: { post },
                        })
                      }
                    >
                      {post.typeEn === 'LOST'
                        ? 'นี่อาจเป็นของคุณ'
                        : 'นี่อาจเป็นของฉัน'}
                    </button>

                    <div className="custody-helper-text">
                      <p>หากเป็นสิ่งของของคุณส่งคำขอ</p>
                      <p>พร้อมรายละเอียดเฉพาะเพื่อยืนยัน</p>
                    </div>
                  </>
                )
              )}

            </Card>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '14px 20px',
            borderRadius: '12px',
            color: '#fff',
            background:
              toast.type === 'error' ? '#dc2626' : '#16a34a',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            maxWidth: 'min(90vw, 420px)',
          }}
        >
          {toast.message}
        </div>
      )}

      {confirmModal && (
        <ConfirmModal
          {...confirmModal}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

export default PostDetail;
