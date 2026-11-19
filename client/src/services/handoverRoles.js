// Who is who depends on the post type: on a LOST post the poster gets the item back and the
// claimant (who found it) hands it over; on a FOUND post it is the other way round.
// The server always calls the poster "finder" and the claimant "receiver"; these are display words only.
export function handoverRoles(postType) {
  return postType === 'LOST'
    ? {
        owner: 'เจ้าของของ',
        claimant: 'ผู้พบ',
        ownerConfirm: 'ได้รับของคืนแล้ว',
        ownerWaiting: 'รอยืนยันได้รับของคืน',
        claimantConfirm: 'ส่งคืนแล้ว',
        claimantWaiting: 'รอยืนยันการส่งคืน',
        claimantQuestion: 'คุณส่งของคืนให้เจ้าของเรียบร้อยแล้วใช่หรือไม่?',
        ownerCancel: 'ยกเลิกการรับคืน',
        ownerHelper: 'เมื่อได้รับของคืนแล้ว จึงกดยืนยันได้รับของคืน',
        claimButton: 'ฉันเจอของชิ้นนี้',
        placeLabel: 'สถานที่หาย',
        openLabel: 'OPEN • ยังตามหาอยู่',
      }
    : {
        owner: 'ผู้พบ',
        claimant: 'ผู้รับ',
        ownerConfirm: 'ยืนยันการส่งมอบ',
        ownerWaiting: 'รอยืนยันการส่งของ',
        claimantConfirm: 'ยืนยันการรับมอบ',
        claimantWaiting: 'รอยืนยันการรับสิ่งของ',
        claimantQuestion: 'คุณตรวจสอบและได้รับสิ่งของครบถ้วนแล้วใช่หรือไม่?',
        ownerCancel: 'ยกเลิกการส่งมอบ',
        ownerHelper: 'เมื่อส่งของคืนจริงแล้ว จึงกดยืนยันการส่งคืนและปิดสถานะ',
        claimButton: 'นี่อาจเป็นของฉัน',
        placeLabel: 'สถานที่พบ',
        openLabel: 'OPEN • ยังรอเจ้าของ',
      };
}
