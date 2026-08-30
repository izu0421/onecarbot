// Same Firebase project as app.html and the website — onecarbon-app.
// Do not point this at a second project: PROFILE participants must land in the
// same users/<uid> tree whether they use the web app or this one.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAScLolCIgz4im2fR4QgYkGyZMuR14O7MI',
  authDomain: 'onecarbon-app.firebaseapp.com',
  projectId: 'onecarbon-app',
  storageBucket: 'onecarbon-app.firebasestorage.app',
  messagingSenderId: '27710515098',
  appId: '1:27710515098:web:838eeda8b3978ea9cd3c23',
  measurementId: 'G-MT11J77CNR',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// On web, getAuth() persists in localStorage on its own. In React Native there is
// no localStorage, so without AsyncStorage persistence the user is signed out
// every cold start — initializeAuth throws if called twice, hence the fallback.
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
