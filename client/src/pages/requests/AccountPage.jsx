import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Button from '../../components/ui/Button';
import Thumbnail from '../../components/ui/Thumbnail';
import Badge from '../../components/ui/Badge';
import { claimService } from '../../services/claimService';
import { apiRequest } from '../../api';
import './AccountPage.css';

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-';

const activityTabs = [
  { id: 'posts', label: 'ประกาศที่ฉันสร้าง' },
  { id: 'claims', label: 'คำขอของฉัน' },
];

function ClaimThumbnail({ src }) {
  const [failed, setFailed] = useState(false);

  return src && !failed
    ? <Thumbnail text="รูป" src={src} onError={() => setFailed(true)} />
    : <Thumbnail text="รูป" />;
}

export default function AccountPage({ claimNotifications }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const selectedClaimId = params.get('claim');
  const selectedClaimRef = useRef(null);

  const [bannerMessage, setBannerMessage] = useState(
    location.state?.successMessage || null
  );

  const [activeTab, setActiveTab] = useState(
    selectedClaimId || params.get('tab') === 'claims'
      ? 'claims'
      : 'posts'
  );

  const { notifications, unreadCount } = claimNotifications;

  const unreadClaimIds = new Set(
    (notifications ?? [])
      .filter((entry) => !entry.read_at)
      .map((entry) => String(entry.verify_id))
  );

  const [claimToCancel, setClaimToCancel] = useState(null);

  // ตัวกรองสถานะประกาศ
  const [postFilter, setPostFilter] = useState('all');

  const [myPosts, setMyPosts] = useState(null);
  const [sentClaims, setSentClaims] = useState(null);
  const [sentClaimsError, setSentClaimsError] = useState('');
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

  const loadSentClaims = () => {
    return claimService.getMyClaims()
      .then((claims) => {
        setSentClaims(claims);
        setSentClaimsError('');
      })
      .catch((err) =>
        setSentClaimsError(
          err.message || 'ไม่สามารถโหลดคำขอที่ส่งได้'
        )
      );
  };

  useEffect(() => {
    loadMyPosts();
    loadSentClaims();
  }, []);

  useEffect(() => {
    if (
      activeTab !== 'claims' ||
      !sentClaims ||
      !selectedClaimRef.current
    ) return;

    selectedClaimRef.current.focus({ preventScroll: true });
    selectedClaimRef.current.scrollIntoView({
      block: 'center',
      inline: 'nearest',
    });
  }, [activeTab, sentClaims]);

  const openPost = (post) =>
    navigate(`/posts/${post.post_id}`, {
      state: {
        from: 'account',
        isOwner: true,
      },
    });

  // เปิดรายละเอียดคำขอ
  const openClaim = (claim) => {
    navigate(`/posts/${claim.post_id}`, {
      state: {
        from: 'account',
        claim,
        readClaimOnOpen: true,
        post: {
          finderName: claim.postOwner,
        },
      },
    });
  };

  // กรองประกาศตามสถานะ
  const filteredPosts = myPosts?.filter((post) => {
    if (postFilter === 'all') return true;
    return post.status === postFilter;
  });

  return (
    <div className="profile-activities">

      {/* แบนเนอร์แจ้งเตือนสำเร็จ */}
      {bannerMessage && (
        <div className="account-success-banner" role="status">
          <div className="account-banner-content">
            <CheckCircle2
              size={18}
              className="account-banner-icon-lucide"
            />
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

      {/* แท็บกิจกรรม */}
      <div
        className="profile-tabs"
        role="tablist"
        aria-label="กิจกรรมของฉัน"
      >
        {activityTabs.map(({ id, label }, index) => (
          <button
            key={id}
            type="button"
            id={`profile-tab-${id}`}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`profile-panel-${id}`}
            tabIndex={activeTab === id ? 0 : -1}
            onClick={() => setActiveTab(id)}
            onKeyDown={(event) => {
              const last = activityTabs.length - 1;

              const next = {
                ArrowLeft: index === 0 ? last : index - 1,
                ArrowRight: index === last ? 0 : index + 1,
                Home: 0,
                End: last,
              }[event.key];

              if (next === undefined) return;

              event.preventDefault();
              setActiveTab(activityTabs[next].id);
              event.currentTarget.parentElement.children[next].focus();
            }}
          >
            {label}

            {id === 'claims' && unreadCount > 0 && (
              <span
                className="profile-tab-badge"
                aria-label={`ยังไม่อ่าน ${unreadCount} รายการ`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* =========================
          ประกาศที่ฉันสร้าง
      ========================= */}
      <section
        id="profile-panel-posts"
        role="tabpanel"
        aria-labelledby="profile-tab-posts"
        hidden={activeTab !== 'posts'}
      >
        {loadError && (
          <p className="account-load-error" role="alert">
            {loadError}
          </p>
        )}

        {/* ตัวกรองสถานะ */}
        <div className="account-filter-bar">
          <div className="account-pill-filters">

            <button
              type="button"
              className={`account-filter-pill ${
                postFilter === 'all' ? 'is-active' : ''
              }`}
              onClick={() => setPostFilter('all')}
            >
              ทั้งหมด {myPosts && `(${myPosts.length})`}
            </button>

            <button
              type="button"
              className={`account-filter-pill ${
                postFilter === 'OPEN' ? 'is-active' : ''
              }`}
              onClick={() => setPostFilter('OPEN')}
            >
              เปิดรับคำขอ (OPEN)
            </button>

            <button
              type="button"
              className={`account-filter-pill ${
                postFilter === 'CLOSED' ? 'is-active' : ''
              }`}
              onClick={() => setPostFilter('CLOSED')}
            >
              ส่งมอบสำเร็จแล้ว (CLOSED)
            </button>

            <button
              type="button"
              className={`account-filter-pill ${
                postFilter === 'CANCELLED' ? 'is-active' : ''
              }`}
              onClick={() => setPostFilter('CANCELLED')}
            >
              ยกเลิกโพสต์ (CANCELLED)
            </button>

          </div>
        </div>

        {/* กำลังโหลด */}
        {!myPosts && !loadError && (
          <p role="status">กำลังโหลดประกาศ…</p>
        )}

        {/* ไม่มีประกาศ */}
        {myPosts?.length === 0 && (
          <div className="account-empty-state">
            <EmptyState
              title="ยังไม่มีประกาศที่คุณสร้าง"
              actions={
                <Button onClick={() => navigate('/posts/new')}>
                  สร้างประกาศใหม่
                </Button>
              }
            />
          </div>
        )}

        {/* ไม่พบประกาศตามตัวกรอง */}
        {myPosts?.length > 0 && filteredPosts.length === 0 && (
          <div className="account-empty-state">
            <EmptyState
              title="ไม่พบประกาศในสถานะนี้"
              description="ลองเลือกสถานะอื่น"
            />
          </div>
        )}

        {/* รายการโพสต์ */}
        {filteredPosts?.length > 0 && (
          <div className="account-posts-list">

            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="account-post-card"
              >

                <div
                  className="account-post-header account-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => openPost(post)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openPost(post);
                    }
                  }}
                >
                  <Thumbnail
                    text="รูปโพสต์"
                    src={post.image_url}
                  />

                  <div className="account-post-details">

                    <h3 className="account-post-title">
                      {post.title}
                    </h3>

                    <p className="account-post-meta">
                      {post.location} · {post.date}
                    </p>

                    <div className="account-post-badges">

                      {/* ประเภทโพสต์ */}
                      {post.post_type === 'LOST' ? (
                        <Badge variant="lost">
                          ของหาย
                        </Badge>
                      ) : (
                        <Badge variant="found">
                          พบของ
                        </Badge>
                      )}

                      {/* สถานะโพสต์ */}
                      {post.status === 'OPEN' && (
                        <Badge variant="success">
                          OPEN · เปิดรับคำขอ
                        </Badge>
                      )}

                      {post.status === 'CLOSED' && (
                        <Badge variant="completed">
                          CLOSED · ส่งมอบแล้ว
                        </Badge>
                      )}

                      {post.status === 'CANCELLED' && (
                        <Badge variant="danger">
                          CANCELLED · ยกเลิก
                        </Badge>
                      )}

                    </div>
                  </div>
                </div>

                {/* แสดงปุ่มแก้ไขเฉพาะโพสต์ OPEN */}
                {post.status === 'OPEN' && (
                  <div className="account-post-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/posts/${post.post_id}/edit`,
                          {
                            state: {
                              from: 'account',
                            },
                          }
                        )
                      }
                    >
                      แก้ไขโพสต์
                    </Button>
                  </div>
                )}

              </div>
            ))}

          </div>
        )}
      </section>

      {/* =========================
          คำขอของฉัน
      ========================= */}
      <section
        id="profile-panel-claims"
        role="tabpanel"
        aria-labelledby="profile-tab-claims"
        tabIndex={0}
        hidden={activeTab !== 'claims'}
      >

        {sentClaimsError && (
          <p className="account-load-error" role="alert">
            {sentClaimsError}
          </p>
        )}

        {!sentClaims && !sentClaimsError && (
          <p role="status">กำลังโหลดคำขอ…</p>
        )}

        {!sentClaimsError && sentClaims?.length === 0 && (
          <div className="account-empty-state">
            <EmptyState title="ยังไม่มีคำขอของคุณ" />
          </div>
        )}

        {sentClaims?.length > 0 && (
          <div className="account-table-wrapper">

            <table className="account-data-table">

              <caption className="sr-only">
                ตารางรายการคำขอที่ฉันส่งและสถานะ
              </caption>

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
                  <tr
                    key={claim.id}
                    ref={
                      String(claim.verify_id) === selectedClaimId
                        ? selectedClaimRef
                        : null
                    }
                    className={
                      unreadClaimIds.has(String(claim.verify_id))
                        ? 'account-unread-claim'
                        : undefined
                    }
                    tabIndex={
                      String(claim.verify_id) === selectedClaimId
                        ? -1
                        : undefined
                    }
                  >

                    <td>
                      <div
                        className="account-table-item account-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => openClaim(claim)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openClaim(claim);
                          }
                        }}
                      >
                        <ClaimThumbnail
                          key={claim.item_image_url}
                          src={claim.item_image_url}
                        />

                        <span className="account-table-item-title">
                          {claim.itemTitle}
                          <span className="account-table-sub-id">
                            #{claim.verify_id}
                          </span>
                        </span>
                      </div>
                    </td>

                    <td>{claim.postOwner}</td>

                    <td>{formatDate(claim.created_at)}</td>

                    <td>
                      <div className="account-claim-status">

                        {claim.status === 'PENDING' && (
                          <Badge variant="pending">
                            PENDING · รอตรวจ
                          </Badge>
                        )}

                        {claim.status === 'ACCEPTED' && (
                          <Badge variant="success">
                            ACCEPTED · ตอบรับแล้ว
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

                        {claim.status === 'COMPLETED' && (
                          <Badge variant="completed">
                            COMPLETED · สำเร็จ
                          </Badge>
                        )}

                        {unreadClaimIds.has(String(claim.verify_id)) && (
                          <span className="account-unread-label">
                            ยังไม่อ่าน
                          </span>
                        )}

                      </div>
                    </td>

                    <td>
                      <div
                        className={`account-table-note ${
                          claim.ownerNote ? 'has-note' : ''
                        }`}
                      >
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
                            onClick={() =>
                              setClaimToCancel(claim.verify_id)
                            }
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
        )}
      </section>

      {/* Modal ยืนยันการยกเลิกคำขอ */}
      {claimToCancel !== null && (
        <ConfirmModal
          title="ยืนยันการยกเลิกคำขอ"
          description={`ต้องการยกเลิกคำขอ #${claimToCancel} ใช่หรือไม่?`}
          confirmText="ยกเลิกคำขอ"
          icon={XCircle}
          onConfirm={async () => {
            await claimService.cancelClaim(claimToCancel);
            setBannerMessage('ยกเลิกคำขอของคุณเรียบร้อยแล้ว');
            loadSentClaims();
          }}
          onClose={() => setClaimToCancel(null)}
        />
      )}

    </div>
  );
}