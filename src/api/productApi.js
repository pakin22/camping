// src/api/productApi.js

import { db } from '../firebase'; 
import { collection, addDoc,  serverTimestamp, } from 'firebase/firestore';

// 1. นำเข้าข้อมูลจำลองจากไฟล์ data (หรือประกาศไว้ที่นี่ถ้ายังไม่มีไฟล์แยก)
import { mockProducts } from '../data/products'; 

const productsCollectionRef = collection(db, 'products');

/**
 * ฟังก์ชันสำหรับเพิ่มสินค้าใหม่ (คงไว้เหมือนเดิมเพื่อใช้ในอนาคต)
 */
export const addProduct = async (productData) => {
  try {
    const newProduct = {
      ...productData,
      price: Number(productData.price),
      stock: Number(productData.stock),
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(productsCollectionRef, newProduct);
    return docRef.id;
  } catch (e) {
    console.error("Error adding product: ", e);
    throw new Error('Failed to add product.');
  }
};

/**
 * ฟังก์ชันดึงข้อมูลสินค้า (ปรับเป็นใช้ Mock Data)
 */
export const getProducts = async () => {
  try {
    // --- 🟢 ส่วน Mock Data: ใช้ตัวนี้เพื่อทำ Frontend ---
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockProducts); // ส่งข้อมูลจาก src/data/products.js ออกไป
      }, 500); // จำลองเวลาโหลด 0.5 วินาที
    });

    /* // --- 🔴 ส่วน Firebase ของจริง: ปิดไว้ก่อนจนกว่าจะมีข้อมูลจริงใน DB ---
    const q = query(productsCollectionRef, orderBy("price", "desc"));
    const querySnapshot = await getDocs(q);
    const productsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return productsList;
    */
    
  } catch (e) {
    console.error("Error fetching products: ", e);
    throw new Error('Failed to fetch products.'); 
  }
};