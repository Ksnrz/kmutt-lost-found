import React from 'react';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ImageUpload from '../components/ImageUpload';
import StatusBadge from '../components/StatusBadge';
import './page5.css';

function Page5() {
	
	return (
		<div className="container">
			<BackButton text='กลับไปรายการประกาศ'/>
			<div className='form-layout'>
				<div className='form-left'>
					<h1>พบกระเป๋าสตางค์สีดำ</h1>
					<StatusBadge status="open" />
					<ImageUpload size="150px" text='รูปหลักของสิงของ'/>
					<div className='flex-image'>
						<ImageUpload size="16px 24px" text='รูป 1'/>
						<ImageUpload size="16px 24px" text='รูป 2'/>
						<ImageUpload size="16px 24px" text='+ รูปเพิ่มเติม'/>
					</div>
					<Card>
						<h2>พบกระเป๋าสตางค์สีดำ</h2>
						<p>กระเป๋าสตางค์สีดำขนาดเล็ก พบวางอยู่บริเวณชั้น 1 ของอาคาร S4</p>
						<p>สถานที่พบ: อาคาร S4 ชั้น 1 | วันที่: 23 ก.ย. 2026</p>
					</Card>
				</div>

				<div className='form-right'>
					<p className='Date'>โพสต์เมื่อ 23 ก.ย. 2026</p>
					<Card>
						<h2>ข้อมูลการรับของ</h2>
						<p>ผู้พบ: นักศึกษา มจธ.</p>
						<p>สถานะการเก็บ: ผู้พบเก็บไว้เอง</p>
						<br/>
						<p>ช่องทางติดต่อ *</p>
						<h3>08X-XXX-XXXX</h3>
						<div className='pos-but'>
							<Button>นี่อาจเป็นของฉัน</Button>
						</div>
						<p className='comment'>หากเป็นสิ่งของของคุณส่งคำขอ</p>
						<p className='comment'>พร้อมรายละเอียดเฉพาะเพื่อยืนยัน</p>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default Page5;