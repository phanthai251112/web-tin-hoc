import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBTNqV64uDH4lCqbgYz3_c7YBwA7LCmTMw",
    authDomain: "tinhoc-1845e.firebaseapp.com",
    projectId: "tinhoc-1845e",
    storageBucket: "tinhoc-1845e.firebasestorage.app",
    messagingSenderId: "1057138431640",
    appId: "1:1057138431640:web:a5f7c257f8b3182e7da2ed",
    measurementId: "G-JKRLEH0B2T"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const DOMAIN = "@tinoc.com";
