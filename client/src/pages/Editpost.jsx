
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Line from '../components/Line';
import './Editpost.css';

function Editpost() {
  const navigate = useNavigate();
  const { postId } = useParams();

  const [postType, setPostType] = useState('LOST');
  const [custodyType, setCustodyType] = useState('');
  const [title, setTitle] = useState('');
  const [locationId, setLocationId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [contactText, setContactText] = useState('');

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const handleSubmit = async () => {
    try {
        setLoading(true);
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

        if (postType === 'FOUND' && !custodyType) {
        setError('กรุณาเลือกวิธีเก็บรักษาสิ่งของ');
        return;
        }

        const result = await apiRequest(`/posts/${postId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            post_type: postType,
            custody_type: postType === 'FOUND' ? custodyType : null,
            title,
            location_id: locationId,
            event_date: eventDate,
            description,
            contact_text: contactText,
        }),
        });

        alert('แก้ไขโพสต์สำเร็จ!');
        navigate(`/posts/${postId}`);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
    };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

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

        if (post.event_date) {
          setEventDate(
            new Date(post.event_date).toISOString().slice(0, 10)
          );
        }

        setLocations(locationData.locations || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  if (loading) {
    return <div className="container">กำลังโหลดข้อมูลโพสต์...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <BackButton text="กลับไปรายการโพสต์" />
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <BackButton text="กลับไปรายการโพสต์" />

      <h1>แก้ไขโพสต์</h1>

      <div className="form-layout">
        <div className="form-left">
          <Card>
            <h2>ประเภท</h2>

            <div className="flex-button">
              <Button
                onClick={() => setPostType('LOST')}
                className={postType === 'LOST' ? 'active' : ''}
              >
                ของหาย
              </Button>

              <Button
                onClick={() => setPostType('FOUND')}
                className={postType === 'FOUND' ? 'active' : ''}
              >
                เจอของ
              </Button>
            </div>

            <h2>ข้อมูลสิ่งของ</h2>

            <h3>ชื่อสิ่งของ *</h3>
            <Input
              value={title}
              placeholder="เช่น กระเป๋าสตางค์สีดำ"
              onChange={(e) => setTitle(e.target.value)}
            />

            <h3>สถานที่พบ *</h3>
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

            <h3>วันที่พบ *</h3>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />

            <h3>รายละเอียดสิ่งของ *</h3>
            <textarea
              value={description}
              placeholder="สี รูปทรง ตำหนิ หรือรายละเอียดที่ช่วยระบุสิ่งของ..."
              onChange={(e) => setDescription(e.target.value)}
            />
          </Card>
        </div>

        <div className="form-right">
          <Card>
            <h2>ข้อมูลการเก็บรักษา</h2>

            <h3>สถานะสิ่งของ *</h3>

            {postType === 'FOUND' ? (
              <div className="flex-button1">
                <Button
                  onClick={() => setCustodyType('DEPOSITED')}
                  className={custodyType === 'DEPOSITED' ? 'active' : ''}
                >
                  ฝากไว้
                </Button>

                <Button
                  onClick={() => setCustodyType('SELF_KEPT')}
                  className={custodyType === 'SELF_KEPT' ? 'active' : ''}
                >
                  เก็บไว้เอง
                </Button>
              </div>
            ) : (
              <p>ไม่จำเป็นต้องระบุวิธีเก็บรักษาสำหรับโพสต์ของหาย</p>
            )}

            <Line />

            <h3>ช่องทางติดต่อ *</h3>
            <Input
              value={contactText}
              placeholder="เบอร์โทร"
              onChange={(e) => setContactText(e.target.value)}
            />

            <div className="submit-button">
                <Button onClick={() => navigate(`/posts/${postId}`)}>
                    ยกเลิก
                </Button>

                <Button onClick={handleSubmit}>
                    {loading ? 'กำลังบันทึก...' : 'แก้ไขโพสต์'}
                </Button>
                </div>

                {error && (
                <p style={{ color: 'red' }}>{error}</p>
                )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Editpost;
