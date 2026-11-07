import arrowIcon from '../assets/icons_arrow-back.png';
import './BackButton.css';

function BackButton({text}) {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <button className="back-link-btn" onClick={handleBack}>
      <img src={arrowIcon} alt="ย้อนกลับ" className="back-icon" />
      <span>{text}</span>
    </button>
  );
}

export default BackButton;
