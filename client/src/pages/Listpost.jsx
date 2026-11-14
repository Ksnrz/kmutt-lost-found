import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Inbox, CheckCircle2, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import { apiRequest } from '../api';
import './Listpost.css';

function Listpost() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [bannerMessage, setBannerMessage] = useState(
    location.state?.successMessage || null
  );

  const buildingParam = searchParams.get('building');
  const typeParam = searchParams.get('type');

  // รองรับทั้ง 'พบของ' และ 'เจอของ' เพื่อความเข้ากันได้
  const normalizedType = typeParam === 'เจอของ' ? 'พบของ' : typeParam;

  const [activeFilter, setActiveFilter] = useState(
    normalizedType && ['ของหาย', 'พบของ'].includes(normalizedType) ? normalizedType : 'ทั้งหมด'
  );

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiRequest('/posts');
        setPosts(data.posts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const typeLabel = (post) => (post.post_type === 'FOUND' ? 'พบของ' : 'ของหาย');

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredPosts = posts
    .filter((post) => !buildingParam || post.building_name === buildingParam)
    .filter((post) => activeFilter === 'ทั้งหมด' || typeLabel(post) === activeFilter);

  return (
    <div className="listpost-page">
      <div className="listpost-container">
        {/* Header พร้อม Tag ส้มภาษาอังกฤษตามดีไซน์ */}
        <PageHeader
          backText="กลับแผนที่"
          onBack={() => navigate('/map')}
          tag="CAMPUS POSTS"
          title={buildingParam ? `รายการโพสต์อาคาร ${buildingParam}` : 'รายการโพสต์'}
          subtitle="ดูสิ่งของที่หายและพบในอาคารนี้"
        />

        {/* แถบแจ้งเตือนเมื่อสร้างโพสต์สำเร็จ */}
        {bannerMessage && (
          <div className="listpost-success-banner" role="status">
            <div className="listpost-banner-content">
              <CheckCircle2 size={18} className="listpost-banner-icon" />
              <span>{bannerMessage}</span>
            </div>
            <button
              type="button"
              className="listpost-banner-close"
              onClick={() => setBannerMessage(null)}
              aria-label="ปิดการแจ้งเตือน"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="filter-container">
          {['ทั้งหมด', 'ของหาย', 'พบของ'].map(filter => (
            <button
              key={filter}
              type="button"
              className={`filter-btn ${
                activeFilter === filter ? 'active' : ''
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Post count */}
        <h2 className="post-count">
          พบ {filteredPosts.length} โพสต์
        </h2>

        {loading && <p>กำลังโหลดโพสต์...</p>}

        {error && (
          <p style={{ color: 'red' }}>
            โหลดโพสต์ไม่สำเร็จ: {error}
          </p>
        )}

        {/* Post Grid หรือ Empty State หากไม่พบโพสต์ */}
        {loading || error ? null : filteredPosts.length > 0 ? (
          <div className="post-grid">
            {filteredPosts.map(post => (
              <div className="post-card" key={post.post_id}>
                <div className="post-image">
                  {post.images?.length > 0 ? (
                    <img
                      src={`http://localhost:3000${post.images[0].item_image_url}`}
                      alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    'รูปสิ่งของ'
                  )}
                </div>

                <div className="post-content">
                  <Badge variant={post.post_type === 'FOUND' ? 'found' : 'lost'}>
                    {typeLabel(post)}
                  </Badge>

                  <h3 className="post-title">
                    {post.title}
                  </h3>

                  <div className="post-footer">
                    <p className="post-date">
                      {post.building_name || '-'} · {formatDate(post.event_date)}
                    </p>

                    <button
                      type="button"
                      className="detail-btn"
                      onClick={() => navigate(`/posts/${post.post_id}`)}
                    >
                      ดูรายละเอียด →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="listpost-empty-box">
            <div className="listpost-empty-icon-wrap">
              <Inbox size={38} className="listpost-empty-icon" />
            </div>
            <h3 className="listpost-empty-title">
              ไม่พบประกาศ{activeFilter !== 'ทั้งหมด' ? `ประเภท "${activeFilter}"` : ''}{buildingParam ? ` ในอาคาร ${buildingParam}` : ''}
            </h3>
            <p className="listpost-empty-subtitle">
              ยังไม่มีผู้แจ้งของหายหรือพบของที่ตรงกับเงื่อนไข{buildingParam ? ` ในอาคาร ${buildingParam}` : ''} ลองสลับตัวกรอง หรือค้นหาอาคารอื่นบนแผนที่
            </p>
            <div className="listpost-empty-actions">
              {activeFilter !== 'ทั้งหมด' && (
                <button
                  type="button"
                  className="filter-btn"
                  onClick={() => setActiveFilter('ทั้งหมด')}
                >
                  ดูทั้งหมดในอาคารนี้
                </button>
              )}
              <button
                type="button"
                className="filter-btn active"
                onClick={() => navigate('/map')}
              >
                กลับไปดูแผนที่
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Listpost;
