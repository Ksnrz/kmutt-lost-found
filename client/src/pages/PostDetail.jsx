import { useNavigate, useParams, useLocation } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Badge from '../components/ui/Badge';
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
                <div className="postdetail-owner-block">
                  <div className="owner-badge-wrap">
                    <Badge variant="found">📌 ประกาศของคุณ</Badge>
                  </div>
                  <p className="owner-hint-text">
                    คุณเป็นเจ้าของประกาศนี้ จึงไม่สามารถส่งคำขอขอรับของตนเองได้
                  </p>
                  <button
                    type="button"
                    className="btn-owner-edit"
                    onClick={() =>
                      navigate(`/posts/${postId || 1}/edit`, {
                        state: { post, from: 'account' },
                      })
                    }
                  >
                    แก้ไขประกาศนี้
                  </button>
                </div>
              ) : claim ? (
                <div className="postdetail-claim-status-block">
                  <div className="claim-status-header">
                    <span className="claim-status-label">สถานะคำขอของคุณ:</span>
                    {claim.status === 'PENDING' && (
                      <Badge variant="pending">PENDING · รอตรวจ</Badge>
                    )}
                    {claim.status === 'ACCEPTED' && (
                      <Badge variant="success">ACCEPTED · ตอบรับแล้ว</Badge>
                    )}
                    {claim.status === 'REJECTED' && (
                      <Badge variant="danger">REJECTED · ปฏิเสธ</Badge>
                    )}
                    {claim.status === 'CANCELLED' && (
                      <Badge variant="neutral">CANCELLED · ยกเลิก</Badge>
                    )}
                    {claim.status === 'COMPLETED' && (
                      <Badge variant="completed">COMPLETED · สำเร็จ</Badge>
                    )}
                  </div>

                  <div className="claim-status-body">
                    {claim.status === 'PENDING' && (
                      <p className="claim-status-desc">
                        คุณได้ยื่นคำขอตรวจสอบแล้ว อยู่ระหว่างรอผู้พบตรวจสอบความถูกต้องของหลักฐาน
                      </p>
                    )}
                    {claim.status === 'ACCEPTED' && (
                      <div className="claim-accepted-box">
                        <p className="claim-status-desc">
                          ผู้พบได้ตอบรับคำขอของคุณแล้ว สามารถติดต่อเพื่อนัดรับสิ่งของได้
                        </p>
                        {claim.ownerNote && (
                          <div className="claim-owner-note">
                            <strong>หมายเหตุจากผู้พบ:</strong>
                            <p>{claim.ownerNote}</p>
                          </div>
                        )}
                        {!claim.receiverConfirmed && (
                          <button
                            type="button"
                            className="btn-confirm-delivery"
                            onClick={() => {
                              alert('ยืนยันได้รับของเรียบร้อยแล้ว');
                              navigate('/account');
                            }}
                          >
                            ✓ ยืนยันได้รับของแล้ว
                          </button>
                        )}
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
                    {claim.status === 'COMPLETED' && (
                      <p className="claim-status-desc claim-done">
                        ✓ ทั้งสองฝ่ายยืนยันการส่งมอบเสร็จสิ้นแล้ว ขอบคุณครับ
                      </p>
                    )}
                  </div>
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
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostDetail;
