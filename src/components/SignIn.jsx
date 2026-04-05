import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
// เพิ่มการนำเข้า db และฟังก์ชัน Firestore
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const styles = {
  mainContainer: {
    display: 'flex',
    width: '100%',
    height: '100vh',
    backgroundColor: '#ffffff',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    fontFamily: "'Prompt', sans-serif",
  },
  leftColumn: {
    flex: 1.5,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '80px',
    height: '100%',
    color: '#ffffff',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: "url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2000')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.65)',
    zIndex: 1,
  },
  leftContent: {
    position: 'relative',
    zIndex: 2,
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  },
  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: '100%',
    padding: '40px',
  },
  formWrapper: {
    width: '100%',
    maxWidth: '380px',
  },
  headerNav: {
    display: 'flex',
    backgroundColor: '#f0f0f0',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '35px',
  },
  navItem: {
    flex: 1,
    textAlign: 'center',
    padding: '12px',
    textDecoration: 'none',
    color: '#666',
    fontWeight: '600',
    borderRadius: '10px',
    transition: 'all 0.2s',
    fontSize: '14px',
  },
  activeNavItem: {
    backgroundColor: '#ffffff',
    color: '#000',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  formHeader: { 
    fontSize: '32px', 
    fontWeight: '800', 
    marginBottom: '10px', 
    textAlign: 'left' 
  },
  formSubheader: { 
    fontSize: '14px', 
    color: '#888', 
    marginBottom: '30px' 
  },
  inputGroup: { marginBottom: '15px' },
  input: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '16px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    border: 'none',
  },
  emailButton: {
    backgroundColor: '#000',
    color: '#fff',
    marginTop: '10px',
  },
  googleButton: {
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '15px',
  },
  divider: {
    margin: '25px 0',
    textAlign: 'center',
    color: '#bbb',
    fontSize: '13px',
  },
  switchLink: {
    marginTop: '25px',
    textAlign: 'center',
    fontSize: '14px',
  }
};

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ฟังก์ชันเช็คสิทธิ์ (แยกออกมาให้เรียกใช้ง่าย)
  const checkRoleAndNavigate = async (user) => {
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.role === 'admin') {
          console.log("เข้าสู่ระบบในฐานะ: แอดมิน");
          navigate('/admin-dashboard'); // ไปหน้าแอดมิน
        } else {
          console.log("เข้าสู่ระบบในฐานะ: ผู้ใช้ทั่วไป");
          navigate('/'); // ไปหน้าโฮม
        }
      } else {
        // หากไม่มีข้อมูลใน Firestore ให้ไปหน้าแรกไว้ก่อน
        navigate('/');
      }
    } catch (err) {
      console.error("Error fetching role:", err);
      navigate('/');
    }
  };

  

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // เมื่อล็อกอินผ่าน ให้ไปเช็ค Role ต่อทันที
      await checkRoleAndNavigate(userCredential.user);
    } catch  {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setError('');
    try {
      const userCredential = await signInWithPopup(auth, provider);
      // เช็ค Role สำหรับ Google Login ด้วย
      await checkRoleAndNavigate(userCredential.user);
    } catch  {
      setError("การเข้าสู่ระบบด้วย Google ล้มเหลว");
    }
  };

  return (
    <div style={styles.mainContainer}>
      <div className="auth-left" style={styles.leftColumn}>
        <div style={styles.backgroundImage}></div>
        <div style={styles.leftContent}>
          <h1 style={{fontSize: '40px'}}>CAMPGEAR</h1>
          <p>ยินดีต้อนรับกลับสู่อุปกรณ์เดินป่าของคุณ</p>
        </div>
      </div>

      <div className="auth-right" style={styles.rightColumn}>
        <div style={styles.formWrapper}>
          <div style={styles.headerNav}>
            <div style={{ ...styles.navItem, ...styles.activeNavItem }}>เข้าสู่ระบบ</div>
            <Link to="/signup" style={styles.navItem}>สมัครสมาชิก</Link>
          </div>

          <h2 style={styles.formHeader}>ยินดีต้อนรับกลับ</h2>
          <p style={styles.formSubheader}>กรุณากรอกรายละเอียดเพื่อเข้าสู่บัญชีของคุณ</p>

          <form onSubmit={handleEmailSignIn}>
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
                placeholder="รหัสผ่าน" 
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              style={{ ...styles.button, ...styles.emailButton }}
              onMouseOver={(e) => e.target.style.opacity = '0.8'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              เข้าสู่ระบบ →
            </button>
          </form>

          <div style={styles.divider}>หรือเข้าสู่ระบบด้วย</div>

          <button 
            onClick={handleGoogleSignIn} 
            style={{ ...styles.button, ...styles.googleButton }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" width="18"/>
            Google Account
          </button>

          {error && <p style={{ color: '#ff4d4d', textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>{error}</p>}

          <p style={styles.switchLink}>
            <Link to="/forgot-password" style={{ color: '#888', textDecoration: 'none' }}>ลืมรหัสผ่านใช่ไหม?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;