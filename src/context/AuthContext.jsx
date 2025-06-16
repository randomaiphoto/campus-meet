// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, googleProvider } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore"; // Added updateDoc

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const manageUserProfile = async (firebaseUser) => {
    if (!firebaseUser) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }
    const userRef = doc(db, "users", firebaseUser.uid);
    // setLoading(true); // Already set by onAuthStateChanged effect or initial state

    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        // User exists, merge auth data with Firestore data
        setCurrentUser({ ...firebaseUser, ...userSnap.data() });
      } else {
        // New user (e.g. via Google Sign-In, or if signup didn't complete update yet)
        const newUserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0], // Default name
          role: "student", // Default role
          createdAt: serverTimestamp(),
          course: "", // Initialize with empty strings
          year: "",
          mobileNo: "",
        };
        await setDoc(userRef, newUserProfile);
        // For serverTimestamp, we either re-fetch or use an optimistic local date for UI
        setCurrentUser({ ...firebaseUser, ...newUserProfile, createdAt: new Date() });
      }
    } catch (error) {
      console.error("Error managing user profile:", error);
      setCurrentUser(firebaseUser); // Fallback to Firebase user data
    } finally {
      setLoading(false);
    }
  };

  // Modified signup to accept additionalData and merge it into the user's Firestore document
  async function signup(email, password, additionalData = {}) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      const userRef = doc(db, "users", userCredential.user.uid);
      try {
        // This will create or update the user document.
        // It ensures all fields from additionalData are added,
        // and essential fields like uid, email, role are also set/maintained.
        await setDoc(userRef, {
          uid: userCredential.user.uid, // Ensure uid is set
          email: userCredential.user.email, // Ensure email is set
          name: additionalData.name || userCredential.user.displayName || userCredential.user.email.split('@')[0],
          role: "student", // Ensure role is student by default on signup
          course: additionalData.course || "",
          year: additionalData.year || "",
          mobileNo: additionalData.mobileNo || "",
          createdAt: serverTimestamp(), // Set/update createdAt
        }, { merge: true }); // Use merge: true to avoid overwriting fields like an existing role if logic changes
      } catch (error) {
        console.error("Error saving additional user data to Firestore:", error);
        // The user is created in Firebase Auth, but Firestore update failed.
        // onAuthStateChanged will still call manageUserProfile which might recover or show basic info.
      }
    }
    return userCredential;
  }

  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // User profile fetching is handled by onAuthStateChanged via manageUserProfile
    return userCredential;
  }

  function logout() {
    return signOut(auth);
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // onAuthStateChanged will call manageUserProfile.
      // manageUserProfile handles new user creation using Google's displayName.
      // If user already exists, we might want to update their name if it changed in Google.
      const userRef = doc(db, "users", result.user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        const updates = {};
        if (result.user.displayName && result.user.displayName !== existingData.name) {
          updates.name = result.user.displayName;
        }
        // Potentially update email if it can change and is verified
        // if (result.user.email && result.user.email !== existingData.email) {
        //   updates.email = result.user.email;
        // }
        if (Object.keys(updates).length > 0) {
          await updateDoc(userRef, updates);
        }
      }
      // If doc doesn't exist, manageUserProfile will create it with Google's info.
    }
    return result;
  }

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        manageUserProfile(user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    loginWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
