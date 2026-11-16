
import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Plus, User, UserCircle, LogOut } from 'lucide-react';
import './Navbar.css';

/**
 * Navbar Component
 */
export default function Navbar({
  pendingCount = 1,
  onCreatePost,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [toast, setToast] = useState(null);

  const dropdownRef = useRef(null);

  // ตรวจสอบว่าหน้าปัจจุบันอยู่ในหมวด "ขอรับคืน" หรือไม่
  const isClaimsSection =
    location.pathname.startsWith('/claims') ||
    location.pathname.startsWith('/requests');

  // ตรวจจับการคลิกนอก Dropdown เพื่อปิดอัตโนมัติ
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
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

  // ซ่อน Toast อัตโนมัติหลัง 3 วินาที
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  // แสดง Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // จัดการเมื่อกดปุ่มสร้างโพสต์
  const handleCreatePost = () => {
    if (onCreatePost) {
      onCreatePost();
    } else {
      showToast('ยังไม่สามารถเปิดหน้าสร้างโพสต์ได้', 'error');
    }
  };

  // เปิด Confirmation Modal สำหรับออกจากระบบ
  const handleLogout = () => {
    setIsDropdownOpen(false);

    setConfirmModal({
      title: 'ยืนยันการออกจากระบบ',
      message: 'คุณต้องการออกจากระบบใช่หรือไม่?',
      confirmText: 'ออกจากระบบ',
      onConfirm: () => {
        localStorage.removeItem('token');
        setConfirmModal(null);
        navigate('/login');
      },
    });
  };

  // ยืนยันหรือยกเลิกการทำรายการ
  const handleConfirm = () => {
    if (confirmModal?.onConfirm) {
      confirmModal.onConfirm();
    }
  };

  return (
    <>
      <header className="navbar-wrapper">
        <nav className="navbar-card" aria-label="แถบนำทางหลัก">
          {/* 1. ซ้าย: โลโก้ KMUTT Lost & Found */}
          <NavLink
            to="/map"
            className="navbar-brand"
            title="แผนที่มหาวิทยาลัย"
          >
            <div className="navbar-brand-badge" aria-hidden="true">
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
                <path
                  d="M9.8 9.2a1.4 1.4 0 0 1 2.4.9c0 .9-1.2 1-1.2 1.8"
                  strokeWidth="2"
                />
                <circle cx="11" cy="13.8" r="0.4" fill="currentColor" />
              </svg>
            </div>

            <span className="navbar-brand-text">
              <span className="brand-kmutt">KMUTT</span>{' '}
              <span className="brand-lostfound">Lost &amp; Found</span>
            </span>
          </NavLink>

          {/* 2. ตรงกลาง: เมนู 3 รายการ */}
          <div className="navbar-menu">
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'is-active' : ''}`
              }
            >
              <span>แผนที่มหาวิทยาลัย</span>
            </NavLink>

            <NavLink
              to="/account"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'is-active' : ''}`
              }
            >
              <span>ประกาศของฉัน</span>
            </NavLink>

            <NavLink
              to="/requests/review"
              className={({ isActive }) =>
                `navbar-link ${
                  isActive || isClaimsSection ? 'is-active' : ''
                }`
              }
            >
              <span>รออนุมัติ</span>

              {pendingCount > 0 && (
                <span
                  className="navbar-badge"
                  aria-label={`มีคำขอรอตรวจ ${pendingCount} รายการ`}
                >
                  {pendingCount}
                </span>
              )}
            </NavLink>
          </div>

          {/* 3. ขวา: ปุ่มสร้างโพสต์ และ Avatar */}
          <div className="navbar-actions">
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
                className={`navbar-avatar-btn ${
                  isDropdownOpen ? 'is-active' : ''
                }`}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-label="เมนูผู้ใช้งาน"
                aria-haspopup="menu"
                aria-expanded={isDropdownOpen}
              >
                <User size={20} className="navbar-avatar-icon" />
              </button>

              {isDropdownOpen && (
                <div className="navbar-dropdown-menu" role="menu">
                  <button
                    type="button"
                    className="navbar-dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/profile');
                    }}
                    role="menuitem"
                  >
                    <UserCircle
                      size={18}
                      className="dropdown-item-icon"
                    />
                    <span>บัญชีของฉัน</span>
                  </button>

                  <div
                    className="navbar-dropdown-divider"
                    role="separator"
                  />

                  <button
                    type="button"
                    className="navbar-dropdown-item is-logout"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut
                      size={18}
                      className="dropdown-item-icon"
                    />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 10000,
            padding: '14px 20px',
            borderRadius: '10px',
            backgroundColor:
              toast.type === 'error' ? '#dc2626' : '#16a34a',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmModal(null);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="navbar-confirm-title"
            aria-describedby="navbar-confirm-message"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '24px',
              borderRadius: '14px',
              backgroundColor: '#ffffff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <h2
              id="navbar-confirm-title"
              style={{
                margin: '0 0 12px',
                fontSize: '20px',
                color: '#1f2937',
              }}
            >
              {confirmModal.title}
            </h2>

            <p
              id="navbar-confirm-message"
              style={{
                margin: '0 0 24px',
                color: '#4b5563',
                lineHeight: 1.6,
              }}
            >
              {confirmModal.message}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
