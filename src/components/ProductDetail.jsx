import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, storage } from '../firebase'; 
import { 
    doc, getDoc, collection, addDoc, serverTimestamp, 
    query, where, getDocs, orderBy, deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navbar from './Navbar';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'; 
import { Star, X, Camera } from 'lucide-react'; 

const ProductDetail = ({ user, addToCart, favorites, toggleFavorite, cart, removeFromCart, updateQuantity }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation(); 
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');

    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [reviewImages, setReviewImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    // --- ตรวจสอบสถานะ Flash Sale ---
    const isFlashSaleActive = useMemo(() => {
        //ถ้า ไม่มี ข้อมูลสินค้า หรือ สินค้านี้ ไม่ใช่ รายการ Flash Sale หรือ ไม่ได้ระบุ
        if (!product || !product.isFlashSale || !product.saleEndDate) return false;
        
        const now = new Date();
        const endDate = product.saleEndDate.toDate ? product.saleEndDate.toDate() : new Date(product.saleEndDate);
        return now < endDate;
    }, [product]);

    // --- คำนวณราคาปัจจุบัน ---
    const currentPrice = useMemo(() => {
        if (!product) return 0;
        return isFlashSaleActive ? (product.salePrice || product.price) : product.price;
    }, [product, isFlashSaleActive]);

    useEffect(() => {
        const fetchUserRole = async () => {
            if (!user?.uid) {
                setCurrentUserRole(null);
                return;
            }
            if (user.role) {
                setCurrentUserRole(user.role);
                return;
            }
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setCurrentUserRole(userDoc.data().role);
                }
            } catch (error) {
                console.error("Error fetching role:", error);
            }
        };
        fetchUserRole();
    }, [user]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, "products", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                } else {
                    navigate('/shop');
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    const fetchReviews = async () => {
        try {
            const q = query(
                collection(db, "reviews"),
                where("productId", "==", id),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const reviewData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReviews(reviewData);

            if (reviewData.length > 0) {
                const total = reviewData.reduce((acc, curr) => acc + curr.rating, 0);
                setAverageRating((total / reviewData.length).toFixed(1));
            } else {
                setAverageRating(0);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    useEffect(() => {
        if (id) fetchReviews();
    }, [id]);

    //ลบรีวิว
    const handleDeleteReview = async (reviewId) => {
        if (window.confirm("คุณแน่ใจใช่ไหมที่จะลบรีวิวนี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
            try {
                await deleteDoc(doc(db, "reviews", reviewId));
                alert("ลบรีวิวเรียบร้อยแล้ว");
                fetchReviews();
            } catch  {
                alert("เกิดข้อผิดพลาด");
            }
        }
    };

    useEffect(() => {
        if (location.state?.autoOpenReview) {
            setIsReviewOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    //พิมข้อความรีวิว
    const handleReviewSubmit = async () => {
        if (!comment.trim()) return alert("กรุณาพิมพ์ข้อความรีวิว");
        setSubmitting(true);
        try {
            let imageUrls = [];
            for (const file of reviewImages) {
                const imgRef = ref(storage, `reviews/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(imgRef, file);
                const url = await getDownloadURL(snapshot.ref);
                imageUrls.push(url);
            }

            await addDoc(collection(db, "reviews"), {
                productId: id,
                userId: user?.uid || 'anonymous',
                userName: user?.displayName || 'ลูกค้าทั่วไป',
                rating,
                comment,
                images: imageUrls,
                createdAt: serverTimestamp(),
            });

            alert("ขอบคุณสำหรับรีวิวของคุณ!");
            setIsReviewOpen(false);
            setComment("");
            setReviewImages([]);
            setRating(5);
            fetchReviews();
        } catch  {
            alert("เกิดข้อผิดพลาดในการส่งรีวิว");
        } finally {
            setSubmitting(false);
        }
    };

    // --- Helpers ---
    const colorOptions = useMemo(() => {
        if (!product?.variants) return [];
        return Array.from(
            new Map(
                product.variants
                    .filter(v => v.color)
                    .map(v => [v.color, { name: v.color, hex: v.colorHex || '#e5e5e7' }])
            ).values()
        );
    }, [product]);

    const availableSizes = product?.variants?.filter(v => v.color === selectedColor && v.stock > 0).map(v => v.size) || [];
    const isFavorite = favorites.some(fav => fav.id === product?.id);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Prompt', color: '#86868b' }}>
            <div className="loader">กำลังโหลดข้อมูลสินค้า...</div>
        </div>
    );
    
    if (!product) return null;

    return (
        <div style={{ fontFamily: "'Prompt', sans-serif", backgroundColor: '#fff', minHeight: '100vh', color: '#1d1d1f' }}>
            <Navbar user={user} cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} favorites={favorites} toggleFavorite={toggleFavorite} addToCart={addToCart} />
            
            <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '120px 30px 80px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '100px', alignItems: 'start' }}>
                    
                    {/* Left: Image */}
                    <div style={{ position: 'sticky', top: '120px' }}>
                        <div style={{ backgroundColor: '#fbfbfd', borderRadius: '40px', overflow: 'hidden', aspectRatio: '1/1', boxShadow: '0 20px 40px rgba(0,0,0,0.04)' }}>
                            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div>
                        <header style={{ marginBottom: '40px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#06c', textTransform: 'uppercase' }}>{product.category}</span>
                            <h1 style={{ fontSize: '48px', fontWeight: '700', margin: '10px 0 20px' }}>{product.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <p style={{ fontSize: '32px', fontWeight: '500', color: isFlashSaleActive ? '#e30000' : '#1d1d1f' }}>
                                    ฿{currentPrice.toLocaleString()}
                                </p>
                                {isFlashSaleActive && product.salePrice && (
                                    <p style={{ fontSize: '20px', color: '#86868b', textDecoration: 'line-through' }}>฿{product.price.toLocaleString()}</p>
                                )}
                            </div>
                        </header>

                        {/* Variant Selection */}
                        <div style={{ marginBottom: '40px', padding: '30px 0', borderTop: '1px solid #f5f5f7' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>สี <span style={{ fontWeight: '400', color: '#86868b', marginLeft: '8px' }}>— {selectedColor || 'เลือกสี'}</span></h4>
                            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                                {colorOptions.map((colorObj, index) => (
                                    <button 
                                        key={`color-${colorObj.name}-${index}`}
                                        onClick={() => { setSelectedColor(colorObj.name); setSelectedSize(''); }}
                                        style={{
                                            width: '44px', height: '44px', borderRadius: '50%',
                                            backgroundColor: colorObj.hex, border: 'none', cursor: 'pointer',
                                            boxShadow: selectedColor === colorObj.name ? `0 0 0 2px #fff, 0 0 0 4px #0071e3` : `inset 0 0 0 1px rgba(0,0,0,0.1)`,
                                            transform: selectedColor === colorObj.name ? 'scale(1.1)' : 'scale(1)', transition: '0.3s'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '50px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>ขนาด <span style={{ fontWeight: '400', color: '#86868b', marginLeft: '8px' }}>— {selectedSize || 'เลือกไซส์'}</span></h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                                {selectedColor ? availableSizes.map(size => (
                                    <button 
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        style={{
                                            padding: '16px', borderRadius: '12px',
                                            border: selectedSize === size ? '2px solid #0071e3' : '1px solid #d2d2d7',
                                            backgroundColor: selectedSize === size ? '#f5fbff' : '#fff',
                                            color: selectedSize === size ? '#0071e3' : '#1d1d1f',
                                            cursor: 'pointer', fontWeight: '600'
                                        }}
                                    >
                                        {size}
                                    </button>
                                )) : <div style={{ gridColumn: '1/-1', padding: '20px', borderRadius: '12px', border: '1px dashed #d2d2d7', color: '#86868b', textAlign: 'center' }}>เลือกสีก่อนเลือกไซส์</div>}
                            </div>
                        </div>

                        {/* Actions */} 
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '60px' }}>
                            
                            <button 
                                onClick={() => {
                                    if(!selectedSize) return;
                                    const sv = product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
                                    addToCart({
                                        ...product, selectedColor, selectedSize, 
                                        colorHex: sv?.colorHex || '#e5e5e7',
                                        price: currentPrice, 
                                        maxStock: sv?.stock || 0, 
                                        cartId: `${product.id}-${selectedColor}-${selectedSize}`
                                    });
                                    alert("เพิ่มลงตะกร้าสินค้าแล้ว");
                                }}
                                disabled={!selectedSize}
                                style={{ flex: 1, padding: '20px', borderRadius: '18px', border: 'none', backgroundColor: selectedSize ? '#000' : '#e5e5e7', color: '#fff', fontWeight: '600', cursor: selectedSize ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                            >
                                <ShoppingBagIcon /> ใส่ลงในตะกร้า
                            </button>
                            <button onClick={() => toggleFavorite(product)} style={{ width: '64px', height: '64px', borderRadius: '18px', border: '1px solid #d2d2d7', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isFavorite ? '#ff4d4f' : '#1d1d1f' }}>
                                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                            </button>
                        </div>

                        {/* Trust Badges */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '15px', padding: '20px', borderRadius: '20px', backgroundColor: '#f5f5f7' }}>
                                <LocalShippingIcon style={{ color: '#86868b' }} />
                                <div><h5 style={{ fontSize: '14px', margin: '0' }}>ส่งฟรี</h5><p style={{ fontSize: '12px', color: '#86868b', margin: 0 }}>ซื้อครบ 2,000.-</p></div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', padding: '20px', borderRadius: '20px', backgroundColor: '#f5f5f7' }}>
                                <VerifiedUserIcon style={{ color: '#86868b' }} />
                                <div><h5 style={{ fontSize: '14px', margin: '0' }}>ของแท้ 100%</h5><p style={{ fontSize: '12px', color: '#86868b', margin: 0 }}>Official Store</p></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- รีวิวจากลูกค้า --- */}
                <div style={{ marginTop: '100px', paddingTop: '80px', borderTop: '1px solid #f5f5f7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <div>
                            <h2 style={{ fontSize: '40px', fontWeight: '700' }}>รีวิวจากลูกค้า</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                                <span style={{ fontSize: '48px', fontWeight: '700' }}>{averageRating}</span>
                                <div>
                                    <div style={{ display: 'flex', color: '#FFD700' }}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} size={18} fill={s <= Math.round(averageRating) ? "#FFD700" : "none"} color={s <= Math.round(averageRating) ? "#FFD700" : "#d2d2d7"} />
                                        ))}
                                    </div>
                                    <p style={{ margin: 0, color: '#86868b', fontSize: '14px' }}>จาก {reviews.length} ความคิดเห็น</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {reviews.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#f5f5f7', borderRadius: '30px', color: '#86868b' }}>ยังไม่มีรีวิวสำหรับสินค้านี้</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                            {reviews.map((rev) => (
                                <div key={rev.id} style={{ padding: '30px', borderRadius: '25px', backgroundColor: '#fbfbfd', border: '1px solid #f5f5f7', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <div>
                                            <p style={{ fontWeight: '600', margin: '0' }}>{rev.userName}</p>
                                            <div style={{ display: 'flex', color: '#FFD700' }}>
                                                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} fill={s <= rev.rating ? "#FFD700" : "none"} color={s <= rev.rating ? "#FFD700" : "#d2d2d7"} />)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '12px', color: '#86868b' }}>{rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString('th-TH') : 'ล่าสุด'}</span>
                                            {(user?.role === 'admin' || currentUserRole === 'admin') && (
                                                <button 
                                                    onClick={() => handleDeleteReview(rev.id)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: '#fff1f0', color: '#ff4d4f', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', marginTop: '8px' }}
                                                >
                                                    <DeleteOutlineIcon style={{ fontSize: '16px' }} /> ลบโดย Admin
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '15px', color: '#1d1d1f', lineHeight: '1.6' }}>{rev.comment}</p>
                                    {rev.images?.length > 0 && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                                            {rev.images.map((img, i) => <img key={i} src={img} alt="review" style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} />)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- รีวิว Modal --- */}
            {isReviewOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                    <div style={{ backgroundColor: '#fff', width: '90%', maxWidth: '450px', borderRadius: '28px', padding: '35px', position: 'relative' }}>
                        <button onClick={() => setIsReviewOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f5f5f7', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}><X size={20}/></button>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', textAlign: 'center' }}>รีวิวสินค้า</h2>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '25px 0' }}>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <Star key={num} size={36} fill={num <= rating ? "#FFD700" : "none"} color={num <= rating ? "#FFD700" : "#d2d2d7"} style={{ cursor: 'pointer' }} onClick={() => setRating(num)} />
                            ))}
                        </div>
                        <textarea 
                            placeholder="แชร์ความเห็นของคุณ..."
                            style={{ width: '100%', height: '120px', borderRadius: '15px', border: '1px solid #d2d2d7', padding: '15px', marginBottom: '20px' }}
                            value={comment} onChange={(e) => setComment(e.target.value)}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#06c', cursor: 'pointer', marginBottom: '20px' }}>
                            <Camera size={20} /> เพิ่มรูปภาพ ({reviewImages.length})
                            <input type="file" multiple accept="image/*" hidden onChange={(e) => setReviewImages(Array.from(e.target.files))} />
                        </label>
                        <button disabled={submitting} onClick={handleReviewSubmit} style={{ width: '100%', backgroundColor: '#000', color: '#fff', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: '600', cursor: 'pointer' }}>
                            {submitting ? "กำลังส่ง..." : "ส่งรีวิว"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;