import BuildingPicker from '../components/BuildingPicker';

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

  // ==============================
  // State
  // ==============================

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

  // ==============================
  // Location helpers
  // ==============================

  const codeOf = (id) =>
    locations.find(
      (location) =>
        String(location.location_id) === String(id)
    )?.building_name;

  const idOf = (code) =>
    String(
      locations.find(
        (location) => location.building_name === code
      )?.location_id ?? ''
    );

  // ==============================
  // Current date
  // ==============================

  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  // ==============================
  // Fetch locations
  // ==============================

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await apiRequest('/locations');
        setLocations(data.locations || []);
      } catch (err) {
        setError(
          err.message || 'ไม่สามารถโหลดข้อมูลสถานที่ได้'
        );
      }
    };

    fetchLocations();
  }, []);

  // ==============================
  // Image preview
  // ==============================

  useEffect(() => {
    const previewUrls = images.map((image) =>
      URL.createObjectURL(image)
    );

    setImagePreviews(previewUrls);

    return () => {
      previewUrls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [images]);

  // ==============================
  // Handle image selection
  // ==============================

  const handleImageChange = (e) => {
    const selectedImages = Array.from(
      e.target.files || []
    );

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

  // ==============================
  // Remove image
  // ==============================

  const handleRemoveImage = (index) => {
    setImages((currentImages) =>
      currentImages.filter((_, i) => i !== index)
    );

    setError('');
  };

  // ==============================
  // Validate form
  // ==============================

  const validateForm = () => {
    if (!title.trim()) {
      return 'กรุณากรอกชื่อสิ่งของ';
    }

    if (title.trim().length > 200) {
      return 'ชื่อสิ่งของต้องไม่เกิน 200 ตัวอักษร';
    }

    if (!locationId) {
      return 'กรุณาเลือกสถานที่พบ';
    }

    const selectedLocation = locations.find(
      (location) =>
        String(location.location_id) === String(locationId)
    );

    if (!selectedLocation) {
      return 'ไม่พบข้อมูลสถานที่ที่เลือก กรุณาเลือกใหม่';
    }

    if (!eventDate) {
      return 'กรุณาระบุวันที่พบ';
    }

    if (eventDate > today) {
      return 'วันที่พบต้องไม่เป็นวันในอนาคต';
    }

    const selectedDate = new Date(
      `${eventDate}T00:00:00`
    );

    if (Number.isNaN(selectedDate.getTime())) {
      return 'กรุณาระบุวันที่ให้ถูกต้อง';
    }

    if (!description.trim()) {
      return 'กรุณากรอกรายละเอียดสิ่งของ';
    }

    if (!contactText.trim()) {
      return 'กรุณากรอกช่องทางติดต่อ';
    }

    if (contactText.trim().length > 200) {
      return 'ช่องทางติดต่อต้องไม่เกิน 200 ตัวอักษร';
    }

    // FOUND + DEPOSITED ต้องมีสถานที่ฝาก
    if (
      postType === 'FOUND' &&
      custodyType === 'DEPOSITED'
    ) {
      if (!depositLocation) {
        return 'กรุณาเลือกสถานที่ฝาก';
      }

      const selectedDepositLocation = locations.find(
        (location) =>
          String(location.location_id) ===
          String(depositLocation)
      );

      if (!selectedDepositLocation) {
        return 'ไม่พบสถานที่ฝาก กรุณาเลือกใหม่';
      }
    }

    if (images.length > 5) {
      return 'สามารถเลือกรูปภาพได้สูงสุด 5 รูป';
    }

    if (
      images.some(
        (image) => !image.type.startsWith('image/')
      )
    ) {
      return 'กรุณาเลือกเฉพาะไฟล์รูปภาพเท่านั้น';
    }

    return '';
  };

  // ==============================
  // Submit post
  // ==============================

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (loading) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();

      // Post type
      formData.append('post_type', postType);

      // Custody information
      if (postType === 'FOUND') {
        formData.append('custody_type', custodyType);

        if (custodyType === 'DEPOSITED') {
          formData.append(
            'deposit_location_id',
            depositLocation
          );

          formData.append(
            'deposit_detail',
            depositDetail.trim()
          );
        }
      }

      // Post information
      formData.append('title', title.trim());

      formData.append('location_id', locationId);

      formData.append('event_date', eventDate);

      formData.append(
        'description',
        description.trim()
      );

      // Accept any contact text:
      // Instagram, Line ID, Facebook, phone number, etc.
      formData.append(
        'contact_text',
        contactText.trim()
      );

      // Images
      images.forEach((image) => {
        formData.append('images', image);
      });

      // Send API request
      await apiRequest('/posts', {
        method: 'POST',
        body: formData,
      });

      // Success
      navigate('/posts', {
        state: {
          successMessage:
            'เผยแพร่ประกาศใหม่สำเร็จเรียบร้อยแล้ว!',
        },
      });

    } catch (err) {
      console.error('Create post error:', err);

      setError(
        err.message ||
        'เกิดข้อผิดพลาดในการเผยแพร่โพสต์'
      );

    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Render
  // ==============================

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

          {/* LEFT: Item information */}

          <div className="form-left">
            <Card>

              <h2>ประเภท</h2>

              <div className="segmented-toggle">

                <button
                  type="button"
                  className={`toggle-option ${
                    postType === 'LOST' ? 'is-active' : ''
                  }`}
                  onClick={() => {
                    setPostType('LOST');
                    setError('');
                  }}
                >
                  ของหาย
                </button>

                <button
                  type="button"
                  className={`toggle-option ${
                    postType === 'FOUND' ? 'is-active' : ''
                  }`}
                  onClick={() => {
                    setPostType('FOUND');
                    setError('');
                  }}
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

              <BuildingPicker
                value={codeOf(locationId)}
                onChange={(code) => {
                  setLocationId(idOf(code));
                  setError('');
                }}
              />

              <h3>
                {postType === 'LOST'
                  ? 'วันที่คาดว่าทำหาย'
                  : 'วันที่พบ'}
                {' '}
                <span className="req-star">*</span>
              </h3>

              <Input
                type="date"
                max={today}
                value={eventDate}
                onChange={(e) =>
                  setEventDate(e.target.value)
                }
              />

              <h3>
                รายละเอียดสิ่งของ
                {' '}
                <span className="req-star">*</span>
              </h3>

              <Input
                type="text"
                placeholder="สี รูปทรง ตำหนิ หรือรายละเอียดที่ช่วยระบุสิ่งของ..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
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

                  <h3>
                    ตัวอย่างรูปภาพ ({images.length}/5)
                  </h3>

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
                          onClick={() =>
                            handleRemoveImage(index)
                          }
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

          {/* RIGHT: Contact and custody information */}

          <div className="form-right">
            <Card>
              <h2>{postType === 'LOST' ? 'ข้อมูลผู้ตามหา' : 'ข้อมูลการเก็บรักษา'}</h2>

              {postType === 'FOUND' && (
                <>

                  <h3>
                    สถานะสิ่งของ
                    {' '}
                    <span className="req-star">*</span>
                  </h3>

                  <div className="segmented-toggle">

                    <button
                      type="button"
                      className={`toggle-option ${
                        custodyType === 'DEPOSITED'
                          ? 'is-active'
                          : ''
                      }`}
                      onClick={() => {
                        setCustodyType('DEPOSITED');
                        setError('');
                      }}
                    >
                      ฝากไว้
                    </button>

                    <button
                      type="button"
                      className={`toggle-option ${
                        custodyType === 'SELF_KEPT'
                          ? 'is-active'
                          : ''
                      }`}
                      onClick={() => {
                        setCustodyType('SELF_KEPT');
                        setError('');
                      }}
                    >
                      เก็บไว้เอง
                    </button>

                  </div>

                  <Line />

                </>
              )}

              {/* Contact information */}

              <h3>
                ช่องทางติดต่อ
                {' '}
                <span className="req-star">*</span>
              </h3>

              <Input
                type="text"
                placeholder="เช่น @instagram, Line ID, Facebook หรือเบอร์โทร"
                value={contactText}
                onChange={(e) =>
                  setContactText(e.target.value)
                }
              />

              <p
                style={{
                  fontSize: '13px',
                  color: '#888',
                  marginTop: '8px',
                  lineHeight: '1.6',
                }}
              >
                สามารถกรอกช่องทางติดต่อได้อย่างอิสระ
                เช่น Instagram, Line ID, Facebook หรือเบอร์โทรศัพท์
              </p>

              {/* Deposit information */}

              {postType === 'FOUND' &&
                custodyType === 'DEPOSITED' && (
                  <>

                    <h3>
                      สถานที่ฝาก
                      {' '}
                      <span className="req-star">*</span>
                    </h3>

                    <BuildingPicker
                      value={codeOf(depositLocation)}
                      onChange={(code) => {
                        setDepositLocation(idOf(code));
                        setError('');
                      }}
                    />

                    <h3>รายละเอียดที่รับฝาก</h3>

                    <Input
                      type="text"
                      placeholder="เช่น ฝากแม่บ้านชั้น 1 ห้อง S4-101 เปิด 8:00–16:00"
                      value={depositDetail}
                      onChange={(e) =>
                        setDepositDetail(e.target.value)
                      }
                    />

                  </>
                )}

              {/* Description */}

              <div className="form-description">
                <p>ข้อมูลติดต่อจะแสดงในหน้าโพสต์</p>
                <p>ตรวจสอบข้อมูลก่อนเผยแพร่</p>
              </div>

              {/* Error message */}

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

              {/* Buttons */}

              <div className="flex-button2">

                <Button
                  type="button"
                  className="btn-cancel"
                  onClick={() => navigate('/posts')}
                  disabled={loading}
                >
                  ยกเลิก
                </Button>

                <Button
                  type="button"
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading
                    ? 'กำลังเผยแพร่...'
                    : 'เผยแพร่โพสต์'}
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
