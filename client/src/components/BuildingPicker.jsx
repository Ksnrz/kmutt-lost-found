import EmptyState from './ui/EmptyState';
import { useId, useState } from 'react';
import locationIcon from '../assets/map/location.svg';
import chevronIcon from '../assets/map/chevron.svg';
import './BuildingPicker.css';

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
            <EmptyState compact as="p" title={`ไม่พบอาคารที่ตรงกับ “${searchQuery}”`} />
          )}
        </div>
      </div>
    </details>
  );
}
