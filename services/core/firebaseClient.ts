import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDxuhBf4ZnmWSrrhxYef0KcXrIvIiYcoe4",
  authDomain: "seedlingsmicrogreenwebsite.firebaseapp.com",
  projectId: "seedlingsmicrogreenwebsite",
  storageBucket: "seedlingsmicrogreenwebsite.firebasestorage.app",
  messagingSenderId: "694969011092",
  appId: "1:694969011092:web:0834f33510c8eeab2a9d81",
  measurementId: "G-NSJK47RJEH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ THIS LINE
export const auth = getAuth(app);
