// entry.js

// Firebase configuration – replace these with your actual Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyDn4RsiRAE-BfiiJQpXey4G8RwUWmyZNmY",
  authDomain: "nebulacode-53d75.firebaseapp.com",
  projectId: "nebulacode-53d75",
  storageBucket: "nebulacode-53d75.firebasestorage.app",
  messagingSenderId: "161788071174",
  appId: "1:161788071174:web:63e2277959aae617f1a287"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();

// Reference to the "users" collection in Firestore.
const usersCollection = firestore.collection("users");

// Get DOM Elements
const cardContent = document.getElementById("card-content");
const loadingContainer = document.getElementById("loading-container");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const otpForm = document.getElementById("otp-form");
const errorMessage = document.getElementById("error-message");
const signupPhotoInput = document.getElementById("signup-photo");
const photoPreviewDiv = document.getElementById("photo-preview");
const toggleLoginBtn = document.getElementById("toggle-login");
const toggleSignupBtn = document.getElementById("toggle-signup");
const resendOtpBtn = document.getElementById("resend-otp");
const resendTimerElement = document.getElementById("resend-timer");

let generatedOTP = ""; // Will hold the generated OTP

// ------------------------------------------------------------
// Global Button Press Effect: add temporary visual feedback
// ------------------------------------------------------------
document.querySelectorAll("button").forEach(button => {
  button.addEventListener("mousedown", function () {
    this.classList.add("button-pressed");
  });
  button.addEventListener("mouseup", function () {
    this.classList.remove("button-pressed");
  });
  // For touch devices:
  button.addEventListener("touchstart", function () {
    this.classList.add("button-pressed");
  });
  button.addEventListener("touchend", function () {
    this.classList.remove("button-pressed");
  });
});

// ------------------------------------------------------------
// Function to start the resend OTP timer (60 seconds)
// ------------------------------------------------------------
function startResendTimer(duration) {
  let timer = duration;
  resendOtpBtn.disabled = true;
  resendTimerElement.textContent = timer;
  const countdown = setInterval(() => {
    timer--;
    resendTimerElement.textContent = timer;
    if (timer <= 0) {
      clearInterval(countdown);
      resendOtpBtn.disabled = false;
      resendTimerElement.textContent = "60";
    }
  }, 1000);
}

// ------------------------------------------------------------
// Toggle Between Login and Signup Forms
// ------------------------------------------------------------
toggleLoginBtn.addEventListener("click", () => {
  console.log("Switching to login form.");
  toggleLoginBtn.classList.add("active");
  toggleSignupBtn.classList.remove("active");
  loginForm.style.display = "block";
  signupForm.style.display = "none";
  otpForm.style.display = "none";
  errorMessage.textContent = "";
});

toggleSignupBtn.addEventListener("click", () => {
  console.log("Switching to signup form.");
  toggleSignupBtn.classList.add("active");
  toggleLoginBtn.classList.remove("active");
  signupForm.style.display = "block";
  loginForm.style.display = "none";
  otpForm.style.display = "none";
  errorMessage.textContent = "";
});

// ------------------------------------------------------------
// Profile Photo Preview on Signup
// ------------------------------------------------------------
signupPhotoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      photoPreviewDiv.innerHTML = `<img src="${ev.target.result}" alt="Profile Preview">`;
    };
    reader.readAsDataURL(file);
  } else {
    photoPreviewDiv.innerHTML = "";
  }
});

// ------------------------------------------------------------
// SIGNUP Process – Step 1: Generate OTP and Show OTP Form
// ------------------------------------------------------------
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  errorMessage.textContent = "";
  
  // Collect signup details
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  
  if (!name || !email || !password) {
    errorMessage.textContent = "Please fill out all required fields.";
    return;
  }
  
  // Simulate OTP generation (6-digit)
  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("Generated OTP:", generatedOTP);
  alert("OTP sent to your email (Simulation): " + generatedOTP);
  
  // Start the resend OTP timer for 60 seconds
  startResendTimer(60);
  
  // Hide signup form; show OTP form for verification.
  signupForm.style.display = "none";
  otpForm.style.display = "block";
});

// ------------------------------------------------------------
// Resend OTP Functionality
// ------------------------------------------------------------
resendOtpBtn.addEventListener("click", () => {
  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("Resent OTP:", generatedOTP);
  alert("OTP resent to your email (Simulation): " + generatedOTP);
  startResendTimer(60);
});

