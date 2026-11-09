import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusMap from '../assets/map/map_kmutt.jpg'
import searchIcon from '../assets/map/search.svg'
import locationIcon from '../assets/map/location.svg'
import chevronIcon from '../assets/map/chevron.svg'
import './Map.css'

const southBuildings = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15']
const northBuildings = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'N11', 'N12', 'N14', 'N15', 'N16', 'N17', 'N18', 'N19', 'N20']

export default function Map() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState('S1')
  const [query, setQuery] = useState('')

  const matches = (building) => building.toLowerCase().includes(query.trim().toLowerCase())
  const south = southBuildings.filter(matches)
  const north = northBuildings.filter(matches)

  // เลือกตึกแล้วปิด dropdown และล้างคำค้นหา
  function selectBuilding(building) {
    setSelected(building)
    setQuery('')
    setOpen(false)
  }

  return (
    <main className="map-page">
      <div className="map-container">
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
          <button className="map-create" type="button" onClick={() => navigate('/posts/new')}>+ สร้างโพสต์</button>
        </div>

        <div className="map-content">
          <aside className="map-sidebar">
            <div className="map-filter">
              <h1>สถานที่ <span>*</span></h1>
              <details className="map-location" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
                <summary>
                  <img src={locationIcon} alt="" />
                  <span className={selected ? 'is-selected' : ''}>{selected || 'เลือกสถานที่ / ค้นหาตึก...'}</span>
                  <img className="map-chevron" src={chevronIcon} alt="" />
                </summary>
                <div className="map-dropdown">
                  <input className="map-building-search" type="search" placeholder="ค้นหาตึก เช่น S1, N2..." value={query} onChange={(event) => setQuery(event.target.value)} />
                  <div className="map-building-list">
                    {south.length > 0 && (
                      <div className="map-zone map-zone-south">
                        <h2>โซน S (อาคารเรียน)</h2>
                        {south.map((building) => (
                          <label className="map-building" key={building}>
                            <input type="radio" name="building" value={building} checked={selected === building} onChange={() => selectBuilding(building)} />
                            <span>{building}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {north.length > 0 && (
                      <div className="map-zone map-zone-north">
                        <h2>โซน N (อาคารและคณะต่าง ๆ)</h2>
                        {north.map((building) => (
                          <label className="map-building" key={building}>
                            <input type="radio" name="building" value={building} checked={selected === building} onChange={() => selectBuilding(building)} />
                            <span>{building}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {south.length + north.length === 0 && <p className="map-empty">ไม่พบตึกที่ค้นหา</p>}
                  </div>
                </div>
              </details>
            </div>
            <button className="map-search" type="button">
              <img src={searchIcon} alt="" />ค้นหา
            </button>
          </aside>
          <div className="map-image">
            <img src={campusMap} alt="แผนที่มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี แสดงอาคารโซน S และ N" />
          </div>
        </div>
      </div>
    </main>
  )
}
