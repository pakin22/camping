import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { auth, db, storage } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { MdCameraAlt, MdEdit, MdSave, MdPerson, MdPhone, MdEmail, MdHome, MdHistory, MdLocationOn, MdClose } from 'react-icons/md';
import CircularProgress from '@mui/material/CircularProgress';

const colors = {
    primary: '#000',
    secondary: '#6e6e73',
    background: '#f5f5f7',
    white: '#ffffff',
    accent: '#0071e3', 
    error: '#ff4d4f',
    success: '#28a745'
};

const Profile = ({ user, cart, addToCart, favorites, toggleFavorite }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    
    const [profileData, setProfileData] = useState({
        displayName: user?.displayName || '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '', 
        province: '',
        district: '',
        subDistrict: '',
        zipCode: ''
    });
    
   // เปลี่ยนบรรทัดนี้ใน Profile.jsx
const [imagePreview, setImagePreview] = useState(user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}&background=random`);

    // 1. ดึงข้อมูล Profile และประวัติการสั่งซื้อ
    useEffect(() => {
        const fetchUserDataAndOrders = async () => {
            if (user?.uid) {
                try {
                    // ดึงข้อมูลส่วนตัวจาก Firestore
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setProfileData(prev => ({ ...prev, ...docSnap.data() }));
                    }

                    // ดึงประวัติการสั่งซื้อ
                    const q = query(
                        collection(db, "orders"), 
                        where("userId", "==", user.uid),
                        orderBy("createdAt", "desc")
                    );
                    const querySnapshot = await getDocs(q);
                    const ordersList = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setOrders(ordersList);
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            }
        };

        fetchUserDataAndOrders();
        if (user?.photoURL) setImagePreview(user.photoURL);
    }, [user]);

    // 2. ฟังก์ชันจัดการรูปภาพ
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert("ขนาดรูปภาพต้องไม่เกิน 2MB");
            return;
        }

        setLoading(true);
        try {
            const storageRef = ref(storage, `profiles/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            await updateProfile(auth.currentUser, { photoURL: downloadURL });
            setImagePreview(downloadURL);
            alert("อัปเดตรูปโปรไฟล์สำเร็จ");
        } catch  {
            alert("เกิดข้อผิดพลาดในการอัปโหลด");
        } finally {
            setLoading(false);
        }
    };

    // 3. ฟังก์ชันกรองเบอร์โทรศัพท์ (เฉพาะตัวเลข 10 หลัก)
    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setProfileData({ ...profileData, phone: value });
    };

    // 4. ฟังก์ชันบันทึกข้อมูล
    const handleSave = async () => {
        setLoading(true);
        try {
            const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
            
            // อัปเดต Firebase Auth
            await updateProfile(auth.currentUser, { displayName: fullName });
            
            // อัปเดต Firestore
            await setDoc(doc(db, "users", user.uid), {
                ...profileData,
                displayName: fullName,
                email: user.email,
                updatedAt: new Date()
            }, { merge: true });

            setIsEditing(false);
            alert("บันทึกข้อมูลเรียบร้อย");
        } catch (error) {
            console.error(error);
            alert("บันทึกไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: colors.background, minHeight: '100vh', padding: '120px 20px 60px', fontFamily: 'Prompt, sans-serif' }}>
            <Navbar user={user} cart={cart} addToCart={addToCart} favorites={favorites} toggleFavorite={toggleFavorite} />
            
            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                
                {/* Left Column: Profile Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={cardStyle}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={avatarWrapper}>
                                <img src={imagePreview} alt="Profile" style={avatarImg} />
                                <label style={cameraIcon}>
                                    <MdCameraAlt size={18} />
                                    <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                                </label>
                            </div>
                            <h2 style={{ margin: '20px 0 5px', fontSize: '24px' }}>{profileData.displayName || 'Camping User'}</h2>
                            <p style={{ color: colors.secondary, fontSize: '14px' }}><MdEmail style={{verticalAlign:'middle'}}/> {user?.email}</p>
                        </div>
                        
                        <div style={{ marginTop: '30px', borderTop: `1px solid ${colors.background}`, paddingTop: '20px' }}>
                            <div style={infoRow}><MdPerson color={colors.accent}/> <span>{profileData.firstName || '-'} {profileData.lastName || ''}</span></div>
                            <div style={infoRow}><MdPhone color={colors.accent}/> <span>{profileData.phone || 'ยังไม่ได้ระบุเบอร์โทร'}</span></div>
                            <div style={infoRow}><MdLocationOn color={colors.accent}/> <span>{profileData.province || 'ยังไม่ได้ระบุที่อยู่'}</span></div>
                        </div>

                        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} style={isEditing ? btnSave : btnEdit} disabled={loading}>
                            {loading ? <CircularProgress size={20} color="inherit" /> : (isEditing ? <><MdSave/> บันทึกข้อมูล</> : <><MdEdit/> แก้ไขโปรไฟล์</>)}
                        </button>
                        {isEditing && <button onClick={() => setIsEditing(false)} style={btnCancel}>ยกเลิก</button>}
                    </div>
                </div>

                {/* Right Column: Address & Orders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* Address Form */}
                    <div style={cardStyle}>
                        <h3 style={sectionTitle}><MdHome color={colors.accent} /> ข้อมูลที่อยู่จัดส่ง</h3>
                        <div style={formGrid}>
                            <div style={inputGroup}>
                                <label style={labelStyle}>ชื่อจริง</label>
                                <input disabled={!isEditing} style={inputStyle(isEditing)} value={profileData.firstName} onChange={(e)=>setProfileData({...profileData, firstName: e.target.value})} placeholder="ชื่อ" />
                            </div>
                            <div style={inputGroup}>
                                <label style={labelStyle}>นามสกุล</label>
                                <input disabled={!isEditing} style={inputStyle(isEditing)} value={profileData.lastName} onChange={(e)=>setProfileData({...profileData, lastName: e.target.value})} placeholder="นามสกุล" />
                            </div>
                            <div style={inputGroup}>
                                <label style={labelStyle}>เบอร์โทรศัพท์</label>
                                <input disabled={!isEditing} style={inputStyle(isEditing)} value={profileData.phone} onChange={handlePhoneChange} placeholder="08XXXXXXXX" />
                            </div>
                            <div style={{gridColumn: 'span 2'}}>
                                <label style={labelStyle}>ที่อยู่ (บ้านเลขที่/ถนน/ซอย)</label>
                                <input disabled={!isEditing} style={inputStyle(isEditing)} value={profileData.address} onChange={(e)=>setProfileData({...profileData, address: e.target.value})} placeholder="123/45 หมู่ 1..." />
                            </div>
                            <div style={inputGroup}>
                                <label style={labelStyle}>ตำบล/แขวง</label>
                                <input disabled={!isEditing} style={inputStyle(isEditing)} value={profileData.subDistrict} onChange={(e)=>setProfileData({...profileData, subDistrict: e.target.value})} />
                            </div>
                            <div style={inputGroup}>
                                <label style={labelStyle}>อำเภอ/เขต</label>
                                <input disabled={!isEditing} style={inputStyle(isEditing)} value={profileData.district} onChange={(e)=>setProfileData({...profileData, district: e.target.value})} />
                            </div>
                            <div style={inputGroup}>
                                <label style={labelStyle}>จังหวัด</label>
                                <input disabled={!isEditing} style={inputStyle(isEditing)} value={profileData.province} onChange={(e)=>setProfileData({...profileData, province: e.target.value})} />
                            </div>
                            <div style={inputGroup}>
                                <label style={labelStyle}>รหัสไปรษณีย์</label>
                                <input disabled={!isEditing} style={inputStyle(isEditing)} value={profileData.zipCode} onChange={(e)=>setProfileData({...profileData, zipCode: e.target.value})} maxLength="5" />
                            </div>
                        </div>
                    </div>

                    {/* Order History */}
                    <div style={cardStyle}>
                        <h3 style={sectionTitle}><MdHistory color={colors.accent} /> ประวัติการสั่งซื้อ</h3>
                        {orders.length === 0 ? (
                            <p style={{ textAlign: 'center', color: colors.secondary, padding: '40px' }}>ยังไม่มีรายการสั่งซื้อ</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {orders.map(order => (
                                    <div key={order.id} style={orderItemStyle}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontWeight: '700', fontSize: '16px' }}>#{order.orderId || order.id.slice(0,8)}</span>
                                                <div style={{ fontSize: '13px', color: colors.secondary, marginTop: '4px' }}>
                                                    {order.createdAt?.toDate().toLocaleDateString('th-TH')} • {order.createdAt?.toDate().toLocaleTimeString('th-TH')}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '700', color: colors.primary }}>฿{order.totalAmount?.toLocaleString()}</div>
                                                <span style={statusBadge(order.status)}>{order.status === 'pending' ? 'รอตรวจสอบ' : 'สำเร็จ'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- Styles (คงเดิมและปรับปรุงเล็กน้อย) ---
const cardStyle = {
    backgroundColor: colors.white,
    padding: '35px',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
};

const avatarWrapper = {
    width: '130px', height: '130px', borderRadius: '50%', 
    margin: '0 auto', position: 'relative', border: `4px solid ${colors.background}`,
    overflow: 'visible'
};

const avatarImg = { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' };

const cameraIcon = {
    position: 'absolute', bottom: '5px', right: '5px', 
    backgroundColor: colors.accent, color: '#fff', 
    width: '38px', height: '38px', borderRadius: '50%', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,100,0.2)'
};

const infoRow = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', fontSize: '15px' };

const sectionTitle = { fontSize: '20px', fontWeight: '700', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' };

const formGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };

const inputGroup = { display: 'flex', flexDirection: 'column', gap: '8px' };

const labelStyle = { fontSize: '13px', fontWeight: '600', color: colors.secondary };

const inputStyle = (isEditing) => ({
    padding: '14px', borderRadius: '12px', 
    border: isEditing ? `1.5px solid ${colors.accent}` : '1.5px solid #eee',
    backgroundColor: isEditing ? '#fff' : '#f9f9f9', 
    outline: 'none', transition: '0.3s ease',
    fontSize: '15px'
});

const btnEdit = {
    width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${colors.primary}`,
    backgroundColor: 'transparent', cursor: 'pointer', marginTop: '25px', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '700'
};

const btnSave = { ...btnEdit, backgroundColor: colors.primary, color: '#fff', border: 'none' };

const btnCancel = { ...btnEdit, border: 'none', color: colors.error, marginTop: '8px' };

const orderItemStyle = {
    padding: '20px', borderRadius: '18px', border: '1px solid #f0f0f0', backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
};

const statusBadge = (status) => ({
    fontSize: '11px', padding: '4px 12px', borderRadius: '20px', fontWeight: '600',
    backgroundColor: status === 'pending' ? '#fff7e6' : '#f6ffed',
    color: status === 'pending' ? '#faad14' : '#52c41a',
    border: `1px solid ${status === 'pending' ? '#ffe58f' : '#b7eb8f'}`,
    display: 'inline-block', marginTop: '5px'
});

export default Profile;