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
import './AccountPage.css';

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
export default function AccountPage({
  onNavigateReview,
  onNavigateEditPost,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [bannerMessage, setBannerMessage] = useState(location.state?.successMessage || null);

  // State 1: แท็บที่กำลังเปิด ('my_posts' | 'my_sent_claims' | 'my_received_claims')
  const [activeTab, setActiveTab] = useState('my_posts');

  // State 2: ตัวกรองสถานะประกาศ ('all' | 'OPEN' | 'CLOSED' | 'CANCELLED')
  const [postFilter, setPostFilter] = useState('all');

  // State 3: ข้อมูลประกาศที่ฉันสร้าง (ดึงมาจาก Entity POSTS + LOCATION ตาม ER Diagram)
  const [myPosts] = useState(() => {
    let posts = [
      {
        id: 'p-101',
        post_id: 'p-101',
        title: 'พบกระเป๋าสตางค์สีดำ',
        post_type: 'ประกาศเจอของ (FOUND)',
        custody_type: 'ผู้พบเก็บรักษาเอง',
        building_name: 'อาคาร S4 ชั้น 1',
        location: 'S4 ชั้น 1',
        date: '24 ก.ย. 2026',
        created_at: '24 ก.ย. 2026',
        status: 'OPEN', // post_status: 'OPEN' | 'CLOSED' | 'CANCELLED'
        post_status: 'OPEN',
        pendingRequestsCount: 2,
      },
      {
        id: 'p-102',
        post_id: 'p-102',
        title: 'ตามหากุญแจรถยนต์ Honda',
        post_type: 'ตามหาของหาย (LOST)',
        custody_type: 'เจ้าของตามหาเอง',
        building_name: 'อาคาร CB4 ชั้น 2',
        location: 'CB4 ชั้น 2',
        date: '22 ก.ย. 2026',
        created_at: '22 ก.ย. 2026',
        status: 'OPEN',
        post_status: 'OPEN',
        pendingRequestsCount: 0,
      },
      {
        id: 'p-103',
        post_id: 'p-103',
        title: 'พบหูฟังไร้สาย AirPods',
        post_type: 'ประกาศเจอของ (FOUND)',
        custody_type: 'ฝากจุดประชาสัมพันธ์',
        building_name: 'หอสมุด ชั้น 3',
        location: 'หอสมุด ชั้น 3',
        date: '18 ก.ย. 2026',
        created_at: '18 ก.ย. 2026',
        status: 'CLOSED',
        post_status: 'CLOSED',
        pendingRequestsCount: 0,
      },
      {
        id: 'p-104',
        post_id: 'p-104',
        title: 'พบร่มพับสีน้ำเงิน',
        post_type: 'ประกาศเจอของ (FOUND)',
        custody_type: 'ส่งต่อจุดรับของหาย',
        building_name: 'โรงอาหารพระจอมเกล้า',
        location: 'โรงอาหารพระจอมเกล้า',
        date: '15 ก.ย. 2026',
        created_at: '15 ก.ย. 2026',
        status: 'CANCELLED',
        post_status: 'CANCELLED',
        pendingRequestsCount: 0,
      },
    ];

    if (location.state?.updatedPost) {
      const up = location.state.updatedPost;
      posts = posts.map((p) =>
        p.id === up.id || p.post_id === up.id ? { ...p, ...up } : p
      );
    }
    if (location.state?.deletedPostId) {
      const delId = location.state.deletedPostId;
      posts = posts.filter((p) => p.id !== delId && p.post_id !== delId);
    }

    return posts;
  });

  // State 4: ข้อมูลคำขอที่ฉันส่ง (Entity VERIFY_ITEMS ที่ current user เป็นผู้ submit)
  const [sentClaims, setSentClaims] = useState(() => {
    let claims = [
      {
        id: 'c-01',
        verify_id: 'c-01',
        post_id: 'p-101',
        itemTitle: 'ขอรับกระเป๋าสตางค์สีดำ',
        postOwner: 'นายสมเกียรติ มั่นคง (ผู้พบ)',
        date: '25 ก.ย. 2026',
        created_at: '25 ก.ย. 2026',
        status: 'ACCEPTED', // verify_status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
        verify_status: 'ACCEPTED',
        proof_description: 'กระเป๋าสตางค์สีดำ Guy Laroche มีบัตรสีฟ้า',
        ownerNote: 'ตอบรับแล้ว! นัดรับของที่โถง CB4 วันนี้เวลา 16:30 น.',
        receiverConfirmed: false,
      },
      {
        id: 'c-02',
        verify_id: 'c-02',
        post_id: 'p-089',
        itemTitle: 'ขอรับบัตรนักศึกษาที่ทำหาย',
        postOwner: 'เจ้าหน้าที่ห้องทะเบียน',
        date: '20 ก.ย. 2026',
        created_at: '20 ก.ย. 2026',
        status: 'COMPLETED',
        verify_status: 'COMPLETED',
        proof_description: 'บัตรนักศึกษาคณะวิศวกรรมศาสตร์ ภาควิชา CPE',
        ownerNote: 'ทั้งสองฝ่ายยืนยันการส่งมอบเสร็จสิ้นแล้ว ขอบคุณครับ',
        receiverConfirmed: true,
      },
      {
        id: 'c-03',
        verify_id: 'c-03',
        post_id: 'p-075',
        itemTitle: 'ขอรับหูฟังไร้สาย AirPods',
        postOwner: 'นายชินวัฒน์ อักษร (ผู้พบ)',
        date: '24 ก.ย. 2026',
        created_at: '24 ก.ย. 2026',
        status: 'PENDING',
        verify_status: 'PENDING',
        proof_description: 'เคสหูฟังมีสติกเกอร์รูปแมวสีส้มติดอยู่ที่ฝา',
        ownerNote: 'กำลังตรวจสอบรูปภาพและรายละเอียดตำหนิที่ส่งมา',
        receiverConfirmed: false,
      },
      {
        id: 'c-04',
        verify_id: 'c-04',
        post_id: 'p-064',
        itemTitle: 'ขอรับกระติกน้ำเก็บความเย็น',
        postOwner: 'นายธนาคาร เจริญสุข (ผู้พบ)',
        date: '15 ก.ย. 2026',
        created_at: '15 ก.ย. 2026',
        status: 'REJECTED',
        verify_status: 'REJECTED',
        proof_description: 'กระติกน้ำสีดำด้าน ขนาด 500ml',
        ownerNote: 'ตำหนิตรงฝาไม่ตรงกับของจริงที่เก็บได้ ขออภัยด้วยครับ',
        receiverConfirmed: false,
      },
      {
        id: 'c-05',
        verify_id: 'c-05',
        post_id: 'p-055',
        itemTitle: 'ขอรับสายชาร์จไอโฟน',
        postOwner: 'นางสาวพิมพ์มาดา รักษ์ดี (ผู้พบ)',
        date: '10 ก.ย. 2026',
        created_at: '10 ก.ย. 2026',
        status: 'CANCELLED',
        verify_status: 'CANCELLED',
        proof_description: 'สายชาร์จ Type-C to Lightning สีขาว มีปลอกพันสายไฟสีฟ้า',
        ownerNote: 'โพสต์ถูกปิดเนื่องจากส่งมอบให้แก่เจ้าของท่านอื่นเรียบร้อยแล้ว',
        receiverConfirmed: false,
      },
    ];

    if (location.state?.confirmedClaimId) {
      const cid = location.state.confirmedClaimId;
      claims = claims.map((c) =>
        c.id === cid || c.verify_id === cid
          ? { ...c, receiverConfirmed: true, status: 'COMPLETED', verify_status: 'COMPLETED' }
          : c
      );
    }

    return claims;
  });

  // ซิงก์ข้อมูลสถานะคำขอที่ฉันส่งแบบ Real-time จาก claimService
  useEffect(() => {
    let isMounted = true;
    claimService.getMyClaims().then((claims) => {
      if (isMounted && claims && claims.length > 0) {
        setSentClaims((prev) => {
          return prev.map((old) => {
            const match = claims.find(c => String(c.id) === String(old.id) || String(c.id) === '102' || String(c.id) === 'c-01');
            if (match) {
              return {
                ...old,
                status: match.status || match.verify_status || old.status,
                verify_status: match.status || match.verify_status || old.verify_status,
                ownerNote: match.ownerNote || match.note || old.ownerNote,
                receiverConfirmed: match.receiverConfirmed,
              };
            }
            return old;
          });
        });
      }
    });

    const unsubscribe = claimService.subscribe((updatedClaims) => {
      setSentClaims((prev) => {
        return prev.map((old) => {
          const match = updatedClaims.find(c => String(c.id) === String(old.id) || String(c.id) === '102' || String(c.id) === 'c-01');
          if (match) {
            return {
              ...old,
              status: match.status || match.verify_status || old.status,
              verify_status: match.status || match.verify_status || old.verify_status,
              ownerNote: match.ownerNote || match.note || old.ownerNote,
              receiverConfirmed: match.receiverConfirmed,
            };
          }
          return old;
        });
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // State 5: รายการประกาศของฉันที่มีคนส่งคำขอเข้ามา (POSTS ที่ receives VERIFY_ITEMS)
  const [receivedClaims] = useState([
    {
      id: 'rc-101',
      postId: 'p-101',
      postTitle: 'พบกระเป๋าสตางค์สีดำ',
      location: 'S4 ชั้น 1',
      building_name: 'อาคาร S4 ชั้น 1',
      pendingCount: 2,
      latestClaimant: 'ภัทรพล สุขเกษม (นักศึกษา B)',
      date: '24 ก.ย. 2026',
    },
  ]);





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
                    onClick={() => {
                      const targetId = post.id || post.post_id;
                      navigate(`/posts/${targetId}`, {
                        state: {
                          from: 'account',
                          isOwner: true,
                          post: post,
                        },
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        const targetId = post.id || post.post_id;
                        navigate(`/posts/${targetId}`, {
                          state: {
                            from: 'account',
                            isOwner: true,
                            post: post,
                          },
                        });
                      }
                    }}
                  >
                    <Thumbnail text="รูปโพสต์" />
                    <div className="account-post-details">
                      <h3 className="account-post-title">{post.title}</h3>
                      <p className="account-post-meta">
                        {post.location} · {post.date}
                      </p>
                      <div className="account-post-badges">
                        {/* 1. ประเภทโพสต์ตาม ER Diagram (post_type: FOUND / LOST) */}
                        {post.post_type === 'LOST' || (post.post_type && post.post_type.includes('LOST')) ? (
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
                      onClick={() => {
                        const targetId = post.id || post.post_id;
                        if (onNavigateEditPost) {
                          onNavigateEditPost(targetId, post);
                        } else {
                          navigate(`/posts/${targetId}/edit`, {
                            state: { post, from: 'account' },
                          });
                        }
                      }}
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
                        onClick={() => {
                          const targetPostId = claim.post_id || claim.postId || 1;
                          navigate(`/posts/${targetPostId}`, {
                            state: {
                              from: 'account',
                              claim: claim,
                              post: {
                                id: targetPostId,
                                title: claim.itemTitle.replace(/^ขอรับ/, 'พบ'),
                                finderName: claim.postOwner,
                                date: claim.date || claim.created_at,
                                eventDate: claim.date || claim.created_at,
                                description: claim.proof_description || `สิ่งของที่ถูกประกาศโดย ${claim.postOwner}`,
                              },
                            },
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            const targetPostId = claim.post_id || claim.postId || 1;
                            navigate(`/posts/${targetPostId}`, {
                              state: {
                                from: 'account',
                                claim: claim,
                                post: {
                                  id: targetPostId,
                                  title: claim.itemTitle.replace(/^ขอรับ/, 'พบ'),
                                  finderName: claim.postOwner,
                                  date: claim.date || claim.created_at,
                                  eventDate: claim.date || claim.created_at,
                                  description: claim.proof_description || `สิ่งของที่ถูกประกาศโดย ${claim.postOwner}`,
                                },
                              },
                            });
                          }
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
                    <td>{claim.created_at || claim.date}</td>
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const targetPostId = claim.post_id || claim.postId || 1;
                          navigate(`/posts/${targetPostId}`, {
                            state: {
                              from: 'account',
                              claim: claim,
                              post: {
                                id: targetPostId,
                                title: claim.itemTitle.replace(/^ขอรับ/, 'พบ'),
                                finderName: claim.postOwner,
                                date: claim.date || claim.created_at,
                                eventDate: claim.date || claim.created_at,
                                description: claim.proof_description || `สิ่งของที่ถูกประกาศโดย ${claim.postOwner}`,
                              },
                            },
                          });
                        }}
                      >
                        ดูรายละเอียด
                      </Button>
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
          {receivedClaims.map((item) => (
            <Card key={item.id} className="account-received-card">
              <div className="account-received-left">
                <Thumbnail text="รูปโพสต์" />
                <div className="account-received-info">
                  <h3 className="account-received-title">{item.postTitle}</h3>
                  <p className="account-received-meta">
                    สถานที่: {item.building_name || item.location} · คำขอล่าสุดจาก {item.latestClaimant} ({item.date})
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
