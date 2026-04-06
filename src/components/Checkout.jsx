import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { 
    collection, doc, getDoc, getDocs, query, where, 
    serverTimestamp, runTransaction, limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ข้อมูลและสไตล์ (ตรวจสอบ Path ให้ตรงกับโปรเจกต์ของคุณ)
import { THAILAND_DATA } from '../data/thailandData';
import { theme, styles } from '../styles/checkoutStyles';

// Icons & UI
import Navbar from './Navbar';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CircularProgress from '@mui/material/CircularProgress';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

const Checkout = (props) => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    
    // สถานะสำหรับส่วนลด
    const [discountCode, setDiscountCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null); 

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', phone: '',
        houseNo: '', province: '', district: '', subDistrict: '', zipCode: ''
    });

    useEffect(() => {
        if (!props.user) navigate('/signin');
        else handleUseProfileAddress();
    }, [props.user]);

    // --- Logic การคำนวณเงิน (Re-calculate ทุกครั้งที่มีการเปลี่ยนแปลง State) ---
    const cartItems = props.cart || [];
    
    // 1. ราคาสินค้ารวม (Subtotal)
    const subtotal = cartItems.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.quantity) || 0;
        return sum + (price * qty);
    }, 0);

    // 2. ค่าจัดส่ง (ฟรีเมื่อซื้อครบ 2,000 บาท)
    const shipping = (subtotal >= 2000 || subtotal === 0) ? 0 : 150;
    
    // 3. ฟังก์ชันคำนวณส่วนลดจากคูปอง
    const calculateDiscount = () => {
        if (!appliedCoupon) return 0;
        const couponVal = Number(appliedCoupon.discountValue) || 0;
        
        if (appliedCoupon.discountType === 'percent') {
            return (subtotal * couponVal) / 100;
        }
        return couponVal; // แบบยอดเงินคงที่ (Fixed Amount)
    };

    const discountAmount = calculateDiscount();
    
    // 4. ยอดชำระสุทธิ (Total)
    const total = Math.max(0, subtotal + shipping - discountAmount);

    // --- การจัดการ Form และ Address ---
    const validation = {
        name: formData.firstName?.trim() !== '' && formData.lastName?.trim() !== '',
        phone: (formData.phone || '').trim().length === 10,
        addressDetail: formData.houseNo?.trim() !== '',
        location: formData.province !== '' && formData.district !== '' && formData.subDistrict !== '',
        file: selectedFile !== null
    };
    const isFormValid = Object.values(validation).every(Boolean);

   const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: value
    }));

    // Logic เสริม: ถ้ากรอกตำบล แล้วระบบหา ZipCode เจอใน Data จะช่วยใส่ให้เบื้องต้น
    if (name === 'subDistrict' && value.length > 2) {
        // ค้นหาแบบกว้างๆ (Case-sensitive อาจจะมีผล ควรระวัง)
        const foundZip = THAILAND_DATA[formData.province]?.[formData.district]?.[value];
        if (foundZip) {
            setFormData(prev => ({ ...prev, zipCode: foundZip }));
        }
    }
};

    // --- ระบบตรวจสอบคูปอง ---
    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;
        setCouponLoading(true);
        try {
            const searchCode = discountCode.trim();
            const q = query(
                collection(db, "coupons"), 
                where("code", "==", searchCode),
                where("isActive", "==", true),
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                alert('ไม่พบโค้ดส่วนลดนี้ หรือโค้ดหมดอายุแล้ว');
                setAppliedCoupon(null);
                return;
            }

            const rawData = querySnapshot.docs[0].data();
            
            // ป้องกันปัญหา String/Number จาก Database
            const couponData = {
                code: rawData.code,
                discountValue: Number(rawData.discountValue) || 0, 
                discountType: rawData.discountType || 'fixed',     
                minOrder: Number(rawData.minOrder) || 0
            };

            // ตรวจสอบวันหมดอายุ (Optional: เพิ่มความโปร)
            if (rawData.expiryDate) {
                const now = new Date();
                const expiry = rawData.expiryDate.toDate(); // แปลง Firebase Timestamp เป็น JS Date
                if (now > expiry) {
                    alert("ขออภัย: โค้ดนี้หมดอายุแล้ว");
                    setAppliedCoupon(null);
                    return;
                }
            }

            setAppliedCoupon(couponData);
            alert(`ใช้ส่วนลด ฿${couponData.discountValue.toLocaleString()} เรียบร้อย!`);

            if (subtotal < couponData.minOrder) {
                alert(`ยอดซื้อขั้นต่ำต้องถึง ฿${couponData.minOrder.toLocaleString()}`);
                setAppliedCoupon(null);
                return;
            }

            setAppliedCoupon(couponData);
            console.log("Applied Coupon:", couponData); // Debug ดูค่าที่ดึงมา
            alert(`ใช้ส่วนลด "${couponData.code}" สำเร็จ!`);

        } catch (e) {
            console.error("Coupon Error: ", e);
            alert("เกิดข้อผิดพลาดในการตรวจสอบคูปอง");
        } finally {
            setCouponLoading(false);
        }
    };

    const handleUseProfileAddress = async () => {
        if (!props.user) return;
        setProfileLoading(true);
        try {
            const userDoc = await getDoc(doc(db, "users", props.user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setFormData({
                    firstName: data.firstName || '', lastName: data.lastName || '', phone: data.phone || '',
                    houseNo: data.address || '', province: data.province || '',
                    district: data.district || '', subDistrict: data.subDistrict || '', zipCode: data.zipCode || ''
                });
            }
        } catch (e) { console.error(e); } finally { setProfileLoading(false); }
    };

    // --- ส่งคำสั่งซื้อ ---
    const handleSubmitOrder = async () => {
        if (!isFormValid || !props.user) return;
        setLoading(true);
        try {
            // 1. อัปโหลดสลิป
            const fileRef = ref(storage, `slips/${Date.now()}_${selectedFile.name}`);
            await uploadBytes(fileRef, selectedFile);
            const slipUrl = await getDownloadURL(fileRef);
            const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

            // 2. บันทึกลง Firestore (Transaction เพื่อความปลอดภัยของข้อมูล)
            await runTransaction(db, async (transaction) => {
                const orderRef = doc(collection(db, "orders"));
                transaction.set(orderRef, {
                    orderId,
                    userId: props.user.uid,
                    customerInfo: { ...formData, email: props.user.email },
                    items: cartItems,
                    subtotal: Number(subtotal), 
                    shipping: Number(shipping), 
                    discount: Number(discountAmount), 
                    couponUsed: appliedCoupon ? appliedCoupon.code : null,
                    totalAmount: Number(total), // บันทึกยอดที่หักลบเรียบร้อยแล้ว
                    slipUrl, 
                    status: 'pending', 
                    createdAt: serverTimestamp()
                });
            });

            alert('สั่งซื้อสำเร็จ! เราจะรีบตรวจสอบยอดชำระของคุณ');
            if (props.clearCart) props.clearCart();
            navigate('/');
        } catch (e) { 
            alert("เกิดข้อผิดพลาด: " + e.message); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div style={styles.wrapper}>
            {loading && <div style={styles.loadingOverlay}><CircularProgress color="inherit" /></div>}
            <Navbar {...props} />
            <div style={styles.container}>
                <div style={styles.mainContent}>
                    <h1 style={styles.title}>Check Out</h1>

                    {/* ข้อมูลธนาคาร */}
                    <section style={styles.cardSection}>
                        <div style={styles.sectionTitle}><AccountBalanceIcon /> ชำระเงินผ่านธนาคาร</div>
                        <div style={styles.bankCard}>
                            <div style={styles.bankHeader}>
                                <div><p style={styles.bankLabel}>ชื่อบัญชี</p><p style={styles.bankName}>บจก. แคมป์เกียร์ ไทยแลนด์</p></div>
                                <div style={styles.bankBrand}>K-BANK</div>
                            </div>
                            <div style={styles.accountNumberRow}>
                                <h2 style={styles.accountNumber}>123-4-56789-0</h2>
                                <button onClick={() => { navigator.clipboard.writeText("123-4-56789-0"); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} 
                                        style={{ ...styles.copyBtn, backgroundColor: copied ? theme.success : theme.black }}>
                                    {copied ? <CheckCircleIcon fontSize="small"/> : <ContentCopyIcon fontSize="small"/>} {copied ? 'คัดลอกแล้ว' : 'คัดลอกเลขบัญชี'}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* อัปโหลดสลิป */}
                    <section style={styles.cardSection}>
                        <div style={styles.sectionTitle}><CloudUploadIcon /> อัปโหลดหลักฐานการโอน</div>
                        <input type="file" id="slip" hidden accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if(file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                        }} />
                        <label htmlFor="slip" style={{
                            ...styles.uploadArea, 
                            border: `2px dashed ${selectedFile ? theme.success : '#d1d1d6'}`,
                            backgroundColor: selectedFile ? '#f6fff8' : '#fafafa',
                            cursor: 'pointer', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', minHeight: '180px',
                            borderRadius: '12px', transition: 'all 0.2s ease'
                        }}>
                            {previewUrl ? (
                                <img src={previewUrl} alt="slip" style={{ maxHeight: '250px', borderRadius: '8px', padding: '10px' }} />
                            ) : (
                                <>
                                    <CloudUploadIcon style={{ fontSize: '48px', color: '#8e8e93', marginBottom: '10px' }} />
                                    <span style={{ color: '#8e8e93', fontSize: '14px' }}>คลิกเพื่อเลือกไฟล์รูปภาพสลิป</span>
                                </>
                            )}
                        </label>
                    </section>

                    {/* ที่อยู่จัดส่ง */}
                    <section style={styles.cardSection}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <div style={styles.sectionTitle}><LocationOnIcon /> ข้อมูลผู้รับและที่อยู่จัดส่ง</div>
                            <button onClick={handleUseProfileAddress} disabled={profileLoading} style={styles.profileBtn?.(profileLoading) || {}}>
                                {profileLoading ? 'กำลังโหลด...' : 'ใช้ข้อมูลโปรไฟล์'}
                            </button>
                        </div>
                        
                        <div style={styles.inputRow}>
                            <input name="firstName" placeholder="ชื่อ" style={styles.input(!validation.name && formData.firstName)} value={formData.firstName} onChange={handleInputChange} />
                            <input name="lastName" placeholder="นามสกุล" style={styles.input(!validation.name && formData.lastName)} value={formData.lastName} onChange={handleInputChange} />
                        </div>

                        <input name="phone" placeholder="เบอร์โทรศัพท์ (10 หลัก)" maxLength={10} style={{...styles.input(!validation.phone && formData.phone), marginBottom:'20px', width: '100%'}} value={formData.phone} onChange={handleInputChange} />

                        <div style={styles.addressBox}>
                            <input name="houseNo" placeholder="เลขที่บ้าน, ซอย, หมู่บ้าน, ถนน" style={{...styles.input(!validation.addressDetail && formData.houseNo), marginBottom:'15px', width: '100%'}} value={formData.houseNo} onChange={handleInputChange} />
                            
                            <div style={styles.inputRow}>
                                {/* เปลี่ยนเป็น Input แทน Select */}
                                <input 
                                    name="province" 
                                    placeholder="จังหวัด" 
                                    style={styles.input(!validation.location && formData.province)} 
                                    value={formData.province} 
                                    onChange={handleInputChange} 
                                />
                                <input 
                                    name="district" 
                                    placeholder="เขต / อำเภอ" 
                                    style={styles.input(!validation.location && formData.district)} 
                                    value={formData.district} 
                                    onChange={handleInputChange} 
                                />
                            </div>

                            <div style={styles.inputRow}>
                                <input 
                                    name="subDistrict" 
                                    placeholder="แขวง / ตำบล" 
                                    style={styles.input(!validation.location && formData.subDistrict)} 
                                    value={formData.subDistrict} 
                                    onChange={handleInputChange} 
                                />
                                {/* ปลด readOnly ออกเพื่อให้ผู้ใช้กรอกเองได้ถ้า Auto-fill ไม่ทำงาน */}
                                <input 
                                    name="zipCode" 
                                    placeholder="รหัสไปรษณีย์" 
                                    maxLength={5}
                                    style={{...styles.input(false), backgroundColor:'#fff'}} 
                                    value={formData.zipCode} 
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <aside style={styles.sidebar}>
                    <div style={styles.summaryCard}>
                        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>สรุปรายการสั่งซื้อ</h3>
                        
                        <div style={{ ...styles.cartList, maxHeight: '250px', overflowY: 'auto' }}>
                           {cartItems.map((item, index) => {
                            // 1. สร้าง Key พิเศษขึ้นมาโดยรวมเอาคุณสมบัติที่ต่างกันมาต่อกัน
                            // ผลลัพธ์จะได้ประมาณนี้: "prod123-Red-L-0"
                            const uniqueKey = `${item.id}-${item.selectedColor}-${item.selectedSize}-${index}`;

                            return (
                                <div 
                                    key={uniqueKey} // 2. นำ Key ที่สร้างไว้มาใช้ตรงนี้
                                    style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}
                                >
                                    <div style={{ width: '55px', height: '55px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f5f5f7', flexShrink: 0 }}>
                                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '14px', lineHeight: '1.2' }}>{item.name}</div>
                                        <div style={{ fontSize: '12px', color: '#8e8e93' }}>
                                            x{item.quantity} | {item.selectedColor} {item.selectedSize}
                                        </div>
                                    </div>
                                    
                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                                        ฿{((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                                                </div>

                        {/* ช่องใส่คูปองส่วนลด */}
                        <div style={{ marginTop: '20px', padding: '15px 0', borderTop: `1px solid ${theme.border}` }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <LocalOfferIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: appliedCoupon ? theme.success : '#8e8e93' }} />
                                    <input 
                                        placeholder="รหัสส่วนลด" 
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value)}
                                        disabled={!!appliedCoupon}
                                        style={{ 
                                            width: '100%', padding: '10px 10px 10px 35px', 
                                            borderRadius: '8px', border: `1px solid ${appliedCoupon ? theme.success : '#d1d1d6'}`, 
                                            fontSize: '14px', backgroundColor: appliedCoupon ? '#f6fff8' : '#fff'
                                        }} 
                                    />
                                </div>
                                {appliedCoupon ? (
                                    <button onClick={() => { setAppliedCoupon(null); setDiscountCode(''); }} 
                                        style={{ padding: '0 15px', borderRadius: '8px', border: 'none', backgroundColor: '#fff0f0', color: '#ff3b30', fontWeight: '600', cursor: 'pointer' }}
                                    >ถอนออก</button>
                                ) : (
                                    <button onClick={handleApplyDiscount} disabled={couponLoading || !discountCode}
                                        style={{ padding: '0 15px', borderRadius: '8px', border: 'none', backgroundColor: theme.black, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                                    >
                                        {couponLoading ? '...' : 'ใช้โค้ด'}
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* ราคาสุดท้าย */}
                        <div style={{...styles.summaryPrices, borderTop: `1px solid ${theme.border}`, paddingTop: '15px'}}>
                            <div style={styles.priceRow}>
                                <span style={{color: theme.gray}}>ยอดรวมสินค้า</span>
                                <span>฿{subtotal.toLocaleString()}</span>
                            </div>
                            <div style={styles.priceRow}>
                                <span style={{color: theme.gray}}>ค่าจัดส่ง</span>
                                <span>{shipping === 0 ? 'ส่งฟรี' : `฿${shipping}`}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div style={{...styles.priceRow, color: theme.success}}>
                                    <span>ส่วนลด ({appliedCoupon?.code})</span>
                                    <span>-฿{discountAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div style={{...styles.totalRow, marginTop: '15px', paddingTop: '15px', borderTop: `2px solid ${theme.black}`}}>
                                <span style={{fontWeight: '700'}}>ยอดสุทธิ</span>
                                <span style={{fontSize: '22px', fontWeight: '700', color: theme.success}}>
                                    ฿{total.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <button 
                            disabled={!isFormValid || loading} 
                            onClick={handleSubmitOrder} 
                            style={{
                                ...styles.payBtn, 
                                backgroundColor: isFormValid ? theme.black : '#ccc', 
                                cursor: isFormValid ? 'pointer' : 'not-allowed', 
                                color: isFormValid ? '#fff' : '#666',
                                marginTop: '20px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '10px'
                            }}
                        >
                            {loading ? <CircularProgress size={20} color="inherit" /> : (isFormValid ? <CheckCircleIcon /> : <ErrorOutlineIcon />)}
                            {isFormValid ? 'ยืนยันสั่งซื้อและแจ้งโอน' : 'กรุณากรอกข้อมูลให้ครบ'}
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Checkout;