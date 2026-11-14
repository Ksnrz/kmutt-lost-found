
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import BackButton from '../components/BackButton';
import './Listpost.css';

function Listpost() {
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('ทั้งหมด');
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

  const filteredPosts =
    activeFilter === 'ทั้งหมด'
      ? posts
      : posts.filter((post) =>
          post.post_type === (activeFilter === 'ของหาย' ? 'LOST' : 'FOUND')
        );

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="listpost-container">
      <BackButton text="กลับแผนที่" />

      <div className="header-flex-container">
        <div>
          <h1 className="header-title">รายการโพสต์</h1>
          <p className="subtitle">
            ดูสิ่งของที่หายและพบในอาคารนี้
          </p>
        </div>

        <button
          className="create-btn"
          onClick={() => navigate('/posts/new')}
        >
          + สร้างโพสต์
        </button>
      </div>

      <div className="filter-container">
        {['ทั้งหมด', 'ของหาย', 'เจอของ'].map((filter) => (
          <button
            key={filter}
            className={`filter-btn ${
              activeFilter === filter ? 'active' : ''
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <h2 className="post-count">
        พบ {filteredPosts.length} โพสต์
      </h2>

      {loading && <p>กำลังโหลดโพสต์...</p>}

      {error && (
        <p style={{ color: 'red' }}>
          โหลดโพสต์ไม่สำเร็จ: {error}
        </p>
      )}

      {!loading && !error && filteredPosts.length === 0 && (
        <p>ยังไม่มีโพสต์ในหมวดหมู่นี้</p>
      )}

      <div className="post-grid">
        {filteredPosts.map((post) => (
          <div className="post-card" key={post.post_id}>
            <div className="post-image">
              {post.images?.length > 0 ? (
                <img
                  src={`http://localhost:3000${post.images[0].image_url}`}
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
              <span
                className={`status-badge ${
                  post.post_type === 'FOUND' ? 'found' : 'lost'
                }`}
              >
                {post.post_type === 'FOUND' ? 'เจอของ' : 'ของหาย'}
              </span>

              <h3 className="post-title">{post.title}</h3>

              <div className="post-footer">
                <p className="post-date">
                  {post.building_name || '-'} · {formatDate(post.event_date)}
                </p>

                <button
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
    </div>
  );
}

export default Listpost;
