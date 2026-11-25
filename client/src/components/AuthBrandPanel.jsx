import mascot from '../assets/login/login-mascot.png'

export default function AuthBrandPanel() {
  return (
    <section className="login-intro">
      <h2 className="login-headline">
        <span className="login-headline-first">ทำของหาย?</span>
        <span className="login-headline-second">ให้เรา<span className="login-headline-accent">ช่วยหา</span></span>
      </h2>
      <div className="login-mascot">
        <img className="login-illustration" src={mascot} alt="มาสคอตค้นหาของหาย" width={1254} height={1254} />
        <p className="login-speech">ของหาย ได้คืน</p>
      </div>
    </section>
  )
}
