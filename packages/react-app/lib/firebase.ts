// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getDatabase } from "firebase/database";




const firebaseConfig = {
    apiKey: "AIzaSyBvv2vMLgacfTYA-vjO9-o4NdVuMO64N3s",
    authDomain: "sanddrop-32496.firebaseapp.com",
    projectId: "sanddrop-32496",

    // 🔥 ADD THIS (MOST IMPORTANT)
    databaseURL: "https://sanddrop-32496-default-rtdb.asia-southeast1.firebasedatabase.app",


    storageBucket: "sanddrop-32496.firebasestorage.app",
    messagingSenderId: "220945597047",
    appId: "1:220945597047:web:1ea931fb68294dc31ffc72",
    measurementId: "G-048ZVGK2PW"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// ------------------------------------------------------------
// 🔥 WAIT FOR AUTH BEFORE ALLOWING DATABASE ACCESS
// ------------------------------------------------------------

let resolveAuthReady: () => void;
export const authReady = new Promise<void>((resolve) => {
    resolveAuthReady = resolve;
});

// Start Anonymous Login
signInAnonymously(auth).catch((err) => {
    console.error("❌ Anonymous auth failed:", err);
});

// When auth finishes → unlock database
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✔ Firebase Anonymous Auth Ready → UID:", user.uid);
        console.log("AUTH STATE:", user);
        resolveAuthReady();
    }
});
