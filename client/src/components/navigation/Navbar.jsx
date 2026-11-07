import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Plus, User, UserCircle, LogOut } from 'lucide-react';
import './Navbar.css';

/**
 * Navbar Component — แถบนำทางด้านบน Desktop ตรงตามดีไซน์
 * 
 * 1. ฝั่งซ้าย: โลโก้ KMUTT Lost & Found + เมนูนำทาง 3 รายการ (ชิดซ้ายต่อจากโลโก้ เพื่อการกวาดสายตาที่รวดเร็ว)
 *    - แผนที่มหาวิทยาลัย
 *    - ประกาศของฉัน
 *    - ขอรับคืน (มี Badge 1 สีส้ม)
 *    (เมนูที่ Active จะเป็นสีส้มพร้อมมีเส้นใต้สีส้ม)
 * 2. ฝั่งขวา:
 *    - ปุ่ม "+ สร้างโพสต์" (สีส้ม)
 *    - Avatar ผู้ใช้ (ทรงกลม)
 * 3. Dropdown เมื่อกด Avatar:
 *    - บัญชีของฉัน
 *    - เส้นคั่น
 *    - ออกจากระบบ
 */
export default function Navbar({
  pendingCount = 1,
  onCreatePost,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ตรวจสอบว่าหน้าปัจจุบันอยู่ในหมวด "ขอรับคืน" หรือไม่ (/claims/* หรือ /requests/*)
  const isClaimsSection =
    location.pathname.startsWith('/claims') ||
    location.pathname.startsWith('/requests');

  // ตรวจจับการคลิกนอก Dropdown เพื่อปิดอัตโนมัติ
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // จัดการเมื่อกดปุ่มสร้างโพสต์
  const handleCreatePost = () => {
    if (onCreatePost) {
      onCreatePost();
    } else {
      alert('เปิดหน้าสร้างโพสต์ใหม่ (+ สร้างโพสต์)');
    }
  };

  // จัดการเมื่อกดออกจากระบบ
  const handleLogout = () => {
    setIsDropdownOpen(false);
    const confirmLogout = window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?');
    if (confirmLogout) {
      alert('ออกจากระบบเรียบร้อยแล้ว');
      navigate('/claims/new');
    }
  };

  return (
    <header className="navbar-wrapper">
      <nav className="navbar-card" aria-label="แถบนำทางหลัก">
        {/* ============================================================
            1. ซ้าย: โลโก้ KMUTT Lost & Found
            ============================================================ */}
        <NavLink to="/claims/new" className="navbar-brand">
          <div className="navbar-brand-badge" aria-hidden="true">
            {/* ไอคอนแว่นขยายที่มีเครื่องหมาย ? ด้านในตรงตามดีไซน์ */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="navbar-brand-svg"
            >
              <circle cx="11" cy="11" r="7.5" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
              <path d="M9.8 9.2a1.4 1.4 0 0 1 2.4.9c0 .9-1.2 1-1.2 1.8" strokeWidth="2" />
              <circle cx="11" cy="13.8" r="0.4" fill="currentColor" />
            </svg>
          </div>
          <span className="navbar-brand-text">
            <span className="brand-kmutt">KMUTT</span>{' '}
            <span className="brand-lostfound">Lost & Found</span>
          </span>
        </NavLink>

        {/* ============================================================
            2. ตรงกลาง: เมนู 3 รายการ
            ============================================================ */}
        <div className="navbar-menu">
          {/* เมนูที่ 1: แผนที่มหาวิทยาลัย */}
          <NavLink
            to="/map"
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'is-active' : ''}`
            }
          >
            <span>แผนที่มหาวิทยาลัย</span>
          </NavLink>

          {/* เมนูที่ 2: ประกาศของฉัน */}
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'is-active' : ''}`
            }
          >
            <span>ประกาศของฉัน</span>
          </NavLink>

          {/* เมนูที่ 3: ขอรับคืน (มี Badge ตัวเลข 1) */}
          <NavLink
            to="/requests/review"
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
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-label="เมนูผู้ใช้งาน"
              aria-haspopup="menu"
              aria-expanded={isDropdownOpen}
            >
              <User size={20} className="navbar-avatar-icon" />
            </button>

            {/* Dropdown Menu เมื่อกด Avatar */}
            {isDropdownOpen && (
              <div className="navbar-dropdown-menu" role="menu">
                <button
                  type="button"
                  className="navbar-dropdown-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/account');
                  }}
                  role="menuitem"
                >
                  <UserCircle size={18} className="dropdown-item-icon" />
                  <span>บัญชีของฉัน</span>
                </button>

                <div className="navbar-dropdown-divider" role="separator" />

                <button
                  type="button"
                  className="navbar-dropdown-item is-logout"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <LogOut size={18} className="dropdown-item-icon" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

