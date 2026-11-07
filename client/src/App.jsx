import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import ClaimRequestPage from './pages/requests/ClaimRequestPage';
import ReviewRequestsPage from './pages/requests/ReviewRequestsPage';
import AccountPage from './pages/requests/AccountPage';
import './App.css';

/**
 * KMUTT Lost & Found — Root Application & Router
 * 
 * =============================================================================
 * 🤝 คู่มือสำหรับเพื่อนร่วมทีม (Coworker Guide):
 * =============================================================================
 * 1. ระบบนี้ใช้ react-router-dom v7 เป็นแกนกลางในการเปลี่ยนหน้า
 * 2. ลำดับกระบวนการ (Flow):
 *    - /claims/new      -> 1. หน้าส่งคำขอตรวจสอบสิ่งของ (ClaimRequestPage)
 *    - /requests/review -> 2. หน้าตรวจสอบคำขอที่ส่งมา (ReviewRequestsPage)
 *    - /account         -> 3. หน้าจัดการประกาศและบัญชี (AccountPage)
 * 
 * 3. เมื่อเพื่อนๆ ทำหน้าของตัวเองเสร็จ สามารถนำมาเสียบ Route ใน <Routes> ได้ทันที:
 *    - เพื่อนคนที่ 1 (Auth & Map): <Route path="/" element={<MapPage />} /> ...
 *    - เพื่อนคนที่ 2 (Posts):      <Route path="/posts/create" element={<Page4 />} /> ...
 * =============================================================================
 */
function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* แถบนำทางด้านบน เรียงลำดับ: ส่งคำขอ -> ตรวจสอบคำขอ -> จัดการ account */}
        <nav className="app-nav-bar">
          <div className="app-brand">
            <span className="app-brand-title">KMUTT Lost & Found</span>
            <span className="app-brand-sub">| ระบบจัดการคำขอ & บัญชี</span>
          </div>

          <div className="app-nav-links">
            <NavLink to="/claims/new" className="app-nav-btn">
              ส่งคำขอ (/claims/new)
            </NavLink>
            <NavLink to="/requests/review" className="app-nav-btn">
              ตรวจสอบคำขอ (/requests/review)
            </NavLink>
            <NavLink to="/account" className="app-nav-btn">
              จัดการ Account (/account)
            </NavLink>
          </div>
        </nav>

        {/* จุดกำหนด Route ของเว็บ */}
        <main>
          <Routes>
            {/* 1. หน้าส่งคำขอตรวจสอบสิ่งของ (Verification Request) */}
            <Route path="/claims/new" element={<ClaimRequestPage />} />

            {/* 2. หน้าตรวจสอบคำขอที่ส่งมา (Review Requests) */}
            <Route path="/requests/review" element={<ReviewRequestsPage />} />

            {/* 3. หน้าจัดการประกาศและบัญชีของฉัน (My Account) */}
            <Route path="/account" element={<AccountPage />} />

            {/* หน้าแรก Redirect ไปหน้าแรกตามลำดับ (ส่งคำขอ) */}
            <Route path="/" element={<Navigate to="/claims/new" replace />} />

            {/* หากพิมพ์ URL ผิด ให้เด้งกลับไปที่หน้าแรก (/claims/new) */}
            <Route path="*" element={<Navigate to="/claims/new" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
