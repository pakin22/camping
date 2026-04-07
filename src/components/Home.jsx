import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase'; 
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import Navbar from './Navbar';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade, Navigation } from 'swiper/modules';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const colors = { bg: '#ffffff', black: '#000000', gray: '#666666', border: '#e5e5e7', gold: '#af9164', error: '#ff4d4f' };

// --- Helpers (ยกมาจากหน้า Shop) ---
const isSaleActive = (endDate) => {
    if (!endDate) return false;
    const now = new Date();
    const end = endDate.seconds ? new Date(endDate.seconds * 1000) : new Date(endDate);
    return end > now;
};

const styles = {
    wrapper: { backgroundColor: colors.bg, minHeight: '100vh', fontFamily: "'Prompt', sans-serif", color: colors.black, overflowX: 'hidden' },
    heroContainer: { width: '100%', height: '85vh', backgroundColor: colors.black, position: 'relative', zIndex: 1 },
    slide: { position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    heroImage: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, opacity: '0.7', zIndex: 1 },
    heroContent: { position: 'relative', zIndex: 10, textAlign: 'center', color: 'white', padding: '0 20px' },
    heroSub: { fontSize: '14px', letterSpacing: '5px', textTransform: 'uppercase', marginBottom: '20px', fontWeight: '500', display: 'block' },
    heroTitle: { fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: '700', lineHeight: '1.1', marginBottom: '40px', letterSpacing: '-1px' },
    ctaButton: { padding: '16px 42px', backgroundColor: 'white', color: 'black', border: 'none', borderRadius: '40px', fontSize: '14px', fontWeight: '600', letterSpacing: '1px', cursor: 'pointer', transition: '0.3s ease' },
    sectionTitleWrapper: { padding: '80px 40px 40px 40px', maxWidth: '1440px', margin: '0 auto', textAlign: 'center' },
    sectionLabel: { fontSize: '12px', fontWeight: '700', color: colors.gold, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px', display: 'block' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '40px 20px', maxWidth: '1440px', margin: '0 auto', padding: '0 40px 120px 40px' },
    cardContainer: { cursor: 'pointer', position: 'relative' },
    imageWrapper: { aspectRatio: '1/1', overflow: 'hidden', backgroundColor: '#f5f5f5', marginBottom: '18px', position: 'relative', borderRadius: '12px' },
    saleBadge: { position: 'absolute', top: '15px', left: '15px', backgroundColor: colors.error, color: '#fff', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' },
    addButton: (isHovered) => ({ marginTop: '15px', width: '100%', padding: '12px', backgroundColor: colors.black, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: '0.3s ease', transform: isHovered ? 'translateY(-3px)' : 'none', boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.15)' : 'none' })
};

const ProductCard = ({ product, onAddToCart, isFavorite, onToggleFavorite }) => {
    const [isHover, setIsHover] = useState(false);
    const activeFlashSale = product.isFlashSale && isSaleActive(product.saleEndDate);
    const displayPrice = activeFlashSale ? product.salePrice : product.price;

    return (
        <div style={styles.cardContainer} onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
            {/* Flash Sale Badge */}
            {activeFlashSale && (
                <div style={styles.saleBadge}><FlashOnIcon style={{ fontSize: '16px' }} /> FLASH SALE</div>
            )}

            <div style={styles.imageWrapper}>
                <img src={product.imageUrl || 'https://via.placeholder.com/500'} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease', transform: isHover ? 'scale(1.08)' : 'scale(1)' }} />
                
                <button
                    //stopPropagation คือสั่งให้หยุดไม่ให้มันทะลุไปหน้ารายละเอียดสินค้า
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(product); }}
                    style={{
                        position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fff', border: 'none', borderRadius: '50%', 
                        width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.15)', zIndex: 10, transition: 'transform 0.2s ease', 
                        transform: isHover ? 'scale(1.1)' : 'scale(1)'
                    }}
                >
                    {isFavorite ? <FavoriteIcon style={{ fontSize: '20px', color: '#ff4d4f' }} /> : <FavoriteBorderIcon style={{ fontSize: '20px', color: '#000' }} />}
                </button>
            </div>
            
            <div style={{ padding: '0 4px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>{product.name}</h3>
                <p style={{ fontSize: '14px', color: colors.gray, marginBottom: '10px' }}>{product.category || 'Gear'}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <p style={{ fontSize: '18px', fontWeight: '700', color: activeFlashSale ? colors.error : colors.black }}>฿{displayPrice?.toLocaleString()}</p>
                    {activeFlashSale && <span style={{ textDecoration: 'line-through', color: '#bbb', fontSize: '13px' }}>฿{product.price?.toLocaleString()}</span>}
                </div>
                
                <button onClick={(e) => { e.stopPropagation(); onAddToCart(product); }} style={styles.addButton(isHover)}>ดูรายละเอียดสินค้า</button>
            </div>
        </div>
    );
};

function Home({ user, cart, addToCart, removeFromCart, updateQuantity, favorites, toggleFavorite }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // ดึงสินค้าจริงจาก Firestore (จำกัด 8 ชิ้นสำหรับหน้า Home)
                const prodSnap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc"), limit(12)));
                const prodList = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // จัดเรียง Flash Sale ขึ้นก่อนเหมือนหน้า Shop
                const sorted = prodList.sort((a, b) => {
                    const aActive = a.isFlashSale && isSaleActive(a.saleEndDate);
                    const bActive = b.isFlashSale && isSaleActive(b.saleEndDate);
                    return bActive - aActive;
                });

                setProducts(sorted);
            } catch (error) {
                console.error("Error fetching products for Home:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Prompt' }}>LOADING...</div>;

    return (
        <div style={styles.wrapper}>
            <Navbar user={user} onSignOut={() => signOut(auth)} cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} favorites={favorites} toggleFavorite={toggleFavorite} addToCart={addToCart} /> 
            
            {/* Hero Slider ส่วนเดิม */}
            <Swiper modules={[Autoplay, Pagination, EffectFade, Navigation]} effect="fade" navigation autoplay={{ delay: 5000 }} pagination={{ clickable: true }} loop style={styles.heroContainer}>
                <SwiperSlide>
                    <div style={styles.slide}>
                        <img src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2000" style={styles.heroImage} alt="hero" />
                        <div style={styles.heroContent}>
                            <span style={styles.heroSub}>Winter Collection 2026</span>
                            <h1 style={styles.heroTitle}>EXPLORE THE <br/> UNKNOWN</h1>
                            <button style={styles.ctaButton}>SHOP COLLECTION</button>
                        </div>
                    </div>
                </SwiperSlide>
            </Swiper>

            <div style={styles.sectionTitleWrapper}>
                <span style={styles.sectionLabel}>Adventure Awaits</span>
                <h2 style={{ fontSize: '36px', fontWeight: '700', margin: 0 }}>NEW ARRIVALS</h2>
            </div>

            <main>
                <div style={styles.grid}>
                    {products.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            onAddToCart={addToCart} 
                            isFavorite={favorites.some(fav => fav.id === product.id)}
                            onToggleFavorite={toggleFavorite}
                        />
                    ))}
                </div>
            </main>
            
            <footer style={{ borderTop: `1px solid ${colors.border}`, padding: '80px 40px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>CAMPGEAR®</h2>
                <div style={{ fontSize: '12px', color: '#bbb' }}>© 2026 CAMPGEAR PREMIER CO.</div>
            </footer>
        </div>
    );
}

export default Home;