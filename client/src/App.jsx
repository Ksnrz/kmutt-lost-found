import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import Navbar from './components/navigation/Navbar';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Map from './pages/Map.jsx';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Listpost from './pages/Listpost';
import Editpost from './pages/Editpost';
import ClaimRequestPage from './pages/requests/ClaimRequestPage';
import ReviewRequestsPage from './pages/requests/ReviewRequestsPage';
import AccountPage from './pages/requests/AccountPage';
import Profile from './pages/Profile';
import { apiRequest } from './api';
import { claimService } from './services/claimService';
import './App.css';

// หน้าที่มี Navbar ด้านบน (หน้า login / register ไม่มี)
function WithNavbar() {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [noticeCount, setNoticeCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const receivedData = await apiRequest('/verify/received');
        if (isMounted && receivedData?.posts) {
          const totalPending = receivedData.posts.reduce(
            (sum, p) => sum + (Number(p.pendingCount) || 0),
            0
          );
          setPendingCount(totalPending);
        }
      } catch {
        // ผู้ใช้อาจยังไม่ได้ล็อกอิน
      }

      try {
        const claims = await claimService.getMyClaims();
        if (isMounted && claims) {
          // แจ้งเตือนเมื่อมีคำขอที่ถูก ACCEPTED หรือ REJECTED
          const updates = claims.filter(
            (c) => c.verify_status === 'ACCEPTED' || c.verify_status === 'REJECTED' || c.status === 'ACCEPTED' || c.status === 'REJECTED'
          ).length;
          setNoticeCount(updates);
        }
      } catch {
        // ละเว้นข้อผิดพลาดชั่วคราว
      }
    };

    fetchCounts();

    const unsubscribe = claimService.subscribe(() => {
      fetchCounts();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className="app-container">
      <Navbar
        pendingCount={pendingCount}
        noticeCount={noticeCount}
        onCreatePost={() => {
          navigate('/posts/new');
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
          <Route path="/posts" element={<Listpost />} />
          <Route path="/posts/new" element={<CreatePost />} />
          <Route path="/posts/:postId" element={<PostDetail />} />
          <Route path="/posts/:postId/edit" element={<Editpost />} />
          <Route path="/listpost" element={<Navigate to="/posts" replace />} />
          <Route path="/claims/new" element={<ClaimRequestPage />} />
          <Route path="/posts/:postId/claim" element={<ClaimRequestPage />} />
          <Route path="/requests/review" element={<ReviewRequestsPage />} />
          <Route path="/posts/:postId/review" element={<ReviewRequestsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;