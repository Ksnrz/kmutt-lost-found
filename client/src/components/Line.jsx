import lineImg from '../assets/Line.png'; // ปรับ path ตามตำแหน่งจริงของรูป
import './Line.css';

export default function Line() {
  return (
    <img src={lineImg} alt="line" className="line-image" />
  );
}