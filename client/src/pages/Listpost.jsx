import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import './Listpost.css';

function Listpost() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const buildingParam = searchParams.get('building') || 'S4';
  const typeParam = searchParams.get('type');

  // รองรับทั้ง 'พบของ' และ 'เจอของ' เพื่อความเข้ากันได้
  const normalizedType = typeParam === 'เจอของ' ? 'พบของ' : typeParam;

  const [activeFilter, setActiveFilter] = useState(
    normalizedType && ['ของหาย', 'พบของ'].includes(normalizedType) ? normalizedType : 'ทั้งหมด'
  );

  const posts = [
    {
      id: 1,
      type: 'พบของ',
      title: 'พบกระเป๋าสตางค์สีดำ',
      location: 'ชั้น 1',
      date: '23 ก.ย. 2026'
    },
    {
      id: 2,
      type: 'ของหาย',
      title: 'ตามหากุญแจรถ',
      location: 'ชั้น 2',
      date: '22 ก.ย. 2026'
    },
    {
      id: 3,
      type: 'พบของ',
      title: 'พบหูฟังไร้สาย',
      location: 'โถงกลาง',
      date: '21 ก.ย. 2026'
    },
    {
      id: 4,
      type: 'ของหาย',
      title: 'ตามหาบัตรนักศึกษา',
      location: 'ห้องสมุดชั้น 2',
      date: '20 ก.ย. 2026'
    },
    {
      id: 5,
      type: 'พบของ',
      title: 'พบขวดน้ำสแตนเลส',
      location: 'ชั้น 3',
      date: '19 ก.ย. 2026'
    },
    {
      id: 6,
      type: 'ของหาย',
      title: 'ตามหากระเป๋าผ้า',
      location: 'หอพักใน',
      date: '18 ก.ย. 2026'
    }
  ];

  const filteredPosts =
    activeFilter === 'ทั้งหมด'
      ? posts
      : posts.filter(post => post.type === activeFilter);

  return (
    <div className="listpost-page">
      <div className="listpost-container">
        {/* Header พร้อม Tag ส้มภาษาอังกฤษตามดีไซน์ */}
        <PageHeader
          backText="กลับแผนที่"
          onBack={() => navigate('/map')}
          tag="CAMPUS POSTS"
          title={`รายการโพสต์อาคาร ${buildingParam}`}
          subtitle="ดูสิ่งของที่หายและพบในอาคารนี้"
        />

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

        {/* Post Grid (Responsive Full Width) */}
        <div className="post-grid">
          {filteredPosts.map(post => (
            <div className="post-card" key={post.id}>
              <div className="post-image">
                รูปสิ่งของ
              </div>

              <div className="post-content">
                <Badge variant={post.type === 'พบของ' ? 'found' : 'lost'}>
                  {post.type}
                </Badge>

                <h3 className="post-title">
                  {post.title}
                </h3>

                <div className="post-footer">
                  <p className="post-date">
                    {buildingParam} {post.location} · {post.date}
                  </p>

                  <button
                    type="button"
                    className="detail-btn"
                    onClick={() => navigate(`/posts/${post.id}`)}
                  >
                    ดูรายละเอียด →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Listpost;
