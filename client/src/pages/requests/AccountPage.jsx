import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Megaphone,
  Send,
  Inbox,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Thumbnail from '../../components/ui/Thumbnail';
import Badge from '../../components/ui/Badge';
import { claimService } from '../../services/claimService';
import { apiRequest } from '../../api';
import './AccountPage.css';

/**
 * AccountPage Component — หน้าจัดการบัญชีและกิจกรรมของฉัน (MY ACCOUNT)
 * Route URL: /account
 *
 * ใช้ข้อมูลจาก API จริงทั้งหมด:
 * - GET /api/me/posts       → ประกาศที่ฉันสร้าง
 * - GET /api/verify/my-claims → คำขอที่ฉันส่ง
 * - GET /api/verify/received  → โพสต์ของฉันที่มีคำขอเข้ามา
 */
export default function AccountPage({
  onNavigateReview,
  onNavigateEditPost,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [bannerMessage, setBannerMessage] = useState(location.state?.successMessage || null);

  // State 1: แท็บที่กำลังเปิด
  const [activeTab, setActiveTab] = useState('my_posts');

  // State 2: ตัวกรองสถานะประกาศ
  const [postFilter, setPostFilter] = useState('all');

  // State 3: ประกาศที่ฉันสร้าง (GET /api/me/posts)
  const [myPosts, setMyPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // State 4: คำขอที่ฉันส่ง (GET /api/verify/my-claims)
  const [sentClaims, setSentClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(true);

  // State 5: โพสต์ของฉันที่มีคำขอเข้ามา (GET /api/verify/received)
  const [receivedClaims, setReceivedClaims] = useState([]);
  const [receivedLoading, setReceivedLoading] = useState(true);

  // ดึงประกาศของฉัน
  useEffect(() => {
    let isMounted = true;
    apiRequest('/me/posts')
      .then((data) => {
        if (isMounted) setMyPosts(data?.posts || []);
      })
      .catch((err) => console.error('me/posts failed:', err.message))
      .finally(() => { if (isMounted) setPostsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  // ดึงคำขอที่ฉันส่ง + subscribe real-time
  useEffect(() => {
    let isMounted = true;
    claimService.getMyClaims()
      .then((claims) => {
        if (isMounted) setSentClaims(claims || []);
      })
      .catch((err) => console.error('my-claims failed:', err.message))
      .finally(() => { if (isMounted) setClaimsLoading(false); });

    const unsubscribe = claimService.subscribe((updatedClaims) => {
      if (isMounted) setSentClaims(updatedClaims);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // ดึงโพสต์ที่มีคำขอเข้ามา
  useEffect(() => {
    let isMounted = true;
    apiRequest('/verify/received')
      .then((data) => {
        if (isMounted) setReceivedClaims(data?.posts || []);
      })
      .catch((err) => console.error('verify/received failed:', err.message))
      .finally(() => { if (isMounted) setReceivedLoading(false); });
    return () => { isMounted = false; };
  }, []);

  // กรองประกาศตามตัวกรอง
  const filteredPosts = myPosts.filter((post) => {
    if (postFilter === 'all') return true;
    return (post.post_status || post.status) === postFilter;
  });

  return (
    <div className="account-page-container">
      {/* ส่วนหัวหน้าเว็บ */}
      <PageHeader
        tag="My Activities"
        title="ประกาศและคำขอของฉัน"
        subtitle="ติดตามประกาศที่สร้าง คำขอรับของ (My Requests) และจัดการส่งมอบสิ่งของ"
      />

      {/* แบนเนอร์แจ้งเตือนสำเร็จ */}
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
          1. การ์ดแท็บเลือกหมวดหมู่
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
              <p className="account-stat-number">{postsLoading ? '...' : `${myPosts.length} รายการ`}</p>
            </div>
          </div>
          <span className="account-stat-badge">จัดการ</span>
        </button>

        {/* แท็บที่ 2: คำขอที่ฉันส่ง */}
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
              <p className="account-stat-number">{claimsLoading ? '...' : `${sentClaims.length} รายการ`}</p>
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
              <p className="account-stat-number">{receivedLoading ? '...' : `${receivedClaims.length} รายการ`}</p>
            </div>
          </div>
          <span className="account-stat-badge">ไปหน้าตรวจ</span>
        </button>
      </div>

      {/* ============================================================
          3. แท็บที่ 1: ประกาศที่ฉันสร้าง
          ============================================================ */}
      {activeTab === 'my_posts' && (
        <section aria-labelledby="my-posts-heading">
          <h2 id="my-posts-heading" className="sr-only">
            รายการประกาศที่ฉันสร้าง
          </h2>

          {postsLoading ? (
            <div className="account-empty-state">
              <Loader2 size={32} className="account-empty-icon" />
              <p className="account-empty-title">กำลังโหลดประกาศของคุณ...</p>
            </div>
          ) : (
            <>
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

              {filteredPosts.length === 0 ? (
                <div className="account-empty-state">
                  <Inbox size={42} className="account-empty-icon" />
                  <p className="account-empty-title">ไม่พบรายการประกาศในหมวดหมู่นี้</p>
                  <p className="account-empty-desc">ลองเลือกตัวกรองอื่น หรือสร้างประกาศใหม่</p>
                </div>
              ) : (
                <div className="account-posts-list">
                  {filteredPosts.map((post) => {
                    const postId = post.post_id;
                    const postStatus = post.post_status || post.status;
                    const postType = post.post_type;
                    const location2 = post.building_name || post.location || '-';
                    const dateStr = post.created_at
                      ? new Date(post.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '-';

                    return (
                      <div key={postId} className="account-post-card">
                        <div
                          className="account-post-header account-clickable"
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/posts/${postId}`, {
                            state: { from: 'account', isOwner: true, post },
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              navigate(`/posts/${postId}`, {
                                state: { from: 'account', isOwner: true, post },
                              });
                            }
                          }}
                        >
                          <Thumbnail text="รูปโพสต์" />
                          <div className="account-post-details">
                            <h3 className="account-post-title">{post.title}</h3>
                            <p className="account-post-meta">
                              {location2} · {dateStr}
                            </p>
                            <div className="account-post-badges">
                              {postType === 'LOST' || (postType && postType.includes('LOST')) ? (
                                <Badge variant="lost">ของหาย</Badge>
                              ) : (
                                <Badge variant="found">พบของ</Badge>
                              )}
                              {postStatus === 'OPEN' && (
                                <Badge variant="success">OPEN · เปิดรับคำขอ</Badge>
                              )}
                              {postStatus === 'CLOSED' && (
                                <Badge variant="completed">CLOSED · ส่งมอบแล้ว</Badge>
                              )}
                              {postStatus === 'CANCELLED' && (
                                <Badge variant="danger">CANCELLED · ยกเลิก</Badge>
                              )}
                              {Number(post.pending_count) > 0 && (
                                <Badge variant="count">{post.pending_count} คำขอรอตรวจ</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="account-post-actions">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (onNavigateEditPost) {
                                onNavigateEditPost(postId, post);
                              } else {
                                navigate(`/posts/${postId}/edit`, {
                                  state: { post, from: 'account' },
                                });
                              }
                            }}
                          >
                            แก้ไขโพสต์
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ============================================================
          4. แท็บที่ 2: ตารางคำขอที่ฉันส่ง
          ============================================================ */}
      {activeTab === 'my_sent_claims' && (
        <section aria-labelledby="sent-claims-heading">
          <h2 id="sent-claims-heading" className="sr-only">
            รายการคำขอที่ฉันส่ง (My Requests)
          </h2>
          {claimsLoading ? (
            <div className="account-empty-state">
              <Loader2 size={32} className="account-empty-icon" />
              <p className="account-empty-title">กำลังโหลดคำขอของคุณ...</p>
            </div>
          ) : sentClaims.length === 0 ? (
            <div className="account-empty-state">
              <Send size={42} className="account-empty-icon" />
              <p className="account-empty-title">ยังไม่มีคำขอที่ส่งออกไป</p>
              <p className="account-empty-desc">ไปที่หน้าประกาศและกดปุ่มขอรับสิ่งของ</p>
            </div>
          ) : (
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
                  {sentClaims.map((claim) => {
                    const claimId = claim.verify_id || claim.id;
                    const targetPostId = claim.post_id || claim.postId;
                    const claimStatus = claim.verify_status || claim.status;
                    const dateStr = claim.created_at
                      ? new Date(claim.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
                      : (claim.date || '-');

                    return (
                      <tr key={claimId}>
                        <td>
                          <div
                            className="account-table-item account-clickable"
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/posts/${targetPostId}`, {
                              state: { from: 'account', claim },
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                navigate(`/posts/${targetPostId}`, {
                                  state: { from: 'account', claim },
                                });
                              }
                            }}
                          >
                            <Thumbnail text="รูป" />
                            <span className="account-table-item-title">
                              {claim.itemTitle || claim.postTitle}
                              <span className="account-table-sub-id">#{claimId}</span>
                            </span>
                          </div>
                        </td>
                        <td>{claim.postOwner || claim.postOwnerName || '-'}</td>
                        <td>{dateStr}</td>
                        <td>
                          {claimStatus === 'PENDING' && (
                            <Badge variant="pending">PENDING · รอตรวจ</Badge>
                          )}
                          {claimStatus === 'ACCEPTED' && (
                            <Badge variant="success">ACCEPTED · ตอบรับแล้ว</Badge>
                          )}
                          {claimStatus === 'REJECTED' && (
                            <Badge variant="danger">REJECTED · ปฏิเสธ</Badge>
                          )}
                          {claimStatus === 'CANCELLED' && (
                            <Badge variant="neutral">CANCELLED · ยกเลิก</Badge>
                          )}
                          {claimStatus === 'COMPLETED' && (
                            <Badge variant="completed">COMPLETED · สำเร็จ</Badge>
                          )}
                        </td>
                        <td>
                          <div className={`account-table-note ${(claim.ownerNote || claim.note) ? 'has-note' : ''}`}>
                            {claim.ownerNote || claim.note || '— ไม่มีข้อความหมายเหตุ —'}
                          </div>
                        </td>
                        <td>
                          <div className="account-table-actions">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/posts/${targetPostId}`, {
                                state: { from: 'account', claim },
                              })}
                            >
                              ดูรายละเอียด
                            </Button>
                            {claimStatus === 'PENDING' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={async () => {
                                  if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอ #${claimId}?`)) {
                                    try {
                                      await claimService.cancelClaim(claimId);
                                      setBannerMessage('ยกเลิกคำขอของคุณเรียบร้อยแล้ว');
                                      setSentClaims((prev) =>
                                        prev.map((c) =>
                                          String(c.verify_id || c.id) === String(claimId)
                                            ? { ...c, verify_status: 'CANCELLED', status: 'CANCELLED' }
                                            : c
                                        )
                                      );
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          5. แท็บที่ 3: คำขอที่ฉันได้รับ
          ============================================================ */}
      {activeTab === 'my_received_claims' && (
        <section aria-labelledby="received-claims-heading" className="account-received-list">
          <h2 id="received-claims-heading" className="sr-only">
            รายการคำขอตรวจสอบที่ฉันได้รับ
          </h2>
          {receivedLoading ? (
            <div className="account-empty-state">
              <Loader2 size={32} className="account-empty-icon" />
              <p className="account-empty-title">กำลังโหลดคำขอที่ได้รับ...</p>
            </div>
          ) : receivedClaims.length === 0 ? (
            <div className="account-empty-state">
              <Inbox size={42} className="account-empty-icon" />
              <p className="account-empty-title">ยังไม่มีคำขอเข้ามายังประกาศของคุณ</p>
              <p className="account-empty-desc">เมื่อมีผู้ส่งคำขอมายังประกาศของคุณ จะแสดงที่นี่</p>
            </div>
          ) : (
            receivedClaims.map((item) => {
              const postId = item.post_id;
              const pendingCount = Number(item.pendingCount) || 0;
              const totalCount = Number(item.totalCount) || 0;
              const dateStr = item.latestDate
                ? new Date(item.latestDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
                : (item.date || '-');

              return (
                <Card key={postId} className="account-received-card">
                  <div className="account-received-left">
                    <Thumbnail text="รูปโพสต์" />
                    <div className="account-received-info">
                      <h3 className="account-received-title">{item.postTitle}</h3>
                      <p className="account-received-meta">
                        สถานที่: {item.building_name || '-'} · คำขอล่าสุดจาก {item.latestClaimant} ({dateStr})
                      </p>
                      <div>
                        <Badge variant="count">
                          {pendingCount} คำขอรอตรวจ · {totalCount} คำขอทั้งหมด
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="account-received-actions">
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (onNavigateReview) {
                          onNavigateReview(item);
                        } else {
                          navigate(`/posts/${postId}/review`, {
                            state: { postId, postTitle: item.postTitle, from: '/account' },
                          });
                        }
                      }}
                    >
                      ตรวจสอบคำขอ →
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </section>
      )}
    </div>
  );
}
