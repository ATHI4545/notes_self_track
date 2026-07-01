import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/firebaseConfig';

const AuthContext = createContext(null);

export const AVATARS = ['🧑‍💻', '👩‍💼', '🧑‍🎓', '👨‍🎨', '🧑‍🔬', '👩‍🏫', '🧙', '🦸', '🧑‍🚀', '🎯'];

function mapFirebaseError(code) {
  switch (code) {
    case 'auth/email-already-in-use':   return 'This email is already registered.';
    case 'auth/invalid-email':          return 'Please enter a valid email address.';
    case 'auth/weak-password':          return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':         return 'No account found with this email.';
    case 'auth/wrong-password':         return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':     return 'Invalid email or password.';
    case 'auth/too-many-requests':      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    case 'auth/user-disabled':          return 'This account has been disabled.';
    default:                            return 'Something went wrong. Please try again.';
  }
}

// ── Default extended profile shape ──────────────────────────────────────────
const DEFAULT_EXTENDED = {
  profileImageUrl: '',
  resumeUrl:       '',
  portfolioUrl:    '',
  cgpa:            '',
  course:          '',
  dob:             '',
  leetcodeUsername: '',
};

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [extProfile, setExtProfile] = useState(DEFAULT_EXTENDED);

  // ── Listen for Firebase auth state + fetch Firestore profile ────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchExtProfile(firebaseUser.uid);
      } else {
        setExtProfile(DEFAULT_EXTENDED);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Fetch extended profile from Firestore ────────────────────────────────────
  const fetchExtProfile = async (uid) => {
    try {
      const ref  = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setExtProfile({
          profileImageUrl: data.profileImageUrl || '',
          resumeUrl:       data.resumeUrl       || '',
          portfolioUrl:    data.portfolioUrl    || '',
          cgpa:            data.cgpa            || '',
          course:          data.course          || '',
          dob:             data.dob             || '',
          leetcodeUsername: data.leetcodeUsername || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch extended profile:', err);
    }
  };

  // ── Computed profile merging Firebase Auth + Firestore extended fields ───────
  const profile = user
    ? {
        name:            user.displayName || '',
        email:           user.email       || '',
        avatar:          user.photoURL    || '🧑‍💻',
        uid:             user.uid,
        joinedDate:      user.metadata?.creationTime || new Date().toISOString(),
        // Extended fields from Firestore
        profileImageUrl: extProfile.profileImageUrl,
        resumeUrl:       extProfile.resumeUrl,
        portfolioUrl:    extProfile.portfolioUrl,
        cgpa:            extProfile.cgpa,
        course:          extProfile.course,
        dob:             extProfile.dob,
        leetcodeUsername: extProfile.leetcodeUsername,
      }
    : {
        name: '', email: '', avatar: '🧑‍💻', uid: null, joinedDate: null,
        ...DEFAULT_EXTENDED,
      };

  // ── Signup ───────────────────────────────────────────────────────────────────
  const signup = async ({ name, email, password, avatar }) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await fbUpdateProfile(credential.user, {
        displayName: name,
        photoURL:    avatar || '🧑‍💻',
      });
      // Create initial Firestore user document
      await setDoc(doc(db, 'users', credential.user.uid), {
        name,
        email,
        avatar:          avatar || '🧑‍💻',
        createdAt:       new Date().toISOString(),
        ...DEFAULT_EXTENDED,
      }, { merge: true });

      setUser({ ...credential.user, displayName: name, photoURL: avatar || '🧑‍💻' });
      return { success: true };
    } catch (err) {
      return { success: false, error: mapFirebaseError(err.code) };
    }
  };

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = async ({ email, password }) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      return { success: false, error: mapFirebaseError(err.code) };
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = async () => { await signOut(auth); };

  // ── Upload profile image to Firebase Storage → return download URL ───────────
  const uploadProfileImage = async (file) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop() || 'jpg';
    const storageRef = ref(storage, `users/${auth.currentUser.uid}/profile.${ext}`);
    const snapshot = await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
    return getDownloadURL(snapshot.ref);
  };

  // ── Upload resume PDF to Cloudinary → return download URL ──────────────────
  const uploadResumePdf = async (file) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      throw new Error('Only PDF files are accepted');
    }
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing in .env');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    // Using auto resource_type so Cloudinary processes it correctly as a PDF document
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || 'Failed to upload to Cloudinary');
    }

    const data = await res.json();
    return data.secure_url || data.url;
  };

  // ── Update profile (Firebase Auth + Firestore) ───────────────────────────────
  const updateProfile = async (updates) => {
    if (!auth.currentUser) return;

    // 1. Update Firebase Auth fields (name & avatar)
    const authPatch = {};
    if (updates.name   !== undefined) authPatch.displayName = updates.name;
    if (updates.avatar !== undefined) authPatch.photoURL    = updates.avatar;
    if (Object.keys(authPatch).length > 0) {
      await fbUpdateProfile(auth.currentUser, authPatch);
      setUser(prev => ({ ...prev, ...authPatch }));
    }

    // 2. Write extended fields to Firestore
    const firestorePatch = {};
    const extFields = ['profileImageUrl', 'resumeUrl', 'portfolioUrl', 'cgpa', 'course', 'dob', 'leetcodeUsername'];
    extFields.forEach(key => {
      if (updates[key] !== undefined) {
        firestorePatch[key] = updates[key]; // base64 compressed images are allowed (~20-50 KB)
      }
    });
    if (updates.name)  firestorePatch.name  = updates.name;
    if (updates.email) firestorePatch.email = updates.email;

    if (Object.keys(firestorePatch).length > 0) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { ...firestorePatch, updatedAt: new Date().toISOString() }, { merge: true });
      setExtProfile(prev => ({ ...prev, ...firestorePatch }));
    }
  };

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{
      user, profile, isLoggedIn, loading,
      login, signup, logout, updateProfile, uploadProfileImage, uploadResumePdf,
      AVATARS,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
