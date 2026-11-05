import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
 * 🌟 ออกแบบใหม่เพื่อแก้ปัญหาที่อาจารย์กังวล (รองรับข้อมูลหลายรายการได้อย่างเป็นระเบียบ):
 * 1. React Router: ใช้ useNavigate() ลิงก์ไปหน้ารายละเอียดหรือหน้าตรวจคำขอ /requests/review
 * 2. ZERO Inline Styles: 100% ควบคุมผ่าน CSS Classes
 * 3. Scalable Tab Layout: แยกเป็น 3 แท็บชัดเจน รองรับประกาศและคำขอจำนวนมากได้ ไม่แออัด
 * 4. Separate Data Table: ทำ "ตารางแยก" แสดงคำขอที่ฉันส่ง + สถานะ + หมายเหตุจากเจ้าของโพสต์
 */
export default function AccountPage({
  onNavigateReview,
  onNavigatePostDetail,
}) {
  const navigate = useNavigate();

  // State 1: แท็บที่กำลังเปิด ('my_posts' | 'my_sent_claims' | 'my_received_claims')
  const [activeTab, setActiveTab] = useState('my_posts');

  // State 2: ตัวกรองสถานะประกาศ ('all' | 'OPEN' | 'CLOSED')
  const [postFilter, setPostFilter] = useState('all');

  // State 3: ข้อมูลประกาศที่ฉันสร้าง (จำลองหลายรายการเพื่อแสดงความสามารถในการจัดระเบียบ)
  const [myPosts, setMyPosts] = useState([
    {
      id: 'p-101',
      title: 'พบกระเป๋าสตางค์สีดำ',
      location: 'S4 ชั้น 1',
      date: '24 ก.ย. 2026',
      status: 'OPEN', // 'OPEN' | 'CLOSED'
    },
    {
      id: 'p-102',
      title: 'ตามหากุญแจรถยนต์ Honda',
      location: 'CB4 ชั้น 2',
      date: '22 ก.ย. 2026',
      status: 'OPEN',
    },
    {
      id: 'p-103',
      title: 'พบหูฟังไร้สาย AirPods',
      location: 'หอสมุด ชั้น 3',
      date: '18 ก.ย. 2026',
      status: 'CLOSED',
    },
  ]);

  // State 4: ข้อมูลคำขอที่ฉันส่ง (แสดงผลเป็น "ตารางแยก" ตามที่โจทย์ต้องการ)
  const [sentClaims] = useState([
    {
      id: 'c-01',
      itemTitle: 'ขอรับกระเป๋าสตางค์สีดำ',
      postOwner: 'นักศึกษา A',
      date: '25 ก.ย. 2026',
      status: 'PENDING',
      ownerNote: 'กำลังตรวจสอบรูปภาพหลักฐานที่ส่งมา',
    },
    {
      id: 'c-02',
      itemTitle: 'ขอรับบัตรนักศึกษาที่ทำหาย',
      postOwner: 'เจ้าหน้าที่ห้องทะเบียน',
      date: '20 ก.ย. 2026',
      status: 'APPROVED',
      ownerNote: 'นัดรับของที่ตึกสำนักงานอธิการบดี ชั้น 1 ในวันเวลาราชการ',
    },
    {
      id: 'c-03',
      itemTitle: 'ขอรับกระติกน้ำเก็บความเย็น',
      postOwner: 'นักศึกษา C',
      date: '15 ก.ย. 2026',
      status: 'REJECTED',
      ownerNote: 'ตำหนิตรงฝาไม่ตรงกับของจริงที่เก็บได้ ขออภัยด้วยครับ',
    },
  ]);

  // State 5: รายการประกาศของฉันที่มีคนส่งคำขอเข้ามา (รอการตรวจ)
  const [receivedClaims] = useState([
    {
      id: 'rc-101',
      postTitle: 'พบกระเป๋าสตางค์สีดำ',
      location: 'S4',
      pendingCount: 1,
      latestClaimant: 'นักศึกษา B',
      date: '24 ก.ย. 2026',
    },
  ]);

  // สลับสถานะเปิด/ปิดประกาศ (Open / Close toggle)
  const handleTogglePostStatus = (postId) => {
    setMyPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, status: post.status === 'OPEN' ? 'CLOSED' : 'OPEN' }
          : post
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
        subtitle="ติดตามประกาศที่สร้าง คำขอรับของ และจัดการคำขอตรวจสอบสิ่งของ"
      />

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
            <h3 className="account-stat-number">{myPosts.length} รายการ</h3>
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
            <span className="account-stat-label">คำขอที่ฉันส่ง</span>
            <h3 className="account-stat-number">{sentClaims.length} รายการ</h3>
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
            <h3 className="account-stat-number">1 รายการรอตรวจ</h3>
          </div>
          <span className="account-stat-badge">ไปหน้าตรวจ</span>
        </div>
      </div>

      {/* ============================================================
          2. แถบสลับแท็บเมนู (Tab Navigation)
          ============================================================ */}
      <div className="account-tabs-header">
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
          📤 คำขอที่ฉันส่ง (ตารางสถานะ & หมายเหตุ) ({sentClaims.length})
        </button>
        <button
          type="button"
          className={`account-tab-btn ${activeTab === 'my_received_claims' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('my_received_claims')}
        >
          📥 คำขอที่ฉันได้รับ ({receivedClaims.length})
        </button>
      </div>

      {/* ============================================================
          3. แท็บที่ 1: ประกาศที่ฉันสร้าง (รองรับหลายโพสต์)
          ============================================================ */}
      {activeTab === 'my_posts' && (
        <section>
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
                เปิดอยู่ (OPEN)
              </button>
              <button
                type="button"
                className={`account-filter-pill ${postFilter === 'CLOSED' ? 'is-active' : ''}`}
                onClick={() => setPostFilter('CLOSED')}
              >
                ปิดประกาศแล้ว (CLOSED)
              </button>
            </div>
          </div>

          {/* รายการการ์ดโพสต์ */}
          <div className="account-posts-grid">
            {filteredPosts.map((post) => (
              <div key={post.id} className="account-post-card">
                <div className="account-post-header">
                  <Thumbnail text="รูปโพสต์" />
                  <div className="account-post-details">
                    <h4 className="account-post-title">{post.title}</h4>
                    <p className="account-post-meta">
                      {post.location} · {post.date}
                    </p>
                    <div>
                      {post.status === 'OPEN' ? (
                        <Badge variant="pending">OPEN</Badge>
                      ) : (
                        <Badge variant="neutral">CLOSED</Badge>
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => alert(`เปิดหน้าต่างแก้ไขประกาศ #${post.id}`)}
                  >
                    แก้ไข
                  </Button>
                  <Button
                    variant={post.status === 'OPEN' ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => handleTogglePostStatus(post.id)}
                  >
                    {post.status === 'OPEN' ? 'ปิดประกาศ' : 'เปิดอีกครั้ง'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================
          4. แท็บที่ 2: ตารางคำขอที่ฉันส่ง (ตารางแยก + สถานะ + หมายเหตุ)
          ============================================================ */}
      {activeTab === 'my_sent_claims' && (
        <section>
          <div className="account-table-wrapper">
            <table className="account-data-table">
              <thead>
                <tr>
                  <th>สิ่งของที่ส่งคำขอรับคืน</th>
                  <th>ผู้โพสต์</th>
                  <th>วันที่ส่ง</th>
                  <th>สถานะ</th>
                  <th>หมายเหตุจากเจ้าของโพสต์</th>
                  <th>การกระทำ</th>
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
                      {claim.status === 'APPROVED' && (
                        <Badge variant="success">APPROVED · อนุมัติ</Badge>
                      )}
                      {claim.status === 'REJECTED' && (
                        <Badge variant="danger">REJECTED · ปฏิเสธ</Badge>
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
                        onClick={() => alert(`ขอดูรายละเอียดคำขอ #${claim.id}`)}
                      >
                        ขอดูรายละเอียด
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
          5. แท็บที่ 3: คำขอที่ฉันได้รับ (มีปุ่มไปหน้าตรวจ)
          ============================================================ */}
      {activeTab === 'my_received_claims' && (
        <section className="account-received-list">
          {receivedClaims.map((item) => (
            <Card key={item.id} className="account-received-card">
              <div className="account-received-left">
                <Thumbnail text="รูปโพสต์" />
                <div className="account-received-info">
                  <h4 className="account-received-title">{item.postTitle}</h4>
                  <p className="account-received-meta">
                    สถานที่: {item.location} · คำขอล่าสุดจาก {item.latestClaimant} ({item.date})
                  </p>
                  <div>
                    <Badge variant="count">
                      {item.pendingCount} คำขอที่รอการตรวจสอบ
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

