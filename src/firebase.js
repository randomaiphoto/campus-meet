// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC9rL_fWbfcuDugJ3R_PNwsHTsMbmRdEYE",
  authDomain: "project-88b11.firebaseapp.com",
  projectId: "project-88b11",
  storageBucket: "project-88b11.firebasestorage.app",
  messagingSenderId: "696039449077",
  appId: "1:696039449077:web:a6e80300f68c7bfecec0bc",
  measurementId: "G-SKW38ZCKLL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();