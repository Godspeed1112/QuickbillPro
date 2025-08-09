// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC7_tx_hQtE0UZDJ94yDOtY7nvkRX3TxSg",
  authDomain: "quickbillpro-41972.firebaseapp.com",
  projectId: "quickbillpro-41972",
  storageBucket: "quickbillpro-41972.firebasestorage.app",
  messagingSenderId: "261455927743",
  appId: "1:261455927743:web:f748664ce440636b7de90a",
  measurementId: "G-8M14WBGV8K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);