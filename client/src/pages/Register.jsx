import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import mascot from '../assets/login/mascot.png'
import './Login.css'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    if (form.get('password') !== form.get('confirmPassword')) {
      return setError('รหัสผ่านไม่ตรงกัน')
    }
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: { student_id: form.get('studentId'), email: form.get('email'), password: form.get('password') },
      })
      navigate('/login')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="login-page">
      <div className="login-layout">
        <section className="login-intro">
          <div className="login-illustration">
            <img src={mascot} alt="มาสคอตค้นหาของหาย" />
          </div>
          <h2 className="login-headline">
            ของหาย?<br />ให้เรา<span>ช่วยหา</span>
          </h2>
          <p className="login-description">
            ค้นหาประกาศตามตึก แจ้งพบสิ่งของ<br />
            และส่งคำขอรับคืน พร้อมหลักฐาน
          </p>
        </section>

        <section className="login-card register-card">
          <p className="login-brand">KMUTT <strong>Lost &amp; Found</strong></p>
          <header className="login-header">
            <h1>สมัครสมาชิก</h1>
            <p>สร้างบัญชีเพื่อเริ่มใช้งาน</p>
          </header>
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="register-fields">
              <div className="login-field">
                <label htmlFor="register-student-id">รหัสนักศึกษา</label>
                <input id="register-student-id" name="studentId" type="text" placeholder="กรอกรหัสนักศึกษา" required />
              </div>
              <div className="login-field">
                <label htmlFor="register-email">อีเมล</label>
                <input id="register-email" name="email" type="email" placeholder="กรอกอีเมล" required />
              </div>
              <div className="login-field">
                <label htmlFor="register-password">รหัสผ่าน</label>
                <input id="register-password" name="password" type="password" placeholder="ตั้งรหัสผ่าน" required />
              </div>
              <div className="login-field">
                <label htmlFor="register-confirm-password">ยืนยันรหัสผ่าน</label>
                <input id="register-confirm-password" name="confirmPassword" type="password" placeholder="กรอกรหัสผ่านอีกครั้ง" required />
              </div>
            </div>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="login-submit" type="submit">สมัครสมาชิก</button>
          </form>
          <p className="login-register">มีบัญชีอยู่แล้ว? <a href="/login">เข้าสู่ระบบ</a></p>
        </section>
      </div>
    </main>
  )
}
