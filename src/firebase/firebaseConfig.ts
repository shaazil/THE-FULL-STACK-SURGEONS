// firebaseConfig.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from 'firebase/auth';
// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp({
  apiKey: "AIzaSyBmrzOtpqaSFnet_Any8WY2wNcYdJPlMSE",
  authDomain: "medtranscribe-4b39c.firebaseapp.com",
  projectId: "medtranscribe-4b39c",
  storageBucket: "medtranscribe-4b39c.appspot.com", // FIXED URL
  messagingSenderId: "796524154020",
  appId: "1:796524154020:web:51461d190a984a5be1aa31"
}) : getApp();

const db = getFirestore(app);
const storage = getStorage(app);
export const auth = getAuth(app);
export { app, db, storage };
// // firebaseConfig.ts
// import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
// import { getStorage, connectStorageEmulator } from 'firebase/storage';
// import { getAuth, connectAuthEmulator } from 'firebase/auth';
// import Constants from 'expo-constants';


// // Get configuration from environment
// const getFirebaseConfig = () => {
//   // For production, use environment variables
//   if (Constants.expoConfig?.extra?.firebaseConfig) {
//     return Constants.expoConfig.extra.firebaseConfig;
//   }
  
//   // Fallback config if environment variables are not set
//   return {
//     apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY,
//     authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN,
//     projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID,
//     storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID,
//     appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID
//   };
// };

// // Initialize Firebase or get existing instance
// const initializeFirebase = () => {
//   try {
//     if (getApps().length === 0) {
//       const firebaseConfig = getFirebaseConfig();
      
//       // Validate config
//       const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
//       const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
      
//       if (missingFields.length > 0) {
//         console.error(`Missing required Firebase config fields: ${missingFields.join(', ')}`);
//         throw new Error('Invalid Firebase configuration');
//       }
      
//       return initializeApp(firebaseConfig);
//     } else {
//       return getApp();
//     }
//   } catch (error) {
//     console.error('Error initializing Firebase:', error);
//     throw error;
//   }
// };

// // Initialize Firebase
// const app = initializeFirebase();
// const auth = getAuth(app);
// const db = getFirestore(app);
// const storage = getStorage(app);

// // Connect to emulators in development if enabled
// if (__DEV__) {
//   const useEmulators = Constants.expoConfig?.extra?.USE_FIREBASE_EMULATORS === 'true';
  
//   if (useEmulators) {
//     try {
//       connectFirestoreEmulator(db, 'localhost', 8080);
//       connectStorageEmulator(storage, 'localhost', 9199);
//       connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
//       console.log('Connected to Firebase emulators');
//     } catch (error) {
//       console.warn('Failed to connect to Firebase emulators:', error);
//     }
//   }
// }

// export { app, auth, db, storage };