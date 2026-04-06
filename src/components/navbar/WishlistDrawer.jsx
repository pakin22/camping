import React from 'react';
import { X, Trash2, Heart, ArrowRight, ShoppingBag } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

const WishlistDrawer = ({ isOpen, onClose, favorites = [], toggleFavorite }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <>
            {/* 1. Overlay (ฉากหลังเบลอ) */}
            <div 
                onClick={onClose} 
                style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.3)', 
                    backdropFilter: 'blur(5px)',
                    zIndex: 2000,
                    animation: 'fadeIn 0.3s ease'
                }} 
            />
            
            {/* 2. Drawer Content */}
            <div style={{
                position: 'fixed', top: 0, right: 0, width: '400px', height: '100%',
                backgroundColor: '#fff', zIndex: 2001, 
                boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
                display: 'flex', flexDirection: 'column',
                animation: 'slideIn 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
            }}>
                
                {/* Header Section */}
                <div style={{ 
                    padding: '30px 25px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderBottom: '1px solid #f0f0f0' 
                }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>สินค้าที่ชื่นชอบ</h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#888' }}>
                            {favorites.length} items saved
                        </p>
                    </div>

                    {/* ปุ่มปิด X ทรงกลม สีดำ ไอคอนขาว (เหมือนกับ NotificationDrawer) */}
                    <button 
                        onClick={onClose} 
                        style={{ 
                            background: '#000', // เริ่มต้นเป็นสีดำ
                            border: 'none', 
                            borderRadius: '50%', 
                            width: '52px', 
                            height: '52px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                            color: '#fff', // ไอคอนสีขาว
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#333';
                            e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#000';
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                        }}
                    >
                        <X size={28} strokeWidth={2.5} /> 
                    </button>
                </div>

                {/* Body: รายการสินค้า */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {favorites.length === 0 ? (
                        <div style={{ 
                            height: '70%', display: 'flex', flexDirection: 'column', 
                            alignItems: 'center', justifyContent: 'center', color: '#bbb' 
                        }}>
                            <Heart size={48} strokeWidth={1.5} style={{ marginBottom: '15px', opacity: 0.5 }} />
                            <p style={{ fontSize: '15px', fontWeight: '500' }}>Your wishlist is empty</p>
                        </div>
                    ) : (
                        favorites.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                                <img 
                                    src={item.imageUrl} 
                                    alt={item.name} 
                                    style={{ width: '85px', height: '85px', borderRadius: '12px', objectFit: 'cover', backgroundColor: '#f9f9f9' }} 
                                />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>{item.name}</h4>
                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>฿{item.price?.toLocaleString()}</p>
                                    <button 
                                        onClick={() => { navigate(`/product/${item.id}`); onClose(); }}
                                        style={{ background: 'none', border: 'none', color: '#0066cc', padding: '5px 0', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                                    >
                                        Details <ArrowRight size={14} />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => toggleFavorite(item)}
                                    style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '8px' }}
                                    title="Remove"
                                >
                                    <Trash2 size={20} strokeWidth={2} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '25px', borderTop: '1px solid #f0f0f0' }}>
                    <button 
                        onClick={() => { navigate('/shop'); onClose(); }}
                        style={{ 
                            width: '100%', padding: '16px', borderRadius: '15px',
                            backgroundColor: '#000', color: '#fff', border: 'none',
                            fontWeight: '600', fontSize: '15px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            transition: '0.3s'
                        }}
                    >
                        <ShoppingBag size={18} /> Continue Shopping
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </>
    );
};

export default WishlistDrawer;