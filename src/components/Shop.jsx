import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

// --- Styles ---
const colors = {
    background: '#ffffff',
    lightGray: '#f8f8f9',
    black: '#000000',
    textSecondary: '#6e6e73',
    accent: '#000000',
    border: '#e5e5e7',
    error: '#ff4d4f',
    saleBg: '#fff1f0',
    flashSaleGradient: 'linear-gradient(90deg, #ff4d4f 0%, #ff7875 100%)'
};

const styles = {
    wrapper: { backgroundColor: colors.background, minHeight: '100vh', fontFamily: "'Prompt', sans-serif" },
    flashBanner: {
        backgroundColor: '#ff4d4f',
        backgroundImage: colors.flashSaleGradient,
        color: '#fff',
        padding: '12px 20px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        fontSize: '15px',
        fontWeight: '600',
        position: 'fixed',
        top: '70px',
        left: 0,
        right: 0,
        zIndex: 90,
        boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)',
        animation: 'pulse 2s infinite'
    },
    mainLayout: { display: 'flex', maxWidth: '1400px', margin: '0 auto', padding: '160px 40px 60px', gap: '60px' },
    sidebar: { width: '240px', flexShrink: 0, position: 'sticky', top: '160px', height: 'fit-content' },
    filterTitle: { fontSize: '12px', fontWeight: '700', marginBottom: '20px', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '1.5px' },
    filterItem: (isActive) => ({
        fontSize: '15px', padding: '12px 16px', marginBottom: '4px', cursor: 'pointer',
        color: isActive ? colors.black : colors.textSecondary,
        backgroundColor: isActive ? colors.lightGray : 'transparent',
        transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', border: 'none',
        borderRadius: '8px', textAlign: 'left', width: '100%', fontWeight: isActive ? '600' : '400',
        borderLeft: isActive ? `3px solid ${colors.black}` : '3px solid transparent',
    }),
    contentArea: { flexGrow: 1 },
    headerSection: { 
        marginBottom: '40px', 
        padding: '30px', 
        borderRadius: '20px', 
        backgroundColor: colors.lightGray,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    productListGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '40px 24px' },
    imageWrapper: { aspectRatio: '1/1', overflow: 'hidden', backgroundColor: colors.lightGray, borderRadius: '16px', marginBottom: '20px', position: 'relative', border: `1px solid ${colors.border}` },
    cardImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s cubic-bezier(0.2, 1, 0.3, 1)' },
    productName: { fontSize: '18px', fontWeight: '600', margin: '0 0 6px 0' },
    saleBadge: { position: 'absolute', top: '15px', left: '15px', backgroundColor: colors.error, color: '#fff', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' },
    favoriteBtn: (isHovered) => ({ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', zIndex: 50, transform: isHovered ? 'scale(1.1)' : 'scale(1)', transition: '0.2s' }),
    detailButton: (isHovered) => ({ marginTop: '20px', width: '100%', padding: '14px', backgroundColor: colors.black, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: '0.3s', transform: isHovered ? 'translateY(-2px)' : 'none' }),
};

// --- Helpers ---
const isSaleActive = (endDate) => {
    if (!endDate) return false;
    const now = new Date();
    const end = endDate.seconds ? new Date(endDate.seconds * 1000) : new Date(endDate);
    return end > now;
};

// --- Sub-Component: CountdownTimer ---
const CountdownTimer = ({ endDate, showLabel = false }) => {
    const calculateTimeLeft = () => {
        const end = endDate?.seconds ? new Date(endDate.seconds * 1000) : new Date(endDate);
        const diff = +end - +new Date();
        if (diff <= 0) return null;
        return {
            h: Math.floor(diff / (1000 * 60 * 60)),
            m: Math.floor((diff / 1000 / 60) % 60),
            s: Math.floor((diff / 1000) % 60)
        };
    };
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [endDate]);

    if (!timeLeft) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {showLabel && <span>สิ้นสุดใน:</span>}
            <div style={{ display: 'flex', gap: '4px', fontWeight: '700' }}>
                <span style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{String(timeLeft.h).padStart(2, '0')}</span>:
                <span style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{String(timeLeft.m).padStart(2, '0')}</span>:
                <span style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{String(timeLeft.s).padStart(2, '0')}</span>
            </div>
        </div>
    );
};

