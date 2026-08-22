import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Note: Firebase Web SDK config is designed to be public and shipped to the client.
// Security is handled by Firestore Security Rules, not by hiding the API key.
const firebaseConfig = {
  apiKey: "AIzaSyD19EOEBlOIW-hgafiCfXLw0SLnFBmrDoQ",
  authDomain: "faang-tracker-db.firebaseapp.com",
  projectId: "faang-tracker-db",
  storageBucket: "faang-tracker-db.firebasestorage.app",
  messagingSenderId: "759936923591",
  appId: "1:759936923591:web:5e44b5846f7c2850d70be2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
