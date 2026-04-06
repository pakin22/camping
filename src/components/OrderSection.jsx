import React, { useState } from 'react';
import { db } from '../firebase';
import { 
    updateDoc, 
    doc, 
    collection, 
    addDoc, 
    serverTimestamp,
    runTransaction 
} from 'firebase/firestore';
import { styles, getStatusStyle, theme } from './AdminDashboard.styles';

// MUI Components for Tracking Dialog
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    Button,
    Typography 
} from '@mui/material';

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';


const OrderSection = ({ orders, fetchOrders, searchTerm, setSearchTerm, setSelectedOrder, fetchProducts }) => {
        
    // --- State สำหรับ Tracking Dialog ---
    const [openTrackDialog, setOpenTrackDialog] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [trackingNumber, setTrackingNumber] = useState('');

    // --- ฟังก์ชันส่งการแจ้งเตือน ---
    const sendNotification = async (userId, title, message, productId = null) => {
        if (!userId) return;
        try {
            await addDoc(collection(db, "notifications"), {
                userId,
                title,
                message,
                productId, 
                updatedAt: serverTimestamp(),
                isRead: false
            });
        } catch (err) {
            console.error("Notify Error:", err);
        }
    };

    // --- ฟังก์ชันเปิด Dialog กรอกเลขพัสดุ ---
    const handleOpenTrackDialog = (order) => {
        setCurrentOrder(order);
        setTrackingNumber('');
        setOpenTrackDialog(true);
    };

    // --- ฟังก์ชันบันทึกการจัดส่ง (Shipped with Tracking) ---
    const confirmShipping = async () => {
        if (!trackingNumber.trim()) {
            alert("กรุณากรอกเลขพัสดุก่อนยืนยัน");
            return;
        }

        try {
            const orderRef = doc(db, "orders", currentOrder.id);
            const firstProductId = currentOrder.items && currentOrder.items.length > 0 
                ? currentOrder.items[0].id 
                : null;

            await updateDoc(orderRef, {
                status: 'shipped',
                trackingNumber: trackingNumber,
                shippedAt: serverTimestamp()
            });

            await sendNotification(
                currentOrder.userId, 
                "สินค้าจัดส่งแล้ว", 
                `ออเดอร์ ${currentOrder.orderId} กำลังเดินทางไปหาคุณ! เลขพัสดุ: ${trackingNumber}`,
                firstProductId 
            );

            setOpenTrackDialog(false);
            alert("บันทึกการจัดส่งเรียบร้อย!");

            // ✅ ป้องกัน Error: fetchOrders is not a function
            if (typeof fetchOrders === 'function') {
                fetchOrders();
            }
        } catch (err) {
            console.error("Shipping Error:", err);
            alert("เกิดข้อผิดพลาด: " + err.message);
        }
    };

    // --- ฟังก์ชันอัปเดตสถานะ (Approve / Processing) ---
   const updateOrderStatus = async (orderId, newStatus) => {
    try {
        const orderData = orders.find(o => o.id === orderId);
        if (!orderData) return;

        if (newStatus === 'processing') {
            if (orderData.status !== 'pending') {
                alert("ออเดอร์นี้ดำเนินการไปแล้ว");
                return;
            }

            const confirmAction = window.confirm("ยืนยันการชำระเงินและตัดสต็อกสินค้า?");
            if (!confirmAction) return;

            // เริ่ม Transaction
            await runTransaction(db, async (transaction) => {
                const items = orderData.items || [];
                const updates = [];

                // --- STEP 1: READ PHASE ---
                for (const item of items) {
                    const productRef = doc(db, "products", item.id);
                    const snap = await transaction.get(productRef);
                    if (!snap.exists()) throw new Error(`Product ${item.id} not found`);
                    updates.push({ item, snap, ref: productRef });
                }

                // --- STEP 2: WRITE PHASE ---
                for (const { item, snap, ref } of updates) {
                    const productData = snap.data();
                    const variants = [...(productData.variants || [])];

                    const vIndex = variants.findIndex(v => 
                        String(v.color || '').trim().toUpperCase() === String(item.selectedColor || '').trim().toUpperCase() && 
                        String(v.size || '').trim().toUpperCase() === String(item.selectedSize || '').trim().toUpperCase()
                    );

                    if (vIndex !== -1) {
                        const currentStock = Number(variants[vIndex].stock || 0);
                        const buyQty = Number(item.quantity || 1);

                        variants[vIndex].stock = Math.max(0, currentStock - buyQty);
                        const newTotalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);

                        transaction.update(ref, { 
                            variants: variants, 
                            totalStock: newTotalStock 
                        });

                        const logRef = doc(collection(db, "inventoryLogs"));
                        transaction.set(logRef, {
                            type: "DEDUCT",
                            orderId: orderId,
                            displayOrderId: orderData.orderId,
                            productId: item.id,
                            productName: item.name,
                            variant: `${item.selectedColor} / ${item.selectedSize}`,
                            quantity: buyQty,
                            timestamp: serverTimestamp(),
                            adminNote: "ตัดสต็อกอัตโนมัติ (แอดมินยืนยันชำระเงิน)"
                        });
                    }
                }

                // อัปเดตสถานะ Order
                transaction.update(doc(db, "orders", orderId), { status: 'processing' });
            });

            // --- STEP 3: AFTER TRANSACTION (Non-atomic tasks) ---
            await sendNotification(
                orderData.userId, 
                "ชำระเงินสำเร็จ", 
                `ออเดอร์ ${orderData.orderId} ของคุณได้รับการยืนยันแล้ว กำลังเตรียมจัดส่งสินค้าครับ`,
                orderData.items?.[0]?.id || null
            );

            alert("✅ ยืนยันชำระเงินและตัดสต็อกเรียบร้อย!");
            if (typeof fetchOrders === 'function') fetchOrders();
            if (typeof fetchProducts === 'function') fetchProducts();
        }
    } catch (err) {
        console.error("Update Error:", err);
        alert("เกิดข้อผิดพลาด: " + err.message);
    }
};

    // --- ฟังก์ชันยกเลิกออเดอร์ (Cancel & Restock) ---
    const cancelOrder = async (orderId) => {
        try {
            const orderData = orders.find(o => o.id === orderId);
            if (!orderData) return;

            const items = orderData.items || [];
            const confirmCancel = window.confirm("⚠️ ยกเลิกออเดอร์? หากเคยตัดสต็อกไปแล้ว ระบบจะคืนสต็อกให้ทันที");
            if (!confirmCancel) return;

            await runTransaction(db, async (transaction) => {
                if (orderData.status !== 'pending' && orderData.status !== 'cancelled') {
                    for (const item of items) {
                        const productRef = doc(db, "products", item.id);
                        const productSnap = await transaction.get(productRef);
                        if (!productSnap.exists()) continue;

                        const productData = productSnap.data();
                        const variants = [...(productData.variants || [])];
                        const vIndex = variants.findIndex(v => 
                            String(v.color || '').trim().toLowerCase() === String(item.color || '').trim().toLowerCase() && 
                            String(v.size || '').trim().toLowerCase() === String(item.size || '').trim().toLowerCase()
                        );

                        if (vIndex !== -1) {
                            variants[vIndex].stock = Number(variants[vIndex].stock || 0) + Number(item.quantity || 1);
                            const newTotalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
                            transaction.update(productRef, { variants: variants, totalStock: newTotalStock });

                            const logRef = doc(collection(db, "inventoryLogs"));
                            transaction.set(logRef, {
                                type: "RESTOCK",
                                orderId: orderId,
                                displayOrderId: orderData.orderId,
                                productId: item.id,
                                productName: item.name,
                                variant: `${item.color || '-'} / ${item.size || '-'}`,
                                quantity: item.quantity,
                                timestamp: serverTimestamp(),
                                adminNote: "ยกเลิกออเดอร์ (คืนสต็อกอัตโนมัติ)"
                            });
                        }
                    }
                }
                transaction.update(doc(db, "orders", orderId), { status: 'cancelled' });
            });

            await sendNotification(
                orderData.userId, 
                "ออเดอร์ถูกยกเลิก", 
                `ออเดอร์ ${orderData.orderId} ของคุณถูกยกเลิกแล้ว`,
                null
            );
            
            alert("❌ ยกเลิกและคืนสต็อกเรียบร้อย");
            
            // ✅ ป้องกัน Error: fetchOrders/fetchProducts is not a function
            if (typeof fetchOrders === 'function') fetchOrders();
            if (typeof fetchProducts === 'function') fetchProducts();
        } catch (err) {
            console.error(err);
            alert("ยกเลิกไม่สำเร็จ: " + err.message);
        }
    };

    const filtered = orders.filter(o => 
        o.customerInfo?.firstName?.toLowerCase().includes(searchTerm?.toLowerCase() || '') || 
        o.orderId?.toLowerCase().includes(searchTerm?.toLowerCase() || '')
    );

    return (
        <>
            <section style={{...styles.card, padding: 0, overflow: 'hidden'}}>
                <div style={{...styles.listHeaderWrapper, backgroundColor: '#fff', padding: '20px'}}>
                    <div style={{...styles.searchBox, width: '100%', maxWidth: '400px', border: '1px solid #eee'}}>
                        <SearchIcon style={{color: '#999'}}/>
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อลูกค้า หรือ Order ID..."
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            style={styles.searchInput}
                        />
                    </div>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={{...styles.table, minWidth: '1000px'}}>
                        <thead style={{backgroundColor: '#fafafa'}}>
                            <tr>
                                <th style={{...styles.th, width: '150px'}}>DATE</th>
                                <th style={styles.th}>CUSTOMER</th>
                                <th style={styles.th}>ITEMS</th>
                                <th style={styles.th}>TOTAL</th>
                                <th style={{...styles.th, textAlign: 'center'}}>SLIP</th>
                                <th style={styles.th}>STATUS</th>
                                <th style={{...styles.th, textAlign: 'right'}}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(order => {
                                const s = getStatusStyle(order.status);
                                return (
                                    <tr key={order.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={{fontWeight: '600', fontSize: '13px'}}>{order.createdAt?.toDate().toLocaleDateString('th-TH')}</div>
                                            <div style={{fontSize: '11px', color: '#999'}}>{order.createdAt?.toDate().toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{fontWeight: '700', color: theme.primary}}>{order.customerInfo?.firstName} {order.customerInfo?.lastName}</div>
                                            <div style={{fontSize: '11px', color: theme.accentGold}}>ID: {order.orderId}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {order.items && order.items.length > 0 ? (
                                                    <>
                                                        <span style={{ fontWeight: '600', color: '#333', fontSize: '13px' }}>{order.items[0].name}</span>
                                                        {order.items.length > 1 && <span style={{ fontSize: '11px', color: '#999' }}>และอีก {order.items.length - 1} รายการ</span>}
                                                    </>
                                                ) : <span style={{ color: '#ff4d4f', fontSize: '12px' }}>ไม่มีรายการ</span>}
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{fontWeight: '800', color: theme.primary}}>฿{order.totalAmount?.toLocaleString()}</span>
                                        </td>
                                        <td style={{...styles.td, textAlign: 'center'}}>
                                            {order.slipUrl ? (
                                                <img src={order.slipUrl} style={{width: '35px', height: '45px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer'}} alt="slip" onClick={() => setSelectedOrder(order)} />
                                            ) : <span style={{fontSize: '10px', color: '#ccc'}}>N/A</span>}
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ ...styles.statusBadge, color: s.color, backgroundColor: s.bg }}>
                                                {s.text}
                                            </div>
                                            {order.status === 'shipped' && order.trackingNumber && (
                                                <div style={{fontSize: '11px', marginTop: '4px', color: theme.primary, fontWeight: 'bold'}}>
                                                    {order.trackingNumber}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{...styles.td, textAlign: 'right'}}>
                                            <div style={{display:'flex', gap: '8px', justifyContent: 'flex-end'}}>
                                                {order.status === 'pending' && (
                                                    <button onClick={() => updateOrderStatus(order.id, 'processing')} style={styles.actionBtnApprove} title="ยืนยันการชำระเงิน">
                                                        <CheckCircleIcon style={{fontSize: '18px'}}/>
                                                    </button>
                                                )}
                                                {order.status === 'processing' && (
                                                    <button onClick={() => handleOpenTrackDialog(order)} style={styles.actionBtnShip} title="กรอกเลขพัสดุและจัดส่ง">
                                                        <LocalShippingIcon style={{fontSize: '18px'}}/>
                                                    </button>
                                                )}
                                                {order.status !== 'cancelled' && order.status !== 'shipped' && (
                                                    <button onClick={() => cancelOrder(order.id)} style={{...styles.actionBtnCancel, backgroundColor: '#fff1f0', color: '#ff4d4f', border: '1px solid #ffccc7'}} title="ยกเลิกออเดอร์">
                                                        <CancelIcon style={{fontSize: '18px'}}/>
                                                    </button>
                                                )}
                                                <button onClick={() => setSelectedOrder(order)} style={styles.actionBtnView} title="ดูรายละเอียด">
                                                    <VisibilityIcon style={{fontSize: '18px'}}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* --- Dialog สำหรับกรอกเลขพัสดุ --- */}
            <Dialog open={openTrackDialog} onClose={() => setOpenTrackDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle style={{ fontWeight: 'bold', color: theme.primary }}>
                    ยืนยันการจัดส่งสินค้า
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        ออเดอร์: {currentOrder?.orderId}
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="หมายเลขพัสดุ (Tracking Number)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="เช่น TH123456789"
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions style={{ padding: '16px 24px' }}>
                    <Button onClick={() => setOpenTrackDialog(false)} color="inherit">
                        ยกเลิก
                    </Button>
                    <Button 
                        onClick={confirmShipping} 
                        variant="contained" 
                        style={{ backgroundColor: theme.primary, color: '#fff' }}
                    >
                        ยืนยันจัดส่ง
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default OrderSection;