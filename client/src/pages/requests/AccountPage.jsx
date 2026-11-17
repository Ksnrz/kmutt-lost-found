import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Megaphone,
  Send,
  Inbox,
  CheckCircle2,
  X,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Thumbnail from '../../components/ui/Thumbnail';
import Badge from '../../components/ui/Badge';
import { claimService } from '../../services/claimService';
import { apiRequest } from '../../api';
import './AccountPage.css';

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

/**
 * AccountPage Component — หน้าจัดการบัญชีและกิจกรรมของฉัน (MY ACCOUNT)
 * Route URL: /account
 * 
 * 🌟 สอดคล้องกับ ER Diagram:
 * 1. Entity: POSTS & LOCATION (ความสัมพันธ์ USERS (0,N) creates (1,1) POSTS)
 *    - post_id, post_status ('OPEN' | 'CLOSED' | 'CANCELLED'), post_type, custody_type, building_name
 * 2. Entity: VERIFY_ITEMS (ความสัมพันธ์ USERS (0,N) submit (1,1) VERIFY_ITEMS)
 *    - verify_id, verify_status, proof_description, created_at
 * 3. Dual Confirmation (ฝ่ายผู้รับ): ในแท็บ "คำขอที่ฉันส่ง (My Requests)" สามารถกดยืนยันได้รับของเมื่อคำขอได้รับการ ACCEPTED
 * 4. จัดการคำขอที่ได้รับ: มีแท็บและปุ่มตรงไปยังหน้าตรวจคำขอ /requests/review (POSTS (0,N) receives (1,1) VERIFY_ITEMS)
 * 5. ไอคอน: ใช้ Lucide Icons ทั้งหมดตามมาตรฐานการออกแบบ
 * 6. ZERO Inline Styles: 100% ควบคุมผ่าน CSS Classes
 */
