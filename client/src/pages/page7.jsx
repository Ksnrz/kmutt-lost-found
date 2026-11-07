import React from 'react';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ImageUpload from '../components/ImageUpload';
import Line from '../components/Line';
import './page7.css';
import StatusBadge from '../components/StatusBadge';

function Page7() {
	
	return (
		<div className="container">
			<BackButton text='กลับไปรายการประกาศ'/>
			<h1>คำขอที่ส่งมายังประกาศของฉัน</h1>
			<div className='form-layout'>
				<div className='form-left'>
					<Card>
						<div className='flex-title'>
							<h2>คำขอที่ได้รับ</h2>
							<StatusBadge customText="1 รายการรอตรวจ" />
						</div>
						<div className='list'>
							<ImageUpload text='รูปโพสต์' size='24px 36px'/>
							<div className='list-context'>
								<h3>กระเป๋าสตางค์สีดำ · #102</h3>
								<p>โดย นักศึกษา B · 24 ก.ย. 2026</p>
								<StatusBadge status = "pending"/>
							</div>
						</div>
						<p>ดูข้อมูลและรูปหลักฐานก่อนตัดสินใจ</p>
					</Card>
				</div>

				<div className='form-right'>
					<Card>
						<h2>รายละเอียดคำขอ #102</h2>
						<div className='flex-image'>
							<ImageUpload text='รูปโพสต์' size='24px 36px'/>
							<ImageUpload text='รูปโพสต์' size='24px 36px'/>
						</div>
						<h3>หมายเหตุสำหรับผู้ส่ง</h3>
						<Input placeholder='ระบุเหตุผลหรือขั้นตอนนัดรับ'/>
						<p>เมื่อส่งของคืนจริงแล้ว จึงกดยืนยันการส่งคืนและปิดสถานะ</p>
						<div className='tag_but'>
						<Button>ปฏิเสธ</Button>
						<Button>อนุมัติคำขอ</Button>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default Page7;
