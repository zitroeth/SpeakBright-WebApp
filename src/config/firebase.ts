// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBHA7H1TQZsuTG_vlIGivUxNugdmtsGJIA",
    authDomain: "speakbright-55025.firebaseapp.com",
    projectId: "speakbright-55025",
    storageBucket: "speakbright-55025.appspot.com",
    messagingSenderId: "823994313736",
    appId: "1:823994313736:web:454204b939ce50f978f5bd",
    measurementId: "G-WCLN8CHT2C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const auth: Auth = getAuth(app);
export const secondaryAuth: Auth = getAuth(secondaryApp);
export const db: Firestore = getFirestore(app);
// const analytics = getAnalytics(app);