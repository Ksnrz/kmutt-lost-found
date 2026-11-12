import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/ui/PageHeader';
import './Editpost.css';

function Editpost() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const routerLocation = useLocation();
  const postData = routerLocation.state?.post;

  // State สำหรับจัดการฟอร์มแก้ไขโพสต์ (ดึงค่าเริ่มต้นจาก postData หากมีส่งต่อมา)
  const [type, setType] = useState(() => {
    if (postData?.post_type?.includes('LOST') || postData?.type === 'lost') return 'lost';
    return 'found';
  });
  const [storageStatus, setStorageStatus] = useState(() => {
    if (postData?.custody_type?.includes('เก็บ')) return 'เก็บไว้เอง';
    return 'ฝากไว้';
  });
  const [itemName, setItemName] = useState(() => postData?.title || 'กระเป๋าสตางค์สีดำ');
  const [location, setLocation] = useState(
    () => postData?.location || postData?.building_name || 'เลือกตึก / จุดที่พบ'
  );
  const [eventDate, setEventDate] = useState(
    () => postData?.date || postData?.created_at || '23 / 09 / 2026'
  );
  const [itemDetail, setItemDetail] = useState(() => postData?.description || postData?.itemDetail || '');
  const [contact, setContact] = useState(() => postData?.contact || '08X-XXX-XXXX');
  const [depositLocation, setDepositLocation] = useState(
    () => postData?.custody_location || postData?.depositLocation || ''
  );

  const handleCancel = () => {
    if (routerLocation.state?.from === 'account') {
      navigate('/account');
    } else {
      navigate(`/posts/${postId || 1}`);
    }
  };

  const handleDelete = () => {
    if (window.confirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      alert('ลบโพสต์สำเร็จเรียบร้อยแล้ว');
      if (routerLocation.state?.from === 'account') {
        navigate('/account', { state: { successMessage: 'ลบโพสต์สำเร็จเรียบร้อยแล้ว' } });
      } else {
        navigate('/posts');
      }
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert('บันทึกการแก้ไขโพสต์เรียบร้อยแล้ว');
    if (routerLocation.state?.from === 'account') {
      navigate('/account', { state: { successMessage: 'แก้ไขโพสต์เรียบร้อยแล้ว' } });
    } else {
      navigate(`/posts/${postId || 1}`);
    }
  };

  return (
    <div className="editpost-page">
      <div className="editpost-container">
        {/* Header พร้อม Tag ส้มภาษาอังกฤษตามดีไซน์ และปุ่มย้อนกลับ */}
        <PageHeader
          backText="กลับไปรายการโพสต์"
          onBack={() => {
            if (routerLocation.state?.from === 'account') {
              navigate('/account');
            } else {
              navigate('/posts');
            }
          }}
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
                  className={`toggle-option ${type === 'lost' ? 'is-active' : ''}`}
                  onClick={() => setType('lost')}
                >
                  ของหาย
                </button>
                <button
                  type="button"
                  className={`toggle-option ${type === 'found' ? 'is-active' : ''}`}
                  onClick={() => setType('found')}
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
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />

              <div className="form-row">
                <div>
                  <h3>
                    สถานที่พบ <span className="req-star">*</span>
                  </h3>
                  <Input
                    type="text"
                    placeholder="เลือกตึก / จุดที่พบ ▾"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <h3>
                    วันที่พบ <span className="req-star">*</span>
                  </h3>
                  <Input
                    type="text"
                    placeholder="วว / ดด / ปปปป"
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
                value={itemDetail}
                onChange={(e) => setItemDetail(e.target.value)}
              />

              <h3>รูปภาพสิ่งของ</h3>
              <label className="add-image">
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} />
                <span>+ เพิ่มรูปภาพ (ได้หลายรูป)</span>
              </label>
            </Card>
          </div>

          {/* ฝั่งขวา: ข้อมูลการเก็บรักษา & ปุ่มดำเนินการ */}
          <div className="form-right">
            <Card>
              <h2>ข้อมูลการเก็บรักษา</h2>
              <h3>
                สถานะสิ่งของ <span className="req-star">*</span>
              </h3>
              <div className="segmented-toggle">
                <button
                  type="button"
                  className={`toggle-option ${storageStatus === 'ฝากไว้' ? 'is-active' : ''}`}
                  onClick={() => setStorageStatus('ฝากไว้')}
                >
                  ฝากไว้
                </button>
                <button
                  type="button"
                  className={`toggle-option ${storageStatus === 'เก็บไว้เอง' ? 'is-active' : ''}`}
                  onClick={() => setStorageStatus('เก็บไว้เอง')}
                >
                  เก็บไว้เอง
                </button>
              </div>

              <hr className="editpost-divider" />

              <h3>
                ช่องทางติดต่อ <span className="req-star">*</span>
              </h3>
              <Input
                type="text"
                placeholder="เบอร์โทร"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />

              <h3>เลือกสถานที่ฝาก</h3>
              <Input
                type="text"
                placeholder="เลือกสถานที่ / ตึก ▾"
                value={depositLocation}
                onChange={(e) => setDepositLocation(e.target.value)}
              />

              <div className="form-description">
                <p>ข้อมูลติดต่อจะแสดงในหน้าโพสต์</p>
                <p>ตรวจสอบข้อมูลก่อนเผยแพร่</p>
              </div>

              {/* ปุ่มยกเลิก และ ลบโพสต์ */}
              <div className="flex-button2">
                <Button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancel}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  className="btn-delete"
                  onClick={handleDelete}
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
                >
                  แก้ไขโพสต์
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editpost;
