
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ImageUpload from '../components/ImageUpload';
import Line from '../components/Line';
import PageHeader from '../components/ui/PageHeader';
import './CreatePost.css';

function CreatePost() {
  const navigate = useNavigate();

  // State
  const [postType, setPostType] = useState('LOST');
  const [custodyType, setCustodyType] = useState('DEPOSITED');
  const [title, setTitle] = useState('');
  const [locationId, setLocationId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [contactText, setContactText] = useState('');
  const [depositLocation, setDepositLocation] = useState(''); // location_id of the deposit building
  const [depositDetail, setDepositDetail] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // วันที่ปัจจุบันในรูปแบบ YYYY-MM-DD (ใช้เวลาท้องถิ่น)
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await apiRequest('/locations');
        setLocations(data.locations || []);
      } catch (err) {
        setError(err.message || 'ไม่สามารถโหลดข้อมูลสถานที่ได้');
      }
    };

    fetchLocations();
  }, []);

  // สร้าง Preview รูปภาพ และคืนหน่วยความจำเมื่อเปลี่ยนรูปหรือออกจากหน้า
  useEffect(() => {
    const previewUrls = images.map((image) => URL.createObjectURL(image));
    setImagePreviews(previewUrls);

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  // เลือกรูปภาพ
  const handleImageChange = (e) => {
    const selectedImages = Array.from(e.target.files || []);

    if (selectedImages.length > 5) {
      setError('สามารถเลือกรูปภาพได้สูงสุด 5 รูป');
      e.target.value = '';
      return;
    }

    const invalidImage = selectedImages.some(
      (image) => !image.type.startsWith('image/')
    );

    if (invalidImage) {
      setError('กรุณาเลือกเฉพาะไฟล์รูปภาพเท่านั้น');
      e.target.value = '';
      return;
    }

    setError('');
    setImages(selectedImages);
  };

  // ลบรูปภาพที่เลือก
  const handleRemoveImage = (index) => {
    setImages((currentImages) =>
      currentImages.filter((_, i) => i !== index)
    );
    setError('');
  };

  // ตรวจสอบข้อมูลก่อนเผยแพร่
  const validateForm = () => {
    if (!title.trim()) {
      return 'กรุณากรอกชื่อสิ่งของ';
    }

    if (!locationId) {
      return 'กรุณาเลือกสถานที่พบ';
    }

    if (!eventDate) {
      return 'กรุณาระบุวันที่พบ';
    }

    if (eventDate > today) {
      return 'วันที่พบต้องไม่เป็นวันในอนาคต';
    }

    const selectedDate = new Date(`${eventDate}T00:00:00`);

    if (Number.isNaN(selectedDate.getTime())) {
      return 'กรุณาระบุวันที่ให้ถูกต้อง';
    }

    if (!description.trim()) {
      return 'กรุณากรอกรายละเอียดสิ่งของ';
    }

    if (!contactText.trim()) {
      return 'กรุณากรอกเบอร์โทรศัพท์สำหรับติดต่อ';
    }

    // อนุญาตให้กรอกเบอร์โทรไทยโดยมีช่องว่าง ขีด หรือวงเล็บได้
    const normalizedPhone = contactText.replace(/[\s\-()]/g, '');
    const phonePattern = /^(0\d{8,9}|\+66\d{8,9})$/;

    if (!phonePattern.test(normalizedPhone)) {
      return 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง เช่น 0812345678';
    }

    if (images.length > 5) {
      return 'สามารถเลือกรูปภาพได้สูงสุด 5 รูป';
    }

    if (images.some((image) => !image.type.startsWith('image/'))) {
      return 'กรุณาเลือกเฉพาะไฟล์รูปภาพเท่านั้น';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();

      formData.append('post_type', postType);

      if (postType === 'FOUND') {
        formData.append('custody_type', custodyType);
        if (custodyType === 'DEPOSITED') {
          formData.append('deposit_location_id', depositLocation);
          formData.append('deposit_detail', depositDetail);
        }
      }

      formData.append('title', title.trim());
      formData.append('location_id', locationId);
      formData.append('event_date', eventDate);
      formData.append('description', description.trim());
      formData.append('contact_text', contactText.trim());

      images.forEach((image) => {
        formData.append('images', image);
      });

      await apiRequest('/posts', {
        method: 'POST',
        body: formData,
      });

      navigate('/posts', {
        state: {
          successMessage: 'เผยแพร่ประกาศใหม่สำเร็จเรียบร้อยแล้ว!',
        },
      });
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเผยแพร่โพสต์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="createpost-page">
      <div className="createpost-container">
        <PageHeader
          backText="กลับไปรายการโพสต์"
          onBack={() => navigate('/posts')}
          tag="CREATE POST"
          title="สร้างโพสต์"
          subtitle="กรอกรายละเอียดสิ่งของเพื่อลงประกาศหาเจ้าของหรือตามหาของที่หาย"
        />

        <div className="form-layout">
          {/* ฝั่งซ้าย: ข้อมูลสิ่งของ */}
          <div className="form-left">
            <Card>
              <h2>ประเภท</h2>

              <div className="segmented-toggle">
                <button
                  type="button"
                  className={`toggle-option ${postType === 'LOST' ? 'is-active' : ''}`}
                  onClick={() => setPostType('LOST')}
                >
                  ของหาย
                </button>

                <button
                  type="button"
                  className={`toggle-option ${postType === 'FOUND' ? 'is-active' : ''}`}
                  onClick={() => setPostType('FOUND')}
                >
                  พบของ
                </button>
              </div>

              <h2>ข้อมูลสิ่งของ</h2>

              <h3>
                ชื่อสิ่งของ <span className="req-star">*</span>
              </h3>

              <Input
                type="text"
                placeholder="เช่น กระเป๋าสตางค์สีดำ"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <h3>
                สถานที่พบ <span className="req-star">*</span>
              </h3>

              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <option value="">-- เลือกสถานที่ --</option>

                {locations.map((location) => (
                  <option
                    key={location.location_id}
                    value={location.location_id}
                  >
                    {location.building_name}
                  </option>
                ))}
              </select>

              <h3>
                วันที่พบ <span className="req-star">*</span>
              </h3>

              <Input
                type="date"
                max={today}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />

              <h3>
                รายละเอียดสิ่งของ <span className="req-star">*</span>
              </h3>

              <Input
                type="text"
                placeholder="สี รูปทรง ตำหนิ หรือรายละเอียดที่ช่วยระบุสิ่งของ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <h3>รูปภาพสิ่งของ</h3>

              <ImageUpload
                size="20px"
                text={
                  images.length > 0
                    ? `เลือกแล้ว ${images.length} รูป`
                    : 'รูปหลักของสิ่งของ'
                }
                multiple={true}
                onChange={handleImageChange}
              />

              {/* Image Preview */}
              {imagePreviews.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h3>ตัวอย่างรูปภาพ ({images.length}/5)</h3>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={`${preview}-${index}`}
                        style={{
                          position: 'relative',
                          width: '110px',
                          height: '110px',
                        }}
                      >
                        <img
                          src={preview}
                          alt={`ตัวอย่างรูปภาพ ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          aria-label={`ลบรูปภาพที่ ${index + 1}`}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '24px',
                            height: '24px',
                            border: 'none',
                            borderRadius: '50%',
                            background: '#dc2626',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '16px',
                            lineHeight: '24px',
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* ฝั่งขวา: ข้อมูลการเก็บรักษาและปุ่มส่ง */}
          <div className="form-right">
            <Card>
              <h2>ข้อมูลการเก็บรักษา</h2>

              {postType === 'FOUND' && (
                <>
                  <h3>
                    สถานะสิ่งของ <span className="req-star">*</span>
                  </h3>

                  <div className="segmented-toggle">
                    <button
                      type="button"
                      className={`toggle-option ${custodyType === 'DEPOSITED' ? 'is-active' : ''}`}
                      onClick={() => setCustodyType('DEPOSITED')}
                    >
                      ฝากไว้
                    </button>

                    <button
                      type="button"
                      className={`toggle-option ${custodyType === 'SELF_KEPT' ? 'is-active' : ''}`}
                      onClick={() => setCustodyType('SELF_KEPT')}
                    >
                      เก็บไว้เอง
                    </button>
                  </div>

                  <Line />
                </>
              )}

              <h3>
                ช่องทางติดต่อ <span className="req-star">*</span>
              </h3>

              <Input
                type="text"
                placeholder="เบอร์โทร"
                value={contactText}
                onChange={(e) => setContactText(e.target.value)}
              />

              {postType === 'FOUND' && custodyType === 'DEPOSITED' && (
                <>
                  <h3>
                    สถานที่ฝาก <span className="req-star">*</span>
                  </h3>
                  <select value={depositLocation} onChange={(e) => setDepositLocation(e.target.value)}>
                    <option value="">-- เลือกตึกที่ฝาก --</option>
                    {locations.map((location) => (
                      <option key={location.location_id} value={location.location_id}>
                        {location.building_name}
                      </option>
                    ))}
                  </select>

                  <h3>รายละเอียดที่รับฝาก</h3>
                  <Input
                    type="text"
                    placeholder="เช่น ฝากแม่บ้านชั้น 1 ห้อง S4-101 เปิด 8:00–16:00"
                    value={depositDetail}
                    onChange={(e) => setDepositDetail(e.target.value)}
                  />
                </>
              )}

              <div className="form-description">
                <p>ข้อมูลติดต่อจะแสดงในหน้าโพสต์</p>
                <p>ตรวจสอบข้อมูลก่อนเผยแพร่</p>
              </div>

              {error && (
                <p
                  role="alert"
                  style={{
                    color: '#dc2626',
                    background: '#fef2f2',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginTop: '12px',
                  }}
                >
                  {error}
                </p>
              )}

              <div className="flex-button2">
                <Button
                  type="button"
                  className="btn-cancel"
                  onClick={() => navigate('/posts')}
                >
                  ยกเลิก
                </Button>

                <Button
                  type="button"
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'กำลังเผยแพร่...' : 'เผยแพร่โพสต์'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;
