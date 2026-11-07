import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ImagePlus, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Thumbnail from '../../components/ui/Thumbnail';
import AlertCallout from '../../components/ui/AlertCallout';
import './ClaimRequestPage.css';

/**
 * ClaimRequestPage Component — หน้าส่งคำขอตรวจสอบ (VERIFICATION REQUEST)
 * Route URL: /claims/new
 */
export default function ClaimRequestPage({
  // ข้อมูลโพสต์ที่ส่งคำขอ
  item = {
    id: 'p-101',
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
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // รองรับข้อมูลที่ส่งต่อมาจากหน้ารายละเอียดโพสต์ (state, query params หรือ fallback mock)
  const incomingPost = location.state?.post || location.state?.item;
  const currentItem = incomingPost || {
    id: searchParams.get('postId') || item.id || 'p-101',
    title: item.title || 'พบกระเป๋าสตางค์สีดำ',
    category: item.category || 'ประกาศเจอของ',
    location: item.location || 'S4 ชั้น 1',
    imageUrl: item.imageUrl || null,
  };

  // State 1: ข้อความรายละเอียดตำหนิ
  const [defectDetail, setDefectDetail] = useState('');

  // State 2: รายการรูปภาพหลักฐาน
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
      // 2. โครงสร้าง Payload ส่งข้อมูลตาม ER Diagram
      const payload = {
        post_id: currentItem.id || 'p-101',
        user_id: 'u-101',
        verify_status: 'PENDING',
        proof_description: defectDetail.trim(),
        created_at: new Date().toISOString(),
        verify_images: evidenceImages.map((img, idx) => ({
          verify_image_id: `vimg-${Date.now()}-${idx}`,
          verify_image_url: img.previewUrl,
          file_name: img.name,
        })),
        itemTitle: currentItem.title,
        evidenceCount: evidenceImages.length,
      };

      console.log('ส่งคำขอยืนยันสิทธิ์:', payload);

      // จำลอง network delay 
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      } else {
        navigate('/account', {
          state: { successMessage: `ส่งคำขอตรวจสอบสำหรับ "${currentItem.title}" เรียบร้อยแล้ว!` }
        });
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
    } else if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 1) {
      navigate(-1); // กลับไปยังหน้ารายละเอียดโพสต์ของเพื่อนที่เปิดมาก่อนหน้า
    } else {
      navigate('/account');
    }
  };

  return (
    <div className="claim-request-container">
      {/* 1. ส่วนหัวหน้าเว็บ */}
      <PageHeader
        backText="กลับไปรายการประกาศ"
        onBack={handleGoBack}
        tag="VERIFICATION REQUEST"
        title="ส่งคำขอตรวจสอบ"
        subtitle="กรอกรายละเอียดตำหนิและแนบหลักฐานเพื่อยืนยันความเป็นเจ้าของ"
      />

      {/* 2. การ์ดฟอร์มหลัก */}
      <Card className="claim-request-card">
        {/* กล่องสรุปโพสต์ที่กำลังทำเรื่องขอคืน */}
        <div className="claim-post-summary">
          <Thumbnail
            text="รูปโพสต์"
            src={currentItem.imageUrl}
          />
          <div className="claim-post-info">
            <p className="claim-post-title">
              {currentItem.title}
            </p>
            <p className="claim-post-meta">
              {currentItem.category || 'ประกาศเจอของ'} · {currentItem.location || 'S4 ชั้น 1'}
            </p>
          </div>
        </div>

        <hr className="ui-divider" />

        {/* ฟอร์มข้อมูลยืนยันสิทธิ์ */}
        <form onSubmit={handleSubmit} className="claim-form" noValidate>
          <h2 className="claim-section-title">ข้อมูลเพื่อยืนยันสิทธิ์</h2>

          {/* ช่องกรอกที่ 1: รายละเอียดตำหนิ */}
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

          {/* ช่องกรอกที่ 2: แนบรูปหลักฐาน */}
          <div className="claim-form-group">
            <label className="claim-label">
              รูปหลักฐาน (หลายรูป)
            </label>

            {/* Hidden Input file จริง */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="claim-hidden-file-input"
              aria-label="เลือกไฟล์รูปหลักฐาน"
            />

            {/* กล่อง Drag/Drop & Click Upload */}
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
              <ImagePlus size={18} className="claim-upload-icon" />
              <span>แนบรูปตำหนิหรือรูปของเดิม</span>
            </div>

            {/* แสดง Preview รูปที่ผู้ใช้อัปโหลด */}
            {evidenceImages.length > 0 && (
              <div className="claim-preview-grid">
                {evidenceImages.map((img) => (
                  <div key={img.id} className="claim-preview-item">
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="claim-preview-img"
                    />
                    <button
                      type="button"
                      className="claim-preview-remove"
                      onClick={() => handleRemoveImage(img.id)}
                      aria-label={`ลบรูปภาพ ${img.name}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* แถบล่างสุด: กล่องข้อความเตือน + ปุ่มควบคุม */}
          <div className="claim-bottom-bar">
            <div className="claim-alert">
              <AlertCallout>
                หลักฐานจะแสดงเฉพาะผู้ส่งคำขอ เจ้าของโพสต์ และผู้ดูแลระบบ
              </AlertCallout>
            </div>

            <div className="claim-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  if (onCancel) onCancel();
                  else navigate('/account');
                }}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งคำขอ'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
