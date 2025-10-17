
// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

 


const firebaseConfig = {
  apiKey: "AIzaSyDwWHsh_WJYgtUwR_BYvyMhZyW6srMWmCM",
  authDomain: "feedback-system-7877f.firebaseapp.com",
   
  projectId: "feedback-system-7877f",
  storageBucket: "feedback-system-7877f.appspot.com", // 🔥 should be `.appspot.com`, not `.app`
  messagingSenderId: "839552435361",
  appId: "1:839552435361:web:209d5f30fe8bc455155ce0",
 
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
