// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getDatabase } from "firebase/database";




// =========================
// 🔥 ENV CONFIG
// =========================
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
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
