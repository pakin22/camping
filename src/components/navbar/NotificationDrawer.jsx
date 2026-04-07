import React from 'react';
import { X, Star, Clock, CheckCircle, Package, Truck, AlertCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { theme } from './NavTheme';
import { useNavigate } from 'react-router-dom';

const NotificationDrawer = ({ isOpen, onClose, notifications }) => {
    const navigate = useNavigate();

    const handleRead = async (id) => {
        try { 
            await updateDoc(doc(db, "notifications", id), { isRead: true }); 
        } catch (err) { 
            console.error(err); 
        }
    };

    const handleGoToReview = (note) => {
        if (!note.productId) {
            alert("ไม่พบรหัสสินค้าสำหรับการรีวิว");
            return;
        }
        
        handleRead(note.id);
        onClose();

        // ส่งข้อมูล notificationId ไปที่หน้า Product เพื่อให้หน้านั้น Update สถานะรีวิวกลับมาได้
        navigate(`/product/${note.productId}`, { 
            state: { 
                autoOpenReview: true,
                notificationId: note.id 
            } 
        });
    };

    return (
        <>
            {/* Overlay */}
            <div style={{ 
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000, 
                visibility: isOpen ? 'visible' : 'hidden', opacity: isOpen ? 1 : 0, 
                transition: 'opacity 0.4s ease',
                backdropFilter: 'blur(4px)'
            }} onClick={onClose} />
            
            {/* Drawer Content */}
            <div style={{ 
                position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '380px', height: '100%', 
                backgroundColor: '#fff', zIndex: 2001, 
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)', 
                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)', 
                display: 'flex', flexDirection: 'column',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.1)'
            }}>
                {/* Header */}
                <div style={{ padding: '30px 25px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>การแจ้งเตือน</h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888' }}>Notifications</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#000', border: 'none', borderRadius: '50%', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                        <X size={28} strokeWidth={2.5} /> 
                    </button>
                </div>

                {/* รายการแจ้งเตือน */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#ccc' }}>
                             <p>ไม่มีการแจ้งเตือนในขณะนี้</p>
                        </div>
                    ) : (
                        notifications.map((note) => {
                            const status = note.status || '';
                            
                            // ตั้งค่า UI ตามสถานะ
                            const getStatusConfig = () => {
                                if (note.title?.includes("ตรวจสอบ") || status === 'pending') 
                                    return { icon: <Clock size={16} color="#f59e0b" />, bg: '#fffbeb' };
                                if (note.title?.includes("ชำระเงิน") || status === 'paid') 
                                    return { icon: <CheckCircle size={16} color="#10b981" />, bg: '#f0fdf4' };
                                if (note.title?.includes("จัดส่ง") || status === 'shipping') 
                                    return { icon: <Truck size={16} color="#3b82f6" />, bg: '#eff6ff' };
                                if (note.title?.includes("สำเร็จ") || status === 'completed') 
                                    return { icon: <Package size={16} color="#8b5cf6" />, bg: '#f5f3ff' };
                                return { icon: <AlertCircle size={16} color="#666" />, bg: '#fff' };
                            };

                            const config = getStatusConfig();
                            
                            // เงื่อนไขการแสดงปุ่มรีวิว: 
                            // 1. ต้องมีรหัสสินค้า 2. สถานะสำเร็จแล้ว 3. ***ต้องยังไม่เคยรีวิว (isReviewed ไม่เป็น true)***
                            const canReview = note.productId && (note.title?.includes("จัดส่งแล้ว") || status === 'completed') && !note.isReviewed;

                            return (
                                <div key={note.id} style={{ 
                                    padding: '20px', 
                                    borderBottom: `1px solid ${theme.border}`, 
                                    backgroundColor: note.isRead ? '#fff' : config.bg, 
                                    position: 'relative',
                                    transition: 'background 0.2s'
                                }}>
                                    <div onClick={() => handleRead(note.id)} style={{ cursor: 'pointer', display: 'flex', gap: '12px' }}>
                                        <div style={{ marginTop: '2px' }}>{config.icon}</div>
                                        
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 5px', fontSize: '14px', fontWeight: note.isRead ? '500' : '700', color: '#1a1a1a' }}>
                                                {note.title}
                                            </p>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                                                {note.message}
                                            </p>

                                            {/* แสดง Badge ถ้าหากรีวิวไปแล้ว */}
                                            {note.isReviewed && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                                                    <CheckCircle size={14} /> รีวิวเรียบร้อยแล้ว
                                                </div>
                                            )}

                                            <small style={{ color: '#aaa', fontSize: '11px', display: 'block' }}>
                                                {note.updatedAt?.toDate().toLocaleString('th-TH')}
                                            </small>
                                        </div>
                                    </div>

                                    {/* ปุ่ม Action */}
                                    {canReview && (
                                        <div style={{ paddingLeft: '28px', marginTop: '12px' }}>
                                            <button 
                                                onClick={() => handleGoToReview(note)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    backgroundColor: '#000', color: '#fff', border: 'none',
                                                    padding: '10px 16px', borderRadius: '8px',
                                                    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <Star size={14} fill="#FFD700" color="#FFD700" />
                                                รีวิวสินค้า
                                            </button>
                                        </div>
                                    )}

                                    {!note.isRead && (
                                        <div style={{ position: 'absolute', top: '25px', right: '15px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.primary }} />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationDrawer;