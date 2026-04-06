import React, { useState, useMemo } from 'react';
import { 
    MdTrendingUp, MdOutlineShoppingCart, MdAttachMoney, 
    MdInventory2, MdFilterList, MdCalendarMonth, MdBarChart 
} from "react-icons/md";

// ✅ StatCard: ย้ายไว้ด้านนอก (ป้องกัน Render Error)
const StatCard = ({ title, value, icon, subValue, isDark, trend }) => (
    <div style={{
        padding: '24px', background: isDark ? '#1a1a1a' : '#fff',
        color: isDark ? '#fff' : '#1a1a1a', borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: isDark ? 'none' : '1px solid #f0f0f0',
        display: 'flex', flexDirection: 'column', gap: '12px'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ padding: '8px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.1)' : '#f8f8f8', display: 'flex' }}>
                {icon}
            </div>
            {trend && <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: '700' }}>{trend}</span>}
        </div>
        <div>
            <div style={{ fontSize: '13px', fontWeight: '500', opacity: 0.7, marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>{value}</div>
            <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px', textTransform: 'uppercase' }}>{subValue}</div>
        </div>
    </div>
);

const ReportSection = ({ orders = [] }) => {
    const [timeRange, setTimeRange] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const reportData = useMemo(() => {
        const now = new Date();
        const stats = {};
        let totalRev = 0;

        const filtered = orders.filter(order => {
            // 1. แปลงวันที่ (รองรับทั้ง Firebase Timestamp และ Date ปกติ)
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            if (!orderDate || isNaN(orderDate.getTime())) return false;
            // 2. ตัดออเดอร์ที่ 'ยกเลิก' หรือ 'รอกดชำระเงิน' ออกไป (ไม่นำมาคิดเป็นรายได้จริง)
            const status = (order.status || '').toLowerCase();
            if (['cancelled', 'pending'].includes(status)) return false;
            
            // 3. เช็คเงื่อนไขเวลา (วันนี้ / เดือนนี้ / เลือกเอง)
            if (timeRange === 'today') return orderDate.toDateString() === now.toDateString();
            if (timeRange === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
            if (timeRange === 'custom') {
                const s = startDate ? new Date(startDate) : null;
                const e = endDate ? new Date(endDate) : null;
                if (s) s.setHours(0, 0, 0, 0);
                if (e) e.setHours(23, 59, 59, 999);
                
                if (s && e) return orderDate >= s && orderDate <= e;
                if (s) return orderDate >= s;
                if (e) return orderDate <= e;
            }
            return true;
        });

        filtered.forEach(order => {
            const amount = Number(order.totalAmount || order.totalPrice || 0);
            totalRev += amount;
            const items = order.items || order.cartItems || [];
            items.forEach(item => {
                const name = item.name || "Unknown Product";
                if (!stats[name]) stats[name] = { qty: 0, rev: 0, img: item.imageUrl || "" };
                stats[name].qty += (Number(item.quantity) || 0);
                stats[name].rev += (Number(item.price || 0) * Number(item.quantity || 0));
            });
        });

        const products = Object.entries(stats)
            .map(([name, d]) => ({ name, ...d }))
            .sort((a, b) => b.qty - a.qty);

        return {
            totalRev,
            count: filtered.length,
            products,
            maxQty: products.length > 0 ? products[0].qty : 0,
            avgOrder: filtered.length > 0 ? (totalRev / filtered.length) : 0
        };
    }, [orders, timeRange, startDate, endDate]);

    return (
        <div style={{ padding: '30px', backgroundColor: '#fafafa', minHeight: '100vh', fontFamily: "'Prompt', sans-serif" }}>
            
            {/* Header & Filter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MdBarChart color="#000" /> Sales Intelligence
                    </h1>
                    <p style={{ color: '#666', margin: '5px 0 0' }}>สรุปผลการดำเนินงานและวิเคราะห์ยอดขายเชิงลึก</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <div style={{ display: 'flex', background: '#fff', padding: '4px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        {['all', 'today', 'month', 'custom'].map(r => (
                            <button key={r} onClick={() => setTimeRange(r)} style={{
                                padding: '8px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                backgroundColor: timeRange === r ? '#1a1a1a' : 'transparent',
                                color: timeRange === r ? '#fff' : '#666', fontWeight: '600', fontSize: '13px'
                            }}>{r === 'custom' ? 'เลือกวันที่' : r.toUpperCase()}</button>
                        ))}
                    </div>

                    {timeRange === 'custom' && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} 
                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }} />
                            <span style={{ fontSize: '13px', color: '#999' }}>ถึง</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} 
                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <StatCard title="ยอดขายสุทธิ" value={`฿${reportData.totalRev.toLocaleString()}`} 
                    icon={<MdAttachMoney size={20} color="#D4AF37" />} subValue="Net Revenue" isDark />
                <StatCard title="จำนวนออเดอร์" value={reportData.count} 
                    icon={<MdOutlineShoppingCart size={20} color="#3b82f6" />} subValue="Total Transactions" />
                <StatCard title="ยอดซื้อเฉลี่ยต่อบิล" value={`฿${Math.round(reportData.avgOrder).toLocaleString()}`} 
                    icon={<MdTrendingUp size={20} color="#22c55e" />} subValue="Average Order Value" />
                <StatCard title="สินค้าที่ขายออก" value={reportData.products.reduce((acc, curr) => acc + curr.qty, 0)} 
                    icon={<MdInventory2 size={20} color="#8b5cf6" />} subValue="Items Handled" />
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                
                {/* Table: Best Sellers */}
                <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #eee', padding: '24px', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 25px 0', fontSize: '18px', fontWeight: '700' }}>สินค้าขายดีตามช่วงเวลา</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f8f8f8' }}>
                                    <th style={{ padding: '15px 10px', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Product</th>
                                    <th style={{ padding: '15px 10px', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Performance</th>
                                    <th style={{ padding: '15px 10px', color: '#888', fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.products.length > 0 ? reportData.products.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f8f8f8' }}>
                                        <td style={{ padding: '15px 10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img src={p.img} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '10px' }} alt="" />
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '14px' }}>{p.name}</div>
                                                <div style={{ fontSize: '12px', color: '#999' }}>ขายแล้ว {p.qty} ชิ้น</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 10px' }}>
                                            <div style={{ width: '120px', height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
                                                <div style={{ width: `${(p.qty / reportData.maxQty) * 100}%`, height: '100%', background: i === 0 ? '#000' : '#bbb', borderRadius: '3px' }} />
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: '700' }}>฿{p.rev.toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" style={{ padding: '50px', textAlign: 'center', color: '#999' }}>ไม่มีข้อมูลในช่วงนี้</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Stats: Additional Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #6e8efb, #a777e3)', padding: '25px', borderRadius: '24px', color: '#fff' }}>
                        <h4 style={{ margin: '0 0 10px 0', opacity: 0.8, fontSize: '14px' }}>Expert Insight</h4>
                        <p style={{ fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                            {reportData.count > 0 
                                ? `ออเดอร์เฉลี่ยของคุณอยู่ที่ ฿${Math.round(reportData.avgOrder).toLocaleString()} ต่อรายการ ลองจัดโปรโมชั่น Bundle เพื่อเพิ่มยอดนี้!` 
                                : 'ยังไม่มีข้อมูลการขายในช่วงนี้ เริ่มจัดโปรโมชั่นเพื่อกระตุ้นยอดขายกันเถอะ'}
                        </p>
                    </div>
                    
                    <div style={{ background: '#fff', padding: '25px', borderRadius: '24px', border: '1px solid #eee' }}>
                        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Status Overview</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ color: '#666' }}>คำสั่งซื้อสำเร็จ</span>
                                <span style={{ fontWeight: '700', color: '#22c55e' }}>100%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', background: '#22c55e' }} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default ReportSection;