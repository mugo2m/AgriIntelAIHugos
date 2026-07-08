// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
//const firebaseConfig = {
 // apiKey: "AIzaSyCvmPHp2kHbLQbSqW73TxS9NmSCARDqhfM",
  //authDomain: "mugoai-3c70b.firebaseapp.com",
  //projectId: "mugoai-3c70b",
 // storageBucket: "mugoai-3c70b.firebasestorage.app",
 // messagingSenderId: "1044600296070",
 // appId: "1:1044600296070:web:558fde4ad9da314f2d3707",
  //measurementId: "G-PTTHK4M8KR"
//};
//const firebaseConfig = {
  //apiKey: "AIzaSyBmXBBPsa2GecsegkljuBTgFZUTicDaxWI",
  //authDomain: "hugos-aeebf.firebaseapp.com",
  //projectId: "hugos-aeebf",
  //storageBucket: "hugos-aeebf.firebasestorage.app",
  //messagingSenderId: "170860596112",
  //appId: "1:170860596112:web:c2fed1be25b3b4017ac115",
  //measurementId: "G-JPF2L3H08N"
//};
const firebaseConfig = {
  apiKey: "AIzaSyDymmvqyH4UAyy7GCkqSujO5aZBLM1OdJ0",
  authDomain: "agriculturehugo.firebaseapp.com",
  projectId: "agriculturehugo",
  storageBucket: "agriculturehugo.firebasestorage.app",
  messagingSenderId: "311517721134",
  appId: "1:311517721134:web:70c17935a7f6447fc9a5bf",
  measurementId: "G-8ZBCPYBGXM"
};
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);


// Initialize Firebase
//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);