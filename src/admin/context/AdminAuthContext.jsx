import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebase/firebaseConfig';

const AdminAuthContext = createContext(null);

function mapFirebaseError(code) {
  switch (code) {
    case 'auth/invalid-email':          return 'Please enter a valid email address.';
    case 'auth/user-not-found':         return 'No admin account found with this email.';
    case 'auth/wrong-password':         return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':     return 'Invalid email or password.';
    case 'auth/too-many-requests':      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    case 'auth/user-disabled':          return 'This account has been disabled.';
    default:                            return 'Something went wrong. Please try again.';
  }
}

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser]       = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading]           = useState(true);

  const fetchAdminProfile = async (firebaseUser) => {
    const adminRef  = doc(db, 'admin', firebaseUser.uid);
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      const data = adminSnap.data();
      setAdminUser(firebaseUser);
      setAdminProfile({
        name:            data.name            || firebaseUser.email,
        designation:     data.designation     || 'Administrator',
        profileImageUrl: data.profileImageUrl || '',
        mentees:         data.mentees         || [],
        email:           firebaseUser.email,
        uid:             firebaseUser.uid,
      });
      return true;
    }
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isAdmin = await fetchAdminProfile(firebaseUser);
        if (!isAdmin) {
          setAdminUser(null);
          setAdminProfile(null);
        }
      } else {
        setAdminUser(null);
        setAdminProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const adminLogin = async ({ email, password }) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const adminRef   = doc(db, 'admin', credential.user.uid);
      const adminSnap  = await getDoc(adminRef);
      if (!adminSnap.exists()) {
        await signOut(auth);
        return { success: false, error: 'Access denied. This account is not an admin.' };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: mapFirebaseError(err.code) };
    }
  };

  const adminLogout = async () => {
    await signOut(auth);
    setAdminUser(null);
    setAdminProfile(null);
  };

  // ── Upload admin profile image ───────────────────────────────────────────────
  const uploadAdminProfileImage = async (file) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop() || 'jpg';
    const storageRef = ref(storage, `admin/${auth.currentUser.uid}/profile.${ext}`);
    const snapshot = await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
    return getDownloadURL(snapshot.ref);
  };

  // ── Update admin profile fields ──────────────────────────────────────────────
  const updateAdminProfile = async (updates) => {
    if (!auth.currentUser) return;
    const adminRef = doc(db, 'admin', auth.currentUser.uid);
    await setDoc(adminRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    setAdminProfile(prev => ({ ...prev, ...updates }));
  };

  // ── Add mentee by email ──────────────────────────────────────────────────────
  const addMentee = async (email) => {
    if (!auth.currentUser) return { success: false, error: 'Not authenticated' };
    const trimEmail = email.trim().toLowerCase();
    // Check if already added
    if ((adminProfile?.mentees || []).includes(trimEmail)) {
      return { success: false, error: 'This student is already in your mentees list.' };
    }
    // Check if user exists in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', trimEmail));
    const snap = await getDocs(q);
    if (snap.empty) {
      return { success: false, error: 'No student found with this email. Make sure they have signed up.' };
    }
    // Add to mentees array
    const adminRef = doc(db, 'admin', auth.currentUser.uid);
    await setDoc(adminRef, { mentees: arrayUnion(trimEmail) }, { merge: true });
    setAdminProfile(prev => ({ ...prev, mentees: [...(prev.mentees || []), trimEmail] }));
    return { success: true, student: { uid: snap.docs[0].id, ...snap.docs[0].data() } };
  };

  // ── Remove mentee by email ───────────────────────────────────────────────────
  const removeMentee = async (email) => {
    if (!auth.currentUser) return;
    const adminRef = doc(db, 'admin', auth.currentUser.uid);
    await setDoc(adminRef, { mentees: arrayRemove(email) }, { merge: true });
    setAdminProfile(prev => ({ ...prev, mentees: (prev.mentees || []).filter(e => e !== email) }));
  };

  // ── Fetch all mentees' user data ─────────────────────────────────────────────
  const fetchMenteesData = async () => {
    if (!adminProfile?.mentees?.length) return [];
    const usersRef = collection(db, 'users');
    const batches = [];
    const emails = adminProfile.mentees;
    // Firestore 'in' supports up to 10 items per query
    for (let i = 0; i < emails.length; i += 10) {
      const batch = emails.slice(i, i + 10);
      const q = query(usersRef, where('email', 'in', batch));
      batches.push(getDocs(q));
    }
    const results = await Promise.all(batches);
    const students = [];
    results.forEach(snap => snap.docs.forEach(d => students.push({ uid: d.id, ...d.data() })));
    return students;
  };

  const isAdminLoggedIn = !!adminUser;

  return (
    <AdminAuthContext.Provider value={{
      adminUser, adminProfile, isAdminLoggedIn, loading,
      adminLogin, adminLogout,
      updateAdminProfile, uploadAdminProfileImage,
      addMentee, removeMentee, fetchMenteesData,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
