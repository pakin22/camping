import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { Routes, Route, Navigate } from "react-router-dom"; 
import Home from './components/Home.jsx';
import SignIn from './components/SignIn.jsx';
import SignUp from './components/SignUp.jsx';
import Checkout from './components/Checkout';
import Shop from './components/Shop.jsx'; 
import { useAuthStatus } from "./hooks/useAuthStatus"; 
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import ProductDetail from './components/ProductDetail';
import ForgotPassword from './components/ForgotPassword';
// ฟังก์ชันป้องกัน Guest (ถ้าไม่มี User ให้เด้งไป Sign In)
const ProtectedRoute = ({ children, user }) => user ? children : <Navigate to="/signin" replace />;

// ฟังก์ชันป้องกันคนที่ Login แล้ว (ถ้า Login แล้วไม่ควรเข้าหน้า Sign In/Up ได้อีก)
const AuthRoute = ({ children, user }) => user ? <Navigate to="/" replace /> : children;

function App() {
  const { user, isLoading } = useAuthStatus();
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // --- ฟังก์ชันจัดการตระกร้าสินค้า ---
  // --- ฟังก์ชันจัดการตระกร้าสินค้า (แก้ไขใหม่) ---
const addToCart = (productWithOption) => {
  setCart((prevCart) => {
    // ใช้ cartId ในการเช็ค (ซึ่งคือ id-color-size จาก ProductDetail)
    const existingItem = prevCart.find((item) => item.cartId === productWithOption.cartId);
    
    if (existingItem) {
      return prevCart.map((item) =>
        item.cartId === productWithOption.cartId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
    }
    // ถ้ายังไม่มี ให้เพิ่มเข้าไปเป็นรายการใหม่
    return [...prevCart, { ...productWithOption, quantity: 1 }];
  });
};

const removeFromCart = (cartId) => {
  // เปลี่ยนจาก productId เป็น cartId
  setCart((prevCart) => prevCart.filter((item) => item.cartId !== cartId));
};

const updateQuantity = (cartId, amount) => {
  // เปลี่ยนจาก productId เป็น cartId
  setCart((prevCart) =>
    prevCart.map((item) => {
      if (item.cartId === cartId) {
        const newQuantity = item.quantity + amount;
        return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
      }
      return item;
    })
  );
};
  
  // ใน App.js
useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
            // 🛑 เมื่อไม่มีผู้ใช้ (Logged Out) ให้ล้างข้อมูลทันที
            setCart([]);
            setFavorites([]);
        }
    });
    return () => unsubscribe();
}, []);

  // 🔥 เพิ่มฟังก์ชันล้างตะกร้า (ใช้หลังสั่งซื้อสำเร็จ)
  const clearCart = () => setCart([]);

  // --- ฟังก์ชันจัดการรายการโปรด ---
  const toggleFavorite = (product) => {
    setFavorites((prevFavorites) => {
      const isExist = prevFavorites.find((item) => item.id === product.id);
      if (isExist) return prevFavorites.filter((item) => item.id !== product.id);
      return [...prevFavorites, product];
    });
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Prompt' }}>กำลังตรวจสอบสถานะ...</div>;

  return (
    <Routes>
      <Route path="/" element={
        <Home 
          user={user} cart={cart} addToCart={addToCart} 
          removeFromCart={removeFromCart} updateQuantity={updateQuantity} 
          favorites={favorites} toggleFavorite={toggleFavorite} 
        /> 
      } />

      <Route path="/shop" element={
        <Shop 
          user={user} cart={cart} addToCart={addToCart} 
          removeFromCart={removeFromCart} updateQuantity={updateQuantity} 
          favorites={favorites} toggleFavorite={toggleFavorite} 
        />
      } />

      {/* 🔒 หน้า Checkout (ต้อง Login เท่านั้น) */}
      <Route path="/checkout" element={
        <ProtectedRoute user={user}>
          <Checkout 
            user={user} 
            cart={cart} 
            clearCart={clearCart} // 🔥 ส่งฟังก์ชันเคลียร์ตะกร้า
            removeFromCart={removeFromCart} 
            updateQuantity={updateQuantity} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite} 
          />
        </ProtectedRoute>
      } />

      {/* 🔒 หน้า Admin (ต้อง Login เท่านั้น) */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute user={user}>
          <AdminDashboard user={user} />
        </ProtectedRoute>
      } />
      <Route 
        path="/product/:id" 
        element={
          <ProductDetail 
            user={user} 
            cart={cart}
            addToCart={addToCart} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
          />
        } 
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/signin" element={<AuthRoute user={user}><SignIn /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute user={user}><SignUp /></AuthRoute>} />
      <Route path="*" element={<div style={{ textAlign: 'center', padding: '50px' }}>404 Not Found</div>} />
      <Route path="/profile" element={
      <ProtectedRoute user={user}>
        <Profile 
            user={user} 
            cart={cart} 
            addToCart={addToCart} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite} 
        />
    </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;