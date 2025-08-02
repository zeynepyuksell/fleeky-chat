import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyCOI6SpLFEtUNHhLTplcMy0n4K0WnwF1aE",
  authDomain: "fleekychat.firebaseapp.com",
  projectId: "fleekychat",
  storageBucket: "fleekychat.appspot.com",
  messagingSenderId: "206205265774",
  appId: "1:206205265774:web:a9b309c34b92bfd143c37f",
  measurementId: "G-D50WNE73DN",
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 