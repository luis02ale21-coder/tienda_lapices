import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB3qNIw5EcS9GZM2OCLOdjja4St8AbLNgk",
    authDomain: "tiendalapices-40573.firebaseapp.com",
    projectId: "tiendalapices-40573",
    storageBucket: "tiendalapices-40573.firebasestorage.app",
    messagingSenderId: "121276264954",
    appId: "1:121276264954:web:9711e7f11539d215cef443",
    measurementId: "G-8KJ4DHMW3L"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);