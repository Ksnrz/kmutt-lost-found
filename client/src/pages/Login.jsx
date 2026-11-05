import mascot from '../assets/login/mascot.png'
import mapIcon from '../assets/login/map.svg'
import postIcon from '../assets/login/post.svg'
import claimIcon from '../assets/login/claim.svg'
import './Login.css'

export default function Login() {
  return (
    <main className="login-page">
      <div className="login-layout">
        <section className="login-intro" aria-labelledby="login-intro-title">
          <div className="login-illustration">
            <img src={mascot}/>
          </div>
          <h2 id="login-intro-title" className="login-headline">
            ของหาย?<br />ให้เรา<span>ช่วยหา</span>
          </h2>
          <p className="login-description">
            ค้นหาประกาศตามตึก แจ้งพบสิ่งของ<br className="login-description-break" />
            และส่งคำขอรับคืน พร้อมหลักฐาน
          </p>
          {/* <ul className="login-features" aria-label="บริการของเรา">
            <li><img src={mapIcon} alt="" />แผนที่มหาวิทยาลัย</li>
            <li><img src={postIcon} alt="" />ประกาศของฉัน</li>
            <li><img src={claimIcon} alt="" />ขอรับคืน</li>
          </ul> */}
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <p className="login-brand">KMUTT <strong>Lost &amp; Found</strong></p>
          <header className="login-header">
            <h1 id="login-title">เข้าสู่ระบบ</h1>
            <p>กรอกข้อมูลบัญชีนักศึกษาเพื่อเข้าใช้งาน</p>
          </header>
          <form className="login-form">
            <div className="login-field">
              <label htmlFor="studentId">รหัสนักศึกษา / อีเมล</label>
              <input id="studentId" name="studentId" type="text" autoComplete="username" placeholder="กรอกรหัสนักศึกษาหรืออีเมล" required />
            </div>
            <div className="login-field">
              <label htmlFor="password">รหัสผ่าน</label>
              <input id="password" name="password" type="password" autoComplete="current-password" placeholder="กรอกรหัส" required />
            </div>
            <button className="login-submit" type="button">เข้าสู่ระบบ</button>
          </form>
          <p className="login-register">ยังไม่มีบัญชี? <button type="button">สมัครสมาชิก</button></p>
        </section>
      </div>
    </main>
  )
}
