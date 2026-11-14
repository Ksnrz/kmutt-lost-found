import arrowBackIcon from '../../assets/icons_arrow-back.png';
import './PageHeader.css';

/**
 * Shared PageHeader Component
 * @param {string} tag - ข้อความ Tag ส้ม เช่น "CAMPUS POSTS", "MY ACCOUNT", "RECEIVED REQUESTS"
 * @param {string} title - หัวข้อหลัก 28px Bold
 * @param {string} subtitle - คำอธิบายรอง 14px
 * @param {string} backText - ข้อความปุ่มย้อนกลับ (ถ้ามี)
 * @param {function} onBack - callback ฟังก์ชันเมื่อกดปุ่มย้อนกลับ
 * @param {ReactNode} actions - ปุ่มหรือองค์ประกอบด้านขวา (เช่น ปุ่มสร้างโพสต์)
 */
export default function PageHeader({
  tag,
  title,
  subtitle,
  backText,
  onBack,
  actions,
  children,
  className = '',
}) {
  return (
    <header className={`page-header ${className}`}>
      {backText && (
        <div className="page-header-back-row">
          <button type="button" className="page-header-back-btn" onClick={onBack}>
            <img src={arrowBackIcon} alt="" className="page-header-back-icon" aria-hidden="true" />
            <span>{backText}</span>
          </button>
        </div>
      )}
      <div className="page-header-main-row">
        <div className="page-header-text-group">
          {tag && <div className="page-header-tag">{tag}</div>}
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {(actions || children) && (
          <div className="page-header-actions">
            {actions || children}
          </div>
        )}
      </div>
    </header>
  );
}
