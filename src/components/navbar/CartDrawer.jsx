import React from 'react';
import { MdClose, MdDeleteOutline } from "react-icons/md";
import { theme } from './NavTheme';

const CartDrawer = ({ isOpen, onClose, cart = [], removeFromCart, updateQuantity, onCheckout }) => {
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    return (
        <>
            <div style={{ 
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, 
                visibility: isOpen ? 'visible' : 'hidden', 
                opacity: isOpen ? 1 : 0, transition: 'opacity 0.3s ease'
            }} onClick={onClose} />

            <div style={{ 
                position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '450px', height: '100%', 
                backgroundColor: '#fff', zIndex: 2001, 
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)', 
                visibility: isOpen ? 'visible' : 'hidden',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.4s', 
                display: 'flex', flexDirection: 'column', willChange: 'transform' 
            }}>
                <div style={{ padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>ตะกร้าสินค้า</h2>
                    <MdClose onClick={onClose} style={{ cursor: 'pointer', fontSize: '24px' }} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 40px' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>ตะกร้าว่างเปล่า</div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.cartId} style={{ display: 'flex', gap: '20px', padding: '25px 0', borderBottom: `1px solid ${theme.border}` }}>
                                <img src={item.imageUrl} alt={item.name} style={{ width: '90px', height: '110px', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#f9f9f9' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <h4 style={{ fontSize: '15px', margin: 0, fontWeight: '600', color: '#1a1a1a' }}>{item.name}</h4>
                                        <MdDeleteOutline 
                                            onClick={() => removeFromCart(item.cartId)} 
                                            style={{ cursor: 'pointer', color: '#ff4d4f', fontSize: '20px' }} 
                                        />
                                    </div>

                                    {/* --- ส่วนแสดง สี และ ไซส์ แบบใหม่ --- */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {/* วงกลมสีจิงๆ ที่เลือกมา */}
                                            <div style={{ 
                                                width: '12px', height: '12px', borderRadius: '50%', 
                                                backgroundColor: item.colorHex || '#ddd', // ใช้ค่าสีจากฐานข้อมูล
                                                border: '1px solid #eee'
                                            }} />
                                            <span style={{ fontSize: '13px', color: '#666' }}>{item.selectedColor}</span>
                                        </div>
                                        <span style={{ color: '#ddd' }}>|</span>
                                        <span style={{ fontSize: '13px', color: '#666' }}>Size: {item.selectedSize}</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                        <p style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>฿{item.price.toLocaleString()}</p>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #eee', borderRadius: '6px', overflow: 'hidden' }}>
                                            <button onClick={() => updateQuantity(item.cartId, -1)} style={{ border: 'none', background: '#fdfdfd', padding: '5px 12px', cursor: 'pointer', fontSize: '16px' }}>-</button>
                                            <span style={{ padding: '0 10px', fontSize: '13px', fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.cartId, 1)} style={{ border: 'none', background: '#fdfdfd', padding: '5px 12px', cursor: 'pointer', fontSize: '16px' }}>+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div style={{ padding: '30px 40px', borderTop: `1px solid ${theme.border}`, backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <span style={{ color: '#666' }}>ยอดรวมสุทธิ</span>
                            <strong style={{ fontSize: '22px', color: '#1a1a1a' }}>฿{totalPrice.toLocaleString()}</strong>
                        </div>
                        <button 
                            onClick={onCheckout} 
                            style={{ 
                                width: '100%', padding: '18px', backgroundColor: '#1a1a1a', 
                                color: '#fff', border: 'none', borderRadius: '12px', 
                                fontWeight: '600', fontSize: '16px', cursor: 'pointer',
                                transition: 'background 0.3s ease',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#1a1a1a'}
                        >
                            ดำเนินการชำระเงิน
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartDrawer;