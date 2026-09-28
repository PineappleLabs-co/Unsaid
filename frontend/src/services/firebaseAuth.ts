// Real Firebase & Google Authentication Service
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForGoogleAuthPopup',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'thought-catcher-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'thought-catcher-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'thought-catcher-app.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export interface GoogleAuthResult {
  token: string;
  user_id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

/**
 * Sign in using Firebase Google popup.
 * Throws clean, user-facing error messages on cancellation or configuration problems.
 * Does NOT silently swallow errors with fake fallbacks.
 */
export async function signInWithGoogleReal(): Promise<GoogleAuthResult> {
  // Check if API key is unconfigured dummy
  if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.includes('DummyKey')) {
    throw new Error(
      'Firebase credentials not configured yet. Please configure VITE_FIREBASE_API_KEY in Frontend/.env'
    );
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user: User = result.user;
    const token = await user.getIdToken();

    return {
      token,
      user_id: user.uid,
      email: user.email || 'user@example.com',
      displayName: user.displayName || user.email?.split('@')[0] || 'Google User',
      photoURL: user.photoURL || undefined,
    };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. Popup was closed before completion.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in popup is already open.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error(
        'Domain not authorized. Add current localhost domain to Firebase Console -> Auth -> Authorized domains.'
      );
    } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid') {
      throw new Error('Invalid Firebase API Key. Please verify VITE_FIREBASE_API_KEY.');
    }
    throw new Error(error.message || 'Google authentication failed.');
  }
}

export function getCurrentFirebaseUser(): User | null {
  return auth.currentUser;
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signOutFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn('Firebase signOut notice:', err);
  }
}
