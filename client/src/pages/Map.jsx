import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import campusMap from '../assets/map/map_kmutt.jpg';
import searchIcon from '../assets/map/search.svg';
import BuildingPicker from '../components/BuildingPicker';
import './Map.css';

export default function Map() {
  const navigate = useNavigate();

  // State
  const [postType, setPostType] = useState('all'); // 'all' | 'found' | 'lost'
  const [selectedBuilding, setSelectedBuilding] = useState('S1');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedBuilding) {
      params.set('building', selectedBuilding);
    }
    // 'all' sends no type, so the list page shows every type
    if (postType !== 'all') {
      params.set('type', postType === 'lost' ? 'ของหาย' : 'พบของ');
    }
    navigate(`/posts?${params.toString()}`);
  };

  return (
    <div className="map-page">
      <div className="map-container">
        <header className="map-heading">
          <h1>เลือก<span>สถานที่</span></h1>
          <p>เลือกตึกเพื่อดูประกาศของหายและพบของ</p>
        </header>
        {/* Toolbar: ตัวเลือกประเภทโพสต์ */}
        <div className="map-toolbar">
          <div className="map-tabs">
            <label>
              <input
                type="radio"
                name="postType"
                value="all"
                checked={postType === 'all'}
                onChange={() => setPostType('all')}
              />
              <span>ทั้งหมด</span>
            </label>
            <label>
              <input
                type="radio"
                name="postType"
                value="lost"
                checked={postType === 'lost'}
                onChange={() => setPostType('lost')}
              />
              <span>ของหาย</span>
            </label>
            <label>
              <input
                type="radio"
                name="postType"
                value="found"
                checked={postType === 'found'}
                onChange={() => setPostType('found')}
              />
              <span>พบของ</span>
            </label>
          </div>
        </div>

        {/* Content: ฝั่งซ้ายตัวกรองอาคาร - ฝั่งขวาแผนที่ มจธ. */}
        <div className="map-content">
          <aside className="map-sidebar">
            <div className="map-filter">
              <h2 className="map-filter-heading">สถานที่ <span>*</span></h2>
              <BuildingPicker value={selectedBuilding} onChange={setSelectedBuilding} defaultOpen />
            </div>
            <button className="map-search" type="button" onClick={handleSearch}>
              <img src={searchIcon} alt="" aria-hidden="true" />
              <span>ค้นหา</span>
            </button>
          </aside>

          <div className="map-image">
            <img src={campusMap} alt="แผนที่มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี แสดงอาคารโซน S และ N" />
          </div>
        </div>
      </div>
    </div>
  );
}
