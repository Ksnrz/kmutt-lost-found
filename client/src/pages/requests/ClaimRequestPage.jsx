import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Thumbnail from '../../components/ui/Thumbnail';
import AlertCallout from '../../components/ui/AlertCallout';
import './ClaimRequestPage.css';

/**
 * ClaimRequestPage Component — หน้าส่งคำขอตรวจสอบ (VERIFICATION REQUEST)
 * Route URL: /claims/new
 * 
 * 🌟 React Best Practices:
 * 1. React Router: ใช้ useNavigate() จัดการการเปลี่ยน path เมื่อกดย้อนกลับ หรือส่งข้อมูลเสร็จ
 * 2. ZERO Inline Styles: ควบคุมสไตล์ผ่าน Class ใน CSS ทั้งหมด
 * 3. Controlled Form: state ควบคุม textarea และการแนบรูปภาพพร้อม preview
 * 4. Memory Safe: เคลียร์ URL.revokeObjectURL ใน useEffect
 */
export default function ClaimRequestPage({
  // ข้อมูลโพสต์ที่ส่งคำขอ (มีค่าเริ่มต้นตรงตามภาพสเปก)
  item = {
    title: 'พบกระเป๋าสตางค์สีดำ',
    category: 'ประกาศเจอของ',
    location: 'S4',
    imageUrl: null,
  },
  onBack,
  onCancel,
  onSubmitSuccess,
}) {
  const navigate = useNavigate();

  // State 1: ข้อความรายละเอียดตำหนิ
  const [defectDetail, setDefectDetail] = useState('');
  
  // State 2: รายการรูปภาพหลักฐานที่ผู้ใช้อัปโหลด
  const [evidenceImages, setEvidenceImages] = useState([]);
  
  // State 3: ข้อความ Error เมื่อกรอกข้อมูลไม่ครบ
  const [errorMessage, setErrorMessage] = useState('');
  
  // State 4: สถานะระหว่างกำลังส่งข้อมูล
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref สำหรับคลิกเปิด File Picker ที่ซ่อนอยู่
  const fileInputRef = useRef(null);

  // Cleanup Object URLs เมื่อ component ถูกถอดออก (Best Practice ป้องกัน Memory Leak)
  useEffect(() => {
    return () => {
      evidenceImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [evidenceImages]);

  // จัดการเมื่อเลือกไฟล์รูปภาพ
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newImages = selectedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
    }));

    setEvidenceImages((prev) => [...prev, ...newImages]);
    // รีเซ็ตค่า input เพื่อให้เลือกไฟล์ชื่อเดิมซ้ำได้ถ้าต้องการ
    e.target.value = '';
  };

  // ลบรูปภาพที่เลือกออก
  const handleRemoveImage = (idToRemove) => {
    setEvidenceImages((prev) => {
      const target = prev.find((img) => img.id === idToRemove);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== idToRemove);
    });
  };

  // จัดการเมื่อกดปุ่มส่งฟอร์ม (Form Submission)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. ตรวจสอบความถูกต้องของข้อมูล (Validation)
    if (!defectDetail.trim()) {
      setErrorMessage('กรุณาระบุรายละเอียดตำหนิหรือข้อมูลเฉพาะเพื่อยืนยันความเป็นเจ้าของ');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // 2. จำลองการส่งข้อมูล (API Request)
      const payload = {
        itemTitle: item.title,
        defectDetail: defectDetail.trim(),
        evidenceCount: evidenceImages.length,
        submittedAt: new Date().toISOString(),
      };

      console.log('ส่งคำขอสำเร็จ:', payload);

      // จำลอง network delay สั้นๆ
      await new Promise((resolve) => setTimeout(resolve, 600));

      alert('ส่งคำขอตรวจสอบเรียบร้อยแล้ว!');
      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      } else {
        navigate('/account');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/account');
    }
  };

  return (
    <div className="claim-request-container">
      {/* 1. ส่วนหัวหน้าเว็บ (ย้อนกลับ + แท็กส้ม + ชื่อหน้า) */}
      <PageHeader
        backText="กลับไปรายการประกาศ"
        onBack={handleGoBack}
        tag="VERIFICATION REQUEST"
        title="ส่งคำขอตรวจสอบ"
      />

      {/* 2. การ์ดฟอร์มหลัก */}
      <Card className="claim-request-card">
        {/* กล่องสรุปโพสต์ที่กำลังทำเรื่องขอคืน */}
        <div className="claim-post-summary">
          <Thumbnail
            text="รูปโพสต์"
            src={item.imageUrl}
          />
          <div className="claim-post-info">
            <p className="claim-post-title">{item.title}</p>
            <p className="claim-post-meta">
              {item.category} · {item.location}
            </p>
          </div>
        </div>

        <hr className="ui-divider" />

        {/* ฟอร์มข้อมูลยืนยันสิทธิ์ */}
        <form onSubmit={handleSubmit} className="claim-form" noValidate>
          <h2 className="claim-section-title">ข้อมูลเพื่อยืนยันสิทธิ์</h2>

          {/* ช่องกรอกที่ 1: รายละเอียดตำหนิหรือข้อมูลเฉพาะ */}
          <div className="claim-form-group">
            <label className="claim-label" htmlFor="defectDetail">
              รายละเอียดตำหนิหรือข้อมูลเฉพาะ
            </label>
            <textarea
              id="defectDetail"
              rows={4}
              className={`claim-textarea ${errorMessage ? 'has-error' : ''}`}
              value={defectDetail}
              onChange={(e) => {
                setDefectDetail(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="ระบุตำหนิพิเศษ เช่น รอยถลอก สติกเกอร์ ข้อมูลบัตร หรือเอกสารที่อยู่ด้านใน..."
              aria-required="true"
            />
            {errorMessage && (
              <p className="claim-error-text" role="alert">
                {errorMessage}
              </p>
            )}
          </div>

          {/* ช่องกรอกที่ 2: แนบรูปหลักฐาน (หลายรูป) */}
          <div className="claim-form-group">
            <label className="claim-label">
              รูปหลักฐาน (หลายรูป)
            </label>

            {/* Hidden Input file จริง */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="claim-hidden-file-input"
              aria-hidden="true"
            />

            {/* กล่องประคลิกเพื่อเปิดหน้าต่างเลือกไฟล์ */}
            <div
              className="claim-upload-zone"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              + แนบรูปตำหนิหรือรูปของเดิม
            </div>

            {/* พรีวิวรูปภาพที่เลือกไว้ */}
            {evidenceImages.length > 0 && (
              <div className="claim-preview-grid">
                {evidenceImages.map((img) => (
                  <div key={img.id} className="claim-preview-item" title={img.name}>
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="claim-preview-img"
                    />
                    <button
                      type="button"
                      className="claim-preview-remove"
                      onClick={() => handleRemoveImage(img.id)}
                      aria-label={`ลบรูป ${img.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* แถบด้านล่าง: กล่องข้อความแจ้งเตือน + ปุ่มควบคุม */}
          <div className="claim-bottom-bar">
            <AlertCallout className="claim-alert">
              หลักฐานจะแสดงเฉพาะผู้ส่งคำขอ เจ้าของโพสต์ และผู้ดูแลระบบ
            </AlertCallout>

            <div className="claim-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={onCancel || handleGoBack}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอ'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
