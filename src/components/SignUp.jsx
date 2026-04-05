import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase'; 
import { doc, setDoc } from 'firebase/firestore';

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
  headerNav: {
    display: 'flex', backgroundColor: '#f0f0f0', borderRadius: '12px', padding: '4px', marginBottom: '35px',
  },
  navItem: {
    flex: 1, textAlign: 'center', padding: '12px', textDecoration: 'none', color: '#666',
    fontWeight: '600', borderRadius: '10px', transition: 'all 0.2s', fontSize: '14px',
  },
  activeNavItem: { backgroundColor: '#ffffff', color: '#000', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  formHeader: { fontSize: '32px', fontWeight: '800', marginBottom: '10px' },
  formSubheader: { fontSize: '14px', color: '#888', marginBottom: '30px' },
  inputGroup: { marginBottom: '12px' },
  input: {
    width: '100%', padding: '14px 18px', borderRadius: '10px', border: '1px solid #ddd',
    fontSize: '15px', boxSizing: 'border-box', outline: 'none',
  },
  button: {
    width: '100%', padding: '16px', borderRadius: '12px', fontSize: '16px',
    fontWeight: '700', cursor: 'pointer', border: 'none', backgroundColor: '#000', color: '#fff',
    marginTop: '15px', transition: 'opacity 0.2s',
  },
  // เพิ่มสไตล์กล่องแจ้งเตือน Error
  errorBox: {
    backgroundColor: '#fff1f0',
    border: '1px solid #ffa39e',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '20px',
    color: '#cf1322',
    fontSize: '13px',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
};

function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // เพิ่มสถานะ Loading
  
  const navigate = useNavigate();

  // ฟังก์ชันกรองเฉพาะตัวอักษร (ย้ายมาไว้นอก handleSignUp)
  const handleNameChange = (value, setter) => {
    const formattedValue = value.replace(/[^a-zA-Zก-๙\s]/g, '');
    setter(formattedValue);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    // 1. ตรวจสอบเงื่อนไขเบื้องต้น (Validation)
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);

    try {
      // 1. สร้างบัญชีใน Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. อัปเดต Display Name
      const fullName = `${firstName} ${lastName}`;
      await updateProfile(user, { displayName: fullName });

      // 3. บันทึกข้อมูลลง Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: 'user',
        createdAt: new Date()
      });

      console.log("ลงทะเบียนสำเร็จ");
      navigate('/'); 

    } catch (err) {
      // ดักจับ Error จาก Firebase และแสดงผลเป็นภาษาไทย
      console.error(err.code);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError("อีเมลนี้ถูกใช้งานไปแล้วในระบบ");
          break;
        case 'auth/invalid-email':
          setError("รูปแบบอีเมลไม่ถูกต้อง");
          break;
        case 'auth/weak-password':
          setError("รหัสผ่านคาดเดาง่ายเกินไป");
          break;
        default:
          setError("ไม่สามารถสมัครสมาชิกได้ โปรดตรวจสอบข้อมูลอีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.mainContainer}>
      <div style={styles.leftColumn}>
        <div style={styles.backgroundImage}></div>
        <div style={styles.leftContent}>
          <h1 style={{fontSize: '40px'}}>CAMPGEAR</h1>
          <p>เริ่มต้นการเดินทางครั้งใหม่กับเรา</p>
        </div>
      </div>

      <div style={styles.rightColumn}>
        <div style={styles.formWrapper}>
          <div style={styles.headerNav}>
            <Link to="/signin" style={styles.navItem}>เข้าสู่ระบบ</Link>
            <div style={{ ...styles.navItem, ...styles.activeNavItem }}>สมัครสมาชิก</div>
          </div>

          <h2 style={styles.formHeader}>สร้างบัญชีใหม่</h2>
          <p style={styles.formSubheader}>กรอกข้อมูลด้านล่างเพื่อร่วมเป็นส่วนหนึ่งกับ CAMPGEAR</p>

          <form onSubmit={handleSignUp}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input 
                type="text" 
                placeholder="ชื่อจริง" 
                style={{ ...styles.input, flex: 1 }}
                value={firstName}
                onChange={(e) => handleNameChange(e.target.value, setFirstName)}
                required
              />
              <input 
                type="text" 
                placeholder="นามสกุล" 
                style={{ ...styles.input, flex: 1 }}
                value={lastName}
                onChange={(e) => handleNameChange(e.target.value, setLastName)}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <input 
                type="email" 
                placeholder="อีเมลของคุณ" 
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <input 
                type="password" 
                placeholder="รหัสผ่าน (8 ตัวขึ้นไป)" 
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <input 
                type="password" 
                placeholder="ยืนยันรหัสผ่าน" 
                style={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" style={{...styles.button, opacity: loading ? 0.7 : 1}} disabled={loading}>
              {loading ? 'กำลังประมวลผล...' : 'สร้างบัญชีตอนนี้ →'}
            </button>
          </form>

          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignUp;