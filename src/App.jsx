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

const ProtectedRoute = ({ children, user }) => user ? children : <Navigate to="/signin" replace />;
const AuthRoute = ({ children, user }) => user ? <Navigate to="/" replace /> : children;

function App() {
  const { user, isLoading } = useAuthStatus();
  
  // 1. กำหนดค่าเริ่มต้นโดยพยายามดึงจาก LocalStorage ก่อน
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('local-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [favorites, setFavorites] = useState(() => {
    const savedFavs = localStorage.getItem('local-favorites');
    return savedFavs ? JSON.parse(savedFavs) : [];
  });

  // 2. บันทึกข้อมูลลง LocalStorage ทุกครั้งที่ State เปลี่ยน
  useEffect(() => {
    localStorage.setItem('local-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('local-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // --- ฟังก์ชันจัดการตระกร้าสินค้า ---
  const addToCart = (productWithOption) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.cartId === productWithOption.cartId);
      if (existingItem) {
        return prevCart.map((item) =>
          item.cartId === productWithOption.cartId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { ...productWithOption, quantity: 1 }];
    });
  };

  const removeFromCart = (cartId) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, amount) => {
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
    
  // จัดการเคลียร์ข้อมูลเมื่อ Logout (ปรับปรุงให้เคลียร์ LocalStorage ด้วย)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
            setCart([]);
            setFavorites([]);
            localStorage.removeItem('local-cart');
            localStorage.removeItem('local-favorites');
        }
    });
    return () => unsubscribe();
  }, []);

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('local-cart');
  };

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

      <Route path="/checkout" element={
        <ProtectedRoute user={user}>
          <Checkout 
            user={user} 
            cart={cart} 
            clearCart={clearCart}
            removeFromCart={removeFromCart} 
            updateQuantity={updateQuantity} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite} 
          />
        </ProtectedRoute>
      } />

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