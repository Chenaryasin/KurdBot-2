import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBi81-ilTD5ieqH1ogpRFqMnDSrrI4eKB0",
  authDomain: "kurdmaster-501bb.firebaseapp.com",
  projectId: "kurdmaster-501bb",
  storageBucket: "kurdmaster-501bb.firebasestorage.app",
  messagingSenderId: "985327762308",
  appId: "1:985327762308:web:c7e65935028fa751a77bd1",
  measurementId: "G-Z6Q05J1SK6"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