export default function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bannerMessage, setBannerMessage] = useState(location.state?.successMessage || null);

  // แท็บที่กำลังเปิด ('my_posts' | 'my_sent_claims' | 'my_received_claims'), Navbar ส่ง tab มาทาง state ได้
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'my_posts');

  // ตัวกรองสถานะประกาศ ('all' | 'OPEN' | 'CLOSED' | 'CANCELLED')
  const [postFilter, setPostFilter] = useState('all');

  const [myPosts, setMyPosts] = useState([]);
  const [sentClaims, setSentClaims] = useState([]);
  const [loadError, setLoadError] = useState('');

  const loadMyPosts = () =>
    apiRequest('/me/posts')
      .then((data) =>
        setMyPosts(
          data.posts.map((p) => ({
            ...p,
            id: p.post_id,
            status: p.post_status,
            location: p.building_name,
            date: formatDate(p.event_date),
          }))
        )
      )
      .catch((err) => setLoadError(err.message));

  const loadSentClaims = () => claimService.getMyClaims().then(setSentClaims);

  useEffect(() => {
    loadMyPosts();
    loadSentClaims();
  }, []);

  // โพสต์ของฉันที่ยังมีคำขอรอตรวจ
  const receivedClaims = myPosts.filter((p) => p.pending_count > 0);

  const openPost = (post) =>
    navigate(`/posts/${post.post_id}`, { state: { from: 'account', isOwner: true } });

  // PostDetail ใช้ claim เพื่อแสดงขั้นตอนส่งมอบของผู้รับ
  const openClaim = (claim) =>
    navigate(`/posts/${claim.post_id}`, {
      state: { from: 'account', claim, post: { finderName: claim.postOwner } },
    });

  // กรองประกาศตามตัวกรอง
  const filteredPosts = myPosts.filter((post) => {
    if (postFilter === 'all') return true;
    return post.status === postFilter;
  });

  return (
    <div className="account-page-container">
      {/* ส่วนหัวหน้าเว็บ */}
      <PageHeader
        tag="My Activities"
        title="ประกาศและคำขอของฉัน"
        subtitle="ติดตามประกาศที่สร้าง คำขอรับของ (My Requests) และจัดการส่งมอบสิ่งของ"
      />

      {loadError && <p className="account-load-error" role="alert">{loadError}</p>}

      {/* แบนเนอร์แจ้งเตือนสำเร็จ (ถ้ามีข้อความส่งต่อมาจากหน้าอื่น) */}
      {bannerMessage && (
        <div className="account-success-banner" role="status">
          <div className="account-banner-content">
            <CheckCircle2 size={18} className="account-banner-icon-lucide" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            className="account-banner-close"
            onClick={() => setBannerMessage(null)}
            aria-label="ปิดการแจ้งเตือน"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ============================================================
          1. การ์ดแท็บเลือกหมวดหมู่ข้อมูลบัญชี (Interactive Tab Cards พร้อมไอคอนและเอฟเฟกต์)
          ============================================================ */}
      <div className="account-stats-grid" role="tablist" aria-label="หมวดหมู่ข้อมูลบัญชี">
        {/* แท็บที่ 1: ประกาศที่ฉันสร้าง */}
        <button
          type="button"
          className={`account-stat-card ${activeTab === 'my_posts' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('my_posts')}
          role="tab"
          aria-selected={activeTab === 'my_posts'}
        >
          <div className="account-stat-main">
            <div className="account-stat-icon-badge" aria-hidden="true">
              <Megaphone size={22} className="account-stat-icon" />
            </div>
            <div className="account-stat-info">
              <span className="account-stat-label">ประกาศที่ฉันสร้าง</span>
              <p className="account-stat-number">{myPosts.length} รายการ</p>
            </div>
          </div>
          <span className="account-stat-badge">จัดการ</span>
        </button>

        {/* แท็บที่ 2: คำขอที่ฉันส่ง (My Requests) */}
        <button
          type="button"
          className={`account-stat-card ${activeTab === 'my_sent_claims' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('my_sent_claims')}
          role="tab"
          aria-selected={activeTab === 'my_sent_claims'}
        >
          <div className="account-stat-main">
            <div className="account-stat-icon-badge" aria-hidden="true">
              <Send size={22} className="account-stat-icon" />
            </div>
            <div className="account-stat-info">
              <span className="account-stat-label">คำขอที่ฉันส่ง (My Requests)</span>
              <p className="account-stat-number">{sentClaims.length} รายการ</p>
            </div>
          </div>
          <span className="account-stat-badge">ตารางสถานะ</span>
        </button>

        {/* แท็บที่ 3: คำขอที่ฉันได้รับ */}
        <button
          type="button"
          className={`account-stat-card ${activeTab === 'my_received_claims' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('my_received_claims')}
          role="tab"
          aria-selected={activeTab === 'my_received_claims'}
        >
          <div className="account-stat-main">
            <div className="account-stat-icon-badge" aria-hidden="true">
              <Inbox size={22} className="account-stat-icon" />
            </div>
            <div className="account-stat-info">
              <span className="account-stat-label">คำขอที่ฉันได้รับ</span>
              <p className="account-stat-number">{receivedClaims.length} รายการ</p>
            </div>
          </div>
          <span className="account-stat-badge">ไปหน้าตรวจ</span>
        </button>
      </div>

      {/* ============================================================
          3. แท็บที่ 1: ประกาศที่ฉันสร้าง (POSTS + LOCATION)
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
              <Inbox size={42} className="account-empty-icon" />
              <p className="account-empty-title">ไม่พบรายการประกาศในหมวดหมู่นี้</p>
              <p className="account-empty-desc">ลองเลือกตัวกรองอื่น หรือสร้างประกาศใหม่</p>
            </div>
          ) : (
            <div className="account-posts-list">
              {filteredPosts.map((post) => (
                <div key={post.id} className="account-post-card">
                  <div
                    className="account-post-header account-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => openPost(post)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openPost(post);
                    }}
                  >
                    <Thumbnail text="รูปโพสต์" src={post.image_url} />
                    <div className="account-post-details">
                      <h3 className="account-post-title">{post.title}</h3>
                      <p className="account-post-meta">
                        {post.location} · {post.date}
                      </p>
                      <div className="account-post-badges">
                        {/* 1. ประเภทโพสต์ตาม ER Diagram (post_type: FOUND / LOST) */}
                        {post.post_type === 'LOST' ? (
                          <Badge variant="lost">ของหาย</Badge>
                        ) : (
                          <Badge variant="found">พบของ</Badge>
                        )}

                        {/* 2. สถานะโพสต์ (post_status: OPEN, CLOSED, CANCELLED) */}
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
                      onClick={() => navigate(`/posts/${post.post_id}/edit`, { state: { from: 'account' } })}
                    >
                      แก้ไขโพสต์
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          4. แท็บที่ 2: ตารางคำขอที่ฉันส่ง (VERIFY_ITEMS — รองรับ 5 สถานะ)
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
                      <div
                        className="account-table-item account-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => openClaim(claim)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openClaim(claim);
                        }}
                      >
                        <Thumbnail text="รูป" />
                        <span className="account-table-item-title">
                          {claim.itemTitle}
                          <span className="account-table-sub-id">#{claim.verify_id}</span>
                        </span>
                      </div>
                    </td>
                    <td>{claim.postOwner}</td>
                    <td>{formatDate(claim.created_at)}</td>
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
                      <div className="account-table-actions">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openClaim(claim)}
                        >
                          ดูรายละเอียด
                        </Button>
                        {claim.status === 'PENDING' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={async () => {
                              if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอ #${claim.verify_id}?`)) {
                                try {
                                  await claimService.cancelClaim(claim.verify_id);
                                  setBannerMessage('ยกเลิกคำขอของคุณเรียบร้อยแล้ว');
                                  loadSentClaims();
                                } catch (err) {
                                  alert(err.message || 'ไม่สามารถยกเลิกคำขอได้');
                                }
                              }
                            }}
                          >
                            ยกเลิก
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================
          5. แท็บที่ 3: คำขอที่ฉันได้รับ (POSTS ที่ receives VERIFY_ITEMS)
          ============================================================ */}
      {activeTab === 'my_received_claims' && (
        <section aria-labelledby="received-claims-heading" className="account-received-list">
          <h2 id="received-claims-heading" className="sr-only">
            รายการคำขอตรวจสอบที่ฉันได้รับ
          </h2>
          {receivedClaims.length === 0 && (
            <div className="account-empty-state">
              <Inbox size={42} className="account-empty-icon" />
              <p className="account-empty-title">ยังไม่มีคำขอที่รอตรวจ</p>
            </div>
          )}
          {receivedClaims.map((item) => (
            <Card key={item.post_id} className="account-received-card">
              <div className="account-received-left">
                <Thumbnail text="รูปโพสต์" src={item.image_url} />
                <div className="account-received-info">
                  <h3 className="account-received-title">{item.title}</h3>
                  <p className="account-received-meta">
                    สถานที่: {item.building_name} · คำขอล่าสุดจาก {item.latest_claimant}
                  </p>
                  <div>
                    <Badge variant="count">
                      {item.pending_count} คำขอรอตรวจ (1 โพสต์มีผู้ได้รับการตอบรับได้เพียง 1 คน)
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="account-received-actions">
                <Button
                  variant="primary"
                  onClick={() => navigate(`/posts/${item.post_id}/review`, { state: { from: '/account' } })}
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
