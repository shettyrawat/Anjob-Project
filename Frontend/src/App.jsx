import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import ChatBot from './components/ChatBot';

// Lazy loading the page components
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
const JobList = lazy(() => import('./pages/JobList'));
const AddJob = lazy(() => import('./pages/AddJob'));
const ResumeAnalysis = lazy(() => import('./pages/ResumeAnalysis'));
const MockInterview = lazy(() => import('./pages/MockInterview'));
const Profile = lazy(() => import('./pages/Profile'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <div className="app-container" style={{ padding: '0 1rem' }}>
      <Navbar />
      <main style={{ maxWidth: '1200px', margin: '2rem auto' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '5rem', fontSize: '1.2rem' }}>Loading Page...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/set-password" element={<ProtectedRoute><SetPassword /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><JobList /></ProtectedRoute>} />
            <Route path="/jobs/add" element={<ProtectedRoute><AddJob /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute><ResumeAnalysis /></ProtectedRoute>} />
            <Route path="/interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/jobs" />} />
            <Route path="/dashboard" element={<Navigate to="/jobs" />} />
          </Routes>
        </Suspense>
      </main>
      <ChatBot />
    </div>
  );
}

export default App;
