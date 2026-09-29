import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyD6ANRJhj4AIHwmyguhOZAQRXV7oKKCrWo",
  authDomain: "noxveil-arcanum.firebaseapp.com",
  projectId: "noxveil-arcanum",
  storageBucket: "noxveil-arcanum.firebasestorage.app",
  messagingSenderId: "565155224533",
  appId: "1:565155224533:web:b5a02aa183d4600840fb5c"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);