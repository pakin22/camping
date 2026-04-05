// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore"; // <-- เพิ่มบรรทัดนี้
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDmg-w_IWbKL5gxWbn8p-jsV39WDxlol8g",
  authDomain: "camping-87acf.firebaseapp.com",
  projectId: "camping-87acf",
  storageBucket: "camping-87acf.firebasestorage.app",
  messagingSenderId: "1077998808700",
  appId: "1:1077998808700:web:0e3a1f90efc8866ba5e3f9",
  measurementId: "G-6T99CEX4XF"
};

const app = initializeApp(firebaseConfig);

// 1. Export Auth (สำหรับ SignIn/SignUp)
export const auth = getAuth(app);

// 2. Export Firestore Database (สำหรับเก็บข้อมูลสินค้า) <-- เพิ่มบรรทัดนี้
export const db = getFirestore(app);

export const storage = getStorage(app);

