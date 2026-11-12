import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/ui/PageHeader';
import './Editpost.css';

function Editpost() {
  const navigate = useNavigate();
  const { postId } = useParams();

  // State สำหรับจัดการฟอร์มแก้ไขโพสต์
  const [type, setType] = useState('found'); // 'found' | 'lost'
  const [storageStatus, setStorageStatus] = useState('ฝากไว้'); // 'ฝากไว้' | 'เก็บไว้เอง'
  const [itemName, setItemName] = useState('กระเป๋าสตางค์สีดำ');
  const [location, setLocation] = useState('เลือกตึก / จุดที่พบ');
  const [eventDate, setEventDate] = useState('23 / 09 / 2026');
  const [itemDetail, setItemDetail] = useState('');
  const [contact, setContact] = useState('08X-XXX-XXXX');
  const [depositLocation, setDepositLocation] = useState('');

  const handleCancel = () => {
    navigate(`/posts/${postId || 1}`);
  };

  const handleDelete = () => {
    if (window.confirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      alert('ลบโพสต์สำเร็จเรียบร้อยแล้ว');
      navigate('/posts');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert('บันทึกการแก้ไขโพสต์เรียบร้อยแล้ว');
    navigate(`/posts/${postId || 1}`);
  };

  return (
    <div className="editpost-page">
      <div className="editpost-container">
        {/* Header พร้อม Tag ส้มภาษาอังกฤษตามดีไซน์ และปุ่มย้อนกลับ */}
        <PageHeader
          backText="กลับไปรายการโพสต์"
          onBack={() => navigate('/posts')}
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
