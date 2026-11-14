
import { useState, useRef, useEffect } from 'react';
import {
  useNavigate,
  useLocation,
  useSearchParams,
  useParams,
} from 'react-router-dom';
import { ImagePlus, X } from 'lucide-react';

import { apiRequest } from '../../api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Thumbnail from '../../components/ui/Thumbnail';
import AlertCallout from '../../components/ui/AlertCallout';
import { claimService } from '../../services/claimService';
import './ClaimRequestPage.css';

export default function ClaimRequestPage({
  item,
  onBack,
  onCancel,
  onSubmitSuccess,
}) {
  const navigate = useNavigate();
  const { postId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const actualPostId =
    postId || searchParams.get('postId') || item?.id;

  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [postError, setPostError] = useState('');

  const [defectDetail, setDefectDetail] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // ดึงข้อมูลโพสต์จริงจาก Backend
  useEffect(() => {
    const fetchPost = async () => {
      if (!actualPostId) {
        setPostError('ไม่พบรหัสประกาศ');
        setLoadingPost(false);
        return;
      }

      try {
        setLoadingPost(true);
        setPostError('');

        const data = await apiRequest(`/posts/${actualPostId}`);

        if (!data.post) {
          throw new Error('ไม่พบประกาศนี้');
        }

        setPost(data.post);
      } catch (err) {
        setPostError(err.message || 'ไม่สามารถโหลดข้อมูลประกาศได้');
      } finally {
        setLoadingPost(false);
      }
    };

    fetchPost();
  }, [actualPostId]);

  // ล้าง URL รูปภาพเมื่อออกจากหน้า
  useEffect(() => {
    return () => {
      evidenceImages.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, [evidenceImages]);

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

  const handleRemoveImage = (idToRemove) => {
    setEvidenceImages((prev) => {
      const target = prev.find((img) => img.id === idToRemove);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((img) => img.id !== idToRemove);
    });
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/posts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ตรวจสอบสถานะโพสต์ก่อนส่งคำขอ
    if (post?.post_status !== 'OPEN') {
      setErrorMessage('ประกาศนี้ถูกยกเลิกแล้ว ไม่สามารถส่งคำขอได้');
      return;
    }

    if (!defectDetail.trim()) {
      setErrorMessage(
        'กรุณาระบุรายละเอียดตำหนิหรือข้อมูลเฉพาะเพื่อยืนยันความเป็นเจ้าของ'
      );
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // ตรวจสอบสถานะจาก Backend อีกครั้งก่อนดำเนินการ
      const latestData = await apiRequest(`/posts/${actualPostId}`);

      if (latestData.post?.post_status !== 'OPEN') {
        setPost(latestData.post);
        setErrorMessage('ประกาศนี้ถูกยกเลิกแล้ว ไม่สามารถส่งคำขอได้');
        return;
      }

      // ข้อมูลสำหรับส่งต่อให้ระบบส่วนอื่น
      const payload = {
        post_id: post.post_id,
        proof_description: defectDetail.trim(),
        files: evidenceImages.map((img) => img.file).filter(Boolean),
        verify_images: evidenceImages.map((img) => ({
          file: img.file,
          file_name: img.name,
        })),
        itemTitle: post.title,
        evidenceCount: evidenceImages.length,
      };

      await claimService.submitClaim(payload);

      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      } else {
        navigate('/account', {
          state: { successMessage: `ส่งคำขอตรวจสอบสำหรับ "${post.title}" เรียบร้อยแล้ว!` },
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  const postStatus = String(post?.post_status || '')
    .trim()
    .toUpperCase();

  const imageUrl = post?.images?.[0]?.item_image_url
    ? `http://localhost:3000${post.images[0].item_image_url}`
    : null;

  const currentItem = {
    id: post?.post_id,
    title: post?.title || '',
    category:
      post?.post_type === 'FOUND'
        ? 'ประกาศเจอของ'
        : 'ประกาศของหาย',
    location: post?.building_name || '-',
    imageUrl,
  };

  if (loadingPost) {
    return (
      <div className="claim-request-container">
        <p>กำลังโหลดข้อมูลประกาศ...</p>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="claim-request-container">
        <PageHeader
          backText="กลับไปรายการประกาศ"
          onBack={handleGoBack}
          tag="VERIFICATION REQUEST"
          title="ส่งคำขอตรวจสอบ"
        />
        <Card className="claim-request-card">
          <p className="claim-error-text">
            {postError || 'ไม่พบประกาศนี้'}
          </p>
        </Card>
      </div>
    );
  }

  if (postStatus !== 'OPEN') {
    return (
      <div className="claim-request-container">
        <PageHeader
          backText="กลับไปรายการประกาศ"
          onBack={handleGoBack}
          tag="VERIFICATION REQUEST"
          title="ไม่สามารถส่งคำขอได้"
          subtitle="ประกาศนี้ถูกยกเลิกแล้ว"
        />

        <Card className="claim-request-card">
          <p>
            ประกาศ "{post.title}" ถูกยกเลิกแล้ว
          </p>
          <p>
            จึงไม่สามารถส่งคำขอตรวจสอบความเป็นเจ้าของได้
          </p>
          <div className="claim-actions">
            <Button
              variant="primary"
              type="button"
              onClick={handleGoBack}
            >
              กลับไปหน้าก่อนหน้า
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="claim-request-container">
      <PageHeader
        backText="กลับไปรายการประกาศ"
        onBack={handleGoBack}
        tag="VERIFICATION REQUEST"
        title="ส่งคำขอตรวจสอบ"
        subtitle="กรอกรายละเอียดตำหนิและแนบหลักฐานเพื่อยืนยันความเป็นเจ้าของ"
      />

      <Card className="claim-request-card">
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
              {currentItem.category} · {currentItem.location}
            </p>
          </div>
        </div>

        <hr className="ui-divider" />

        <form
          onSubmit={handleSubmit}
          className="claim-form"
          noValidate
        >
          <h2 className="claim-section-title">
            ข้อมูลเพื่อยืนยันสิทธิ์
          </h2>

          <div className="claim-form-group">
            <label
              className="claim-label"
              htmlFor="defectDetail"
            >
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
              placeholder="ระบุตำหนิพิเศษ เช่น รอยถลอก สติกเกอร์ หรือข้อมูลเฉพาะของสิ่งของ..."
              aria-required="true"
            />

            {errorMessage && (
              <p className="claim-error-text" role="alert">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="claim-form-group">
            <label className="claim-label">
              รูปหลักฐาน (หลายรูป)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="claim-hidden-file-input"
              aria-label="เลือกไฟล์รูปหลักฐาน"
            />

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
              <ImagePlus
                size={18}
                className="claim-upload-icon"
              />
              <span>แนบรูปตำหนิหรือรูปของเดิม</span>
            </div>

            {evidenceImages.length > 0 && (
              <div className="claim-preview-grid">
                {evidenceImages.map((img) => (
                  <div
                    key={img.id}
                    className="claim-preview-item"
                  >
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
                  else handleGoBack();
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
                {isSubmitting ? 'กำลังตรวจสอบ...' : 'ส่งคำขอ'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
