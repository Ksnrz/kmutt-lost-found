import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import campusMap from '../assets/map/map_kmutt.jpg';
import searchIcon from '../assets/map/search.svg';
import locationIcon from '../assets/map/location.svg';
import chevronIcon from '../assets/map/chevron.svg';
import './Map.css';

const southBuildings = [
  { code: 'S1', name: 'อาคารเรียนรวม 1 (CB1)' },
  { code: 'S2', name: 'อาคารเรียนรวม 2 (CB2)' },
  { code: 'S3', name: 'อาคารปฏิบัติการทางวิทยาศาสตร์' },
  { code: 'S4', name: 'อาคารเรียนรวม 3 (CB3)' },
  { code: 'S5', name: 'อาคารเรียนรวม 4 (CB4)' },
  { code: 'S6', name: 'อาคารเรียนรวม 5 (CB5)' },
  { code: 'S7', name: 'อาคารปฏิบัติการทางวิศวกรรม' },
  { code: 'S8', name: 'อาคารวิศวกรรมเครื่องกล' },
  { code: 'S9', name: 'อาคารวิศวกรรมโยธา' },
  { code: 'S10', name: 'อาคารวิศวกรรมไฟฟ้า' },
  { code: 'S11', name: 'อาคารวิศวกรรมเคมี' },
  { code: 'S12', name: 'โรงอาหารและศูนย์อาหาร (KFC)' },
  { code: 'S13', name: 'อาคารพระจอมเกล้าราชานุสรณ์ 190 ปี (โรงยิม)' },
  { code: 'S14', name: 'อาคารกิจกรรมนักศึกษา' },
  { code: 'S15', name: 'สนามกีฬา / อาคารกีฬา' }
];

const northBuildings = [
  { code: 'N1', name: 'สำนักงานอธิการบดี (AD)' },
  { code: 'N2', name: 'สำนักหอสมุด' },
  { code: 'N3', name: 'ศูนย์เครื่องมือวิทยาศาสตร์ฯ' },
  { code: 'N4', name: 'สถาบันการเรียนรู้ (LX)' },
  { code: 'N5', name: 'สถาบันวิทยาการหุ่นยนต์ (FIBO)' },
  { code: 'N6', name: 'คณะครุศาสตร์อุตสาหกรรมฯ' },
  { code: 'N7', name: 'คณะเทคโนโลยีสารสนเทศ (SIT)' },
  { code: 'N8', name: 'คณะพลังงาน สิ่งแวดล้อมฯ' },
  { code: 'N9', name: 'อาคารปฏิบัติการทางวิทยาศาสตร์' },
  { code: 'N10', name: 'อาคารปฏิบัติการรวม' },
  { code: 'N11', name: 'ภาควิชาวิทยาศาสตร์และเทคโนโลยี' },
  { code: 'N12', name: 'อาคารบริการทั่วไป' },
  { code: 'N14', name: 'โรงอาหารพระจอมเกล้า (สิงห์)' },
  { code: 'N15', name: 'อาคารจอดรถ' },
  { code: 'N16', name: 'หอพักนักศึกษาหญิง' },
  { code: 'N17', name: 'หอพักนักศึกษาชาย' },
  { code: 'N18', name: 'อาคารสมาคมนักศึกษาเก่า' },
  { code: 'N19', name: 'อาคารวิจัยเคมี' },
  { code: 'N20', name: 'อาคารวิจัยและพัฒนานวัตกรรม' }
];

export default function Map() {
  const navigate = useNavigate();

  // State
  const [postType, setPostType] = useState('found'); // 'found' | 'lost'
  const [selectedBuilding, setSelectedBuilding] = useState('S1');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic search filtering
  const query = searchQuery.trim().toLowerCase();

  const filteredSouth = useMemo(() => {
    if (!query) return southBuildings;
    return southBuildings.filter(
      (b) => b.code.toLowerCase().includes(query) || b.name.toLowerCase().includes(query)
    );
  }, [query]);

  const filteredNorth = useMemo(() => {
    if (!query) return northBuildings;
    return northBuildings.filter(
      (b) => b.code.toLowerCase().includes(query) || b.name.toLowerCase().includes(query)
    );
  }, [query]);

  const allBuildings = useMemo(() => [...southBuildings, ...northBuildings], []);
  const selectedBuildingObj = useMemo(
    () => allBuildings.find((b) => b.code === selectedBuilding),
    [allBuildings, selectedBuilding]
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedBuilding) {
      params.set('building', selectedBuilding);
    }
    if (postType) {
      params.set('type', postType === 'lost' ? 'ของหาย' : 'พบของ');
    }
    navigate(`/posts?${params.toString()}`);
  };

  return (
    <div className="map-page">
      <div className="map-container">
        {/* Toolbar: ตัวเลือกประเภทโพสต์ */}
        <div className="map-toolbar">
          <div className="map-tabs">
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
              <details className="map-location" open>
                <summary>
                  <img src={locationIcon} alt="" aria-hidden="true" />
                  <span className="map-summary-text">
                    {selectedBuildingObj ? (
                      <>
                        <strong>{selectedBuildingObj.code}</strong>
                        <span className="map-summary-sub"> — {selectedBuildingObj.name}</span>
                      </>
                    ) : (
                      'เลือกสถานที่ / ค้นหาตึก...'
                    )}
                  </span>
                  <img className="map-chevron" src={chevronIcon} alt="" aria-hidden="true" />
                </summary>
                <div className="map-dropdown">
                  <div className="map-search-wrapper">
                    <input
                      className="map-building-search"
                      type="search"
                      placeholder="ค้นหาตึก เช่น S1, N2, หอสมุด..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="map-search-clear"
                        onClick={() => setSearchQuery('')}
                        aria-label="ล้างคำค้นหา"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="map-building-list">
                    {filteredSouth.length > 0 && (
                      <div className="map-zone map-zone-south">
                        <h3>โซน S (อาคารเรียน)</h3>
                        {filteredSouth.map((building) => (
                          <label className="map-building" key={building.code}>
                            <input
                              type="radio"
                              name="building"
                              value={building.code}
                              checked={selectedBuilding === building.code}
                              onChange={() => setSelectedBuilding(building.code)}
                            />
                            <span>
                              <span className="map-building-code">{building.code}</span>
                              <span className="map-building-name">— {building.name}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {filteredNorth.length > 0 && (
                      <div className="map-zone map-zone-north">
                        <h3>โซน N (อาคารและคณะต่าง ๆ)</h3>
                        {filteredNorth.map((building) => (
                          <label className="map-building" key={building.code}>
                            <input
                              type="radio"
                              name="building"
                              value={building.code}
                              checked={selectedBuilding === building.code}
                              onChange={() => setSelectedBuilding(building.code)}
                            />
                            <span>
                              <span className="map-building-code">{building.code}</span>
                              <span className="map-building-name">— {building.name}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {filteredSouth.length === 0 && filteredNorth.length === 0 && (
                      <div className="map-empty-buildings">
                        ไม่พบอาคารที่ตรงกับ "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              </details>
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
