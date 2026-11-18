import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Plus, User, UserCircle, LogOut, X } from 'lucide-react';
import BrandWordmark from '../BrandWordmark';
import ConfirmModal from '../ui/ConfirmModal';
import './Navbar.css';

/**
 * Navbar Component 
 */
export default function Navbar({
  pendingCount = 0,
  onCreatePost,
  claimNotifications,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);
  const navRef = useRef(null);
  const menuButtonRef = useRef(null);
  const { unreadCount, loadNotifications } = claimNotifications;

  // ตรวจสอบว่าหน้าปัจจุบันอยู่ในหมวด "ขอรับคืน" หรือไม่ (/claims/* หรือ /requests/*)
  const isClaimsSection =
    location.pathname.startsWith('/claims') ||
    location.pathname.startsWith('/requests');

  // ตรวจจับการคลิกนอก Dropdown เพื่อปิดอัตโนมัติ
  useEffect(() => {
    function handleClickOutside(event) {
      if (showLogoutConfirm) return;
      if (!navRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen || isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isMenuOpen, showLogoutConfirm]);

  // จัดการเมื่อกดปุ่มสร้างโพสต์
  const handleCreatePost = () => {
    setIsMenuOpen(false);
    if (onCreatePost) {
      onCreatePost();
    } else {
      alert('เปิดหน้าสร้างโพสต์ใหม่ (+ สร้างโพสต์)');
    }
  };

  // จัดการเมื่อกดออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="navbar-wrapper">
      <nav
        className="navbar-card"
        aria-label="แถบนำทางหลัก"
        ref={navRef}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && isMenuOpen) {
            setIsMenuOpen(false);
            menuButtonRef.current?.focus();
          }
        }}
      >
        {/* ============================================================
            1. ซ้าย: โลโก้ KMUTT Lost & Found
            ============================================================ */}
        <NavLink to="/map" className="navbar-brand" title="แผนที่มหาวิทยาลัย" onClick={() => setIsMenuOpen(false)}>
          <BrandWordmark />
        </NavLink>

        {/* ============================================================
            2. ตรงกลาง: เมนู 3 รายการ
            ============================================================ */}
        <button
          type="button"
          className="navbar-menu-toggle"
          ref={menuButtonRef}
          aria-label="เมนูหลัก"
          aria-controls="navbar-main-menu"
          aria-expanded={isMenuOpen}
          onClick={() => {
            setIsDropdownOpen(false);
            setIsMenuOpen((open) => !open);
          }}
        >
          {isMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
        <div id="navbar-main-menu" className={`navbar-menu${isMenuOpen ? ' is-open' : ''}`}>
          {/* เมนูที่ 1: แผนที่มหาวิทยาลัย */}
          <NavLink
            to="/map"
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'is-active' : ''}`
            }
          >
            <span>แผนที่มหาวิทยาลัย</span>
          </NavLink>

          {/* เมนูที่ 2: ประกาศทั้งหมด */}
          <NavLink
            to="/posts"
            onClick={() => setIsMenuOpen(false)}
            end
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'is-active' : ''}`
            }
          >
            <span>ประกาศทั้งหมด</span>
          </NavLink>

          {/* เมนูที่ 3: ขอรับคืน (มี Badge ตัวเลข 1) */}
          <NavLink
            to="/requests/review"
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) =>
              `navbar-link ${isActive || isClaimsSection ? 'is-active' : ''}`
            }
          >
            <span>รออนุมัติ</span>
            {pendingCount > 0 && (
              <span className="navbar-badge" aria-label={`มีคำขอรอตรวจ ${pendingCount} รายการ`}>
                {pendingCount}
              </span>
            )}
          </NavLink>
        </div>

        {/* ============================================================
            3. ขวา: ปุ่ม + สร้างโพสต์ และ Avatar
            ============================================================ */}
        <div className="navbar-actions">
          {/* ปุ่ม + สร้างโพสต์ */}
          <button
            type="button"
            className="navbar-btn-create"
            aria-label="สร้างโพสต์"
            onClick={handleCreatePost}
          >
            <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
            <span>สร้างโพสต์</span>
          </button>

          {/* Avatar ผู้ใช้และ Dropdown */}
          <div className="navbar-avatar-box" ref={dropdownRef}>
            <button
              type="button"
              className={`navbar-avatar-btn ${isDropdownOpen ? 'is-active' : ''}`}
              onClick={() => {
                setIsMenuOpen(false);
                if (!isDropdownOpen) loadNotifications();
                setIsDropdownOpen((prev) => !prev);
              }}
              aria-label={unreadCount ? `เมนูผู้ใช้งาน การแจ้งเตือนที่ยังไม่อ่าน ${unreadCount} รายการ` : 'เมนูผู้ใช้งาน'}
              aria-controls="navbar-account-panel"
              aria-expanded={isDropdownOpen}
            >
              <User size={20} className="navbar-avatar-icon" />
              {unreadCount > 0 && <span className="navbar-avatar-badge" aria-hidden="true">{unreadCount}</span>}
            </button>

            {/* Dropdown Menu เมื่อกด Avatar */}
            {isDropdownOpen && (
              <div className="navbar-dropdown-menu" id="navbar-account-panel">
                <button
                  type="button"
                  className="navbar-dropdown-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate(unreadCount > 0 ? '/profile?tab=claims' : '/profile');
                  }}
                >
                  <UserCircle size={18} className="dropdown-item-icon" />
                  <span>บัญชีของฉัน</span>
                  {unreadCount > 0 && <span className="navbar-dropdown-badge">{unreadCount}</span>}
                </button>

                <div className="navbar-dropdown-divider" role="separator" />

                <button
                  type="button"
                  className="navbar-dropdown-item is-logout"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  <LogOut size={18} className="dropdown-item-icon" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      {showLogoutConfirm && (
        <ConfirmModal
          title="ยืนยันการออกจากระบบ"
          description="ต้องการออกจากระบบใช่หรือไม่?"
          confirmText="ออกจากระบบ"
          icon={LogOut}
          onConfirm={handleLogout}
          onClose={() => setShowLogoutConfirm(false)}
        />
      )}
    </header>
  );
}

