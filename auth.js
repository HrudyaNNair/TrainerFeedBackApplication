import { app } from "./firebase-config.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } 
  from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const auth = getAuth(app);

// Handle Signup
document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Signup successful! You can now log in.");
  } catch (error) {
    alert(error.message);
  }
});

// Handle Login
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "index.html"; // redirect after login
  } catch (error) {
    alert(error.message);
  }
});
