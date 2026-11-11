import { useNavigate } from 'react-router-dom';
import campusMap from '../assets/map/map_kmutt.jpg';
import searchIcon from '../assets/map/search.svg';
import locationIcon from '../assets/map/location.svg';
import chevronIcon from '../assets/map/chevron.svg';
import './Map.css';

const southBuildings = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15'];
const northBuildings = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'N11', 'N12', 'N14', 'N15', 'N16', 'N17', 'N18', 'N19', 'N20'];

export default function Map() {
  const navigate = useNavigate();

  return (
    <div className="map-page">
      <div className="map-container">
        {/* Toolbar: ตัวเลือกประเภทโพสต์ และปุ่มสร้างโพสต์ */}
        <div className="map-toolbar">
          <div className="map-tabs">
            <label>
              <input type="radio" name="postType" value="lost" />
              <span>ของหาย</span>
            </label>
            <label>
              <input type="radio" name="postType" value="found" defaultChecked />
              <span>เจอของ</span>
            </label>
          </div>
          <button className="map-create" type="button" onClick={() => navigate('/posts/new')}>
            + สร้างโพสต์
          </button>
        </div>

        {/* Content: ฝั่งซ้ายตัวกรองอาคาร - ฝั่งขวาแผนที่ มจธ. */}
        <div className="map-content">
          <aside className="map-sidebar">
            <div className="map-filter">
              <h2 className="map-filter-heading">สถานที่ <span>*</span></h2>
              <details className="map-location" open>
                <summary>
                  <img src={locationIcon} alt="" aria-hidden="true" />
                  <span>เลือกสถานที่ / ค้นหาตึก...</span>
                  <img className="map-chevron" src={chevronIcon} alt="" aria-hidden="true" />
                </summary>
                <div className="map-dropdown">
                  <input className="map-building-search" type="search" placeholder="ค้นหาตึก เช่น S1, N2, โรงอาหาร..." />
                  <div className="map-building-list">
                    <div className="map-zone map-zone-south">
                      <h3>โซน S (อาคารเรียน)</h3>
                      {southBuildings.map((building) => (
                        <label className="map-building" key={building}>
                          <input type="radio" name="building" value={building} defaultChecked={building === 'S1'} />
                          <span>{building}</span>
                        </label>
                      ))}
                    </div>
                    <div className="map-zone map-zone-north">
                      <h3>โซน N (อาคารและคณะต่าง ๆ)</h3>
                      {northBuildings.map((building) => (
                        <label className="map-building" key={building}>
                          <input type="radio" name="building" value={building} />
                          <span>{building}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            </div>
            <button className="map-search" type="button">
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
