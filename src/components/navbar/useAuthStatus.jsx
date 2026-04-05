import { useState, useEffect } from "react";
import { auth, db } from "../firebase"; // ตรวจสอบ path ให้ถูก
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const useAuthStatus = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // ดึงข้อมูล Role จาก Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // รวมข้อมูล Auth + ข้อมูลใน Firestore (รวมถึง role: 'admin')
            console.log("Hook ดึงข้อมูลเสริมสำเร็จ:", userData);
            setUser({ ...firebaseUser, ...userDoc.data() });
          } else {
            setUser(firebaseUser);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isLoading };
};