// ------------------------------------------------------------
// OTP Verification & Complete Registration
// ------------------------------------------------------------
otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.textContent = "";
  
  const enteredOTP = document.getElementById("otp-input").value.trim();
  console.log("Entered OTP:", enteredOTP);
  
  if (enteredOTP !== generatedOTP) {
    errorMessage.textContent = "Invalid OTP. Please try again.";
    return;
  }
  
  // OTP verified; obtain user information from the signup form
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const file = signupPhotoInput.files[0];
  
  try {
    // Create user with Firebase Authentication
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log("New user created:", user.uid);
    
    // Upload the profile photo if available, or use a default fallback.
    let photoURL = "";
    if (file) {
      const storageRef = storage.ref();
      const photoRef = storageRef.child(`profilePhotos/${user.uid}/${file.name}`);
      await photoRef.put(file);
      photoURL = await photoRef.getDownloadURL();
      console.log("Photo URL from Storage:", photoURL);
    } else {
      photoURL = "default-avatar.png"; // Ensure you have this image in your project.
      console.log("No photo uploaded; using default avatar.");
    }
    
    // Update the user's profile in Firebase Authentication
    console.log("Updating profile with:", { displayName: name, photoURL: photoURL });
    await user.updateProfile({
      displayName: name,
      photoURL: photoURL
    });
    console.log("Profile update called. Before reload:", user.displayName, user.photoURL);
    
    // Force a reload of the user data from Firebase.
    await user.reload();
    const currentUser = firebase.auth().currentUser;
    console.log("After reload:", currentUser.displayName, currentUser.photoURL);
    
    // Use fallback values if profile update did not propagate
    const finalDisplayName = currentUser.displayName || (name || email.split('@')[0] || "Anonymous");
    const finalPhotoURL = currentUser.photoURL || photoURL;
    console.log("Final values to store:", { finalDisplayName, finalPhotoURL, email });
    
    // Save additional user details in Firestore.
    await usersCollection.doc(user.uid).set({
      displayName: finalDisplayName,
      photoURL: finalPhotoURL,
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Sign out the user so that they must sign in afresh.
    await auth.signOut();
    alert("Registration successful! Please log in with your new credentials.");
    
    // Reset forms and clear OTP data.
    signupForm.reset();
    otpForm.reset();
    photoPreviewDiv.innerHTML = "";
    generatedOTP = "";
    
    // Switch back to the login form.
    loginForm.style.display = "block";
    signupForm.style.display = "none";
    otpForm.style.display = "none";
    toggleLoginBtn.classList.add("active");
    toggleSignupBtn.classList.remove("active");
    
  } catch (error) {
    console.error("Signup error:", error);
    if (error.code === "auth/email-already-in-use") {
      errorMessage.textContent = "This email is already registered. Please use the login form.";
    } else {
      errorMessage.textContent = error.message;
    }
  }
});

// ------------------------------------------------------------
// LOGIN Process with Full UI Replacement by Loading Animation
// ------------------------------------------------------------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.textContent = "";
  
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  
  if (!email || !password) {
    errorMessage.textContent = "Please enter both email and password.";
    return;
  }
  
  // Hide the entire interactive UI and show only the loading container
  cardContent.style.display = "none";
  loadingContainer.style.display = "block";
  
  console.log("Attempting login with:", email);
  
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log("Login successful for user:", user.uid);
    
    // Fetch additional user details from Firestore (or use the auth object values).
    const userDoc = await usersCollection.doc(user.uid).get();
    let displayName = user.displayName;
    let photoURL = user.photoURL;
    if (userDoc.exists) {
      const data = userDoc.data();
      displayName = data.displayName;
      photoURL = data.photoURL;
    }
    
    // Save user data for use in the redirected page.
    localStorage.setItem("user", JSON.stringify({
      uid: user.uid,
      displayName: displayName,
      photoURL: photoURL,
      email: user.email
    }));
    
    // Delay for about 2 seconds before redirecting.
    setTimeout(() => {
      window.location.href = "editor.html";
    }, 2000);
    
  } catch (error) {
    console.error("Login error:", error);
    errorMessage.textContent = (error.code === "auth/user-not-found") ?
      "No account found with that email. Please sign up." :
      (error.code === "auth/wrong-password" ?
        "Incorrect password. Please try again." : error.message);
    
    // On error, restore the interactive UI and hide the loading container.
    cardContent.style.display = "block";
    loadingContainer.style.display = "none";
  }
});

// ------------------------------------------------------------
// Auth State Listener (Optional for Debugging)
// ------------------------------------------------------------
auth.onAuthStateChanged((user) => {
  console.log(user ? "User is signed in: " + user.email : "No user is signed in.");
});