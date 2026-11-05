import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import AccountPage from './pages/requests/AccountPage';
import ReviewRequestsPage from './pages/requests/ReviewRequestsPage';
import ClaimRequestPage from './pages/requests/ClaimRequestPage';
import './App.css';

/**
 * KMUTT Lost & Found — Root Application & Router
 * 
 * =============================================================================
 * 🤝 คู่มือสำหรับเพื่อนร่วมทีม (Coworker Guide):
 * =============================================================================
 * 1. ระบบนี้ใช้ react-router-dom v7 เป็นแกนกลางในการเปลี่ยนหน้า
 * 2. หน้าที่ 8, 9, 10 (ก้อน Requests & Account) ได้ถูกผูก Route ไว้เรียบร้อยแล้ว:
 *    - /account         -> หน้าจัดการประกาศและคำขอ (AccountPage)
 *    - /requests/review -> หน้าตรวจคำขอที่ส่งมา (ReviewRequestsPage)
 *    - /claims/new      -> หน้าส่งคำขอตรวจสอบสิ่งของ (ClaimRequestPage)
 * 
 * 3. เมื่อเพื่อนๆ ทำหน้าของตัวเองเสร็จ สามารถนำมาเสียบ Route ใน <Routes> ได้ทันที:
 *    - เพื่อนคนที่ 1 (Auth & Map):
 *      <Route path="/" element={<MapPage />} />
 *      <Route path="/login" element={<LoginPage />} />
 *      <Route path="/register" element={<RegisterPage />} />
 *    - เพื่อนคนที่ 2 (Posts Feed):
 *      <Route path="/posts" element={<PostListPage />} />
 *      <Route path="/posts/:id" element={<PostDetailPage />} />
 * 
 * 4. เนื่องจากทั้ง 3 หน้านี้ไม่ใช่หน้าแรกของเว็บ ระหว่างที่รอเพื่อนทำหน้าแรก
 *    เราตั้งค่า path="/" ให้ Redirect วิ่งไปที่ "/account" ก่อนชั่วคราว
 * =============================================================================
 */
function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* แถบนำทางด้านบน (NavLink จัดการ active class ให้อัตโนมัติ ปลอด Inline Style 100%) */}
        <nav className="app-nav-bar">
          <div className="app-brand">
            <span className="app-brand-title">KMUTT Lost & Found</span>
            <span className="app-brand-sub">| ระบบจัดการคำขอ & บัญชี</span>
          </div>

          <div className="app-nav-links">
            <NavLink to="/account" className="app-nav-btn">
              จัดการ Account (/account)
            </NavLink>
            <NavLink to="/requests/review" className="app-nav-btn">
              ตรวจคำขอ (/requests/review)
            </NavLink>
            <NavLink to="/claims/new" className="app-nav-btn">
              ส่งคำขอ (/claims/new)
            </NavLink>
          </div>
        </nav>

        {/* จุดกำหนด Route ของเว็บ */}
        <main>
          <Routes>
            {/* -------------------------------------------------------------
                📍 ก้อนงาน: Requests & Account (หน้าที่ทำเสร็จแล้ว)
                ------------------------------------------------------------- */}
            {/* 1. หน้าจัดการบัญชีและคำขอ (My Account) */}
            <Route path="/account" element={<AccountPage />} />

            {/* 2. หน้ารายการคำขอรอตรวจ (Review Requests) */}
            <Route path="/requests/review" element={<ReviewRequestsPage />} />

            {/* 3. หน้าส่งคำขอตรวจสอบสิ่งของ (Verification Request) */}
            <Route path="/claims/new" element={<ClaimRequestPage />} />

            {/* -------------------------------------------------------------
                🏠 จัดการหน้าแรกชั่วคราว (Fallback / Temporary Redirect)
                เมื่อเพื่อนทำหน้าแรกเสร็จ ให้เปลี่ยน element เป็นหน้าของเพื่อน เช่น <MapPage />
                ------------------------------------------------------------- */}
            <Route path="/" element={<Navigate to="/account" replace />} />

            {/* หากพิมพ์ URL ผิด ให้เด้งกลับไปที่ /account */}
            <Route path="*" element={<Navigate to="/account" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
