// js/firebase/firebase-auth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.innerText = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

function showAuthModal() { document.getElementById("auth-modal").style.display = "block"; }
function closeAuthModal() { document.getElementById("auth-modal").style.display = "none"; }
function toggleAuthModal() {
  const modal = document.getElementById("auth-modal");
  modal.style.display = modal.style.display === "block" ? "none" : "block";
}

async function modalSignUp() {
  const email = document.getElementById("modal-email").value.trim();
  const password = document.getElementById("modal-password").value.trim();
  const valid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
  if (!valid) { showToast("Password must meet all requirements listed."); return; }
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    closeAuthModal();
  } catch (e) { showToast("Something went wrong. Please try again."); console.error(e); }
}

async function modalLogin() {
  const email = document.getElementById("modal-email").value.trim();
  const password = document.getElementById("modal-password").value.trim();
  if (!email || !password) { showToast("Error: Please add your Credentials in the input fields above!!"); return; }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    closeAuthModal();
  } catch (error) {
    if (error.code === "auth/user-not-found") alert("Error: User does not exist, please sign up.");
    else if (error.code === "auth/invalid-credential") showToast("Error: Invalid credentials provided. Please check your email and password.");
    else alert(error.message);
  }
}

// Auth state -> show/hide account icon
window.addEventListener('DOMContentLoaded', () => {
  const accountBtn = document.getElementById("account-btn");
  if (!accountBtn) return;
  if (auth.currentUser) accountBtn.style.display = "none";
  auth.onAuthStateChanged(user => {
    accountBtn.style.display = user ? "none" : "inline-block";
  });
});

// expose
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.toggleAuthModal = toggleAuthModal;
window.modalSignUp = modalSignUp;
window.modalLogin = modalLogin;
window.showToast = showToast;