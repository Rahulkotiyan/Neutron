import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBF1M-Vd7CKV4ElfZyUt-HN4HAFwjlyOHk",
  authDomain: "neutron-55894.firebaseapp.com",
  projectId: "neutron-55894",
  storageBucket: "neutron-55894.firebasestorage.app",
  messagingSenderId: "655376177624",
  appId: "1:655376177624:web:13a9c03a10d9f5b2e83aad",
  measurementId: "G-R6Q1KZCFJQ",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
