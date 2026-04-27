import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCHChR54xUn9_fgdnPeJyC0cL-SZKvYtHI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "citrus-5589a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "citrus-5589a",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "citrus-5589a.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "493811785650",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || "1:493811785650:web:f9196de40f6bdebe630eab",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-26VJ68B4LK",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  return result.user;
}
