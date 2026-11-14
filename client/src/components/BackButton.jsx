import arrowIcon from '../assets/icons_arrow-back.png';
import './BackButton.css';

function BackButton({ text = 'ย้อนกลับ', onClick }) {
  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      window.history.back();
    }
  };

  return (
    <button type="button" className="back-link-btn" onClick={handleBack}>
      <img src={arrowIcon} alt="" className="back-icon" aria-hidden="true" />
      <span>{text}</span>
    </button>
  );
}

export default BackButton;
