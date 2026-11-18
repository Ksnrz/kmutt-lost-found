import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
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
import ReceivedRequestsPage from './pages/requests/ReceivedRequestsPage';
import Profile from './pages/Profile';
import { apiRequest } from './api';
import useClaimNotifications from './services/useClaimNotifications';
import './App.css';

// หน้าที่มี Navbar ด้านบน (หน้า login / register ไม่มี)
function WithNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const claimNotifications = useClaimNotifications();

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const receivedData = await apiRequest('/me/posts');
        if (isMounted && receivedData?.posts) {
          const totalPending = receivedData.posts.reduce(
            (sum, p) => sum + (Number(p.pending_count) || 0),
            0
          );
          setPendingCount(totalPending);
        }
      } catch {
        // ผู้ใช้อาจยังไม่ได้ล็อกอิน
      }

    };

    fetchCounts();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <div className="app-container">
      <Navbar
        pendingCount={pendingCount}
        claimNotifications={claimNotifications}
        onCreatePost={() => {
          navigate('/posts/new');
        }}
      />
      <main>
        <Outlet context={claimNotifications} />
      </main>
    </div>
  );
}

function AccountRedirect() {
  const { state } = useLocation();
  const destination = state?.tab === 'my_received_claims' ? '/requests/review' : '/profile';
  return <Navigate to={destination} replace state={state} />;
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
          <Route path="/posts/:postId/claim" element={<ClaimRequestPage />} />
          <Route path="/requests/review" element={<ReceivedRequestsPage />} />
          <Route path="/posts/:postId/review" element={<ReviewRequestsPage />} />
          <Route path="/account" element={<AccountRedirect />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
