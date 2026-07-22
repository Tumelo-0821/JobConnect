import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import global styles
import './styles/global.css';

// Import all pages
import LandingPage        from './pages/LandingPage/LandingPage';
import LoginPage          from './pages/Auth/LoginPage';
import RegisterPage       from './pages/Auth/RegisterPage';
import VerificationPage   from './pages/Verification/VerificationPage';
import WorkerDashboard    from './pages/WorkerDashboard/WorkerDashboard';
import EmployerDashboard  from './pages/EmployerDashboard/EmployerDashboard';
import PostJobPage        from './pages/JobPost/PostJobPage';
import ChatPage           from './pages/Chat/ChatPage';

// Simple placeholder for pages not built yet
function ComingSoon({ pageName }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Poppins, sans-serif', background: '#f7f9fc',
      padding: '20px', textAlign: 'center'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚧</div>
      <h2 style={{ fontSize: '1.8rem', color: '#1a6fc4', marginBottom: '8px' }}>{pageName}</h2>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>This page is coming soon!</p>
      <button
        onClick={() => window.history.back()}
        style={{
          background: '#1a6fc4', color: 'white', border: 'none',
          padding: '12px 28px', borderRadius: '8px',
          fontSize: '1rem', fontWeight: '700', cursor: 'pointer'
        }}
      >
        ← Go Back
      </button>
    </div>
  );
}

function App() {
  // Shared user state - passed down to every page that needs it
  const [user, setUser] = useState(null);

  function handleLogin(userData) {
    setUser(userData);
  }

  function handleLogout() {
    setUser(null);
  }

  // Props we pass to every page (so they can show the right navbar)
  const sharedProps = { user, onLogout: handleLogout };

  return (
    <BrowserRouter>
      <Routes>

        {/* ===== PUBLIC PAGES ===== */}
        <Route path="/"            element={<LandingPage       {...sharedProps} />} />
        <Route path="/login"       element={<LoginPage         onLogin={handleLogin} />} />
        <Route path="/register"    element={<RegisterPage      onLogin={handleLogin} />} />

        {/* ===== AFTER REGISTER ===== */}
        <Route path="/verification" element={<VerificationPage {...sharedProps} onLogin={handleLogin} />} />

        {/* ===== DASHBOARDS ===== */}
        <Route path="/worker-dashboard"   element={<WorkerDashboard   {...sharedProps} />} />
        <Route path="/employer-dashboard" element={<EmployerDashboard {...sharedProps} />} />

        {/* ===== JOB PAGES ===== */}
        <Route path="/post-job" element={<PostJobPage {...sharedProps} />} />
        <Route path="/jobs"     element={<ComingSoon pageName="Browse Jobs" />} />

        {/* ===== WORKER PAGES ===== */}
        <Route path="/workers"     element={<ComingSoon pageName="Browse Workers" />} />
        <Route path="/worker/:id"  element={<ComingSoon pageName="Worker Profile" />} />

        {/* ===== CHAT ===== */}
        <Route path="/chat"    element={<ChatPage {...sharedProps} />} />
        <Route path="/chat/:id" element={<ChatPage {...sharedProps} />} />

        {/* ===== MISC ===== */}
        <Route path="/how-it-works" element={<ComingSoon pageName="How It Works" />} />
        <Route path="/about"        element={<ComingSoon pageName="About Us" />} />
        <Route path="/support"      element={<ComingSoon pageName="Support" />} />
        <Route path="/privacy"      element={<ComingSoon pageName="Privacy Policy" />} />
        <Route path="/terms"        element={<ComingSoon pageName="Terms of Service" />} />
        <Route path="/contact"      element={<ComingSoon pageName="Contact Us" />} />

        {/* 404 */}
        <Route path="*" element={<ComingSoon pageName="404 – Page Not Found" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
