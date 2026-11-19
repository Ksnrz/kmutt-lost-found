
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  X,
  Search,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { apiRequest } from '../api';
import './Listpost.css';

function Listpost() {
  const location = useLocation();
  return <PostList key={location.key} />;
}

function PostList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [bannerMessage, setBannerMessage] = useState(
    location.state?.successMessage || null
  );

  const buildingParam = searchParams.get('building');
  const typeParam = searchParams.get('type');

  const normalizedType = typeParam === 'เจอของ' ? 'พบของ' : typeParam;

  const [activeFilter, setActiveFilter] = useState(
    normalizedType && ['ของหาย', 'พบของ'].includes(normalizedType)
      ? normalizedType
      : 'ทั้งหมด'
  );

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [requestedPage, setCurrentPage] = useState(1);

  const POSTS_PER_PAGE = 8;

  // โหลดข้อมูลโพสต์ และสามารถสั่งโหลดใหม่ได้
  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await apiRequest('/posts');

        if (isMounted) {
          setPosts(data.posts || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'เกิดข้อผิดพลาดในการโหลดโพสต์');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handleRetry = () => {
    setReloadKey((key) => key + 1);
  };

  const typeLabel = (post) =>
    post.post_type === 'FOUND' ? 'พบของ' : 'ของหาย';

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredPosts = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return posts
      .filter((post) =>
        !buildingParam || post.building_name === buildingParam
      )
      .filter(
        (post) =>
          activeFilter === 'ทั้งหมด' ||
          typeLabel(post) === activeFilter
      )
      .filter((post) => {
        if (!keyword) return true;

        const searchableText = [
          post.title,
          post.description,
          post.building_name,
          typeLabel(post),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .sort((a, b) => {
        const dateA = new Date(a.event_date).getTime() || 0;
        const dateB = new Date(b.event_date).getTime() || 0;

        return sortOrder === 'newest'
          ? dateB - dateA
          : dateA - dateB;
      });
  }, [posts, buildingParam, activeFilter, searchText, sortOrder]);

  const totalPages = Math.ceil(
    filteredPosts.length / POSTS_PER_PAGE
  );

  const currentPage = Math.min(requestedPage, Math.max(totalPages, 1));

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  return (
    <div className="listpost-page">
      <div className="listpost-container">
        <PageHeader
          className="listpost-page-header"
          backText={buildingParam ? 'กลับแผนที่' : undefined}
          onBack={buildingParam ? () => navigate('/map') : undefined}
          tag="CAMPUS POSTS"
          title={
            buildingParam
              ? `รายการโพสต์อาคาร ${buildingParam}`
              : 'รายการโพสต์'
          }
          subtitle={buildingParam ? 'ดูสิ่งของที่หายและพบในอาคารนี้' : 'ดูสิ่งของที่หายและพบในมหาวิทยาลัย'}
        />

        {/* Search และ Sort */}
        <div className="listpost-tools">
          <div className="listpost-search">
            <Search size={18} aria-hidden="true" />

            <input
              type="search"
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ค้นหาชื่อสิ่งของหรือรายละเอียด..."
              aria-label="ค้นหาโพสต์"
            />
          </div>

          <select
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value)}
            aria-label="เรียงตามวันที่"
          >
            <option value="newest">วันที่: ใหม่ไปเก่า</option>
            <option value="oldest">วันที่: เก่าไปใหม่</option>
          </select>
        </div>

        {bannerMessage && (
          <div className="listpost-success-banner" role="status">
            <div className="listpost-banner-content">
              <CheckCircle2
                size={18}
                className="listpost-banner-icon"
              />
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

        <div className="filter-container">
          {['ทั้งหมด', 'ของหาย', 'พบของ'].map((filter) => (
            <button
              key={filter}
              type="button"
              className={`filter-btn ${
                activeFilter === filter ? 'active' : ''
              }`}
              onClick={() => handleFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <h2 className="post-count">
          พบ {filteredPosts.length} โพสต์
        </h2>

        {/* Loading Skeleton */}
        {loading && (
          <div
            className="post-grid"
            aria-label="กำลังโหลดโพสต์"
            aria-busy="true"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="post-card skeleton-card" key={index}>
                <div className="skeleton-image" />
                <div className="post-content">
                  <div className="skeleton-badge" />
                  <div className="skeleton-title" />
                  <div className="skeleton-text" />
                  <div className="skeleton-button" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            className="listpost-empty-box listpost-error-box"
            role="alert"
          >
            <div className="listpost-empty-icon-wrap">
              <AlertCircle
                size={38}
                className="listpost-error-icon"
              />
            </div>

            <h3 className="listpost-empty-title">
              โหลดโพสต์ไม่สำเร็จ
            </h3>

            <p className="listpost-empty-subtitle">
              {error}
            </p>

            <div className="listpost-empty-actions">
              <button
                type="button"
                className="filter-btn active"
                onClick={handleRetry}
              >
                <RefreshCw
                  size={15}
                  style={{ marginRight: '6px' }}
                />
                ลองอีกครั้ง
              </button>
            </div>
          </div>
        )}

        {/* Posts หรือ Empty State */}
        {!loading && !error && (
          filteredPosts.length > 0 ? (
            <>
              <div className="post-grid">
                {paginatedPosts.map((post) => (
                  <div className="post-card" key={post.post_id}>
                    <div className="post-image">
                      {post.images?.length > 0 ? (
                        <img
                          src={post.images[0].item_image_url}
                          alt={post.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        'รูปสิ่งของ'
                      )}
                    </div>

                    <div className="post-content">
                      <Badge
                        variant={
                          post.post_type === 'FOUND' ? 'found' : 'lost'
                        }
                      >
                        {typeLabel(post)}
                      </Badge>

                      <h3 className="post-title">
                        {post.title}
                      </h3>

                      <div className="post-footer">
                        <p className="post-date">
                          {post.building_name || '-'} ·{' '}
                          {formatDate(post.event_date)}
                        </p>

                        <button
                          type="button"
                          className="detail-btn"
                          onClick={() =>
                            navigate(`/posts/${post.post_id}`, { state: { from: `/posts${location.search}` } })
                          }
                        >
                          ดูรายละเอียด →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="listpost-pagination"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    margin: '28px 0',
                  }}
                >
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage(currentPage - 1)
                    }
                    style={paginationButtonStyle(
                      currentPage === 1
                    )}
                  >
                    ก่อนหน้า
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={
                        currentPage === page ? 'page' : undefined
                      }
                      style={{
                        ...paginationButtonStyle(false),
                        background:
                          currentPage === page ? '#f97316' : '#fff',
                        color:
                          currentPage === page ? '#fff' : '#333',
                        borderColor:
                          currentPage === page ? '#f97316' : '#ddd',
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage(currentPage + 1)
                    }
                    style={paginationButtonStyle(
                      currentPage === totalPages
                    )}
                  >
                    ถัดไป
                  </button>
                </div>
              )}

              <p
                style={{
                  textAlign: 'center',
                  color: '#777',
                  fontSize: '13px',
                  marginTop: '12px',
                  marginBottom: '20px',
                }}
              >
                หน้า {currentPage} จาก {totalPages || 1}
                {' · '}
                แสดง {paginatedPosts.length} จาก {filteredPosts.length} โพสต์
              </p>
            </>
          ) : (
            <div className="listpost-empty-box">
              <EmptyState
                as="h2"
                title={`ไม่พบประกาศ${activeFilter === 'ทั้งหมด' ? 'ทุกประเภท' : `ประเภท “${activeFilter}”`}${buildingParam ? `ในอาคาร ${buildingParam}` : ''}`}
                description="ลองเปลี่ยนคำค้นหาหรือตัวกรองอีกครั้ง"
                actions={
                  <>
                    <Button variant="secondary" onClick={() => {
                      setActiveFilter('ทั้งหมด');
                      setSearchText('');
                      setCurrentPage(1);
                    }}>
                      ล้างตัวกรองและคำค้นหา
                    </Button>
                    <Button onClick={() => navigate('/map')}>กลับไปดูแผนที่</Button>
                  </>
                }
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

function paginationButtonStyle(disabled) {
  return {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    color: disabled ? '#aaa' : '#333',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontSize: '14px',
  };
}

export default Listpost;
