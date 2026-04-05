// AdminDashboard.styles.js
export const theme = {
    primary: '#000000', secondary: '#757575', background: '#f8f9fa',
    cardWhite: '#ffffff', accentGold: '#af9164', border: '#e0e0e0',
    textMain: '#1a1a1a', textSub: '#666666', fontMain: "'Prompt', sans-serif",
    success: '#27ae60', info: '#3498db', warning: '#f39c12', danger: '#e74c3c'
};

export const getStatusStyle = (status) => {
    switch(status) {
        case 'pending': return { color: theme.warning, bg: '#fef5e7', text: 'รอตรวจสอบ' };
        case 'processing': return { color: theme.info, bg: '#ebf5fb', text: 'ชำระเงินแล้ว' };
        case 'shipped': return { color: theme.success, bg: '#eafaf1', text: 'จัดส่งแล้ว' };
        case 'cancelled': return { color: theme.danger, bg: '#fdedec', text: 'ยกเลิกแล้ว' };
        default: return { color: '#777', bg: '#eee', text: status };
    }
};

export const styles = {
    adminWrapper: { fontFamily: theme.fontMain, backgroundColor: theme.background, minHeight: '100vh', paddingTop: '130px', color: theme.textMain },
    navbarWrapper: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, backgroundColor: '#fff', borderBottom: `1px solid ${theme.border}`, boxShadow: '0 2px 15px rgba(0,0,0,0.04)' },
    topBar: { backgroundColor: '#000', color: '#fff', padding: '8px', textAlign: 'center', fontSize: '10px', letterSpacing: '2px', fontWeight: 300 },
    mainNav: { padding: '0 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' },
    logoContainer: { textDecoration: 'none', color: '#000' },
    logoIcon: { fontSize: '20px', fontWeight: '800', letterSpacing: '3px' },
    logoText: { fontSize: '9px', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' },
    navLinks: { display: 'flex', gap: '40px', height: '100%' },
    navLinkItem: { display: 'flex', alignItems: 'center', cursor:'pointer', fontSize: '14px', fontWeight: '600', height: '100%', position:'relative', transition:'0.3s' },
    badgeCount: { position:'absolute', top:'18px', right:'-18px', backgroundColor:theme.danger, color:'white', borderRadius:'50%', width:'18px', height:'18px', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'10px' },
    rightInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
    contentContainer: { maxWidth: '1400px', margin: '0 auto', padding: '0 40px 50px' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' },
    title: { fontSize: '32px', fontWeight: '800', margin: 0 },
    subtitle: { fontSize: '14px', color: theme.textSub, margin: '4px 0 0' },
    statBox: { backgroundColor: '#fff', padding: '15px 25px', borderRadius: '12px', border: `1px solid ${theme.border}`, display: 'flex', gap: '15px', alignItems: 'center' },
    statIcon: { width: '40px', height: '40px', backgroundColor: '#fdf7ed', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    statLabel: { fontSize: '11px', color: theme.textSub, fontWeight: '600' },
    statValue: { fontSize: '22px', fontWeight: '800', color: theme.primary },
    grid: { display: 'grid', gridTemplateColumns: '420px 1fr', gap: '30px' },
    card: { backgroundColor: '#fff', border: `1px solid ${theme.border}`, padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
    cardTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '20px', borderLeft: `4px solid ${theme.accentGold}`, paddingLeft: '12px' },
    form: { display: 'flex', flexDirection: 'column', gap: '18px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '700', color: '#444' },
    input: { padding: '12px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontFamily: 'Prompt', fontSize: '14px', outlineColor: theme.accentGold },
    select: { padding: '12px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontFamily: 'Prompt', fontSize: '14px' },
    variantContainer: { backgroundColor: '#fcfcfc', padding: '15px', borderRadius: '10px', border: `1px solid ${theme.border}` },
    variantRow: { display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' },
    miniInput: { width: '100%', padding: '8px', border: `1px solid ${theme.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'Prompt' },
    addVariantBtn: { border: 'none', background: 'none', color: theme.accentGold, cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' },
    removeVariantIcon: { fontSize: '18px', color: theme.danger, cursor: 'pointer' },
    uploadZone: { border: '2px dashed #eee', borderRadius:'12px', height:'140px', display:'flex', justifyContent:'center', alignItems:'center', position:'relative', overflow:'hidden', backgroundColor: '#fafafa', cursor:'pointer' },
    fileInput: { position:'absolute', opacity:0, width:'100%', height:'100%', cursor:'pointer' },
    previewImg: { width:'100%', height:'100%', objectFit:'contain' },
    submitBtn: { padding: '14px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight:'700', transition: '0.3s' },
    btnDisabled: { padding: '14px', backgroundColor: '#ccc', color: '#fff', borderRadius: '8px', cursor: 'not-allowed' },
    listHeaderWrapper: { padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, display:'flex', justifyContent:'flex-end' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f5f5f5', padding: '8px 15px', borderRadius: '25px', width: '260px' },
    searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%', fontFamily: 'Prompt' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '15px 20px', fontSize: '11px', color: '#999', textTransform: 'uppercase', borderBottom: `1px solid ${theme.border}`, letterSpacing: '1px' },
    td: { padding: '18px 20px', borderBottom: `1px solid ${theme.border}`, fontSize: '14px' },
    tr: { transition: '0.2s', '&:hover': { backgroundColor: '#fcfcfc' } },
    thumb: { width: '55px', height: '55px', objectFit: 'cover', borderRadius: '10px', backgroundColor:'#f9f9f9' },
    productCell: { display: 'flex', alignItems: 'center', gap: '15px' },
    variantListBadge: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' },
    miniTag: { fontSize: '9px', backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', color: '#666' },
    tag: { fontSize: '10px', backgroundColor: '#eef2f7', color: '#556ee6', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 },
    deleteBtn: { color: theme.danger, border: '1.5px solid #fceaea', backgroundColor: '#fdf4f4', cursor: 'pointer', padding: '6px', borderRadius: '8px', display:'flex', alignItems:'center' },
    orderThumb: { width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in' },
    slipContainer: { display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer' },
    zoomHint: { fontSize: '9px', color: theme.accentGold, fontWeight: '600' },
    statusBadge: { padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-block' },
    actionBtnApprove: { backgroundColor: theme.success, color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    actionBtnShip: { backgroundColor: theme.info, color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    actionBtnView: { backgroundColor: '#f8f9fa', color: '#555', border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
    modal: { backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' },
    modalBody: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '10px' },
    infoSection: { marginBottom: '20px' },
    infoLabel: { display: 'block', fontSize: '12px', color: theme.accentGold, fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px', borderBottom: `1px solid #f0f0f0`, paddingBottom: '5px' },
    orderItemRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px dashed #eee' },
    modalTotal: { textAlign: 'right', fontWeight: '800', fontSize: '18px', marginTop: '15px', color: theme.primary },
    slipFull: { width: '100%', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }
};