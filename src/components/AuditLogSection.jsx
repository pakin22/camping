import React from 'react';

function AuditLogSection({ logs }) {
    const displayLogs = logs || [];

    return (
        <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a' }}>
                Admin Activity Logs (Real-time)
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: '#8c8c8c', fontSize: '14px' }}>
                            <th style={{ padding: '12px 16px' }}>เวลา</th>
                            <th style={{ padding: '12px 16px' }}>แอดมินผู้ดำเนินการ</th>
                            <th style={{ padding: '12px 16px' }}>การกระทำ</th>
                            <th style={{ padding: '12px 16px' }}>รายละเอียด</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayLogs.length > 0 ? displayLogs.map((log) => (
                            <tr key={log.id} style={{ backgroundColor: '#fcfcfc', transition: '0.2s' }}>
                                {/* เวลา */}
                                <td style={{ padding: '16px', fontSize: '13px', borderRadius: '12px 0 0 12px', borderLeft: '1px solid #eee', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                                    {log.timestamp ? log.timestamp.toDate().toLocaleString('th-TH', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    }) : 'กำลังโหลด...'}
                                </td>

                                {/* ข้อมูลแอดมิน (ดึงจาก Field ที่เรา Save ใหม่) */}
                                <td style={{ padding: '16px', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                                        {log.firstName} {log.lastName}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>{log.email}</div>
                                </td>

                                {/* ประเภทการกระทำ */}
                                <td style={{ padding: '16px', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                                    <span style={{ 
                                        padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
                                        backgroundColor: log.action?.includes('DELETE') ? '#fff1f0' : 
                                                        log.action?.includes('CREATE') ? '#f6ffed' : '#e6f7ff',
                                        color: log.action?.includes('DELETE') ? '#cf1322' : 
                                               log.action?.includes('CREATE') ? '#52c41a' : '#1890ff'
                                    }}>
                                        {log.action}
                                    </span>
                                </td>

                                {/* รายละเอียด */}
                                <td style={{ padding: '16px', color: '#555', borderRadius: '0 12px 12px 0', borderRight: '1px solid #eee', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                                    {log.details}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                                    ยังไม่มีประวัติกิจกรรมในระบบ
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AuditLogSection;