// --- Sub-Component: ProductCard ---
const ProductCard = ({ product, isFavorite, onToggleFavorite }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const activeFlashSale = product.isFlashSale && isSaleActive(product.saleEndDate);
    const displayPrice = activeFlashSale ? product.salePrice : product.price;

    return (
        <div style={{ cursor: 'pointer', position: 'relative' }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={() => navigate(`/product/${product.id}`)}>
            {activeFlashSale && (
                <div style={styles.saleBadge}><FlashOnIcon style={{ fontSize: '16px' }} /> FLASH SALE</div>
            )}
            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(product); }} style={styles.favoriteBtn(isHovered)}>
                {isFavorite ? <FavoriteIcon style={{ color: colors.error }} /> : <FavoriteBorderIcon />}
            </button>
            <div style={styles.imageWrapper}>
                <img src={product.imageUrl} alt={product.name} style={{ ...styles.cardImage, transform: isHovered ? 'scale(1.05)' : 'scale(1)' }} />
                {activeFlashSale && (
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'center' }}>
                         <div style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '8px', color: '#fff', fontSize: '11px', backdropFilter: 'blur(4px)' }}>
                            <CountdownTimer endDate={product.saleEndDate} />
                         </div>
                    </div>
                )}
            </div>
            <h3 style={styles.productName}>{product.name}</h3>
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>{product.category}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: activeFlashSale ? colors.error : colors.black }}>฿{displayPrice?.toLocaleString()}</span>
                {activeFlashSale && <span style={{ textDecoration: 'line-through', color: colors.textSecondary, fontSize: '14px' }}>฿{product.price?.toLocaleString()}</span>}
            </div>
            <button style={styles.detailButton(isHovered)}>ดูรายละเอียดสินค้า</button>
        </div>
    );
};

