import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/navigation/Navbar';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Map from './pages/Map.jsx';
import Page4 from './pages/page4';
import Page5 from './pages/page5';
import Page6 from './pages/page6';
import Page7 from './pages/page7';
import ClaimRequestPage from './pages/requests/ClaimRequestPage';
import ReviewRequestsPage from './pages/requests/ReviewRequestsPage';
import AccountPage from './pages/requests/AccountPage';
import './App.css';

// หน้าที่มี Navbar ด้านบน (หน้า login / register ไม่มี)
function WithNavbar() {
  return (
    <div className="app-container">
      <Navbar
        pendingCount={1}
        onCreatePost={() => {
          alert('เปิดหน้าต่างสร้างโพสต์ใหม่ (+ สร้างโพสต์)\n(เชื่อมต่อกับโมดูลโพสต์ของเพื่อนคนที่ 2)');
        }}
      />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<WithNavbar />}>
          <Route path="/map" element={<Map />} />
          <Route path="/posts" element={<Page4 />} />
          <Route path="/posts/new" element={<Page6 />} />
          <Route path="/posts/:postId" element={<Page5 />} />
          <Route path="/posts/:postId/edit" element={<Page7 />} />
          <Route path="/claims/new" element={<ClaimRequestPage />} />
          <Route path="/posts/:postId/claim" element={<ClaimRequestPage />} />
          <Route path="/requests/review" element={<ReviewRequestsPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;