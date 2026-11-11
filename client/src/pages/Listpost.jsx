
import { useState } from 'react';
import BackButton from '../components/BackButton';
import './Listpost.css';

function Listpost() {
  const [activeFilter, setActiveFilter] = useState('ทั้งหมด');

  const posts = [
    {
      id: 1,
      type: 'เจอของ',
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
      type: 'เจอของ',
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
      type: 'เจอของ',
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
    <div className="listpost-container">

      <BackButton text="กลับแผนที่" />

      {/* Header */}
      <div className="header-flex-container">
        <div>
          <h1 className="header-title">
            รายการโพสต์อาคาร S4
          </h1>

          <p className="subtitle">
            ดูสิ่งของที่หายและพบในอาคารนี้
          </p>
        </div>

        <button className="create-btn">
          + สร้างโพสต์
        </button>
      </div>

      {/* Filter */}
      <div className="filter-container">
        {['ทั้งหมด', 'ของหาย', 'เจอของ'].map(filter => (
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

      {/* Post count */}
      <h2 className="post-count">
        พบ {filteredPosts.length} โพสต์
      </h2>

      {/* Post Grid */}
      <div className="post-grid">
        {filteredPosts.map(post => (
          <div className="post-card" key={post.id}>

            <div className="post-image">
              รูปสิ่งของ
            </div>

            <div className="post-content">

              <span className={`status-badge ${
                post.type === 'เจอของ' ? 'found' : 'lost'
              }`}>
                {post.type}
              </span>

              <h3 className="post-title">
                {post.title}
              </h3>

              <div className="post-footer">
                <p className="post-date">
                  S4 {post.location} · {post.date}
                </p>

                <button className="detail-btn">
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
