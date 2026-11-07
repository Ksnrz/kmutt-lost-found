import './AlertCallout.css';

/**
 * Shared Alert / Callout Box
 * @param {React.ReactNode} children - เนื้อหาข้อความภายในกล่อง
 * @param {string} text - ข้อความสำรอง (กรณีส่งเป็น prop text)
 * @param {string} className - คลาส CSS เพิ่มเติม
 */
export default function AlertCallout({
  children,
  text,
  className = '',
}) {
  return (
    <div className={`ui-alert-callout ${className}`}>
      {children || text}
    </div>
  );
}
