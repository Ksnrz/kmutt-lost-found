import './Thumbnail.css';

/**
 * Shared Thumbnail Placeholder
 * @param {string} text - ข้อความแสดงในกล่อง เช่น "รูปโพสต์", "หลักฐาน 1"
 * @param {string} src - URL รูปจริง (ถ้ามี)
 * @param {string} className - Class CSS เพิ่มเติม
 */
export default function Thumbnail({
  text = 'รูปโพสต์',
  src,
  className = '',
  ...props
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={text}
        className={`ui-thumbnail ui-thumbnail-img ${className}`}
        {...props}
      />
    );
  }

  return (
    <div
      className={`ui-thumbnail ui-thumbnail-placeholder ${className}`}
      {...props}
    >
      {text}
    </div>
  );
}
