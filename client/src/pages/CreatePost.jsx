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
  const [postType, setPostType] = useState('LOST'); // 'LOST' | 'FOUND'
  const [custodyType, setCustodyType] = useState('DEPOSITED'); // 'DEPOSITED' | 'SELF_KEPT'
  const [title, setTitle] = useState('');
  const [locationId, setLocationId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [contactText, setContactText] = useState('');
  const [depositLocation, setDepositLocation] = useState('');
  const [images, setImages] = useState([]);

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await apiRequest('/locations');
        setLocations(data.locations);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchLocations();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();

      formData.append('post_type', postType);
      if (postType === 'FOUND') {
        formData.append('custody_type', custodyType);
      }
      formData.append('title', title);
      formData.append('location_id', locationId);
      formData.append('event_date', eventDate);
      formData.append('description', description);
      formData.append('contact_text', contactText);

      images.forEach((image) => {
        formData.append('images', image);
      });

      await apiRequest('/posts', {
        method: 'POST',
        body: formData,
      });

      navigate('/posts', {
        state: { successMessage: 'เผยแพร่ประกาศใหม่สำเร็จเรียบร้อยแล้ว!' },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="createpost-page">
      <div className="createpost-container">
        {/* Header พร้อม Tag ภาษาอังกฤษ และปุ่มย้อนกลับ */}
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
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                <option value="">-- เลือกสถานที่ --</option>
                {locations.map((location) => (
                  <option key={location.location_id} value={location.location_id}>
                    {location.building_name}
                  </option>
                ))}
              </select>

              <h3>
                วันที่พบ <span className="req-star">*</span>
              </h3>
              <Input
                type="date"
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
                text={images.length > 0 ? `เลือกแล้ว ${images.length} รูป` : 'รูปหลักของสิ่งของ'}
                multiple={true}
                onChange={(e) => {
                  const selectedImages = Array.from(e.target.files);
                  setImages(selectedImages.slice(0, 5));
                }}
              />
            </Card>
          </div>

          {/* ฝั่งขวา: ข้อมูลการเก็บรักษา & ปุ่มส่ง */}
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
                  <h3>เลือกสถานที่ฝาก</h3>
                  <Input
                    type="text"
                    placeholder="เลือกสถานที่ / ตึก ▾"
                    value={depositLocation}
                    onChange={(e) => setDepositLocation(e.target.value)}
                  />
                </>
              )}

              <div className="form-description">
                <p>ข้อมูลติดต่อจะแสดงในหน้าโพสต์</p>
                <p>ตรวจสอบข้อมูลก่อนเผยแพร่</p>
              </div>

              {error && <p style={{ color: 'red' }}>{error}</p>}

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
