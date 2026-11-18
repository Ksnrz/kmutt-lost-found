import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Thumbnail from '../../components/ui/Thumbnail';
import { apiRequest } from '../../api';
import './AccountPage.css';

export default function ReceivedRequestsPage() {
  const navigate = useNavigate();
  const [receivedClaims, setReceivedClaims] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    apiRequest('/me/posts', { signal: controller.signal })
      .then(({ posts }) => setReceivedClaims(posts.filter((post) => Number(post.pending_count) > 0)))
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error.status === 401) {
          navigate('/login', { replace: true });
        } else {
          setLoadError(error.message);
        }
      });
    return () => controller.abort();
  }, [navigate]);

  return (
    <div className="account-page-container">
      <PageHeader
        tag="PENDING REQUESTS"
        title="รออนุมัติ"
        subtitle="ตรวจสอบคำขอรับคืนที่คุณได้รับ"
      />
      {loadError && <p className="account-load-error" role="alert">{loadError}</p>}
      {!receivedClaims && !loadError && <p role="status">กำลังโหลดคำขอ…</p>}
      <section className="account-received-list" aria-labelledby="received-claims-heading">
        <h2 id="received-claims-heading" className="profile-card-title">คำขอที่ฉันได้รับ</h2>
        {receivedClaims?.length === 0 && (
          <div className="account-empty-state">
            <EmptyState title="ยังไม่มีคำขอที่รอตรวจ" />
          </div>
        )}
        {receivedClaims?.map((item) => (
          <Card key={item.post_id} className="account-received-card">
            <div className="account-received-left">
              <Thumbnail text="รูปโพสต์" src={item.image_url} />
              <div className="account-received-info">
                <h3 className="account-received-title">{item.title}</h3>
                <p className="account-received-meta">
                  สถานที่: {item.building_name}
                </p>
                <div>
                  <Badge variant="count">
                    {item.pending_count} คำขอรอตรวจ
                  </Badge>
                </div>
              </div>
            </div>

            <div className="account-received-actions">
              <Button
                variant="primary"
                onClick={() => navigate(`/posts/${item.post_id}/review`, { state: { from: '/requests/review' } })}
              >
                ตรวจสอบคำขอ
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