// --- Main Component: Shop ---
function Shop({ user, cart, favorites, toggleFavorite, onSignOut, removeFromCart, updateQuantity, addToCart }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); // เริ่มต้นด้วย Array ว่าง
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(''); // เริ่มต้นด้วย String ว่าง
    const [selectedPrice, setSelectedPrice] = useState('ทั้งหมด');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. ดึงหมวดหมู่
                const catSnap = await getDocs(query(collection(db, "categories"), orderBy("name", "asc")));
                const catList = catSnap.docs.map(doc => doc.data().name);
                
                if (catList.length > 0) {
                    setCategories(catList);
                    setSelectedCategory(catList[0]); // ตั้งค่าเริ่มต้นเป็นหมวดหมู่แรกที่เจอ
                }
                const finalCategories = ["ทั้งหมด", ...catList]; 
                setCategories(finalCategories);
                setSelectedCategory("ทั้งหมด"); // ให้เริ่มต้นที่หมวดหมู่ "ทั้งหมด"

                // 2. ดึงสินค้า
                const prodSnap = await getDocs(collection(db, "products"));
                const prodList = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const sortedProducts = prodList.sort((a, b) => {
                    const aActive = a.isFlashSale && isSaleActive(a.saleEndDate);
                    const bActive = b.isFlashSale && isSaleActive(b.saleEndDate);
                    return bActive - aActive;
                });
                
                setProducts(sortedProducts);
            } catch (err) { 
                console.error("Shop fetchData Error:", err); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, []);

    const flashSaleProducts = products.filter(p => p.isFlashSale && isSaleActive(p.saleEndDate));
    const hasActiveFlashSale = flashSaleProducts.length > 0;
    const nearestEndDate = hasActiveFlashSale 
        ? flashSaleProducts.sort((a,b) => (a.saleEndDate.seconds || 0) - (b.saleEndDate.seconds || 0))[0].saleEndDate 
        : null;

        const filteredProducts = products.filter(p => {
    // แก้ไขบรรทัดนี้: ถ้า selectedCategory คือ "ทั้งหมด" ให้เป็น true เสมอ
    const matchCat = selectedCategory === "ทั้งหมด" || p.category === selectedCategory;
    
    // เงื่อนไขราคาและการค้นหา (โค้ดเดิมของคุณ)
    const currentPrice = (p.isFlashSale && isSaleActive(p.saleEndDate)) ? p.salePrice : p.price;
    let matchPrice = true;
    if (selectedPrice === 'ต่ำกว่า ฿1,000') matchPrice = currentPrice < 1000;
    else if (selectedPrice === '฿1,000 - ฿5,000') matchPrice = currentPrice >= 1000 && currentPrice <= 5000;
    else if (selectedPrice === 'สูงกว่า ฿5,000') matchPrice = currentPrice > 5000;

    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCat && matchPrice && matchSearch;
});

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', fontFamily: 'Prompt' }}>กำลังเตรียมอุปกรณ์...</div>;

    return (
        <div style={styles.wrapper}>
            <Navbar user={user} onSignOut={onSignOut} cart={cart} favorites={favorites} toggleFavorite={toggleFavorite} removeFromCart={removeFromCart} updateQuantity={updateQuantity} addToCart={addToCart} />
            
            {hasActiveFlashSale && (
                <div style={styles.flashBanner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LocalFireDepartmentIcon />
                        <span>FLASH SALE กำลังเริ่ม! ลดสูงสุดเป็นประวัติการณ์</span>
                    </div>
                    <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
                    <CountdownTimer endDate={nearestEndDate} showLabel={true} />
                </div>
            )}

            <div style={{...styles.mainLayout, paddingTop: hasActiveFlashSale ? '160px' : '100px'}}>
                <aside style={{...styles.sidebar, top: hasActiveFlashSale ? '160px' : '100px'}}>
                    <h2 style={styles.filterTitle}>หมวดหมู่</h2>
                    
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} style={styles.filterItem(selectedCategory === cat)}>{cat}</button>
                    ))}
                    <h2 style={{ ...styles.filterTitle, marginTop: '40px' }}>ราคา</h2>
                    {['ทั้งหมด', 'ต่ำกว่า ฿1,000', '฿1,000 - ฿5,000', 'สูงกว่า ฿5,000'].map(p => (
                        <button key={p} onClick={() => setSelectedPrice(p)} style={styles.filterItem(selectedPrice === p)}>{p}</button>
                    ))}
                </aside>

                <main style={styles.contentArea}>
                    <div style={styles.headerSection}>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>{selectedCategory}</h1>
                            <p style={{ color: colors.textSecondary, margin: '5px 0 0' }}>พบสินค้าทั้งหมด {filteredProducts.length} รายการ</p>
                        </div>

                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
                            <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                                <input 
                                    type="text" 
                                    placeholder="ค้นหาอุปกรณ์แคมป์ปิ้ง..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        border: `1px solid ${colors.border}`,
                                        fontSize: '15px',
                                        outline: 'none',
                                        backgroundColor: '#fff',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = colors.black}
                                    onBlur={(e) => e.target.style.borderColor = colors.border}
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', fontSize: '18px' }}
                                    >✕</button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div style={styles.productListGrid}>
                        {filteredProducts.map(p => (
                            <ProductCard key={p.id} product={p} isFavorite={favorites.some(f => f.id === p.id)} onToggleFavorite={toggleFavorite} />
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '100px 0', color: colors.textSecondary }}>
                            <p>ไม่พบสินค้าในหมวดหมู่หรือช่วงราคาที่เลือก</p>
                        </div>
                    )}
                </main>
            </div>

            <style>
                {`
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.95; }
                        100% { opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
}

export default Shop;