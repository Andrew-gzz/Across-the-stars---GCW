// scripts/config/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getDatabase, ref, set, onValue, get, remove, onDisconnect, update } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCv9ozuErOZvKwBXPaCfpqvPUpUeHu21BA",
    authDomain: "across-the-stars-e6675.firebaseapp.com",
    databaseURL: "https://across-the-stars-e6675-default-rtdb.firebaseio.com",
    projectId: "across-the-stars-e6675",
    storageBucket: "across-the-stars-e6675.firebasestorage.app",
    messagingSenderId: "558057367472",
    appId: "1:558057367472:web:68896f5c2b88b33cadd875"
};

// Inicializar Firebase UNA SOLA VEZ
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// Exportar todo lo necesario
export { 
    auth, 
    db, 
    provider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged, 
    ref, 
    set, 
    onValue, 
    get, 
    remove, 
    onDisconnect,
    update
};

// Verificar si el usuario está logueado
export function getCurrentUser() {
    return auth.currentUser;
}

// Esperar a que Firebase cargue el estado de auth
export function waitForAuth() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

console.log("Firebase inicializado correctamente");