import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/navigation/Navbar';
import ClaimRequestPage from './pages/requests/ClaimRequestPage';
import ReviewRequestsPage from './pages/requests/ReviewRequestsPage';
import AccountPage from './pages/requests/AccountPage';
import PageHeader from './components/ui/PageHeader';
import { MapPin } from 'lucide-react';
import './App.css';

/**
 * KMUTT Lost & Found — Root Application & Router
 * 
 * 🌟 Desktop Navbar สไตล์ตาม Figma:
 * - ซ้าย: โลโก้ KMUTT Lost & Found พร้อมไอคอนแว่นขยาย ?
 * - ตรงกลาง: แผนที่มหาวิทยาลัย, ประกาศของฉัน, ขอรับคืน (มี Badge 1)
 * - ขวา: ปุ่ม + สร้างโพสต์ และ Avatar ผู้ใช้ (คลิกเปิด Dropdown บัญชีของฉัน / ออกจากระบบ)
 * - ZERO Inline Styles: ควบคุมสไตล์ผ่าน CSS ทั้งหมด
 */
function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* แถบนำทางด้านบน Desktop Navbar */}
        <Navbar
          pendingCount={1}
          onCreatePost={() => {
            alert('เปิดหน้าต่างสร้างโพสต์ใหม่ (+ สร้างโพสต์)\n(เชื่อมต่อกับโมดูลโพสต์ของเพื่อนคนที่ 2)');
          }}
        />

        {/* จุดกำหนด Route ของเว็บ */}
        <main>
          <Routes>
            {/* 1. หน้าส่งคำขอตรวจสอบสิ่งของ (Verification Request) */}
            <Route path="/claims/new" element={<ClaimRequestPage />} />

            {/* 2. หน้าตรวจสอบคำขอที่ส่งมา (Review Requests — เมนู "ขอรับคืน") */}
            <Route path="/requests/review" element={<ReviewRequestsPage />} />

            {/* 3. หน้าจัดการประกาศและบัญชีของฉัน (My Account — เมนู "ประกาศของฉัน") */}
            <Route path="/account" element={<AccountPage />} />

            {/* 4. หน้าแผนที่มหาวิทยาลัย (จำลองเมื่อคลิกเมนู "แผนที่มหาวิทยาลัย") */}
            <Route
              path="/map"
              element={
                <div className="map-placeholder-view">
                  <PageHeader
                    tag="CAMPUS MAP"
                    title="แผนที่มหาวิทยาลัย"
                    subtitle="ค้นหาตำแหน่งสิ่งของและจุดรับแจ้งของหายในมหาวิทยาลัย"
                  />
                  <div className="map-placeholder-card">
                    <MapPin size={40} className="map-placeholder-icon" />
                    <p className="map-placeholder-title">KMUTT Campus Map</p>
                    <p className="map-placeholder-desc">
                      หน้านี้เป็นส่วนโมดูลแผนที่ของเพื่อนร่วมทีม (Branch: auth-and-map) ซึ่งจะเชื่อมต่อสมบูรณ์เมื่อนำโค้ดมารวมกัน
                    </p>
                  </div>
                </div>
              }
            />

            {/* หน้าแรก Redirect ไปที่ /claims/new ตามลำดับงานหลัก */}
            <Route path="/" element={<Navigate to="/claims/new" replace />} />

            {/* หากพิมพ์ URL อื่นๆ ให้เด้งกลับไปที่ /claims/new */}
            <Route path="*" element={<Navigate to="/claims/new" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
