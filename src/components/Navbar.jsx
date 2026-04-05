import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdAccountCircle, MdKeyboardArrowDown } from "react-icons/md";
import { HiOutlineShoppingCart, HiOutlineBell, HiOutlineHeart } from "react-icons/hi"; 
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase'; 
import { collection, query, onSnapshot, orderBy, where, getDoc, doc } from 'firebase/firestore'; // เพิ่ม getDoc, doc
import WishlistDrawer from './navbar/WishlistDrawer.jsx';
import { theme, navStyles } from './navbar/NavTheme.js';
import CartDrawer from './navbar/CartDrawer.jsx';
import NotificationDrawer from './navbar/NotificationDrawer.jsx';

function Navbar({ user, cart, favorites = [], removeFromCart, updateQuantity, toggleFavorite }) {
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isNotiOpen, setIsNotiOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [userRole, setUserRole] = useState(null); // State สำหรับเก็บสิทธิ์ผู้ใช้

    const navigate = useNavigate();
    const totalItems = cart ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
    const wishlistCount = favorites.length; 
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // ดึงข้อมูล Role ของผู้ใช้จาก Firestore
    useEffect(() => {
        const fetchRole = async () => {
            if (user?.uid) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        setUserRole(userDoc.data().role);
                    }
                } catch (error) {
                    console.error("Error fetching role:", error);
                }
            } else {
                setUserRole(null);
            }
        };
        fetchRole();
    }, [user]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setIsMenuOpen(false);
            setUserRole(null);
            navigate('/');
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("updatedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const linkStyle = {
        textDecoration: 'none',
        color: '#000',
        fontSize: '14px',
        fontWeight: '500',
        letterSpacing: '1px',
        transition: '0.3s',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    };

    return (
        <div style={{ 
            fontFamily: theme.fontMain, position: 'fixed', top: 0, width: '100%', 
            zIndex: 1000, backgroundColor: '#fff', borderBottom: `1px solid ${theme.border}` 
        }}>
            <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                height: '80px', padding: '0 60px' 
            }}>
                
                {/* 1. ส่วน Logo */}
                <Link to="/" style={{ textDecoration: 'none', color: '#000', fontSize: '22px', fontWeight: '800', letterSpacing: '1.5px' }}>
                    CAMPGEAR
                </Link>

                {/* 2. ส่วนเมนูหลัก */}
                <nav style={{ display: 'flex', gap: '35px', alignItems: 'center' }}>
                    <Link to="/" style={linkStyle}>หน้าแรก</Link>
                    <Link to="/shop" style={linkStyle}>สินค้าทั้งหมด</Link>
                </nav>

                {/* 3. ส่วน Icons ด้านขวา */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    
                    {/* ปุ่มรายการที่ชอบ */}
                    <button 
                        style={navStyles.iconBtn} 
                        onClick={() => setIsWishlistOpen(true)}
                        title="รายการที่ชอบ"
                    >
                        <HiOutlineHeart />
                        {wishlistCount > 0 && <span style={navStyles.badge}>{wishlistCount}</span>}
                    </button>

                    <WishlistDrawer 
                        isOpen={isWishlistOpen} 
                        onClose={() => setIsWishlistOpen(false)} 
                        favorites={favorites} 
                        toggleFavorite={toggleFavorite}
                    />

                    {/* ปุ่มแจ้งเตือน */}
                    <button style={navStyles.iconBtn} onClick={() => setIsNotiOpen(true)}>
                        <HiOutlineBell />
                        {unreadCount > 0 && <span style={navStyles.badge}>{unreadCount}</span>}
                    </button>

                    {/* ปุ่มตะกร้าสินค้า */}
                    <button style={navStyles.iconBtn} onClick={() => setIsCartOpen(true)}>
                        <HiOutlineShoppingCart />
                        {totalItems > 0 && <span style={navStyles.badge}>{totalItems}</span>}
                    </button>

                    {/* โปรไฟล์ & Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button style={navStyles.iconBtn} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {user?.photoURL ? (
                                <img src={user.photoURL} style={{ width: '28px', height: '28px', borderRadius: '50%' }} alt="profile" />
                            ) : (
                                <MdAccountCircle />
                            )}
                        </button>

                        {isMenuOpen && (
                            <div style={{ 
                                position: 'absolute', top: '100%', right: 0, backgroundColor: '#fff', 
                                border: `1px solid ${theme.border}`, width: '180px', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '10px', padding: '10px 0'
                            }}>
                                {user ? (
                                    <>
                                        <div style={{ padding: '10px 20px', fontSize: '11px', color: '#888', borderBottom: `1px solid ${theme.border}`, marginBottom: '5px' }}>
                                            {user.email}
                                        </div>
                                        
                                        <div style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '14px' }} 
                                             onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}>
                                             โปรไฟล์
                                        </div>

                                        {/* เมนูสำหรับ Admin เท่านั้น */}
                                        {(userRole === 'admin') && (
                                            <div style={{ 
                                                padding: '10px 20px', cursor: 'pointer', fontSize: '14px', 
                                                color: '#3b82f6', fontWeight: '600', borderTop: `1px solid ${theme.border}` 
                                            }} 
                                                 onClick={() => { navigate('/admin-dashboard'); setIsMenuOpen(false); }}>
                                                 จัดการสินค้า
                                            </div>
                                        )}

                                        <div style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '14px', color: 'red' }} 
                                             onClick={handleSignOut}>
                                             ออกจากระบบ
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '14px' }} 
                                         onClick={() => { navigate('/signin'); setIsMenuOpen(false); }}>
                                         เข้าสู่ระบบ
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CartDrawer 
                isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} 
                cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} 
                onCheckout={() => { setIsCartOpen(false); navigate('/checkout'); }} 
            />
            <NotificationDrawer isOpen={isNotiOpen} onClose={() => setIsNotiOpen(false)} notifications={notifications} />
        </div>
    );
}

export default Navbar;