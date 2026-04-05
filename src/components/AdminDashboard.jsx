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
                        {/* ฝั่งซ้าย: ข้อมูลสินค้า */}
                        <div style={{ flex: 1.2, padding: '30px', backgroundColor: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>ORDER #{selectedOrder?.orderId || 'N/A'}</h2>
                                <CloseIcon onClick={() => setSelectedOrder(null)} style={{ cursor: 'pointer' }} />
                            </div>
                            {/* ... รายละเอียดลูกค้าและสินค้า (ตัดย่อเพื่อความกระชับ) ... */}
                            <p><strong>Customer:</strong> {selectedOrder?.customerInfo?.firstName} {selectedOrder?.customerInfo?.lastName}</p>
                            <div style={{ borderTop: '2px solid #000', marginTop: '20px', paddingTop: '10px' }}>
                                <h3>Total: ฿{(Number(selectedOrder?.totalAmount) || 0).toLocaleString()}</h3>
                            </div>
                        </div>
                        {/* ฝั่งขวา: หลักฐานการโอน */}
                        <div style={{ flex: 0.8, padding: '30px', backgroundColor: '#f9f9f9', borderLeft: '1px solid #eee' }}>
                            <label style={styles.infoLabel}>Payment Status</label>
                            <div style={{ 
                                marginTop: '15px', padding: '15px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold',
                                backgroundColor: selectedOrder?.status ? getStatusStyle(selectedOrder.status).backgroundColor : '#eee',
                                color: selectedOrder?.status ? getStatusStyle(selectedOrder.status).color : '#000'
                            }}>
                                {selectedOrder?.status || 'PENDING'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;