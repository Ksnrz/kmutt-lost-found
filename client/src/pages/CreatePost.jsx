import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [postType, setPostType] = useState('found'); // 'found' | 'lost'
  const [storageStatus, setStorageStatus] = useState('ฝากไว้'); // 'ฝากไว้' | 'เก็บไว้เอง'
  const [itemName, setItemName] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [itemDetail, setItemDetail] = useState('');
  const [contact, setContact] = useState('');
  const [depositLocation, setDepositLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('เผยแพร่โพสต์สำเร็จเรียบร้อยแล้ว');
    navigate('/posts');
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
              <div className="flex-button">
                <Button
                  type="button"
                  className={postType === 'lost' ? 'active' : ''}
                  onClick={() => setPostType('lost')}
                >
                  ของหาย
                </Button>
                <Button
                  type="button"
                  className={postType === 'found' ? 'active' : ''}
                  onClick={() => setPostType('found')}
                >
                  พบของ
                </Button>
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

              <h3>
                สถานที่พบ <span className="req-star">*</span>
              </h3>
              <Input
                type="text"
                placeholder="เลือกตึก / จุดที่พบ"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <h3>
                วันที่พบ <span className="req-star">*</span>
              </h3>
              <Input
                type="text"
                placeholder="วว / ดด / ปปปป"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />

              <h3>
                รายละเอียดสิ่งของ <span className="req-star">*</span>
              </h3>
              <Input
                type="text"
                placeholder="สี รูปทรง ตำหนิ หรือรายละเอียดที่ช่วยระบุสิ่งของ..."
                value={itemDetail}
                onChange={(e) => setItemDetail(e.target.value)}
              />

              <h3>รูปภาพสิ่งของ</h3>
              <ImageUpload size="20px" text="รูปหลักของสิ่งของ" />
            </Card>
          </div>

          {/* ฝั่งขวา: ข้อมูลการเก็บรักษา & ปุ่มส่ง */}
          <div className="form-right">
            <Card>
              <h2>ข้อมูลการเก็บรักษา</h2>
              <h3>
                สถานะสิ่งของ <span className="req-star">*</span>
              </h3>
              <div className="flex-button1">
                <Button
                  type="button"
                  className={storageStatus === 'ฝากไว้' ? 'active' : ''}
                  onClick={() => setStorageStatus('ฝากไว้')}
                >
                  ฝากไว้
                </Button>
                <Button
                  type="button"
                  className={storageStatus === 'เก็บไว้เอง' ? 'active' : ''}
                  onClick={() => setStorageStatus('เก็บไว้เอง')}
                >
                  เก็บไว้เอง
                </Button>
              </div>

              <Line />

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
                >
                  เผยแพร่โพสต์
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
