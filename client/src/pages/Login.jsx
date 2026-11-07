import { useNavigate } from 'react-router-dom'
import mascot from '../assets/login/mascot.png'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
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

        <section className="login-card">
          <p className="login-brand">KMUTT <strong>Lost &amp; Found</strong></p>
          <header className="login-header">
            <h1>เข้าสู่ระบบ</h1>
            <p>กรอกข้อมูลบัญชีเพื่อเข้าใช้งาน</p>
          </header>
          <form className="login-form" onSubmit={(event) => { event.preventDefault(); navigate('/map') }}>
            <div className="login-field">
              <label htmlFor="studentId">รหัสนักศึกษา / อีเมล</label>
              <input id="studentId" name="studentId" type="text" placeholder="กรอกรหัสนักศึกษาหรืออีเมล" required />
            </div>
            <div className="login-field">
              <label htmlFor="password">รหัสผ่าน</label>
              <input id="password" name="password" type="password" placeholder="กรอกรหัส" required />
            </div>
            <button className="login-submit" type="submit">เข้าสู่ระบบ</button>
          </form>
          <p className="login-register">ยังไม่มีบัญชี? <a href="/register">สมัครสมาชิก</a></p>
        </section>
      </div>
    </main>
  )
}
