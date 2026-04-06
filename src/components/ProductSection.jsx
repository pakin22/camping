import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase';
import { 
    collection, addDoc, deleteDoc, doc, updateDoc, 
    serverTimestamp, query, orderBy, onSnapshot,
    writeBatch, where, getDocs, getDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Icons (Material UI)
import {
    DeleteOutline, CloudUpload, Search, AddCircleOutline, 
    AccessTime, Inventory2, Palette, Edit, Close, 
    ConfirmationNumber, LocalOffer, Category, Layers
} from '@mui/icons-material';

const SIZE_PRESETS = ['FREE SIZE', 'S', 'M', 'L', 'XL', '2XL', 'Standard', 'Large'];
const COLOR_PRESETS = [
    { name: 'ขาว', hex: '#ffffff' }, { name: 'ดำ', hex: '#000000' },
    { name: 'เทา', hex: '#8c8c8c' }, { name: 'แดง', hex: '#ff4d4f' },
    { name: 'ชมพู', hex: '#ffadd2' }, { name: 'น้ำเงิน', hex: '#1890ff' },
    { name: 'เขียว', hex: '#52c41a' }, { name: 'ครีม', hex: '#fff1b8' },
];

const styles = {
    container: { display: 'grid', gridTemplateColumns: '450px 1fr', gap: '32px', padding: '32px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: "'Prompt', sans-serif" },
    sidebar: { display: 'flex', flexDirection: 'column', gap: '24px' },
    card: { backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', padding: '28px', border: '1px solid #e2e8f0' },
    title: { fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
    label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' },
    input: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', transition: '0.2s', boxSizing: 'border-box' },
    select: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', backgroundColor: '#fff', cursor: 'pointer' },
    sizeTag: (isSelected) => ({
        padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
        border: '2px solid', borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
        backgroundColor: isSelected ? '#eff6ff' : '#fff', color: isSelected ? '#3b82f6' : '#64748b', transition: '0.2s'
    }),
    flashBox: { padding: '20px', backgroundColor: '#fff1f0', borderRadius: '16px', marginBottom: '20px', border: '1px solid #ffa39e' },
    variantRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', marginBottom: '6px', border: '1px solid #e2e8f0' },
    submitBtn: (isEdit) => ({ 
        width: '100%', padding: '16px', backgroundColor: isEdit ? '#f59e0b' : '#0f172a', 
        color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '10px', fontSize: '16px', transition: '0.3s'
    }),
    uploadArea: { height: '160px', border: '2px dashed #cbd5e0', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', overflow: 'hidden', backgroundColor: '#fcfdfe', transition: '0.3s' }
};
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
`;
    document.head.appendChild(styleTag);
    const ProductSection = () => {
        // --- Shared States ---
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [coupons, setCoupons] = useState([]);
        const [searchTerm, setSearchTerm] = useState('');

        // --- Product Form States ---
        const [editingId, setEditingId] = useState(null);
        const [name, setName] = useState('');
        const [price, setPrice] = useState('');
        const [category, setCategory] = useState('ทั่วไป');
        const [newCategoryInput, setNewCategoryInput] = useState('');
        const [selectedColors, setSelectedColors] = useState([{ name: 'ทั่วไป', hex: '#3b82f6' }]); 
        const [selectedSizes, setSelectedSizes] = useState(['FREE SIZE']);
        const [currentColor, setCurrentColor] = useState('#3b82f6');
        const [colorNameInput, setColorNameInput] = useState('');
        const [variants, setVariants] = useState([]);
        const [salePrice, setSalePrice] = useState('');
        const [saleEndDate, setSaleEndDate] = useState('');
        const [isFlashSale, setIsFlashSale] = useState(false);
        const [imageFile, setImageFile] = useState(null);
        const [previewUrl, setPreviewUrl] = useState(null);
        const [uploading, setUploading] = useState(false);

        // --- Coupon Form States ---
        const [couponCode, setCouponCode] = useState('');
        const [discountValue, setDiscountValue] = useState('');
        const [discountType, setDiscountType] = useState('fixed');
        const [couponExpiry, setCouponExpiry] = useState('');

        const toggleFlashSale = async (product) => {
        try {
            const newStatus = !product.isFlashSale;
            await updateDoc(doc(db, "products", product.id), {
                isFlashSale: newStatus,
                updatedAt: serverTimestamp()
            });
            await saveLog('TOGGLE_FLASH_SALE', `${newStatus ? 'เปิด' : 'ปิด'} Flash Sale: ${product.name}`);
        } catch (err) {
            alert("ไม่สามารถเปลี่ยนสถานะได้: " + err.message);
        }
    };

        // --- Audit Log Logic ---
        const saveLog = async (action, details) => {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const userDocRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userDocRef);
                let adminData = { firstName: "Unknown", lastName: "Admin", email: user.email, displayName: user.displayName || "Admin" };
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    adminData = { firstName: data.firstName || "Unknown", lastName: data.lastName || "", email: data.email || user.email, displayName: data.displayName || "" };
                }
                await addDoc(collection(db, "audit_logs"), {
                    action, details, ...adminData, adminId: user.uid, timestamp: serverTimestamp()
                });
            } catch (err) { console.error("Log error:", err); }
        };

        // --- Real-time Listeners ---
        useEffect(() => {
            //การดึงข้อมูลแบบ Real-time (onSnapshot)
            const unsubCat = onSnapshot(query(collection(db, "categories"), orderBy("name", "asc")), (snap) => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (list.length > 0 && !list.find(c => c.name === 'ทั่วไป')) {
                    addDoc(collection(db, "categories"), { name: 'ทั่วไป', createdAt: serverTimestamp() });
                }
                setCategories(list);
                if (list.length > 0 && !category) setCategory('ทั่วไป');
            });

            const unsubProd = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
                setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });

            const unsubCoupon = onSnapshot(query(collection(db, "coupons"), orderBy("createdAt", "desc")), (snap) => {
                setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });

            return () => { unsubCat(); unsubProd(); unsubCoupon(); };
        }, []);

        // --- Auto-Variant Generator ---
        useEffect(() => {
            setVariants(prev => {
                const newVariants = [];
                selectedColors.forEach(colorObj => {
                    selectedSizes.forEach(size => {
                        const existing = prev.find(v => v.colorHex === colorObj.hex && v.size === size);
                        newVariants.push({ 
                            color: colorObj.name, colorHex: colorObj.hex, size, 
                            stock: existing ? existing.stock : 0 
                        });
                    });
                });
                return newVariants;
            });
        }, [selectedColors, selectedSizes]);

        const handleDeleteProduct = async (id, productName) => {
        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${productName}"?`)) {
            try {
                await deleteDoc(doc(db, "products", id));
                await saveLog('DELETE_PRODUCT', `ลบสินค้า: ${productName}`);
                alert("ลบสินค้าสำเร็จ");
            } catch (err) {
                alert("ไม่สามารถลบได้: " + err.message);
            }
        }
    };

        // --- Category Actions ---
        const handleAddNewCategory = async () => {
            const val = newCategoryInput.trim();
            if (!val) return;
            try {
                await addDoc(collection(db, "categories"), { name: val, createdAt: serverTimestamp() });
                await saveLog('CREATE_CATEGORY', `เพิ่มหมวดหมู่: ${val}`);
                setNewCategoryInput('');
            } catch (err) { alert(err.message); }
        };

        const handleDeleteCategory = async (id, catName) => {
            if (catName === 'ทั่วไป') return alert("ไม่สามารถลบหมวดหมู่เริ่มต้นได้");
            if (window.confirm(`ลบหมวดหมู่ "${catName}"? สินค้าในหมวดนี้จะย้ายไปที่ "ทั่วไป"`)) {
                try {
                    const batch = writeBatch(db);
                    const q = query(collection(db, "products"), where("category", "==", catName));
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach((productDoc) => {
                        batch.update(doc(db, "products", productDoc.id), { category: 'ทั่วไป', updatedAt: serverTimestamp() });
                    });
                    batch.delete(doc(db, "categories", id));
                    await batch.commit();
                    await saveLog('DELETE_CATEGORY', `ลบหมวดหมู่: ${catName} ย้ายสินค้า ${querySnapshot.size} ชิ้น`);
                } catch (err) { alert(err.message); }
            }
        };

        // --- Product Form Actions ---
        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!previewUrl && !imageFile) return alert("กรุณาเลือกรูปภาพ");
            setUploading(true);
            try {
                let finalImageUrl = previewUrl;
                if (imageFile) {
                    const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
                    await uploadBytes(storageRef, imageFile);
                    finalImageUrl = await getDownloadURL(storageRef);
                }

                const productData = {
                    name, category, price: Number(price) || 0,
                    salePrice: salePrice ? Number(salePrice) : null,
                    saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
                    isFlashSale, imageUrl: finalImageUrl, variants, updatedAt: serverTimestamp()
                };

                if (editingId) {
                    await updateDoc(doc(db, "products", editingId), productData);
                    await saveLog('UPDATE_PRODUCT', `แก้ไข: ${name}`);
                } else {
                    productData.createdAt = serverTimestamp();
                    await addDoc(collection(db, "products"), productData);
                    await saveLog('CREATE_PRODUCT', `เพิ่ม: ${name}`);
                }
                resetForm();
                alert("บันทึกสำเร็จ");
            } catch (err) { alert(err.message); } finally { setUploading(false); }
        };

        const resetForm = () => {
            setEditingId(null); setName(''); setPrice(''); setCategory('ทั่วไป');
            setSalePrice(''); setSaleEndDate(''); setIsFlashSale(false);
            setSelectedColors([]); setSelectedSizes(['FREE SIZE']); setVariants([]);
            setImageFile(null); setPreviewUrl(null);
        };

        const startEdit = (product) => {
        setEditingId(product.id);
        setName(product.name);
        setCategory(product.category);
        setPrice(product.price);
        setSalePrice(product.salePrice || '');
        setSaleEndDate(product.saleEndDate ? new Date(product.saleEndDate.seconds * 1000).toISOString().slice(0, 16) : '');
        setIsFlashSale(product.isFlashSale || false);
        setPreviewUrl(product.imageUrl);
        
        // --- จุดสำคัญ: ดึงสีและไซส์จาก variants กลับมาเข้า State ---
        const colors = []; 
        const sizes = [];
        
        if (product.variants && product.variants.length > 0) {
            product.variants.forEach(v => {
                // เก็บสีที่ไม่ซ้ำกัน
                if (!colors.find(c => c.hex === v.colorHex)) {
                    colors.push({ name: v.color, hex: v.colorHex });
                }
                // เก็บไซส์ที่ไม่ซ้ำกัน
                if (!sizes.includes(v.size)) {
                    sizes.push(v.size);
                }
            });
            setSelectedColors(colors);
            setSelectedSizes(sizes);
            setVariants(product.variants); // ใส่ข้อมูลสต็อกกลับเข้าไป
        } else {
            // ถ้าสินค้าไม่มี variants ให้ตั้งค่า default ไว้ป้องกันช่องหาย
            setSelectedColors([{ name: 'ทั่วไป', hex: '#3b82f6' }]);
            setSelectedSizes(['FREE SIZE']);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

        const handleSelectPresetColor = (preset) => {
            const isExist = selectedColors.find(c => c.hex === preset.hex);
            if (isExist) setSelectedColors(selectedColors.filter(c => c.hex !== preset.hex));
            else setSelectedColors([...selectedColors, preset]);
        };

        const handleAddCustomColor = () => {
            const cName = colorNameInput.trim() || currentColor.toUpperCase();
            if (selectedColors.find(c => c.hex === currentColor)) return alert("สีนี้มีอยู่แล้ว");
            setSelectedColors([...selectedColors, { name: cName, hex: currentColor }]);
            setColorNameInput('');
        };

        const handleAddCoupon = async () => {
            const code = couponCode.trim().toUpperCase();
            if (!code || !discountValue || !couponExpiry) return alert("กรุณากรอกข้อมูลให้ครบ");
            try {
                await addDoc(collection(db, "coupons"), {
                    code, discountValue: Number(discountValue), discountType,
                    expiryDate: new Date(couponExpiry), isActive: true, createdAt: serverTimestamp()
                });
                await saveLog('CREATE_COUPON', `สร้างคูปอง: ${code}`);
                setCouponCode(''); setDiscountValue(''); setCouponExpiry('');
            } catch (err) { alert(err.message); }
        };

        const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div style={styles.container}>
                <aside style={styles.sidebar}>
                    {/* Category & Coupon Mini Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        <div style={styles.card}>
                            <h2 style={styles.title}><Category color="primary"/> หมวดหมู่</h2>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                                <input type="text" placeholder="ชื่อหมวดหมู่..." value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} style={styles.input} />
                                <button onClick={handleAddNewCategory} style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}><AddCircleOutline /></button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {categories.map(cat => (
                                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f1f5f9', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>
                                        {cat.name} {cat.name !== 'ทั่วไป' && <DeleteOutline onClick={() => handleDeleteCategory(cat.id, cat.name)} style={{ fontSize: '16px', color: '#ef4444', cursor: 'pointer' }} />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={styles.card}>
                            <h2 style={styles.title}><ConfirmationNumber style={{ color: '#f59e0b' }}/> คูปองส่วนลด</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input type="text" placeholder="รหัสคูปอง (เช่น SUMMER50)" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} style={styles.input} />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="number" placeholder="ส่วนลด" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} style={{ ...styles.input, flex: 1 }} />
                                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} style={{ ...styles.select, width: '100px' }}>
                                        <option value="fixed">฿ (บาท)</option>
                                        <option value="percent">% (เปอร์เซ็นต์)</option>
                                    </select>
                                </div>
                                <input type="date" value={couponExpiry} onChange={(e) => setCouponExpiry(e.target.value)} style={styles.input} />
                                <button onClick={handleAddCoupon} style={{ ...styles.submitBtn(false), padding: '12px', marginTop: '5px' }}>สร้างคูปอง</button>
                            </div>
                            <div style={{ marginTop: '15px', maxHeight: '120px', overflowY: 'auto' }}>
                                {coupons.map(cp => (
                                    <div key={cp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', fontSize: '12px', border: '1px solid #e2e8f0', marginBottom: '6px' }}>
                                        <div><strong style={{ color: '#3b82f6' }}>{cp.code}</strong> (ลด {cp.discountValue}{cp.discountType === 'percent' ? '%' : '฿'})</div>
                                        <DeleteOutline onClick={async () => {
                                            if(window.confirm(`ลบคูปอง ${cp.code}?`)) {
                                                await deleteDoc(doc(db, "coupons", cp.id));
                                                await saveLog('DELETE_COUPON', `ลบคูปอง: ${cp.code}`);
                                            }
                                        }} style={{ color: '#ef4444', cursor: 'pointer', fontSize: '18px' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Product Form */}
                    <div style={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={styles.title}>{editingId ? <Edit/> : <AddCircleOutline/>} {editingId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
                            {editingId && <Close onClick={resetForm} style={{ cursor: 'pointer', color: '#64748b' }} />}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={styles.label}>ชื่อสินค้า</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={styles.label}>หมวดหมู่</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
                                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div><label style={styles.label}>ราคาปกติ (฿)</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={styles.input} required /></div>
                                <div><label style={{ ...styles.label, color: '#ef4444' }}>ราคาโปรโมชั่น (฿)</label><input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} style={styles.input} /></div>
                            </div>
                            
                            <div style={styles.flashBox}>
                                <label style={{ ...styles.label, color: '#cf1322', display: 'flex', alignItems: 'center', gap: '5px' }}><AccessTime fontSize="small" /> ตั้งค่า Flash Sale</label>
                                <input type="datetime-local" value={saleEndDate} onChange={(e) => setSaleEndDate(e.target.value)} style={{ ...styles.input, backgroundColor: '#fff', marginBottom: '12px' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input type="checkbox" id="flash_active" checked={isFlashSale} onChange={(e) => setIsFlashSale(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                    <label htmlFor="flash_active" style={{ fontSize: '14px', fontWeight: '700', color: '#cf1322', cursor: 'pointer' }}>เปิดใช้งาน Flash Sale</label>
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={styles.label}><Palette fontSize="inherit" /> เลือกสีและไซส์ที่วางขาย</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                    {COLOR_PRESETS.map((p) => (
                                        <div key={p.hex} onClick={() => handleSelectPresetColor(p)} style={styles.sizeTag(selectedColors.find(c => c.hex === p.hex))}>
                                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: p.hex, marginRight: '5px', border: '1px solid #ddd' }}></span>
                                            {p.name}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                                    <input type="color" value={currentColor} onChange={(e) => setCurrentColor(e.target.value)} style={{ width: '45px', height: '45px', border: 'none', padding: '0', cursor: 'pointer', backgroundColor: 'transparent' }} />
                                    <input type="text" placeholder="ชื่อสีใหม่..." value={colorNameInput} onChange={(e) => setColorNameInput(e.target.value)} style={{ ...styles.input, flex: 1 }} />
                                    <button type="button" onClick={handleAddCustomColor} style={{ padding: '0 15px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>เพิ่ม</button>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {SIZE_PRESETS.map(s => (
                                        <div key={s} onClick={() => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} style={styles.sizeTag(selectedSizes.includes(s))}>{s}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Variants Stock Input (ครบถ้วน) */}
                            {variants.length > 0 && (
                                <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <label style={styles.label}><Layers fontSize="inherit" /> จัดการสต็อก ({variants.length} รายการย่อย)</label>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                                        {variants.map((v, idx) => (
                                            <div key={idx} style={styles.variantRow}>
                                                <span style={{ fontSize: '13px', fontWeight: '500' }}>{v.color} / {v.size}</span>
                                                <input type="number" placeholder="สต็อก" value={v.stock} onChange={(e) => {
                                                    const newV = [...variants];
                                                    newV[idx].stock = Number(e.target.value);
                                                    setVariants(newV);
                                                }} style={{ ...styles.input, width: '80px', padding: '6px 10px' }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '20px' }}>
                                <label style={styles.label}>รูปภาพสินค้า</label>
                                <div style={styles.uploadArea} onClick={() => document.getElementById('fileIn').click()}>
                                    {previewUrl ? <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (
                                        <>
                                            <CloudUpload style={{ color: '#94a3b8', fontSize: '40px' }} />
                                            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>คลิกเพื่ออัปโหลดรูปภาพ</p>
                                        </>
                                    )}
                                    <input id="fileIn" type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f) { setImageFile(f); setPreviewUrl(URL.createObjectURL(f)); } }} style={{ display: 'none' }} />
                                </div>
                            </div>
                            <button type="submit" disabled={uploading} style={styles.submitBtn(editingId)}>{uploading ? 'กำลังบันทึกข้อมูล...' : (editingId ? 'อัปเดตข้อมูลสินค้า' : 'บันทึกสินค้าใหม่')}</button>
                        </form>
                    </div>
                </aside>

                <main>
                    <div style={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <div>
                                <h2 style={{ ...styles.title, marginBottom: '5px' }}><Inventory2 /> คลังสินค้าทั้งหมด</h2>
                                <p style={{ fontSize: '13px', color: '#64748b' }}>รายการสินค้าทั้งหมดที่มีอยู่ในระบบ</p>
                            </div>
                            <div style={{ position: 'relative', width: '350px' }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" placeholder="ค้นหาชื่อสินค้า..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...styles.input, paddingLeft: '40px', backgroundColor: '#f8fafc' }} />
                            </div>
                        </div>
                        
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                    <th style={{ padding: '15px', color: '#64748b', fontSize: '13px' }}>ข้อมูลสินค้า</th>
                                    <th style={{ padding: '15px', color: '#64748b', fontSize: '13px' }}>ราคา</th>
                                    <th style={{ padding: '15px', color: '#64748b', fontSize: '13px' }}>สต็อกรวม</th>
                                    <th style={{ padding: '15px', color: '#64748b', fontSize: '13px' }} align="right">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(item => {
                                    const totalStock = item.variants?.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) || 0;
                                    
                                    // เช็คว่า Flash Sale กำลังทำงานอยู่จริง (สถานะเปิด และ เวลายังไม่หมด)
                                    const isFlashActive = item.isFlashSale && item.saleEndDate && new Date(item.saleEndDate.seconds * 1000) > new Date();

                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s', backgroundColor: isFlashActive ? '#fff1f0' : 'transparent' }}>
                                            <td style={{ padding: '15px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <img src={item.imageUrl} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} alt="" />
                                                        {isFlashActive && (
                                                            <div style={{ position: 'absolute', top: '-5px', left: '-5px', background: '#ff4d4f', color: '#fff', borderRadius: '50%', padding: '4px', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                                                <AccessTime style={{ fontSize: '12px' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {item.name}
                                                            {isFlashActive && <span style={{ fontSize: '10px', backgroundColor: '#ff4d4f', color: '#fff', padding: '2px 6px', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}>FLASH SALE</span>}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '5px', display: 'inline-block', marginTop: '4px' }}>{item.category}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                {/* แสดงราคา Flash Sale ให้เด่นชัดถ้า Active */}
                                                <div style={{ fontWeight: '700', color: isFlashActive ? '#ff4d4f' : '#0f172a', fontSize: '16px' }}>
                                                    ฿{(isFlashActive && item.salePrice ? item.salePrice : item.price).toLocaleString()}
                                                </div>
                                                {isFlashActive && item.salePrice && <div style={{ fontSize: '12px', color: '#64748b', textDecoration: 'line-through' }}>฿{item.price.toLocaleString()}</div>}
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{ padding: '6px 12px', backgroundColor: totalStock > 0 ? '#f0fdf4' : '#fef2f2', color: totalStock > 0 ? '#16a34a' : '#dc2626', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
                                                    {totalStock} ชิ้น
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px' }} align="right">
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {/* ปุ่ม Quick Flash Sale */}
                                                    <button 
                                                        onClick={() => toggleFlashSale(item)}
                                                        title="เปิด/ปิด Flash Sale ทันที"
                                                        style={{ 
                                                            border: 'none', 
                                                            background: item.isFlashSale ? '#ff4d4f' : '#f1f5f9', 
                                                            color: item.isFlashSale ? '#fff' : '#64748b', 
                                                            padding: '10px', 
                                                            borderRadius: '12px', 
                                                            cursor: 'pointer', 
                                                            display: 'flex',
                                                            transition: '0.3s'
                                                        }}
                                                    >
                                                        <AccessTime fontSize="small"/>
                                                    </button>

                                                    <button onClick={() => startEdit(item)} style={{ border: 'none', background: '#eff6ff', color: '#3b82f6', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}><Edit fontSize="small"/></button>
                                                <button 
                                                        onClick={() => handleDeleteProduct(item.id, item.name)} 
                                                        style={{ border: 'none', background: '#fff1f0', color: '#ef4444', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                                                    >
                                                        <DeleteOutline fontSize="small"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <Inventory2 style={{ fontSize: '48px', opacity: 0.2 }} />
                                <p style={{ marginTop: '10px' }}>ไม่พบรายการสินค้าที่ค้นหา</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    };

export default ProductSection;