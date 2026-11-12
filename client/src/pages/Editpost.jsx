import { useState } from 'react';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ImageUpload from '../components/ImageUpload';
import Line from '../components/Line';
import './Editpost.css';

function Editpost() {
    const [type, setType] = useState('found');
    const [storageStatus, setStorageStatus] = useState('ฝากไว้');

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
                                className={type === 'lost' ? 'active' : ''}
                                onClick={() => setType('lost')}
                            >
                                ของหาย
                            </Button>

                            <Button
                                className={type === 'found' ? 'active' : ''}
                                onClick={() => setType('found')}
                            >
                                พบของ
                            </Button>
                        </div>

                        <h2>ข้อมูลสิ่งของ</h2>

                        <h3>ชื่อสิ่งของ <span>*</span></h3>
                        <Input
                            type="text"
                            placeholder="เช่น กระเป๋าสตางค์สีดำ"
                        />

                        <div className="form-row">

                            <div>
                                <h3>สถานที่พบ <span>*</span></h3>
                                <Input
                                    type="text"
                                    placeholder="เลือกตึก / จุดที่พบ"
                                />
                            </div>

                            <div>
                                <h3>วันที่พบ <span>*</span></h3>
                                <Input
                                    type="text"
                                    placeholder="วว / ดด / ปปปป"
                                />
                            </div>

                        </div>

                        <h3>รายละเอียดสิ่งของ <span>*</span></h3>

                        <textarea
                            placeholder="สี รูปทรง ตำหนิ หรือรายละเอียดที่ช่วยระบุสิ่งของ..."
                        />

                        <h3>รูปภาพสิ่งของ</h3>

                        <ImageUpload
                            size="20px"
                            text="รูปหลักของสิ่งของ"
                        />

                        <div className="add-image">
                            + เพิ่มรูปภาพ (ได้หลายรูป)
                        </div>

                    </Card>
                </div>

                <div className="form-right">
                    <Card>

                        <h2>ข้อมูลการเก็บรักษา</h2>

                        <h3>สถานะสิ่งของ <span>*</span></h3>

                        <div className="flex-button1">
                            <Button
                                className={storageStatus === 'ฝากไว้' ? 'active' : ''}
                                onClick={() => setStorageStatus('ฝากไว้')}
                            >
                                ฝากไว้
                            </Button>

                            <Button
                                className={storageStatus === 'เก็บไว้เอง' ? 'active' : ''}
                                onClick={() => setStorageStatus('เก็บไว้เอง')}
                            >
                                เก็บไว้เอง
                            </Button>
                        </div>

                        <Line />

                        <h3>ช่องทางติดต่อ <span>*</span></h3>

                        <Input
                            type="text"
                            placeholder="เบอร์โทร"
                        />

                        <h3>เลือกสถานที่ฝาก</h3>

                        <Input
                            type="text"
                            placeholder="เลือกสถานที่ / ตึก"
                        />

                        <div className="form-description">
                            <p>ข้อมูลติดต่อจะแสดงในหน้าโพสต์</p>
                            <p>ตรวจสอบข้อมูลก่อนเผยแพร่</p>
                        </div>

                        <div className="flex-button2">
                            <Button>ยกเลิก</Button>
                            <Button>ลบโพสต์</Button>
                        </div>

                        <div className="submit-button">
                            <Button>แก้ไขโพสต์</Button>
                        </div>

                    </Card>
                </div>

            </div>
        </div>
    );
}

export default Editpost;
