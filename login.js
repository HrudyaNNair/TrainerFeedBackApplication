 import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDwWHsh_WJYgtUwR_BYvyMhZyW6srMWmCM",
  authDomain: "feedback-system-7877f.firebaseapp.com",
   
  projectId: "feedback-system-7877f",
  storageBucket: "feedback-system-7877f.appspot.com", // 🔥 should be `.appspot.com`, not `.app`
  messagingSenderId: "839552435361",
  appId: "1:839552435361:web:209d5f30fe8bc455155ce0",
 
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Forms
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

// Switch forms
showSignup.addEventListener("click", () => {
  loginForm.classList.remove("active");
  signupForm.classList.add("active");
});

showLogin.addEventListener("click", () => {
  signupForm.classList.remove("active");
  loginForm.classList.add("active");
});

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "index.html"; // redirect after login
  } catch (err) {
    document.getElementById("loginError").innerText = err.message;
  }
});

// Signup
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Signup successful! Please login.");
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
  } catch (err) {
    document.getElementById("signupError").innerText = err.message;
  }
});
