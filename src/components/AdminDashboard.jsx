import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { styles, theme, getStatusStyle } from './AdminDashboard.styles';
import CloseIcon from '@mui/icons-material/Close';

// Import ส่วนประกอบย่อย
import ProductSection from './ProductSection';
import OrderSection from './OrderSection';
import ReportSection from './ReportSection';
import AuditLogSection from './AuditLogSection'; // ไฟล์ใหม่ที่เราจะสร้าง

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]); // สำหรับเก็บประวัติ Admin
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        // 1. ดึงข้อมูลสินค้า
        const qProducts = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const unsubProducts = onSnapshot(qProducts, (snap) => {
            setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => console.error("Products Load Error:", error));

        // 2. ดึงข้อมูลออเดอร์
        const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const unsubOrders = onSnapshot(qOrders, (snap) => {
            setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => console.error("Orders Load Error:", error));

        // 3. ดึงข้อมูลบันทึกกิจกรรม (Audit Logs)
        const qLogs = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));
        const unsubLogs = onSnapshot(qLogs, (snap) => {
            setAuditLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => console.error("Logs Load Error:", error));

        return () => {
            unsubProducts();
            unsubOrders();
            unsubLogs();
        };
    }, []);

    return (
        <div style={styles.adminWrapper}>
            <header style={styles.navbarWrapper}>
                <div style={styles.topBar}>ADMINISTRATION CONSOLE</div>
                <div style={styles.mainNav}>
                    <Link to="/" style={styles.logoContainer}>
                        <div style={styles.logoIcon}>CAMPGEAR</div>
                    </Link>
                    <nav style={styles.navLinks}>
                        <div 
                            onClick={() => setActiveTab('products')} 
                            style={{...styles.navLinkItem, color: activeTab === 'products' ? theme.accentGold : '#000'}}
                        >
                            คลังสินค้า
                        </div>
                        <div 
                            onClick={() => setActiveTab('orders')} 
                            style={{...styles.navLinkItem, color: activeTab === 'orders' ? theme.accentGold : '#000'}}
                        >
                            ออเดอร์
                        </div>
                        <div 
                            onClick={() => setActiveTab('reports')} 
                            style={{...styles.navLinkItem, color: activeTab === 'reports' ? theme.accentGold : '#000'}}
                        >
                            รายงานยอดขาย
                        </div>
                        {/* เพิ่มเมนูตรวจสอบกิจกรรมแอดมิน */}
                        <div 
                            onClick={() => setActiveTab('logs')} 
                            style={{
                                ...styles.navLinkItem, 
                                color: activeTab === 'logs' ? theme.accentGold : '#000',
                                borderLeft: '1px solid #eee',
                                paddingLeft: '20px'
                            }}
                        >
                            ตรวจสอบกิจกรรม
                        </div>
                    </nav>
                </div>
            </header>

            <div style={styles.contentContainer}>
                {activeTab === 'products' && (
                    <ProductSection products={products} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                )}

                {activeTab === 'orders' && (
                    <OrderSection 
                        orders={orders} 
                        setSelectedOrder={setSelectedOrder} 
                        searchTerm={searchTerm} 
                        setSearchTerm={setSearchTerm}
                        fetchOrders={() => {}} 
                    />
                )}

                {activeTab === 'reports' && <ReportSection orders={orders} />}

                {/* แสดงส่วนบันทึกกิจกรรม */}
                {activeTab === 'logs' && <AuditLogSection logs={auditLogs} />}
            </div>

            {/* Modal รายละเอียดออเดอร์ (เหมือนเดิมแต่ใส่ Optional Chaining ป้องกัน Error) */}
            {selectedOrder && (
                <div style={styles.overlay} onClick={() => setSelectedOrder(null)}>
                    <div 
                        style={{ ...styles.modal, padding: 0, width: '900px', overflow: 'hidden', display: 'flex' }} 
                        onClick={e => e.stopPropagation()}
                    >
    
                        {/* ฝั่งซ้าย: ข้อมูลลูกค้าและรายการสินค้า */}
<div style={{ flex: 1.2, padding: '30px', backgroundColor: '#fff', overflowY: 'auto', maxHeight: '80vh' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', letterSpacing: '-0.5px' }}>ORDER #{selectedOrder?.orderId || 'N/A'}</h2>
        <CloseIcon onClick={() => setSelectedOrder(null)} style={{ cursor: 'pointer', color: '#999' }} />
    </div>

    {/* 1. ส่วนข้อมูลลูกค้า/ที่อยู่ */}
    <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h4 style={{ marginTop: 0, marginBottom: '10px', color: theme.primary }}>Shipping Address</h4>
        <p style={{ margin: '4px 0', fontSize: '14px' }}>
            <strong>Name:</strong> {selectedOrder?.customerInfo?.firstName} {selectedOrder?.customerInfo?.lastName}
        </p>
        <p style={{ margin: '4px 0', fontSize: '14px' }}>
            <strong>Phone:</strong> {selectedOrder?.customerInfo?.phone}
        </p>
        <p style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.5' }}>
            <strong>Address:</strong> {selectedOrder?.customerInfo?.houseNo} ต.{selectedOrder?.customerInfo?.subDistrict} อ.{selectedOrder?.customerInfo?.district} จ.{selectedOrder?.customerInfo?.province} {selectedOrder?.customerInfo?.zipCode}
        </p>
    </div>

    {/* 2. รายการสินค้า */}
    <h4 style={{ marginBottom: '15px' }}>Items ({selectedOrder?.items?.length || 0})</h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {selectedOrder?.items?.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px' }} 
                />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{item.name}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        Color: {item.selectedColor} | Size: {item.selectedSize}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                        <span style={{ fontSize: '14px' }}>฿{item.price?.toLocaleString()} x {item.quantity}</span>
                        <span style={{ fontWeight: '700' }}>฿{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        ))}
    </div>

    {/* 3. สรุปยอดเงิน */}
    <div style={{ marginTop: '25px', borderTop: '2px solid #f0f0f0', paddingTop: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#666' }}>
            <span>Subtotal</span>
            <span>฿{selectedOrder?.subtotal?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#ff4d4f' }}>
            <span>Discount (Coupon: {selectedOrder?.couponUsed || '-'})</span>
            <span>-฿{selectedOrder?.discount?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#666' }}>
            <span>Shipping</span>
            <span>{selectedOrder?.shipping === 0 ? 'Free' : `฿${selectedOrder?.shipping}`}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800' }}>Total Amount</span>
            <span style={{ fontSize: '22px', fontWeight: '800', color: theme.primary }}>
                ฿{(Number(selectedOrder?.totalAmount) || 0).toLocaleString()}
            </span>
        </div>
    </div>
</div>
                        {/* ฝั่งขวา: หลักฐานการโอน */}
                        <div style={{ flex: 0.8, padding: '30px', backgroundColor: '#f9f9f9', borderLeft: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
                            <label style={styles.infoLabel}>Payment Status</label>
                            <div style={{ 
                                marginTop: '10px', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold',
                                backgroundColor: selectedOrder?.status ? getStatusStyle(selectedOrder.status).bg : '#eee', // เปลี่ยนเป็น .bg ตาม styles ของคุณ
                                color: selectedOrder?.status ? getStatusStyle(selectedOrder.status).color : '#000'
                            }}>
                                {selectedOrder?.status?.toUpperCase() || 'PENDING'}
                            </div>

                            <label style={{ ...styles.infoLabel, marginTop: '25px', display: 'block' }}>Payment Slip</label>
                            
                            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                {selectedOrder?.slipUrl ? (
                                    <div style={{ position: 'relative' }}>
                                        <img 
                                            src={selectedOrder.slipUrl} 
                                            alt="Payment Slip" 
                                            style={{ 
                                                width: '100%', 
                                                borderRadius: '8px', 
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                                cursor: 'zoom-in' 
                                            }} 
                                            onClick={() => window.open(selectedOrder.slipUrl, '_blank')}
                                        />
                                        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                                            * คลิกที่รูปเพื่อดูขนาดใหญ่
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ 
                                        padding: '40px 20px', 
                                        border: '2px dashed #ccc', 
                                        borderRadius: '8px', 
                                        color: '#999' 
                                    }}>
                                        ไม่พบหลักฐานการโอนเงิน
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                    </div>
            )}
        </div>
    );
}

export default AdminDashboard;