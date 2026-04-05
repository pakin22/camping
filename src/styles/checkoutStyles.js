// src/styles/checkoutStyles.js

export const theme = {
    black: '#000000',
    darkGray: '#424245',
    gray: '#86868b',
    lightGray: '#f5f5f7',
    border: '#d2d2d7',
    success: '#28a745',
    error: '#d60017',
    font: "'Prompt', sans-serif"
};

export const styles = {
    wrapper: { backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: theme.font, color: theme.black },
    container: { maxWidth: '1100px', margin: '0 auto', padding: '140px 20px 100px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: '60px' },
    loadingOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
    backBtn: { background: 'none', border: 'none', cursor: 'pointer', color: theme.gray, marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' },
    title: { fontSize: '42px', fontWeight: '700', marginBottom: '40px', letterSpacing: '-0.02em' },
    cardSection: { padding: '0 0 40px 0', marginBottom: '40px', borderBottom: `1px solid ${theme.border}` },
    sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' },
    bankCard: { background: 'linear-gradient(145deg, #ffffff 0%, #f9f9fb 100%)', border: `1px solid ${theme.border}`, padding: '35px', borderRadius: '24px' },
    bankHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px' },
    bankLabel: { color: theme.gray, fontSize: '12px', fontWeight: '600', marginBottom: '4px' },
    bankName: { fontSize: '19px', fontWeight: '600', margin: 0 },
    bankBrand: { background: '#e6f6ee', padding: '8px 16px', borderRadius: '12px', color: '#00a950', fontWeight: '700' },
    accountNumberRow: { backgroundColor: '#ffffff', border: `1px solid ${theme.border}`, padding: '24px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    accountNumber: { fontSize: '32px', margin: 0, fontWeight: '700', letterSpacing: '2px' },
    copyBtn: { color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    uploadArea: { border: `2px dashed ${theme.border}`, padding: '60px 20px', borderRadius: '24px', textAlign: 'center', cursor: 'pointer', overflow: 'hidden' },
    slipPreview: { maxHeight: '350px', maxWidth: '100%', borderRadius: '16px' },
    inputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    addressBox: { padding: '30px', backgroundColor: '#f9f9fb', borderRadius: '24px', border: `1px solid ${theme.border}` },
    summaryCard: { backgroundColor: '#fbfbfd', padding: '40px', borderRadius: '32px', position: 'sticky', top: '140px', border: `1px solid ${theme.border}` },
    cartList: { maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' },
    cartItem: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
    summaryPrices: { borderTop: `1px solid ${theme.border}`, paddingTop: '20px' },
    priceRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    totalRow: { display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: `2px solid ${theme.black}` },
    payBtn: { width: '100%', padding: '22px', border: 'none', borderRadius: '50px', fontWeight: '600', fontSize: '18px', marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' },
    
    // Dynamic Functions for styles
    profileBtn: (loading) => ({
        padding: '8px 16px', borderRadius: '10px', border: `1px solid ${theme.black}`,
        backgroundColor: 'transparent', cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px'
    }),
    input: (hasError) => ({
        width: '100%', padding: '18px', border: `1px solid ${hasError ? theme.error : theme.border}`, 
        borderRadius: '14px', fontSize: '16px', outline: 'none', boxSizing: 'border-box', fontFamily: theme.font
    }),
    select: (hasError) => ({
        width: '100%', padding: '18px', border: `1px solid ${hasError ? theme.error : theme.border}`, 
        borderRadius: '14px', fontSize: '16px', cursor: 'pointer', fontFamily: theme.font
    })
};