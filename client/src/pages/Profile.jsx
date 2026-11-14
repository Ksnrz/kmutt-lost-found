import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Info, Lock, UserCircle, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { api } from '../api';
import './Profile.css';

const PHONE_HELP = 'เบอร์มือถือ 10 หลัก ขึ้นต้นด้วย 0';

const onlyDigits = (value) => value.replace(/\D/g, '').slice(0, 10);

// 0812345678 -> 081-234-5678 (display only; the API gets digits)
function formatPhone(d) {
  if (d.length > 6) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return d;
}

// Same rule as the server (routes/me.js). Empty is fine: the phone is optional.
function phoneError(d) {
  if (d === '') return '';
  if (!/^0[689]/.test(d)) return 'เบอร์ต้องขึ้นต้นด้วย 0';
  if (d.length < 10) return `เบอร์โทรต้องมี 10 หลัก (ตอนนี้ ${d.length} หลัก)`;
  return '';
}

/**
 * Profile — หน้าบัญชีของฉัน (/profile)
 * ข้อมูลบัญชีอ่านอย่างเดียว + แก้ชื่อ นามสกุล เบอร์โทร ผ่าน GET/PATCH /api/me
 */
export default function Profile() {
  const navigate = useNavigate();
  const phoneRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [nudgeClosed, setNudgeClosed] = useState(false);
  const [status, setStatus] = useState(''); // 'saved' | error message

  useEffect(() => {
    api('/api/me')
      .then((me) => {
        setProfile(me);
        setForm({
          first_name: me.first_name ?? '',
          last_name: me.last_name ?? '',
          phone: formatPhone(me.phone_number ?? ''),
        });
      })
      .catch((err) => (err.status === 401 ? navigate('/login') : setStatus(err.message)));
  }, [navigate]);

  const phoneDigits = onlyDigits(form.phone);
  const error = phoneError(phoneDigits);
  // show the error once the field was left / save was pressed, or at once when the prefix is already wrong
  const showError = error && (phoneTouched || (phoneDigits.length >= 2 && !/^0[689]/.test(phoneDigits)));
  const phoneValid = phoneDigits.length === 10 && !error;

  function update(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setStatus('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (error) {
      setPhoneTouched(true);
      phoneRef.current?.focus();
      return;
    }
    try {
      const me = await api('/api/me', {
        method: 'PATCH',
        body: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone_number: phoneDigits,
        },
      });
      setProfile(me);
      setStatus('saved');
    } catch (err) {
      setStatus(err.message);
    }
  }

  if (!profile) return <div className="profile-page">{status}</div>;

  const incomplete = !profile.first_name || !profile.last_name || !profile.phone_number;

  return (
    <div className="profile-page">
      <PageHeader
        tag="My Account"
        title="บัญชีของฉัน"
        subtitle="จัดการข้อมูลส่วนตัวที่ใช้ติดต่อเวลานัดรับของ"
      />

      {incomplete && !nudgeClosed && (
        <div className="profile-nudge" role="status">
          <Info size={18} aria-hidden="true" />
          <span>กรอกชื่อและเบอร์โทร เพื่อให้นัดรับของง่ายขึ้น</span>
          <button type="button" className="profile-nudge-close" onClick={() => setNudgeClosed(true)} aria-label="ปิดการแจ้งเตือน">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="profile-grid">
        <section className="profile-card">
          <div className="profile-icon-badge" aria-hidden="true">
            <UserCircle size={22} />
          </div>
          <h2 className="profile-card-title">ข้อมูลบัญชี</h2>
          <dl className="profile-rows">
            <div className="profile-row">
              <dt>รหัสนักศึกษา</dt>
              <dd><Lock size={14} aria-hidden="true" />{profile.student_id}</dd>
            </div>
            <div className="profile-row">
              <dt>อีเมล</dt>
              <dd><Lock size={14} aria-hidden="true" />{profile.email}</dd>
            </div>
          </dl>
        </section>

        <form className="profile-card" onSubmit={handleSubmit} noValidate>
          <h2 className="profile-card-title">ข้อมูลส่วนตัว</h2>
          <div className="profile-fields">
            <div className="profile-field">
              <label htmlFor="first_name">ชื่อ</label>
              <input id="first_name" value={form.first_name} maxLength={100} placeholder="กรอกชื่อ" onChange={(e) => update('first_name', e.target.value)} />
            </div>
            <div className="profile-field">
              <label htmlFor="last_name">นามสกุล</label>
              <input id="last_name" value={form.last_name} maxLength={100} placeholder="กรอกนามสกุล" onChange={(e) => update('last_name', e.target.value)} />
            </div>
            <div className="profile-field profile-field-wide">
              <label htmlFor="phone">เบอร์โทร</label>
              <input
                id="phone"
                ref={phoneRef}
                type="tel"
                inputMode="tel"
                maxLength={12}
                value={form.phone}
                placeholder="081-234-5678"
                className={showError ? 'is-invalid' : phoneValid ? 'is-valid' : ''}
                aria-invalid={Boolean(showError)}
                aria-describedby="phone-hint"
                onChange={(e) => update('phone', formatPhone(onlyDigits(e.target.value)))}
                onBlur={() => setPhoneTouched(true)}
              />
              <p id="phone-hint" className={`profile-hint ${showError ? 'is-invalid' : phoneValid ? 'is-valid' : ''}`}>
                {showError ? error : phoneValid ? 'รูปแบบถูกต้อง' : PHONE_HELP}
              </p>
            </div>
          </div>

          <div className="profile-actions">
            <Button type="submit" variant="primary">บันทึก</Button>
            {status === 'saved' && (
              <span className="profile-saved" role="status"><CheckCircle2 size={16} aria-hidden="true" /> บันทึกแล้ว</span>
            )}
            {status && status !== 'saved' && <span className="profile-error" role="alert">{status}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
