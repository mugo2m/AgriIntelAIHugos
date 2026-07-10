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
//const firebaseConfig = {
  //apiKey: "AIzaSyBWezc2M6Xf6NjVxeZRniRw3NI1yGYoXvU",
  //authDomain: "muuu-83639.firebaseapp.com",
  //projectId: "muuu-83639",
  //storageBucket: "muuu-83639.firebasestorage.app",
  //messagingSenderId: "930919430662",
  //appId: "1:930919430662:web:34d6601bc8b411e5f06187",
 //measurementId: "G-83EMBQ3XCJ"
//};
const firebaseConfig = {
  apiKey: "AIzaSyCTOjbCIof0D9C6p6uoIeLOpx0YvTtNY7Y",
  authDomain: "muiiti.firebaseapp.com",
  projectId: "muiiti",
  storageBucket: "muiiti.firebasestorage.app",
  messagingSenderId: "725849593046",
  appId: "1:725849593046:web:51ffd342ff53035e946577",
  measurementId: "G-FDYGKMQ9M4"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);


// Initialize Firebase
//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);