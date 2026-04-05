import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

// ใช้ Styles เดียวกับหน้า SignIn เพื่อความต่อเนื่อง
const styles = {
  mainContainer: {
    display: 'flex', width: '100%', height: '100vh', backgroundColor: '#ffffff',
    margin: 0, padding: 0, overflow: 'hidden', fontFamily: "'Prompt', sans-serif",
  },
  leftColumn: {
    flex: 1.5, position: 'relative', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', padding: '80px', height: '100%', color: '#ffffff',
  },
  backgroundImage: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundImage: "url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2000')",
    backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.65)', zIndex: 1,
  },
  leftContent: { position: 'relative', zIndex: 2, textShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' },
  rightColumn: {
    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#ffffff', height: '100%', padding: '40px',
  },
  formWrapper: { width: '100%', maxWidth: '380px' },
  formHeader: { fontSize: '32px', fontWeight: '800', marginBottom: '10px' },
  formSubheader: { fontSize: '14px', color: '#888', marginBottom: '30px' },
  input: {
    width: '100%', padding: '14px 18px', borderRadius: '10px', border: '1px solid #ddd',
    fontSize: '16px', boxSizing: 'border-box', outline: 'none', marginBottom: '15px'
  },
  button: {
    width: '100%', padding: '16px', borderRadius: '12px', fontSize: '16px',
    fontWeight: '700', cursor: 'pointer', border: 'none', backgroundColor: '#000', color: '#fff'
  },
  statusMessage: { textAlign: 'center', marginTop: '15px', fontSize: '14px' }
};

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("ตรวจสอบอีเมลของคุณเพื่อทำรายการรีเซ็ตรหัสผ่านใหม่");
      setEmail('');
    } catch  {
      setError("ไม่พบอีเมลนี้ในระบบ หรือเกิดข้อผิดพลาดกรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.mainContainer}>
      {/* ฝั่งซ้าย (ตกแต่งเหมือนหน้า Login) */}
      <div style={styles.leftColumn}>
        <div style={styles.backgroundImage}></div>
        <div style={styles.leftContent}>
          <h1 style={{fontSize: '40px'}}>CAMPGEAR</h1>
          <p>กู้คืนการเข้าถึงอุปกรณ์เดินป่าของคุณ</p>
        </div>
      </div>

      {/* ฝั่งขวา (ฟอร์ม) */}
      <div style={styles.rightColumn}>
        <div style={styles.formWrapper}>
          <h2 style={styles.formHeader}>ลืมรหัสผ่าน?</h2>
          <p style={styles.formSubheader}>ระบุอีเมลที่คุณใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้</p>

          <form onSubmit={handleResetPassword}>
            <input 
              type="email" 
              placeholder="อีเมลของคุณ" 
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'กำลังส่งข้อมูล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
            </button>
          </form>

          {message && <p style={{ ...styles.statusMessage, color: '#2ecc71' }}>{message}</p>}
          {error && <p style={{ ...styles.statusMessage, color: '#ff4d4d' }}>{error}</p>}

          <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px' }}>
            <Link to="/signin" style={{ color: '#000', fontWeight: 'bold', textDecoration: 'none' }}>
               ← กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;