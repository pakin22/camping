import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * ฟังก์ชันบันทึกกิจกรรมแอดมินลง Firestore
 * @param {string} action - ประเภทการกระทำ เช่น "DELETE_PRODUCT", "UPDATE_ORDER"
 * @param {string} details - รายละเอียด เช่น "ลบสินค้า: เต็นท์สนามรุ่น A"
 */
export const saveAuditLog = async (action, details) => {
    const user = auth.currentUser;
    
    if (!user) {
        console.warn("No authenticated admin found for logging.");
        return;
    }

    try {
        await addDoc(collection(db, "auditLogs"), {
            adminId: user.uid,
            adminName: user.displayName || "Admin", // ดึงจาก Profile ที่คุณส่งมา
            adminEmail: user.email,
            action: action,
            details: details,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to save audit log:", error);
    }
};