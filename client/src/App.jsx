import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from './api';
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
import './App.css';

// หน้าที่มี Navbar ด้านบน (หน้า login / register ไม่มี)
function WithNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  // จำนวนคำขอที่รอเราตรวจ (ทุกโพสต์ของเรา) โหลดใหม่ทุกครั้งที่เปลี่ยนหน้า; ไม่ได้ login = 0
  useEffect(() => {
    apiRequest('/me/posts')
      .then(({ posts }) => setPendingCount(posts.reduce((sum, p) => sum + p.pending_count, 0)))
      .catch(() => setPendingCount(0));
  }, [pathname]);

  return (
    <div className="app-container">
      <Navbar
        pendingCount={pendingCount}
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
          <Route
            path="/requests/review"
            element={<Navigate to="/account" replace state={{ tab: 'my_received_claims' }} />}
          />
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