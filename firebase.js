// firebase.js — Firebase project connection
//
// عشان الموقع يشتغل، لازم تعمل مشروع Firebase مجاني وتحط بياناته هنا.
// خطوات إنشاء المشروع موجودة في README.md.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
