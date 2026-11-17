import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiRequest } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import BuildingPicker from '../components/BuildingPicker';
import PageHeader from '../components/ui/PageHeader';
import './Editpost.css';

function Editpost() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const routerLocation = useLocation();
  const fromAccount = routerLocation.state?.from === 'account';

  const [postType, setPostType] = useState('LOST'); // 'LOST' | 'FOUND'
  const [custodyType, setCustodyType] = useState(''); // 'DEPOSITED' | 'SELF_KEPT'
  const [title, setTitle] = useState('');
  const [locationId, setLocationId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [contactText, setContactText] = useState('');
  const [depositLocation, setDepositLocation] = useState(''); // location_id of the deposit building
  const [depositDetail, setDepositDetail] = useState('');

  const [locations, setLocations] = useState([]);
  // the picker works with building codes (locations.building_name); the API wants location_id
  const codeOf = (id) => locations.find((l) => String(l.location_id) === String(id))?.building_name;
  const idOf = (code) => String(locations.find((l) => l.building_name === code)?.location_id ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');

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
        setTitle(post.title || '');
        setLocationId(String(post.location_id || ''));
        setDescription(post.description || '');
        setContactText(post.contact_text || '');

        setEventDate(post.event_date || ''); // already 'YYYY-MM-DD' from the server
        setDepositLocation(String(post.deposit_location_id || ''));
        setDepositDetail(post.deposit_detail || '');

        setLocations(locationData.locations || []);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  const goBack = () => navigate(fromAccount ? '/account' : `/posts/${postId}`);

  const handleSave = async (e) => {
    e?.preventDefault();
    setError('');

    if (!title.trim() || !locationId || !eventDate || !description.trim() || !contactText.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (postType === 'FOUND' && !custodyType) {
      setError('กรุณาเลือกวิธีเก็บรักษาสิ่งของ');
      return;
    }

    try {
      setSaving(true);

      await apiRequest(`/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_type: postType,
          custody_type: postType === 'FOUND' ? custodyType : null,
          deposit_location_id: depositLocation || null,
          deposit_detail: depositDetail,
          title,
          location_id: locationId,
          event_date: eventDate,
          description,
          contact_text: contactText,
        }),
      });

      if (fromAccount) {
        navigate('/account', { state: { successMessage: 'บันทึกการแก้ไขโพสต์เรียบร้อยแล้ว' } });
      } else {
        navigate(`/posts/${postId}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ยังไม่มี API ลบโพสต์ จึงใช้การยกเลิกประกาศ (PATCH /posts/:id/cancel) แทน
  const handleDelete = async () => {
    if (!window.confirm('คุณต้องการยกเลิกประกาศนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;

    try {
      setSaving(true);
      setError('');
      await apiRequest(`/posts/${postId}/cancel`, { method: 'PATCH' });

      navigate(fromAccount ? '/account' : '/posts', {
        state: { successMessage: 'ยกเลิกประกาศเรียบร้อยแล้ว' },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editpost-page">
      <div className="editpost-container">
        {/* Header พร้อม Tag ส้มภาษาอังกฤษตามดีไซน์ และปุ่มย้อนกลับ */}
        <PageHeader
          backText="กลับไปรายการโพสต์"
          onBack={() => navigate(fromAccount ? '/account' : '/posts')}
          tag="EDIT POST"
          title="แก้ไขโพสต์"
          subtitle="ปรับปรุงรายละเอียดข้อมูลสิ่งของหรือสถานะการเก็บรักษา"
        />

        {loading && <p>กำลังโหลดข้อมูลโพสต์...</p>}
        {loadError && <p style={{ color: 'red' }}>{loadError}</p>}

        {!loading && !loadError && (
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

                <div className="form-row">
                  <div>
                    <h3>
                      สถานที่พบ <span className="req-star">*</span>
                    </h3>
                    <BuildingPicker
                      value={codeOf(locationId)}
                      onChange={(code) => setLocationId(idOf(code))}
                      placeholder="เลือกสถานที่ / ค้นหาตึก..."
                    />
                  </div>

                  <div>
                    <h3>
                      {postType === 'LOST' ? 'วันที่คาดว่าทำหาย' : 'วันที่พบ'} <span className="req-star">*</span>
                    </h3>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>
                </div>

                <h3>
                  รายละเอียดสิ่งของ <span className="req-star">*</span>
                </h3>
                <textarea
                  placeholder="สี รูปทรง ตำหนิ หรือรายละเอียดที่ช่วยระบุสิ่งของ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Card>
            </div>

            {/* ฝั่งขวา: ข้อมูลการเก็บรักษา & ปุ่มดำเนินการ */}
            <div className="form-right">
              <Card>
                <h2>{postType === 'LOST' ? 'ข้อมูลผู้ตามหา' : 'ข้อมูลการเก็บรักษา'}</h2>
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

                  <hr className="editpost-divider" />
                  </>
                )}

                <h3>
                  ช่องทางติดต่อ <span className="req-star">*</span>
                </h3>
                <Input
                  type="text"
                  placeholder="เช่น IG, Line ID หรือเบอร์โทร"
                  value={contactText}
                  onChange={(e) => setContactText(e.target.value)}
                />

                {postType === 'FOUND' && custodyType === 'DEPOSITED' && (
                  <>
                    <h3>
                      สถานที่ฝาก <span className="req-star">*</span>
                    </h3>
                    <BuildingPicker
                      value={codeOf(depositLocation)}
                      onChange={(code) => setDepositLocation(idOf(code))}
                      placeholder="เลือกตึกที่ฝาก / ค้นหาตึก..."
                    />

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

                {error && <p style={{ color: 'red' }}>{error}</p>}

                {/* ปุ่มยกเลิก และ ลบโพสต์ */}
                <div className="flex-button2">
                  <Button type="button" className="btn-cancel" onClick={goBack}>
                    ยกเลิก
                  </Button>
                  <Button
                    type="button"
                    className="btn-delete"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    ลบโพสต์
                  </Button>
                </div>

                {/* ปุ่มยืนยันการแก้ไข */}
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
        )}
      </div>
    </div>
  );
}

export default Editpost;