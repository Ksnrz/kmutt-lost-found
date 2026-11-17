import { useId, useState } from 'react';
import locationIcon from '../assets/map/location.svg';
import chevronIcon from '../assets/map/chevron.svg';
import './BuildingPicker.css';

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
  { code: 'S15', name: 'สนามกีฬา / อาคารกีฬา' },
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
  { code: 'N20', name: 'อาคารวิจัยและพัฒนานวัตกรรม' },
];

const allBuildings = [...southBuildings, ...northBuildings];

const ZONES = [
  { key: 'south', title: 'โซน S (อาคารเรียน)', buildings: southBuildings },
  { key: 'north', title: 'โซน N (อาคารและคณะต่าง ๆ)', buildings: northBuildings },
];

// Searchable building dropdown (the one from the Map page). value / onChange use the building code, e.g. 'S4'.
export default function BuildingPicker({
  value,
  onChange,
  defaultOpen = false,
  placeholder = 'เลือกสถานที่ / ค้นหาตึก...',
  className = '',
}) {
  const groupName = useId(); // two pickers on one form must not share a radio group
  const [open, setOpen] = useState(defaultOpen);
  const [searchQuery, setSearchQuery] = useState('');

  const query = searchQuery.trim().toLowerCase();
  const matches = (b) => !query || b.code.toLowerCase().includes(query) || b.name.toLowerCase().includes(query);
  const zones = ZONES.map((z) => ({ ...z, buildings: z.buildings.filter(matches) }));
  const selected = allBuildings.find((b) => b.code === value);

  const select = (code) => {
    onChange(code);
    setSearchQuery('');
    setOpen(false);
  };

  return (
    <details
      className={`map-location ${className}`}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <img src={locationIcon} alt="" aria-hidden="true" />
        <span className="map-summary-text">
          {selected ? (
            <>
              <strong>{selected.code}</strong>
              <span className="map-summary-sub"> — {selected.name}</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <img className="map-chevron" src={chevronIcon} alt="" aria-hidden="true" />
      </summary>
      <div className="map-dropdown">
        <div className="map-search-wrapper">
          <input
            className="map-building-search"
            type="text"
            placeholder="ค้นหาตึก เช่น S1, N2, หอสมุด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            // inside a post form, Enter here must not submit the post
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
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
          {zones.map(
            (zone) =>
              zone.buildings.length > 0 && (
                <div className={`map-zone map-zone-${zone.key}`} key={zone.key}>
                  <h3>{zone.title}</h3>
                  {zone.buildings.map((building) => (
                    <label className="map-building" key={building.code}>
                      <input
                        type="radio"
                        name={groupName}
                        value={building.code}
                        checked={value === building.code}
                        onChange={() => select(building.code)}
                      />
                      <span>
                        <span className="map-building-code">{building.code}</span>
                        <span className="map-building-name">— {building.name}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )
          )}

          {zones.every((z) => z.buildings.length === 0) && (
            <div className="map-empty-buildings">ไม่พบอาคารที่ตรงกับ "{searchQuery}"</div>
          )}
        </div>
      </div>
    </details>
  );
}
