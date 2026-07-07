import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, setDoc, getDoc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from './AuthContext';
import { generateId, calculateStreak, recordStreakDay } from '../utils/helpers';

const TaskContext = createContext(null);

const DEFAULT_CATEGORIES = ['Personal', 'Work', 'Study', 'Health', 'Shopping', 'Finance'];
const DEFAULT_SETTINGS   = { notifications: true };

// ── localStorage helpers (only for dark mode preference — stays local) ────────
function readLS(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function TaskProvider({ children }) {
  const { profile } = useAuth();
  const uid = profile?.uid;

  // ── Firestore paths ───────────────────────────────────────────────────────
  // users/{uid}            → user meta doc (categories, settings, completedDates)
  // users/{uid}/tasks/{id} → individual task docs
  const userDocRef   = uid ? doc(db, 'users', uid) : null;
  const tasksColRef  = uid ? collection(db, 'users', uid, 'tasks') : null;

  // ── State ─────────────────────────────────────────────────────────────────
  const [tasks,          setTasks]          = useState([]);
  const [categories,     setCategories]     = useState(DEFAULT_CATEGORIES);
  const [completedDates, setCompletedDates] = useState([]);
  const [settings,       setSettings]       = useState(DEFAULT_SETTINGS);
  const [darkMode,       setDarkMode]       = useState(() => readLS('df_dark_mode', false));
  const [loading,        setLoading]        = useState(true);

  // Keep ref to unsubscribe functions so we can clean them up
  const unsubTasksRef = useRef(null);

  // ── Apply dark mode to <html> ─────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    writeLS('df_dark_mode', darkMode);
  }, [darkMode]);

  const applyDarkMode = useCallback((val) => setDarkMode(val), []);

  // ── Load user meta (categories, settings, completedDates) from Firestore ──
  const loadUserMeta = useCallback(async (userRef) => {
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.categories)     setCategories(data.categories);
        if (data.settings)       setSettings(data.settings);
        if (data.completedDates) setCompletedDates(data.completedDates);
      } else {
        // First time — create the user meta doc with defaults
        await setDoc(userRef, {
          categories:     DEFAULT_CATEGORIES,
          settings:       DEFAULT_SETTINGS,
          completedDates: [],
          createdAt:      serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('Failed to load user meta:', err);
    }
  }, []);

  // ── Subscribe to tasks collection (real-time) ─────────────────────────────
  useEffect(() => {
    // Unsubscribe previous listener if uid changed
    if (unsubTasksRef.current) {
      unsubTasksRef.current();
      unsubTasksRef.current = null;
    }

    if (!uid || !userDocRef || !tasksColRef) {
      // Logged out — reset state
      setTasks([]);
      setCategories(DEFAULT_CATEGORIES);
      setCompletedDates([]);
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Load user meta (categories, settings, completedDates)
    loadUserMeta(userDocRef);

    // Real-time listener on tasks sub-collection, ordered by createdAt desc
    const q = query(tasksColRef, orderBy('createdAt', 'desc'));
    unsubTasksRef.current = onSnapshot(
      q,
      (snapshot) => {
        const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setTasks(loaded);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore tasks listener error:', err);
        setLoading(false);
      }
    );

    return () => {
      if (unsubTasksRef.current) unsubTasksRef.current();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // ── Helper: persist user meta fields back to Firestore ────────────────────
  const persistMeta = useCallback(async (patch) => {
    if (!userDocRef) return;
    try { await setDoc(userDocRef, patch, { merge: true }); }
    catch (err) { console.warn('Failed to persist user meta:', err); }
  }, [userDocRef]);

  // ── CRUD — Tasks ──────────────────────────────────────────────────────────

  const addTask = useCallback(async (taskData) => {
    if (!tasksColRef) return;
    const newTask = {
      completed:   false,
      archived:    false,
      completedAt: null,
      createdAt:   serverTimestamp(),
      ...taskData,
    };
    try {
      const ref = await addDoc(tasksColRef, newTask);
      if (settings.notifications) toast.success('✅ Task added successfully!');
      if (uid) {
        recordStreakDay(uid);
      }
      return { id: ref.id, ...newTask };
    } catch (err) {
      toast.error('Failed to add task.');
      console.error(err);
    }
  }, [tasksColRef, settings.notifications]);

  const updateTask = useCallback(async (id, updates) => {
    if (!tasksColRef) return;
    try {
      await updateDoc(doc(tasksColRef, id), updates);
      if (settings.notifications) toast.info('✏️ Task updated!');
    } catch (err) {
      toast.error('Failed to update task.');
      console.error(err);
    }
  }, [tasksColRef, settings.notifications]);

  const deleteTask = useCallback(async (id) => {
    if (!tasksColRef) return;
    try {
      await deleteDoc(doc(tasksColRef, id));
      if (settings.notifications) toast.error('🗑️ Task deleted.');
    } catch (err) {
      toast.error('Failed to delete task.');
      console.error(err);
    }
  }, [tasksColRef, settings.notifications]);

  const toggleComplete = useCallback(async (id) => {
    if (!tasksColRef) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const completing = !task.completed;
    const updates = completing
      ? { completed: true,  completedAt: new Date().toISOString() }
      : { completed: false, completedAt: null };

    try {
      await updateDoc(doc(tasksColRef, id), updates);

      if (completing) {
        const newDates = [...completedDates, new Date().toISOString()];
        setCompletedDates(newDates);
        await persistMeta({ completedDates: newDates });
        if (settings.notifications) toast.success('🎉 Task completed!');
      } else {
        if (settings.notifications) toast.info('↩️ Task marked as pending.');
      }
    } catch (err) {
      toast.error('Failed to update task.');
      console.error(err);
    }
  }, [tasksColRef, tasks, completedDates, persistMeta, settings.notifications]);

  const archiveTask = useCallback(async (id) => {
    if (!tasksColRef) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      await updateDoc(doc(tasksColRef, id), { archived: !task.archived });
      toast.info('📦 Task archived.');
    } catch (err) {
      toast.error('Failed to archive task.');
    }
  }, [tasksColRef, tasks]);

  const duplicateTask = useCallback(async (id) => {
    const original = tasks.find(t => t.id === id);
    if (!original) return;
    const { id: _id, createdAt, completedAt, ...rest } = original;
    await addTask({ ...rest, title: `${rest.title} (Copy)`, completed: false });
  }, [tasks, addTask]);

  const reorderTasks = useCallback((newOrder) => {
    // Optimistic local reorder (Firestore order is by createdAt; this is visual only)
    setTasks(newOrder);
  }, []);

  const deleteAllTasks = useCallback(async () => {
    if (!tasksColRef) return;
    try {
      await Promise.all(tasks.map(t => deleteDoc(doc(tasksColRef, t.id))));
      // Reset completedDates too
      setCompletedDates([]);
      await persistMeta({ completedDates: [] });
      toast.error('All tasks deleted.');
    } catch (err) {
      toast.error('Failed to delete all tasks.');
    }
  }, [tasksColRef, tasks, persistMeta]);

  const importTasks = useCallback(async (imported) => {
    if (!tasksColRef) return;
    try {
      if (imported.tasks) {
        await Promise.all(
          imported.tasks.map(t => {
            const { id, ...rest } = t;
            return addDoc(tasksColRef, { ...rest, createdAt: serverTimestamp() });
          })
        );
      }
      if (imported.categories) {
        setCategories(imported.categories);
        await persistMeta({ categories: imported.categories });
      }
      toast.success('📥 Data imported successfully!');
    } catch (err) {
      toast.error('Import failed.');
    }
  }, [tasksColRef, persistMeta]);

  // ── Categories ────────────────────────────────────────────────────────────
  const addCategory = useCallback(async (cat) => {
    if (categories.includes(cat)) return;
    const next = [...categories, cat];
    setCategories(next);
    await persistMeta({ categories: next });
    toast.success(`📁 Category "${cat}" added!`);
  }, [categories, persistMeta]);

  // ── Settings ──────────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    await persistMeta({ settings: next });
  }, [settings, persistMeta]);

  const streak = calculateStreak(completedDates);

  return (
    <TaskContext.Provider value={{
      tasks, categories, settings, darkMode, streak, completedDates, loading,
      addTask, updateTask, deleteTask, toggleComplete,
      archiveTask, duplicateTask, reorderTasks,
      addCategory, deleteAllTasks, importTasks,
      updateSettings, applyDarkMode,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTask must be used within TaskProvider');
  return ctx;
}
