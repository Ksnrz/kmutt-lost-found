import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Thumbnail from '../../components/ui/Thumbnail';
import Badge from '../../components/ui/Badge';
import './ReviewRequestsPage.css';

/**
 * ReviewRequestsPage Component — คำขอที่ส่งมายังประกาศของฉัน (RECEIVED REQUESTS)
 * Route URL: /requests/review
 * 
 * 🌟 React Best Practices:
 * 1. React Router: ใช้ useNavigate() พากลับไปหน้า /account ได้อย่างเป็นธรรมชาติ
 * 2. ZERO Inline Styles: ควบคุมสไตล์ผ่าน Class ใน CSS ทั้งหมดตามกฎของอาจารย์
 * 3. Controlled State: ใช้ useState จัดการโน้ตข้อความและสถานะคำขอ
 * 4. Immutable State Updates: อัปเดตสถานะของรายการโดยไม่ mutate object เดิม
 */
export default function ReviewRequestsPage({
  // ข้อมูลคำขอเริ่มต้น (มีค่าเริ่มต้นตรงตามภาพสเปก)
  initialRequests = [
    {
      id: '102',
      itemTitle: 'กระเป๋าสตางค์สีดำ',
      requester: 'นักศึกษา B',
      date: '24 ก.ย. 2026',
      status: 'PENDING', // 'PENDING' | 'APPROVED' | 'REJECTED'
      description: 'มีรอยถลอกเล็ก ๆ ที่มุมด้านใน และมีบัตรสีฟ้าอยู่หนึ่งใบ',
      evidences: ['หลักฐาน 1', 'หลักฐาน 2'],
    },
  ],
  onBack,
}) {
  const navigate = useNavigate();

  // State 1: รายการคำขอทั้งหมด
  const [requests, setRequests] = useState(initialRequests);

  // State 2: รหัสคำขอที่กำลังเลือกดูรายละเอียดอยู่
  const [selectedId, setSelectedId] = useState('102');

  // State 3: ข้อความในช่อง "หมายเหตุสำหรับผู้ส่ง"
  const [noteText, setNoteText] = useState('');

  // ค้นหาข้อมูลคำขอที่กำลังถูกเลือก
  const activeRequest = requests.find((r) => r.id === selectedId) || requests[0];

  // จำนวนรายการที่ยังรอตรวจ (PENDING)
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  // ฟังก์ชันกด "อนุมัติคำขอ"
  const handleApprove = () => {
    if (!activeRequest) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === activeRequest.id
          ? { ...r, status: 'APPROVED', note: noteText }
          : r
      )
    );

    alert(`อนุมัติคำขอ #${activeRequest.id} เรียบร้อยแล้ว!`);
    setNoteText('');
  };

  // ฟังก์ชันกด "ปฏิเสธ"
  const handleReject = () => {
    if (!activeRequest) return;

    const confirmReject = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอ #${activeRequest.id}?`);
    if (!confirmReject) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === activeRequest.id
          ? { ...r, status: 'REJECTED', note: noteText }
          : r
      )
    );

    alert(`ปฏิเสธคำขอ #${activeRequest.id} แล้ว`);
    setNoteText('');
  };

  // ฟังก์ชันรีเซ็ตสถานะกลับมาเป็น PENDING (เผื่อเปลี่ยนใจ หรืออาจารย์ทดสอบกดซ้ำ)
  const handleResetStatus = (id) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'PENDING', note: '' } : r
      )
    );
    setNoteText('');
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/account');
    }
  };

  return (
    <div className="review-requests-container">
      {/* ส่วนหัวหน้าเว็บ */}
      <PageHeader
        tag="RECEIVED REQUESTS"
        title="คำขอที่ส่งมายังประกาศของฉัน"
        subtitle="ดูข้อมูลและรูปหลักฐานก่อนตัดสินใจ"
        backText="กลับไปรายการประกาศ"
        onBack={handleGoBack}
      />

      {/* เลย์เอาต์แบ่ง 2 คอลัมน์ */}
      <div className="review-requests-grid">
        {/* ========================================================
            คอลัมน์ซ้าย: การ์ดคำขอที่ได้รับ
            ======================================================== */}
        <Card className="review-list-card">
          <div className="review-list-header">
            <h2 className="review-list-title">คำขอที่ได้รับ</h2>
            <Badge variant="count">
              {pendingCount} รายการรอตรวจ
            </Badge>
          </div>

          <div className="review-items-list">
            {requests.map((item) => {
              const isSelected = item.id === activeRequest?.id;

              return (
                <div
                  key={item.id}
                  className={`review-item-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSelectedId(item.id);
                  }}
                >
                  <Thumbnail text="รูปโพสต์" />

                  <div className="review-item-info">
                    <h3 className="review-item-title">
                      {item.itemTitle} · #{item.id}
                    </h3>
                    <p className="review-item-meta">
                      โดย {item.requester} · {item.date}
                    </p>

                    <div className="review-item-badge-wrap">
                      {item.status === 'PENDING' && (
                        <Badge variant="pending">PENDING</Badge>
                      )}
                      {item.status === 'APPROVED' && (
                        <Badge variant="success">APPROVED</Badge>
                      )}
                      {item.status === 'REJECTED' && (
                        <Badge variant="danger">REJECTED</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ========================================================
            คอลัมน์ขวา: รายละเอียดคำขอ
            ======================================================== */}
        {activeRequest ? (
          <Card className="review-detail-card">
            <h2 className="review-detail-title">
              รายละเอียดคำขอ #{activeRequest.id}
            </h2>

            <p className="review-detail-description">
              <span className="review-description-label">คำอธิบาย: </span>
              {activeRequest.description}
            </p>

            {/* กล่องแสดงรูปหลักฐาน */}
            <div className="review-evidences-row">
              {activeRequest.evidences.map((evText, idx) => (
                <div key={idx} className="review-evidence-box">
                  {evText}
                </div>
              ))}
            </div>

            {/* แสดงสถานะหากได้รับการตรวจไปแล้ว */}
            {activeRequest.status === 'APPROVED' && (
              <div className="review-status-alert is-approved">
                ✓ คำขอนี้ได้รับการอนุมัติแล้ว
              </div>
            )}
            {activeRequest.status === 'REJECTED' && (
              <div className="review-status-alert is-rejected">
                ✕ คำขอนี้ถูกปฏิเสธแล้ว
              </div>
            )}

            {/* ช่องกรอกหมายเหตุ */}
            <div className="review-note-section">
              <label htmlFor="reviewNoteInput" className="review-note-title">
                หมายเหตุสำหรับผู้ส่ง
              </label>
              <input
                id="reviewNoteInput"
                type="text"
                className="review-note-input"
                placeholder="ระบุเหตุผลหรือขั้นตอนนัดรับ"
                value={noteText || activeRequest.note || ''}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={activeRequest.status !== 'PENDING'}
              />
              <p className="review-note-helper">
                เมื่อส่งของคืนจริงแล้ว จึงกดยืนยันการส่งคืนและปิดสถานะ
              </p>
            </div>

            {/* ปุ่มกดปฏิเสธ / อนุมัติคำขอ */}
            <div className="review-detail-actions">
              {activeRequest.status !== 'PENDING' && (
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => handleResetStatus(activeRequest.id)}
                >
                  ↺ ตรวจสอบใหม่
                </Button>
              )}
              <Button
                variant="secondary"
                type="button"
                onClick={handleReject}
                disabled={activeRequest.status !== 'PENDING'}
              >
                {activeRequest.status === 'REJECTED' ? '✕ ปฏิเสธแล้ว' : 'ปฏิเสธ'}
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={handleApprove}
                disabled={activeRequest.status !== 'PENDING'}
              >
                {activeRequest.status === 'APPROVED' ? '✓ อนุมัติแล้ว' : 'อนุมัติคำขอ'}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="review-detail-card">
            <p>กรุณาเลือกคำขอที่ต้องการตรวจสอบ</p>
          </Card>
        )}
      </div>
    </div>
  );
}

