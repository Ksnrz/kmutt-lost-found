import BackButton from '../components/BackButton';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ImageUpload from '../components/ImageUpload';
import Line from '../components/Line';
import './page4.css';

function Page4() {
	
	return (
		<div className="container">
			<BackButton text='กลับไปรายการโพสต์'/>
			<h1>สร้างโพสต์</h1>
			<div className='form-layout'>
				<div className='form-left'>
					<Card>
						<h2>ประเภท</h2>
						<div className='flex-button'>
							<Button>ของหาย</Button>
							<Button>เจอของ</Button>
						</div>
						<h2>ข้อมูลสิ่งของ</h2>
						<h3>ชื่อสิ่งของ *</h3>
						<Input type="text" placeholder="เช่น กระเป๋าสตางค์สีดำ" />
						<h3>สถานที่พบ *</h3>
						<Input type="text" placeholder="เลือกตึก / จุดที่พบ" />
						<h3>วันที่พบ *</h3>
						<Input type="text" placeholder="วว / ดด / ปปปป" />
						<h3>รายละเอียดสิ่งของ *</h3>
						<Input type="text" placeholder="สี รูปทรง ตำหนิ หรือรายละเอียดที่ช่วยระบุสิ่งของ..." />
						<h3>รูปภาพสิ่งของ</h3>
						<ImageUpload size="20px" text='รูปหลักของสิงของ'/>
					</Card>
				</div>

				<div className='form-right'>
					<Card>
						<h2>ข้อมูลการเก็บรักษา</h2>
						<h3>สถานะสิ่งของ *</h3>
						<div className='flex-button1'>
							<Button>ฝากไว้</Button>
							<Button>เก็บไว้เอง</Button>
						</div>
                        <Line />
						<h3>ช่องทางติดต่อ *</h3>
						<Input type="text" placeholder="เบอร์โทร" />
						<h3>สถานที่ฝาก</h3>
						<Input type="text" placeholder="สถานที่ / ตึก" />
                        <br/>
						<p>ข้อมูลติดต่อจะแสดงในหน้าโพสต์</p>
						<p>ตรวจสอบข้อมูลก่อนเผยแพร่</p>
						<div className='flex-button2'>
							<Button>ฝากไว้</Button>
							<Button>เก็บไว้เอง</Button>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default Page4;