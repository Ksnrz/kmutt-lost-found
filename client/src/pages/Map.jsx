import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import campusMap from '../assets/map/map_kmutt.jpg';
import searchIcon from '../assets/map/search.svg';
import locationIcon from '../assets/map/location.svg';
import chevronIcon from '../assets/map/chevron.svg';
import './Map.css';

const southBuildings = [
  { code: 'S1', name: 'อาคารวิศวกรรมเครื่องกล 4' },
  { code: 'S2', name: 'อาคารจอดรถ' },
  { code: 'S3', name: 'อาคารสถาบันนวัตกรรมการเรียนรู้ฯ / รร.ดรุณสิกขาลัย' },
  { code: 'S4', name: 'อาคารวิศววัฒนะ' },
  { code: 'S5', name: 'บ้านธรรมรักษา 2 (หอพักชาย)' },
  { code: 'S6', name: 'บ้านธรรมรักษา 1 (หอพักหญิง)' },
  { code: 'S7', name: 'อาคารพัฒนาเด็กเล็ก มจธ.' },
  { code: 'S8', name: 'อาคารวิจัยและพัฒนาเทคโนโลยีวัสดุ' },
  { code: 'S9', name: 'อาคารเรียนและปฏิบัติการคณะพลังงาน สิ่งแวดล้อมและวัสดุ' },
  { code: 'S10', name: 'อาคารกรีน โซไซตี้ มจธ.' },
  { code: 'S11', name: 'อาคารเรียนรวม 5 (CB5)' },
  { code: 'S12', name: 'อาคารเรียนรวม 4 (CB4)' },
  { code: 'S13', name: 'อาคารเรียนรวม 3 (CB3)' },
  { code: 'S14', name: 'อาคารพระจอมเกล้าราชานุสรณ์ 190 ปี' },
  { code: 'S15', name: 'อาคารภาควิชาวิศวกรรมเคมี' }
];

const northBuildings = [
  { code: 'N1', name: 'อาคารศูนย์ต้อนรับ (Welcome Center)' },
  { code: 'N2', name: 'อาคารสำนักงานอธิการบดี' },
  { code: 'N3', name: 'อาคารภาควิชาเคมี' },
  { code: 'N4', name: 'อาคารภาควิชาฟิสิกส์-คณิตศาสตร์' },
  { code: 'N5', name: 'อาคารศูนย์เครื่องมือวิทยาศาสตร์ฯ' },
  { code: 'N6', name: 'อาคารภาควิชาจุลชีววิทยา' },
  { code: 'N7', name: 'อาคารปฏิบัติการพื้นฐานทางวิทยาศาสตร์' },
  { code: 'N8', name: 'สถานีสูบน้ำ' },
  { code: 'N9', name: 'อาคารสถาบันวิทยาการหุ่นยนต์ภาคสนาม (FIBO)' },
  { code: 'N10', name: 'อาคารสำนักหอสมุด' },
  { code: 'N11', name: 'อาคารคณะเทคโนโลยีสารสนเทศ (SIT)' },
  { code: 'N12', name: 'อาคารอเนกประสงค์' },
  { code: 'N13', name: 'อาคารเวิร์คช็อป แอนด์ กรีนเฮ้าส์' },
  { code: 'N14', name: 'อาคารไฟฟ้าแรงสูง' },
  { code: 'N15', name: 'อาคารเรียนและปฏิบัติการทางศิลปศาสตร์ (SoLA)' },
  { code: 'N16', name: 'อาคารการเรียนรู้พหุวิทยาการ (LX)' },
  { code: 'N17', name: 'อาคารเรียนรวม 2 (CB2)' },
  { code: 'N18', name: 'อาคารปฏิบัติการทางวิศวกรรมอุตสาหการ 4' },
  { code: 'N19', name: 'อาคารปฏิบัติการทางวิศวกรรมอุตสาหการ 5' },
  { code: 'N20', name: 'อาคารเรียนรวม 1 (CB1)' }
];

export default function Map() {
  const navigate = useNavigate();

  // State
  const [postType, setPostType] = useState('all'); // 'all' | 'found' | 'lost'
  const [selectedBuilding, setSelectedBuilding] = useState('S1');
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(true);

  // เลือกตึกแล้วปิด dropdown และล้างคำค้นหา
  const selectBuilding = (code) => {
    setSelectedBuilding(code);
    setSearchQuery('');
    setOpen(false);
  };

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
    // 'all' sends no type, so the list page shows every type
    if (postType !== 'all') {
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
              <details className="map-location" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
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
                              onChange={() => selectBuilding(building.code)}
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
                              onChange={() => selectBuilding(building.code)}
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
