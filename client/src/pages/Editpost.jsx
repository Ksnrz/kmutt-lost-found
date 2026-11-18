import BuildingPicker from '../components/BuildingPicker';

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiRequest } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/ui/PageHeader';
import './Editpost.css';

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const API_ORIGIN = 'http://localhost:3000';

function Editpost() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const routerLocation = useLocation();
  const fromAccount = routerLocation.state?.from === 'account';

  const [postType, setPostType] = useState('LOST');
  const [custodyType, setCustodyType] = useState('');
  const [postStatus, setPostStatus] = useState('OPEN');
  const [title, setTitle] = useState('');
  const [locationId, setLocationId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [contactText, setContactText] = useState('');
  const [depositLocation, setDepositLocation] = useState(''); // location_id of the deposit building
  const [depositDetail, setDepositDetail] = useState('');

  const [locations, setLocations] = useState([]);
  const codeOf = (id) => locations.find((location) => String(location.location_id) === String(id))?.building_name;
  const idOf = (code) => String(locations.find((location) => location.building_name === code)?.location_id ?? '');
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  // โหลดข้อมูลโพสต์และสถานที่
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadError('');

        const [postData, locationData] = await Promise.all([
          apiRequest(`/posts/${postId}`),
          apiRequest('/locations'),
        ]);

        const post = postData.post;

        setPostType(post.post_type);
        setCustodyType(post.custody_type || '');
        setPostStatus(post.post_status || 'OPEN');
        setTitle(post.title || '');
        setLocationId(String(post.location_id || ''));
        setDescription(post.description || '');
        setContactText(post.contact_text || '');

        setEventDate(post.event_date || ''); // already 'YYYY-MM-DD' from the server
        setDepositLocation(String(post.deposit_location_id || ''));
        setDepositDetail(post.deposit_detail || '');

        setExistingImages(post.images || []);
        setLocations(locationData.locations || []);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  // สร้างและล้าง URL สำหรับตัวอย่างรูปใหม่
  useEffect(() => {
    const urls = newImages.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImages]);

  const goBack = () =>
    navigate(
      fromAccount ? '/account' : `/posts/${postId}`
    );

  // เลือกรูปภาพใหม่
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = '';

    if (selectedFiles.length === 0) return;

    const validFiles = [];

    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setError('รูปภาพต้องมีขนาดไม่เกิน 5 MB ต่อรูป');
        continue;
      }

      validFiles.push(file);
    }

    const remainingSlots =
      MAX_IMAGES - existingImages.length - newImages.length;

    if (remainingSlots <= 0) {
      setError('สามารถมีรูปภาพได้ไม่เกิน 5 รูป');
      return;
    }

    if (validFiles.length > remainingSlots) {
      setError(`เพิ่มรูปได้อีกไม่เกิน ${remainingSlots} รูป`);
    } else {
      setError('');
    }

    setNewImages((previous) => [
      ...previous,
      ...validFiles.slice(0, remainingSlots),
    ]);
  };

  // ลบรูปภาพเดิม
  const handleRemoveExistingImage = (image) => {
    setExistingImages((previous) =>
      previous.filter(
        (item) =>
          item.item_image_id !== image.item_image_id
      )
    );

    setDeletedImageIds((previous) => [
      ...previous,
      image.item_image_id,
    ]);
  };

  // ลบรูปภาพใหม่
  const handleRemoveNewImage = (index) => {
    setNewImages((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  // บันทึกการแก้ไขโพสต์
  const handleSave = async (e) => {
    e?.preventDefault();
    setError('');

    if (
      !title.trim() ||
      !locationId ||
      !eventDate ||
      !description.trim() ||
      !contactText.trim()
    ) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (eventDate > todayString) {
      setError('วันที่พบต้องไม่เป็นวันในอนาคต');
      return;
    }

    // ตรวจสอบวิธีเก็บรักษาสำหรับโพสต์ FOUND
    if (postType === 'FOUND' && !custodyType) {
      setError('กรุณาเลือกวิธีเก็บรักษาสิ่งของ');
      return;
    }

    // ตรวจสอบสถานที่ฝากสำหรับโพสต์ FOUND แบบ DEPOSITED
    if (
      postType === 'FOUND' &&
      custodyType === 'DEPOSITED' &&
      !depositLocation
    ) {
      setError('กรุณาเลือกสถานที่ฝากสิ่งของ');
      return;
    }

    if (
      existingImages.length + newImages.length >
      MAX_IMAGES
    ) {
      setError('สามารถมีรูปภาพได้ไม่เกิน 5 รูป');
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append('post_type', postType);

      formData.append(
        'custody_type',
        postType === 'FOUND' ? custodyType : ''
      );

      formData.append('title', title.trim());
      formData.append('location_id', locationId);
      formData.append('event_date', eventDate);
      formData.append('description', description.trim());

      // รับข้อความช่องทางติดต่อได้ทุกประเภท
      // ไม่จำกัดเฉพาะเบอร์โทรศัพท์
      formData.append('contact_text', contactText.trim());

      formData.append(
        'delete_image_ids',
        JSON.stringify(deletedImageIds)
      );

      newImages.forEach((file) => {
        formData.append('images', file);
      });

      formData.set(
        'deposit_location_id',
        postType === 'FOUND' &&
        custodyType === 'DEPOSITED'
          ? depositLocation
          : ''
      );

      formData.set(
        'deposit_detail',
        postType === 'FOUND' &&
        custodyType === 'DEPOSITED'
          ? depositDetail
          : ''
      );

      await apiRequest(`/posts/${postId}`, {
        method: 'PATCH',
        body: formData,
      });

      if (fromAccount) {
        const buildingName =
          locations.find(
            (l) => String(l.location_id) === locationId
          )?.building_name || '';

        navigate('/account', {
          state: {
            successMessage:
              'บันทึกการแก้ไขโพสต์เรียบร้อยแล้ว',

            updatedPost: {
              id: postId,
              post_id: postId,
              title,
              status: postStatus,
              post_status: postStatus,

              post_type:
                postType === 'LOST'
                  ? 'ตามหาของหาย (LOST)'
                  : 'ประกาศเจอของ (FOUND)',

              custody_type:
                custodyType === 'SELF_KEPT'
                  ? 'ผู้พบเก็บรักษาเอง'
                  : 'ฝากจุดประชาสัมพันธ์',

              building_name: buildingName,
              location: buildingName,
              date: eventDate,
              description,
              contact: contactText,
            },
          },
        });
      } else {
        navigate(`/posts/${postId}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ยืนยันการยกเลิกประกาศ
  const handleDelete = async () => {
    try {
      setSaving(true);
      setError('');

      await apiRequest(`/posts/${postId}/cancel`, {
        method: 'PATCH',
      });

      navigate(fromAccount ? '/account' : '/posts', {
        state: {
          successMessage: 'ยกเลิกประกาศเรียบร้อยแล้ว',
          ...(fromAccount && {
            deletedPostId: postId,
          }),
        },
      });
    } catch (err) {
      setError(err.message);
      setShowDeleteConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  // หน้ากำลังโหลด
  if (loading) {
    return (
      <div className="editpost-page">
        <div className="editpost-container">
          <p>กำลังโหลดข้อมูลโพสต์...</p>
        </div>
      </div>
    );
  }

  // กรณีโหลดข้อมูลไม่สำเร็จ
  if (loadError) {
    return (
      <div className="editpost-page">
        <div className="editpost-container">
          <PageHeader
            backText="กลับไปรายการโพสต์"
            onBack={goBack}
            tag="EDIT POST"
            title="แก้ไขโพสต์"
            subtitle="ปรับปรุงรายละเอียดข้อมูลสิ่งของหรือสถานะการเก็บรักษา"
          />

          <p style={{ color: 'red' }}>{loadError}</p>

          <Button type="button" onClick={goBack}>
            กลับ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="editpost-page">
      <div className="editpost-container">

        <PageHeader
          backText="กลับไปรายการโพสต์"
          onBack={goBack}
          tag="EDIT POST"
          title="แก้ไขโพสต์"
          subtitle="ปรับปรุงรายละเอียดข้อมูลสิ่งของหรือสถานะการเก็บรักษา"
        />

        <div className="form-layout">

          {/* ฝั่งซ้าย: ข้อมูลสิ่งของ */}
          <div className="form-left">
            <Card>

              <h2>ประเภท</h2>

              <div className="segmented-toggle">
                <button
                  type="button"
                  className={`toggle-option ${
                    postType === 'LOST' ? 'is-active' : ''
                  }`}
                  onClick={() => setPostType('LOST')}
                >
                  ของหาย
                </button>

                <button
                  type="button"
                  className={`toggle-option ${
                    postType === 'FOUND' ? 'is-active' : ''
                  }`}
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

              <div className="form-row">

                <div>
                  <h3>
                    สถานที่พบ <span className="req-star">*</span>
                  </h3>
                  <BuildingPicker
                    value={codeOf(locationId)}
                    onChange={(code) => setLocationId(idOf(code))}
                  />
                </div>

                <div>
                  <h3>
                    {postType === 'LOST' ? 'วันที่คาดว่าทำหาย' : 'วันที่พบ'} <span className="req-star">*</span>
                  </h3>

                  <Input
                    type="date"
                    value={eventDate}
                    max={todayString}
                    onChange={(e) =>
                      setEventDate(e.target.value)
                    }
                  />
                </div>

              </div>

              <h3>
                รายละเอียดสิ่งของ{' '}
                <span className="req-star">*</span>
              </h3>

              <textarea
                placeholder="สี รูปทรง ตำหนิ หรือรายละเอียดที่ช่วยระบุสิ่งของ..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />

              <hr className="editpost-divider" />

              <h2>รูปภาพสิ่งของ</h2>

              <p>
                เพิ่มรูปหรือลบรูปเดิมได้ รวมทั้งหมดไม่เกิน 5 รูป
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(110px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >

                {/* รูปภาพเดิม */}
                {existingImages.map((image) => (
                  <div
                    key={image.item_image_id}
                    style={{
                      position: 'relative',
                      aspectRatio: '1 / 1',
                    }}
                  >
                    <img
                      src={`${API_ORIGIN}${image.item_image_url}`}
                      alt="รูปสิ่งของเดิม"
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
                        handleRemoveExistingImage(image)
                      }
                      aria-label="ลบรูปเดิม"
                      style={removeImageButtonStyle}
                    >
                      ×
                    </button>

                    <span
                      style={{
                        position: 'absolute',
                        bottom: '5px',
                        left: '5px',
                        background: '#333',
                        color: 'white',
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      รูปเดิม
                    </span>
                  </div>
                ))}

                {/* รูปภาพใหม่ */}
                {previewUrls.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    style={{
                      position: 'relative',
                      aspectRatio: '1 / 1',
                    }}
                  >
                    <img
                      src={url}
                      alt="ตัวอย่างรูปใหม่"
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
                        handleRemoveNewImage(index)
                      }
                      aria-label="ลบรูปใหม่"
                      style={removeImageButtonStyle}
                    >
                      ×
                    </button>

                    <span
                      style={{
                        position: 'absolute',
                        bottom: '5px',
                        left: '5px',
                        background: '#176b39',
                        color: 'white',
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      รูปใหม่
                    </span>
                  </div>
                ))}

              </div>

              {/* ปุ่มเพิ่มรูปภาพ */}
              {existingImages.length + newImages.length <
                MAX_IMAGES && (
                <label
                  style={{
                    display: 'inline-block',
                    padding: '10px 16px',
                    border: '1px dashed #999',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  + เพิ่มรูปภาพ

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}

              <p style={{ fontSize: '13px', color: '#666' }}>
                รองรับ JPG, PNG, WEBP และ GIF ขนาดไม่เกิน 5 MB ต่อรูป
              </p>

            </Card>
          </div>

          {/* ฝั่งขวา: ข้อมูลการเก็บรักษา */}
          <div className="form-right">
            <Card>

              <h2>
                {postType === 'LOST'
                  ? 'ข้อมูลผู้ตามหา'
                  : 'ข้อมูลการเก็บรักษา'}
              </h2>

              {/* แสดงเฉพาะโพสต์ FOUND */}
              {postType === 'FOUND' && (
                <>
                  <h3>
                    สถานะสิ่งของ{' '}
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
                      onClick={() =>
                        setCustodyType('DEPOSITED')
                      }
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
                      onClick={() =>
                        setCustodyType('SELF_KEPT')
                      }
                    >
                      เก็บไว้เอง
                    </button>

                  </div>

                  <hr className="editpost-divider" />
                </>
              )}

              {/* ช่องทางติดต่อ */}
              <h3>
                ช่องทางติดต่อ{' '}
                <span className="req-star">*</span>
              </h3>

              <Input
                type="text"
                placeholder="เช่น Instagram, Line ID, Facebook หรือเบอร์โทร"
                value={contactText}
                onChange={(e) =>
                  setContactText(e.target.value)
                }
              />

              {/* สถานที่ฝาก เฉพาะ FOUND และ DEPOSITED */}
              {postType === 'FOUND' &&
                custodyType === 'DEPOSITED' && (
                  <>
                    <h3>
                      สถานที่ฝาก{' '}
                      <span className="req-star">*</span>
                    </h3>

                    <BuildingPicker
                      value={codeOf(depositLocation)}
                      onChange={(code) =>
                        setDepositLocation(idOf(code))
                      }
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

              <div className="form-description">
                <p>ข้อมูลติดต่อจะแสดงในหน้าโพสต์</p>
                <p>ตรวจสอบข้อมูลก่อนเผยแพร่</p>
              </div>

              {/* แจ้งเตือนข้อผิดพลาด */}
              {error && (
                <p
                  style={{ color: 'red' }}
                  role="alert"
                >
                  {error}
                </p>
              )}

              {/* ปุ่มดำเนินการ */}
              <div className="flex-button2">

                <Button
                  type="button"
                  className="btn-cancel"
                  onClick={goBack}
                  disabled={saving}
                >
                  ยกเลิก
                </Button>

                <Button
                  type="button"
                  className="btn-delete"
                  onClick={() =>
                    setShowDeleteConfirm(true)
                  }
                  disabled={saving}
                >
                  ยกเลิกประกาศ
                </Button>

              </div>

              <div className="submit-button-wrap">
                <Button
                  type="button"
                  className="btn-submit-edit"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>

            </Card>
          </div>

        </div>
      </div>

      {/* Modal ยืนยันการยกเลิกประกาศ */}
      {showDeleteConfirm && (
        <div style={modalOverlayStyle}>
          <div
            style={modalStyle}
            role="dialog"
            aria-modal="true"
          >
            <h2>ยืนยันการยกเลิกประกาศ</h2>

            <p>
              คุณต้องการยกเลิกประกาศนี้ใช่หรือไม่?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '20px',
              }}
            >
              <Button
                type="button"
                onClick={() =>
                  setShowDeleteConfirm(false)
                }
                disabled={saving}
              >
                กลับ
              </Button>

              <Button
                type="button"
                className="btn-delete"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving
                  ? 'กำลังดำเนินการ...'
                  : 'ยืนยันยกเลิกประกาศ'}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const removeImageButtonStyle = {
  position: 'absolute',
  top: '5px',
  right: '5px',
  width: '26px',
  height: '26px',
  border: 'none',
  borderRadius: '50%',
  background: '#d93025',
  color: 'white',
  fontSize: '20px',
  lineHeight: '20px',
  cursor: 'pointer',
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  zIndex: 9999,
};

const modalStyle = {
  background: 'white',
  borderRadius: '12px',
  padding: '24px',
  width: '100%',
  maxWidth: '440px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
};

export default Editpost;
