import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDrNr-tISlCjKDhjVFm32mWHQ-PcPPJFAA",
    authDomain: "gt7-tuner.firebaseapp.com",
    projectId: "gt7-tuner",
    storageBucket: "gt7-tuner.firebasestorage.app",
    messagingSenderId: "741464755928",
    appId: "1:741464755928:web:0e0bfee5ba9097204491ad",
    measurementId: "G-KCQ5P613NT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
