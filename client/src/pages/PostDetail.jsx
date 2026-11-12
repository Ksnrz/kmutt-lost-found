import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Handshake, CheckCircle2, Check, Lock } from 'lucide-react';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { claimService } from '../services/claimService';
import './PostDetail.css';

function PostDetail() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const locationState = useLocation();
  const navPost = locationState?.state?.post;
  const claim = locationState?.state?.claim;
  const isOwner = locationState?.state?.isOwner;

  // ข้อมูลโพสต์เริ่มต้น (ตรงตามรูปภาพต้นแบบ หรือดึงจาก state หากมีส่งต่อมา)
  const post = {
    id: postId || navPost?.id || '1',
    title: navPost?.title || (navPost?.itemTitle ? navPost.itemTitle.replace(/^ขอรับ/, 'พบ') : 'พบกระเป๋าสตางค์สีดำ'),
    type: navPost?.type || (navPost?.post_type?.includes('LOST') ? 'ของหาย' : 'พบของ'),
    typeEn: navPost?.typeEn || (navPost?.post_type?.includes('LOST') ? 'LOST' : 'FOUND'),
    building: navPost?.building || 'S4',
    status: navPost?.status?.toLowerCase() || 'open',
    date: navPost?.date || '23 ก.ย. 2026',
    description: navPost?.description || 'กระเป๋าสตางค์สีดำขนาดเล็ก พบวางอยู่บริเวณชั้น 1 ของอาคาร S4',
    location: navPost?.location || navPost?.building_name || 'อาคาร S4 ชั้น 1',
    eventDate: navPost?.eventDate || navPost?.date || '23 ก.ย. 2026',
    finderName: navPost?.finderName || navPost?.postOwner || 'นักศึกษา มจธ.',
    custodyType: navPost?.custodyType || navPost?.custody_type || 'ผู้พบเก็บไว้เอง',
    contact: navPost?.contact || '08X-XXX-XXXX',
    imageUrl: navPost?.imageUrl || null,
  };

  return (
    <div className="postdetail-page">
      <div className="postdetail-container">
        {/* 1. ปุ่มย้อนกลับ */}
        <div className="postdetail-back-row">
          <BackButton
            text={locationState?.state?.from === 'account' ? 'กลับไปหน้าประกาศของฉัน' : 'กลับไปรายการประกาศ'}
            onClick={() => {
              if (locationState?.state?.from === 'account') {
                navigate('/account');
              } else {
                navigate('/posts');
              }
            }}
          />
        </div>

        {/* 2. Header: Breadcrumb/Tag + Title + StatusBadge (ฝั่งซ้าย) และ วันที่โพสต์ (ฝั่งขวา) */}
        <div className="postdetail-header-row">
          <div className="postdetail-header-left">
            <div className="postdetail-tag">
              POST / {post.typeEn} / {post.building}
            </div>
            <h1 className="postdetail-title">{post.title}</h1>
            <div className="postdetail-badge-wrap">
              <StatusBadge status={post.status} />
            </div>
          </div>

          <div className="postdetail-header-right">
            <span className="postdetail-date-text">
              โพสต์เมื่อ {post.date}
            </span>
          </div>
        </div>

        {/* 3. Main Layout: ฝั่งซ้ายรูปภาพ + รายละเอียดโพสต์, ฝั่งขวาข้อมูลการรับของ */}
        <div className="postdetail-layout">
          {/* ฝั่งซ้าย */}
          <div className="postdetail-main">
            {/* กล่องรูปภาพหลัก */}
            <div className="postdetail-main-image">
              {post.imageUrl ? (
                <img src={post.imageUrl} alt={post.title} />
              ) : (
                <span>รูปหลักของสิ่งของ</span>
              )}
            </div>

            {/* แถบรูปภาพย่อย */}
            <div className="postdetail-thumbnails">
              <div className="postdetail-thumb">
                <span>รูป 2</span>
              </div>
              <div className="postdetail-thumb">
                <span>รูป 3</span>
              </div>
              <div className="postdetail-thumb">
                <span>+ รูปเพิ่มเติม</span>
              </div>
            </div>

            {/* การ์ดรายละเอียดโพสต์ */}
            <Card className="postdetail-desc-card">
              <h2 className="postdetail-desc-title">{post.title}</h2>
              <p className="postdetail-desc-text">{post.description}</p>
              <div className="postdetail-desc-meta">
                <span>สถานที่พบ: {post.location}</span>
                <span className="postdetail-meta-sep">|</span>
                <span>วันที่: {post.eventDate}</span>
              </div>
            </Card>
          </div>

          {/* ฝั่งขวา: การ์ดข้อมูลการรับของ */}
          <div className="postdetail-sidebar">
            <Card className="postdetail-sidebar-card">
              <h2 className="custody-title">ข้อมูลการรับของ</h2>

              <div className="custody-info-list">
                <div className="custody-info-row">
                  <span className="custody-label">ผู้พบ:</span>
                  <span className="custody-value">{post.finderName}</span>
                </div>
                <div className="custody-info-row">
                  <span className="custody-label">สถานะการเก็บ:</span>
                  <span className="custody-value">{post.custodyType}</span>
                </div>
              </div>

              <hr className="custody-divider" />

              <div className="custody-contact-block">
                <span className="custody-label">ช่องทางติดต่อ</span>
                <div className="custody-phone">{post.contact}</div>
              </div>

              {/* ด้านล่างของการ์ด: ตรวจสอบที่มาของโพสต์ */}
              {isOwner ? (
                <button
                  type="button"
                  className="btn-claim"
                  onClick={() =>
                    navigate(`/posts/${postId || 1}/edit`, {
                      state: { post, from: 'account' },
                    })
                  }
                >
                  แก้ไขประกาศ
                </button>
              ) : claim ? (
                claim.status === 'ACCEPTED' || claim.status === 'COMPLETED' ? (
                  /* ขั้นตอนการส่งมอบสิ่งของ (Dual Confirmation) สไตล์เดียวกับ ReviewRequestsPage */
                  <div className="review-handover-box postdetail-handover-card">
                    <div className="review-handover-header">
                      <div className="review-handover-title-wrap">
                        <Handshake size={20} className="review-handover-icon" />
                        <strong>ขั้นตอนการส่งมอบสิ่งของ (Dual Confirmation)</strong>
                      </div>
                      <span className={`review-handover-badge ${claim.status === 'COMPLETED' || claim.receiverConfirmed ? 'is-completed' : ''}`}>
                        {claim.status === 'COMPLETED' || claim.receiverConfirmed ? 'ส่งมอบสำเร็จ' : 'รอทั้ง 2 ฝ่ายยืนยัน'}
                      </span>
                    </div>

                    <p className="review-handover-sub">
                      ตามกฎระบบ: ทั้งผู้พบและผู้รับต้องยืนยันการส่งมอบ เมื่อยืนยันครบ โพสต์จะเปลี่ยนเป็น <strong>CLOSED</strong> และคำขออื่นที่ค้างอยู่จะถูกยกเลิกอัตโนมัติ
                    </p>

                    {claim.ownerNote && (
                      <div className="receiver-handover-note">
                        <strong>สถานที่ / ข้อมูลนัดรับจากผู้พบ:</strong>
                        <p>{claim.ownerNote}</p>
                      </div>
                    )}

                    <div className="review-handover-steps-grid">
                      {/* ฝ่ายที่ 1: ผู้พบ */}
                      <div className="handover-step-card is-done">
                        <div className="handover-step-header">
                          <span className="step-num">
                            <Check size={14} />
                          </span>
                          <span className="step-label" title={`ฝ่ายผู้พบ (${post.finderName})`}>
                            ฝ่ายผู้พบ ({post.finderName})
                          </span>
                        </div>
                        <p className="step-status-text">อนุมัติคำขอแล้ว</p>
                        <span className="handover-confirmed-tag">
                          <CheckCircle2 size={13} />
                          <span>อนุมัติแล้ว</span>
                        </span>
                      </div>

                      {/* ฝ่ายที่ 2: ผู้รับ (คุณ) */}
                      <div className={`handover-step-card ${claim.status === 'COMPLETED' || claim.receiverConfirmed ? 'is-done' : ''}`}>
                        <div className="handover-step-header">
                          <span className="step-num">
                            {claim.status === 'COMPLETED' || claim.receiverConfirmed ? <Check size={14} /> : '2'}
                          </span>
                          <span className="step-label">ฝ่ายผู้รับ (คุณ)</span>
                        </div>
                        <p className="step-status-text">
                          {claim.status === 'COMPLETED' || claim.receiverConfirmed
                            ? 'ยืนยันได้รับของแล้ว'
                            : 'รอยืนยันการรับสิ่งของ'}
                        </p>
                        {claim.status !== 'COMPLETED' && !claim.receiverConfirmed ? (
                          <Button
                            variant="primary"
                            size="sm"
                            className="btn-handover-action"
                            onClick={async () => {
                              if (window.confirm('คุณได้ตรวจเช็กและรับสิ่งของจริงถูกต้องครบถ้วนแล้วใช่หรือไม่?')) {
                                const claimId = claim.id || claim.verify_id || '102';
                                await claimService.confirmHandover(claimId, 'receiver');
                                navigate('/account', {
                                  state: {
                                    successMessage: 'ยืนยันได้รับของเรียบร้อยแล้ว การส่งมอบสำเร็จสมบูรณ์!',
                                    confirmedClaimId: claimId,
                                  },
                                });
                              }
                            }}
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

                    {claim.status !== 'COMPLETED' && !claim.receiverConfirmed && (
                      <p className="receiver-confirm-warning">
                        * เมื่อกดยืนยันแล้ว การส่งมอบจะเสร็จสิ้นสมบูรณ์และโพสต์จะปิดโดยอัตโนมัติ
                      </p>
                    )}
                  </div>
                ) : (
                  /* สถานะอื่นๆ เช่น PENDING, REJECTED, CANCELLED */
                  <div className="postdetail-claim-status-block">
                    <div className="claim-status-header">
                      <span className="claim-status-label">สถานะคำขอของคุณ:</span>
                      {claim.status === 'PENDING' && (
                        <Badge variant="pending">PENDING · รอตรวจ</Badge>
                      )}
                      {claim.status === 'REJECTED' && (
                        <Badge variant="danger">REJECTED · ปฏิเสธ</Badge>
                      )}
                      {claim.status === 'CANCELLED' && (
                        <Badge variant="neutral">CANCELLED · ยกเลิก</Badge>
                      )}
                    </div>

                    <div className="claim-status-body">
                      {claim.status === 'PENDING' && (
                        <div className="claim-pending-box">
                          <p className="claim-status-desc">
                            คำขอของคุณอยู่ระหว่างรอผู้พบตรวจสอบความถูกต้องของหลักฐาน
                          </p>
                          <p className="claim-pending-hint">
                            ⏳ <em>ปุ่มยืนยันรับของจะแสดงหลังจากผู้พบอนุมัติคำขอของคุณแล้วเท่านั้น</em>
                          </p>
                        </div>
                      )}
                      {claim.status === 'REJECTED' && (
                        <div className="claim-rejected-box">
                          <p className="claim-status-desc">ผู้พบได้ปฏิเสธคำขอนี้</p>
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
                /* โพสต์ทั่วไปที่เปิดจากหน้าหลัก / รวมโพสต์ */
                post.status === 'closed' || post.status === 'completed' ? (
                  <div className="postdetail-closed-box">
                    <div className="postdetail-closed-badge">
                      <Lock size={15} />
                      <span>ปิดรับคำขอแล้ว</span>
                    </div>
                    <p className="postdetail-closed-desc">
                      สิ่งของนี้ได้รับการส่งมอบคืนเจ้าของเรียบร้อยแล้ว ขอขอบคุณทุกท่านที่ช่วยเหลือครับ
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-claim"
                      onClick={() =>
                        navigate(`/posts/${postId || 1}/claim`, { state: { post } })
                      }
                    >
                      นี่อาจเป็นของฉัน
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
    </div>
  );
}

export default PostDetail;
