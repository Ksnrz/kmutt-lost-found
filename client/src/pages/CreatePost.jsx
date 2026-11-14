
import { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ImageUpload from '../components/ImageUpload';
import Line from '../components/Line';
import './CreatePost.css';

function CreatePost() {

    const [postType, setPostType] = useState('LOST');

    const [custodyType, setCustodyType] = useState('');

    const [title, setTitle] = useState('');
    const [locationId, setLocationId] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [description, setDescription] = useState('');
    const [contactText, setContactText] = useState('');

    const [images, setImages] = useState([]);

    const [locations, setLocations] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

	const handleSubmit = async () => {
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

			const result = await apiRequest('/posts', {
				method: 'POST',
				body: formData,
			});

			alert('สร้างโพสต์สำเร็จ!');
			console.log('ผลลัพธ์:', result);

		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

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

    return (
        <div className="container">
            <BackButton text="กลับไปรายการโพสต์" />
            <h1>สร้างโพสต์</h1>

            <div className="form-layout">
                <div className="form-left">
                    <Card>
                        <h2>ประเภท</h2>
                        <div className="flex-button">
							<Button onClick={() => setPostType('LOST')} className={postType === 'LOST' ? 'active' : ''}>ของหาย</Button>
							<Button onClick={() => setPostType('FOUND')} className={postType === 'FOUND' ? 'active' : ''}>เจอของ</Button>
						</div>

                        <h2>ข้อมูลสิ่งของ</h2>
                        <h3>ชื่อสิ่งของ *</h3>
                        <Input
                            type="text"
                            placeholder="เช่น กระเป๋าสตางค์สีดำ"
							onChange={(e) => setTitle(e.target.value)}
                        />

                        <h3>สถานที่พบ *</h3>
						<select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
							<option value="">-- เลือกสถานที่ --</option>
							{locations.map((location) => (
								<option key={location.location_id} value={location.location_id}>
									{location.building_name}
								</option>
							))}
						</select>

                        <h3>วันที่พบ *</h3>
                        <Input type="date" onChange={(e) => setEventDate(e.target.value)}/>

                        <h3>รายละเอียดสิ่งของ *</h3>
                        <Input type="text" placeholder="สี รูปทรง ตำหนิ หรือรายละเอียดที่ช่วยระบุสิ่งของ..." onChange={(e) => setDescription(e.target.value)}/>

                        <h3>รูปภาพสิ่งของ</h3>
                        <ImageUpload
							size="20px"
							text="รูปหลักของสิ่งของ"
							multiple={true}
							onChange={(e) => {
								const selectedImages = Array.from(e.target.files);
								setImages(selectedImages.slice(0, 5));
							}}
						/>
                    </Card>
                </div>

                <div className="form-right">
                    <Card>
                        <h2>ข้อมูลการเก็บรักษา</h2>
                        <h3>สถานะสิ่งของ *</h3>

                        <div className="flex-button2">
							<Button
								onClick={handleSubmit}
								disabled={loading}
							>
								{loading ? 'กำลังเผยแพร่...' : 'เผยแพร่โพสต์'}
							</Button>
						</div>
						{error && <p style={{ color: 'red' }}>{error}</p>}

                        <Line />

                        <h3>ช่องทางติดต่อ *</h3>
                        <Input
                            type="text"
                            placeholder="เบอร์โทร"
							onChange={(e) => setContactText(e.target.value)}
                        />

                        <h3>สถานที่ฝาก</h3>
                        <Input
                            type="text"
                            placeholder="สถานที่ / ตึก"
                        />

                        <br />
                        <p>ข้อมูลติดต่อจะแสดงในหน้าโพสต์</p>
                        <p>ตรวจสอบข้อมูลก่อนเผยแพร่</p>

                        <div className="flex-button1">
							<Button onClick={() => setCustodyType('DEPOSITED')}
								className={custodyType === 'DEPOSITED' ? 'active' : ''}>
								ฝากไว้
							</Button>

							<Button onClick={() => setCustodyType('SELF_KEPT')}
								className={custodyType === 'SELF_KEPT' ? 'active' : ''}>
								เก็บไว้เอง
							</Button>
						</div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default CreatePost;
