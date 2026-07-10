import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import ProtectedLayout from './components/ProtectedLayout';
import ChatBot from './components/ChatBot';
import { AdminAuthProvider } from './admin/context/AdminAuthContext';

// ── Lazy-loaded pages (each becomes its own chunk for code splitting) ─────────
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Certificates = lazy(() => import('./pages/Certificates'));
const Platforms = lazy(() => import('./pages/Platforms'));
const ProgrammingSheet = lazy(() => import('./pages/ProgrammingSheet'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Resources = lazy(() => import('./pages/Resources'));
const MentorConnect = lazy(() => import('./pages/MentorConnect'));

// ── Admin pages (lazy-loaded) ──────────────────────────────────────────────────
const AdminLogin            = lazy(() => import('./admin/pages/AdminLogin'));
const AdminDashboard        = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminStudents         = lazy(() => import('./admin/pages/AdminStudents'));
const AdminAssessment       = lazy(() => import('./admin/pages/AdminAssessment'));
const AdminStudentDB        = lazy(() => import('./admin/pages/AdminStudentDB'));
const AdminProfile          = lazy(() => import('./admin/pages/AdminProfile'));
const AdminSettings         = lazy(() => import('./admin/pages/AdminSettings'));
const AdminProtectedLayout  = lazy(() => import('./admin/components/AdminProtectedLayout'));

// ── Minimal full-screen loading fallback ──────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid rgba(99,102,241,0.25)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <AuthProvider>
        <TaskProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ── Public user routes ───────────────────────────── */}
                <Route path="/login"  element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* ── Protected user routes ────────────────────────── */}
                <Route element={<ProtectedLayout />}>
                  <Route path="/dashboard"         element={<Dashboard />} />
                  <Route path="/tasks"             element={<Tasks />} />
                  <Route path="/roadmap"           element={<Roadmap />} />
                  <Route path="/analytics"         element={<Analytics />} />
                  <Route path="/profile"           element={<Profile />} />
                  <Route path="/settings"          element={<Settings />} />
                  <Route path="/certificates"      element={<Certificates />} />
                  <Route path="/platforms"         element={<Platforms />} />
                  <Route path="/programming-sheet" element={<ProgrammingSheet />} />
                  <Route path="/leaderboard"       element={<Leaderboard />} />
                  <Route path="/resources"         element={<Resources />} />
                  <Route path="/mentor-connect"    element={<MentorConnect />} />
                </Route>

                {/* ── Admin public route ───────────────────────────── */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* ── Admin protected routes ───────────────────────── */}
                <Route element={<AdminProtectedLayout />}>
                  <Route path="/admin/dashboard"   element={<AdminDashboard />} />
                  <Route path="/admin/students"    element={<AdminStudents />} />
                  <Route path="/admin/assessment"  element={<AdminAssessment />} />
                  <Route path="/admin/studentdb"   element={<AdminStudentDB />} />
                  <Route path="/admin/profile"     element={<AdminProfile />} />
                  <Route path="/admin/settings"    element={<AdminSettings />} />
                </Route>

                {/* ── Default redirect ─────────────────────────────── */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            theme="colored"
            toastStyle={{ borderRadius: '12px', fontFamily: 'Inter, sans-serif' }}
          />
          <ChatBot />
        </TaskProvider>
      </AuthProvider>
    </AdminAuthProvider>
  );
}
