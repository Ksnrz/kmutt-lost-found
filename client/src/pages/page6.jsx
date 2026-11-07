import React from 'react';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ImageUpload from '../components/ImageUpload';
import Line from '../components/Line';
import './page6.css';

function Page6() {
	
	return (
		<div className="container">
			<BackButton text='กลับไปรายการประกาศ'/>
			<h1>ส่งคำขอตรวจสอบ</h1>
			<Card>
				<div className='flex-image'>
					<ImageUpload text="รูปโพสต์" size="24px 36px"/>
					<div className='text-image'>
						<h3>พบกระเป๋าสตางค์สีดำ</h3>
						<p>ประกาศเจอของ · S4</p>
					</div>
				</div>
				<Line />
				<h2>พบกระเป๋าสตางค์สีดำ</h2>
				<h3>รายละเอียดตำหนิหรือข้อมูลเฉพาะ</h3>
				<Input type='text' placeholder='รายละเอียดตำหนิ'/>
				<h3>รูปหลักฐาน (หลายรูป)</h3>
				<ImageUpload text='+ แนบรูปตำหนิหรือรูปของเดิม' size='36px'/>
				<div className='tag_but'>
					<p>หลักฐานจะแสดงเฉพาะผู้ส่งคำขอ เจ้าของโพสต์ และผู้ดูแลระบบ</p>
					<div className='tag_but'>
						<Button>ยกเลิก</Button>
						<Button>ส่งคำขอ</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}

export default Page6;
