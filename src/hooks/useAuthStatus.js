import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export const useAuthStatus = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listener นี้จะถูกเรียกใช้เมื่อมีการ Sign In, Sign Up, หรือ Sign Out
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // เมื่อมีการ Sign Out, currentUser จะเป็น null
      console.log("Hook: สถานะผู้ใช้ล่าสุด:", currentUser ? 'LoggedIn' : 'LoggedOut'); 
      setUser(currentUser); 
      setIsLoading(false); 
    });

    // Cleanup function ต้องถูกเรียกใช้
    return unsubscribe; 
  }, []);

  return { user, isLoading };
};