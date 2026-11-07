import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Thumbnail from '../../components/ui/Thumbnail';
import Badge from '../../components/ui/Badge';
import './AccountPage.css';

/**
 * AccountPage Component — หน้าจัดการบัญชีและกิจกรรมของฉัน (MY ACCOUNT)
 * Route URL: /account
 * 
 * 🌟 ออกแบบตรงตาม Business Rules และ State Machine ของระบบ:
 * 1. Post Lifecycle: OPEN (เปิดรับคำขอ), CLOSED (ส่งมอบสำเร็จแล้ว), CANCELLED (เจ้าของยกเลิกโพสต์)
 * 2. Request Lifecycle: PENDING, ACCEPTED, REJECTED, CANCELLED, COMPLETED
 * 3. Dual Confirmation (ฝ่ายผู้รับ): ในแท็บ "คำขอที่ฉันส่ง (My Requests)" สามารถกดยืนยันได้รับของเมื่อคำขอได้รับการ ACCEPTED
 * 4. จัดการคำขอที่ได้รับ: มีแท็บและปุ่มตรงไปยังหน้าตรวจคำขอ /requests/review
 * 5. ZERO Inline Styles: 100% ควบคุมผ่าน CSS Classes
 */
export default function AccountPage({
  onNavigateReview,
  onNavigatePostDetail,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [bannerMessage, setBannerMessage] = useState(location.state?.successMessage || null);

  // State 1: แท็บที่กำลังเปิด ('my_posts' | 'my_sent_claims' | 'my_received_claims')
  const [activeTab, setActiveTab] = useState('my_posts');

  // State 2: ตัวกรองสถานะประกาศ ('all' | 'OPEN' | 'CLOSED' | 'CANCELLED')
  const [postFilter, setPostFilter] = useState('all');

  // State 3: ข้อมูลประกาศที่ฉันสร้าง (รองรับสถานะ OPEN, CLOSED, CANCELLED ตามสเปก)
  const [myPosts, setMyPosts] = useState([
    {
      id: 'p-101',
      title: 'พบกระเป๋าสตางค์สีดำ',
      location: 'S4 ชั้น 1',
      date: '24 ก.ย. 2026',
      status: 'OPEN', // 'OPEN' | 'CLOSED' | 'CANCELLED'
      pendingRequestsCount: 2,
    },
    {
      id: 'p-102',
      title: 'ตามหากุญแจรถยนต์ Honda',
      location: 'CB4 ชั้น 2',
      date: '22 ก.ย. 2026',
      status: 'OPEN',
      pendingRequestsCount: 0,
    },
    {
      id: 'p-103',
      title: 'พบหูฟังไร้สาย AirPods',
      location: 'หอสมุด ชั้น 3',
      date: '18 ก.ย. 2026',
      status: 'CLOSED',
      pendingRequestsCount: 0,
    },
    {
      id: 'p-104',
      title: 'พบร่มพับสีน้ำเงิน',
      location: 'โรงอาหารพระจอมเกล้า',
      date: '15 ก.ย. 2026',
      status: 'CANCELLED',
      pendingRequestsCount: 0,
    },
  ]);

  // State 4: ข้อมูลคำขอที่ฉันส่ง (My Requests — รองรับทั้ง 5 สถานะตามสเปก)
  const [sentClaims, setSentClaims] = useState([
    {
      id: 'c-01',
      itemTitle: 'ขอรับกระเป๋าสตางค์สีดำ',
      postOwner: 'นักศึกษา A',
      date: '25 ก.ย. 2026',
      status: 'ACCEPTED', // 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
      ownerNote: 'ตอบรับแล้ว! นัดรับของที่โถง CB4 วันนี้เวลา 16:30 น.',
      receiverConfirmed: false,
    },
    {
      id: 'c-02',
      itemTitle: 'ขอรับบัตรนักศึกษาที่ทำหาย',
      postOwner: 'เจ้าหน้าที่ห้องทะเบียน',
      date: '20 ก.ย. 2026',
      status: 'COMPLETED',
      ownerNote: 'ทั้งสองฝ่ายยืนยันการส่งมอบเสร็จสิ้นแล้ว ขอบคุณครับ',
      receiverConfirmed: true,
    },
    {
      id: 'c-03',
      itemTitle: 'ขอรับหูฟังไร้สาย AirPods',
      postOwner: 'นักศึกษา C',
      date: '24 ก.ย. 2026',
      status: 'PENDING',
      ownerNote: 'กำลังตรวจสอบรูปภาพและรายละเอียดตำหนิที่ส่งมา',
      receiverConfirmed: false,
    },
    {
      id: 'c-04',
      itemTitle: 'ขอรับกระติกน้ำเก็บความเย็น',
      postOwner: 'นักศึกษา D',
      date: '15 ก.ย. 2026',
      status: 'REJECTED',
      ownerNote: 'ตำหนิตรงฝาไม่ตรงกับของจริงที่เก็บได้ ขออภัยด้วยครับ',
      receiverConfirmed: false,
    },
    {
      id: 'c-05',
      itemTitle: 'ขอรับสายชาร์จไอโฟน',
      postOwner: 'นักศึกษา E',
      date: '10 ก.ย. 2026',
      status: 'CANCELLED',
      ownerNote: 'โพสต์ถูกปิดเนื่องจากส่งมอบให้แก่เจ้าของท่านอื่นเรียบร้อยแล้ว',
      receiverConfirmed: false,
    },
  ]);

  // State 5: รายการประกาศของฉันที่มีคนส่งคำขอเข้ามา (รอการตรวจ)
  const [receivedClaims] = useState([
    {
      id: 'rc-101',
      postId: 'p-101',
      postTitle: 'พบกระเป๋าสตางค์สีดำ',
      location: 'S4 ชั้น 1',
      pendingCount: 2,
      latestClaimant: 'นักศึกษา B',
      date: '24 ก.ย. 2026',
    },
  ]);

  // สลับสถานะเปิด/ปิดประกาศ (Open / Close / Cancel toggle)
  const handleChangePostStatus = (postId, nextStatus) => {
    setMyPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, status: nextStatus }
          : post
      )
    );
  };

  // ฝ่ายผู้รับกดยืนยันว่าได้รับของแล้ว (Dual Confirmation ฝั่งผู้ส่งคำขอใน My Requests)
  const handleConfirmReceived = (claimId) => {
    setSentClaims((prev) =>
      prev.map((claim) =>
        claim.id === claimId
          ? {
              ...claim,
              receiverConfirmed: true,
              status: 'COMPLETED',
              ownerNote: 'คุณยืนยันได้รับของแล้ว — การส่งมอบสำเร็จเรียบร้อย',
            }
          : claim
      )
    );
  };

  // กรองประกาศตามตัวกรอง
  const filteredPosts = myPosts.filter((post) => {
    if (postFilter === 'all') return true;
    return post.status === postFilter;
  });

  return (
    <div className="account-page-container">
      {/* ส่วนหัวหน้าเว็บ */}
      <PageHeader
        tag="MY ACCOUNT"
        title="ประกาศและคำขอของฉัน"
        subtitle="ติดตามประกาศที่สร้าง คำขอรับของ (My Requests) และจัดการส่งมอบสิ่งของ"
      />

      {/* แบนเนอร์แจ้งเตือนสำเร็จ (ถ้ามีข้อความส่งต่อมาจากหน้าอื่น) */}
      {bannerMessage && (
        <div className="account-success-banner" role="status">
          <div className="account-banner-content">
            <span className="account-banner-icon">✓</span>
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            className="account-banner-close"
            onClick={() => setBannerMessage(null)}
            aria-label="ปิดการแจ้งเตือน"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================
          1. การ์ดสรุปภาพรวมด้านบน (Dashboard Overview Cards)
          ============================================================ */}
      <div className="account-stats-grid">
        <div
          className={`account-stat-card ${activeTab === 'my_posts' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('my_posts')}
          role="button"
          tabIndex={0}
        >
          <div className="account-stat-info">
            <span className="account-stat-label">ประกาศที่ฉันสร้าง</span>
            <p className="account-stat-number">{myPosts.length} รายการ</p>
          </div>
          <span className="account-stat-badge">จัดการ</span>
        </div>

        <div
          className={`account-stat-card ${activeTab === 'my_sent_claims' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('my_sent_claims')}
          role="button"
          tabIndex={0}
        >
          <div className="account-stat-info">
            <span className="account-stat-label">คำขอที่ฉันส่ง (My Requests)</span>
            <p className="account-stat-number">{sentClaims.length} รายการ</p>
          </div>
          <span className="account-stat-badge">ตารางสถานะ</span>
        </div>

        <div
          className={`account-stat-card ${activeTab === 'my_received_claims' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('my_received_claims')}
          role="button"
          tabIndex={0}
        >
          <div className="account-stat-info">
            <span className="account-stat-label">คำขอที่ฉันได้รับ</span>
            <p className="account-stat-number">2 รายการรอตรวจ</p>
          </div>
          <span className="account-stat-badge">ไปหน้าตรวจ</span>
        </div>
      </div>

      {/* ============================================================
          2. แถบสลับแท็บเมนู (Tab Navigation)
          ============================================================ */}
      <div className="account-tabs-wrapper">
        <div className="account-tabs-header" role="tablist">
          <button
            type="button"
            className={`account-tab-btn ${activeTab === 'my_posts' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('my_posts')}
          >
            📢 ประกาศที่ฉันสร้าง ({myPosts.length})
          </button>
          <button
            type="button"
            className={`account-tab-btn ${activeTab === 'my_sent_claims' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('my_sent_claims')}
          >
            📤 คำขอที่ฉันส่ง (My Requests) ({sentClaims.length})
          </button>
          <button
            type="button"
            className={`account-tab-btn ${activeTab === 'my_received_claims' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('my_received_claims')}
          >
            📥 คำขอที่ฉันได้รับ ({receivedClaims.length})
          </button>
        </div>
      </div>

      {/* ============================================================
          3. แท็บที่ 1: ประกาศที่ฉันสร้าง (รองรับสถานะ OPEN, CLOSED, CANCELLED)
          ============================================================ */}
      {activeTab === 'my_posts' && (
        <section aria-labelledby="my-posts-heading">
          <h2 id="my-posts-heading" className="sr-only">
            รายการประกาศที่ฉันสร้าง
          </h2>
          {/* แถบตัวกรองสถานะ */}
          <div className="account-filter-bar">
            <div className="account-pill-filters">
              <button
                type="button"
                className={`account-filter-pill ${postFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setPostFilter('all')}
              >
                ทั้งหมด ({myPosts.length})
              </button>
              <button
                type="button"
                className={`account-filter-pill ${postFilter === 'OPEN' ? 'is-active' : ''}`}
                onClick={() => setPostFilter('OPEN')}
              >
                เปิดรับคำขอ (OPEN)
              </button>
              <button
                type="button"
                className={`account-filter-pill ${postFilter === 'CLOSED' ? 'is-active' : ''}`}
                onClick={() => setPostFilter('CLOSED')}
              >
                ส่งมอบสำเร็จแล้ว (CLOSED)
              </button>
              <button
                type="button"
                className={`account-filter-pill ${postFilter === 'CANCELLED' ? 'is-active' : ''}`}
                onClick={() => setPostFilter('CANCELLED')}
              >
                ยกเลิกโพสต์ (CANCELLED)
              </button>
            </div>
          </div>

          {/* รายการการ์ดโพสต์ */}
          {filteredPosts.length === 0 ? (
            <div className="account-empty-state">
              <span className="account-empty-icon">📭</span>
              <p className="account-empty-title">ไม่พบรายการประกาศในหมวดหมู่นี้</p>
              <p className="account-empty-desc">ลองเลือกตัวกรองอื่น หรือสร้างประกาศใหม่</p>
            </div>
          ) : (
            <div className="account-posts-grid">
              {filteredPosts.map((post) => (
                <div key={post.id} className="account-post-card">
                  <div className="account-post-header">
                    <Thumbnail text="รูปโพสต์" />
                    <div className="account-post-details">
                      <h3 className="account-post-title">{post.title}</h3>
                      <p className="account-post-meta">
                        {post.location} · {post.date}
                      </p>
                      <div>
                        {post.status === 'OPEN' && (
                          <Badge variant="success">OPEN · เปิดรับคำขอ</Badge>
                        )}
                        {post.status === 'CLOSED' && (
                          <Badge variant="completed">CLOSED · ส่งมอบแล้ว</Badge>
                        )}
                        {post.status === 'CANCELLED' && (
                          <Badge variant="danger">CANCELLED · ยกเลิก</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="account-post-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (onNavigatePostDetail) onNavigatePostDetail(post.id);
                        else alert(`เปิดดูประกาศ: ${post.title}`);
                      }}
                    >
                      ดูประกาศ
                    </Button>

                    {post.status === 'OPEN' ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleChangePostStatus(post.id, 'CLOSED')}
                        >
                          ปิดโพสต์ (CLOSED)
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleChangePostStatus(post.id, 'CANCELLED')}
                        >
                          ยกเลิกโพสต์
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleChangePostStatus(post.id, 'OPEN')}
                      >
                        เปิดรับคำขอใหม่
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          4. แท็บที่ 2: ตารางคำขอที่ฉันส่ง (My Requests — รองรับ 5 สถานะ)
          ============================================================ */}
      {activeTab === 'my_sent_claims' && (
        <section aria-labelledby="sent-claims-heading">
          <h2 id="sent-claims-heading" className="sr-only">
            รายการคำขอที่ฉันส่ง (My Requests)
          </h2>
          <div className="account-table-wrapper">
            <table className="account-data-table">
              <caption className="sr-only">ตารางรายการคำขอที่ฉันส่งและสถานะ</caption>
              <thead>
                <tr>
                  <th>สิ่งของที่ส่งคำขอรับคืน</th>
                  <th>ผู้โพสต์</th>
                  <th>วันที่ส่ง</th>
                  <th>สถานะคำขอ</th>
                  <th>หมายเหตุจากผู้พบ</th>
                  <th>การกระทำ / ยืนยันการส่งมอบ</th>
                </tr>
              </thead>
              <tbody>
                {sentClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td>
                      <div className="account-table-item">
                        <Thumbnail text="รูป" />
                        <span className="account-table-item-title">{claim.itemTitle}</span>
                      </div>
                    </td>
                    <td>{claim.postOwner}</td>
                    <td>{claim.date}</td>
                    <td>
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
                    </td>
                    <td>
                      <div className={`account-table-note ${claim.ownerNote ? 'has-note' : ''}`}>
                        {claim.ownerNote || '— ไม่มีข้อความหมายเหตุ —'}
                      </div>
                    </td>
                    <td>
                      {claim.status === 'ACCEPTED' && !claim.receiverConfirmed ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConfirmReceived(claim.id)}
                        >
                          ✓ ยืนยันได้รับของแล้ว
                        </Button>
                      ) : claim.status === 'COMPLETED' ? (
                        <span className="account-table-done-badge">✓ ได้รับของเรียบร้อย</span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => alert(`ขอดูรายละเอียดคำขอ #${claim.id}`)}
                        >
                          ดูรายละเอียด
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================
          5. แท็บที่ 3: คำขอที่ฉันได้รับ (มีปุ่มไปหน้าตรวจคำขอ)
          ============================================================ */}
      {activeTab === 'my_received_claims' && (
        <section aria-labelledby="received-claims-heading" className="account-received-list">
          <h2 id="received-claims-heading" className="sr-only">
            รายการคำขอตรวจสอบที่ฉันได้รับ
          </h2>
          {receivedClaims.map((item) => (
            <Card key={item.id} className="account-received-card">
              <div className="account-received-left">
                <Thumbnail text="รูปโพสต์" />
                <div className="account-received-info">
                  <h3 className="account-received-title">{item.postTitle}</h3>
                  <p className="account-received-meta">
                    สถานที่: {item.location} · คำขอล่าสุดจาก {item.latestClaimant} ({item.date})
                  </p>
                  <div>
                    <Badge variant="count">
                      {item.pendingCount} คำขอรอตรวจ (1 โพสต์มีผู้ได้รับการตอบรับได้เพียง 1 คน)
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="account-received-actions">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (onNavigateReview) {
                      onNavigateReview();
                    } else {
                      navigate('/requests/review');
                    }
                  }}
                >
                  ตรวจสอบคำขอ →
                </Button>
              </div>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
