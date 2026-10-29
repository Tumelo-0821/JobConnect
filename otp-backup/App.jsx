import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './styles/global.css';

import LandingPage        from './pages/LandingPage/LandingPage';
import LoginPage          from './pages/Auth/LoginPage';
import RegisterPage       from './pages/Auth/RegisterPage';
import VerificationPage   from './pages/Verification/VerificationPage';
import WorkerDashboard    from './pages/WorkerDashboard/WorkerDashboard';
import WorkerProfile      from './pages/WorkerProfile/WorkerProfile';
import EmployerDashboard  from './pages/EmployerDashboard/EmployerDashboard';
import PostJobPage        from './pages/JobPost/PostJobPage';
import ChatPage           from './pages/Chat/ChatPage';
import { getStoredUser, clearAuth, api } from './services/api';

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
  const [user, setUser] = useState(getStoredUser);
  const [authLoading, setAuthLoading] = useState(!!getStoredUser());

  useEffect(() => {
    if (!getStoredUser()) {
      setAuthLoading(false);
      return;
    }

    api.getMe()
      .then((freshUser) => setUser(freshUser))
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  function handleLogin(userData) {
    setUser(userData);
  }

  function handleLogout() {
    clearAuth();
    setUser(null);
  }

  const sharedProps = { user, onLogout: handleLogout, authLoading };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<LandingPage       {...sharedProps} />} />
        <Route path="/login"       element={<LoginPage         onLogin={handleLogin} />} />
        <Route path="/register"    element={<RegisterPage      onLogin={handleLogin} />} />
        <Route path="/verification" element={<VerificationPage {...sharedProps} onLogin={handleLogin} />} />
        <Route path="/worker-dashboard"   element={<WorkerDashboard   {...sharedProps} />} />
        <Route path="/worker-profile"     element={<WorkerProfile     {...sharedProps} />} />
        <Route path="/employer-dashboard" element={<EmployerDashboard {...sharedProps} />} />
        <Route path="/post-job" element={<PostJobPage {...sharedProps} />} />
        <Route path="/jobs"     element={<ComingSoon pageName="Browse Jobs" />} />
        <Route path="/workers"     element={<ComingSoon pageName="Browse Workers" />} />
        <Route path="/worker/:id"  element={<ComingSoon pageName="Worker Profile" />} />
        <Route path="/chat"    element={<ChatPage {...sharedProps} />} />
        <Route path="/chat/:id" element={<ChatPage {...sharedProps} />} />
        <Route path="/how-it-works" element={<ComingSoon pageName="How It Works" />} />
        <Route path="/about"        element={<ComingSoon pageName="About Us" />} />
        <Route path="/support"      element={<ComingSoon pageName="Support" />} />
        <Route path="/privacy"      element={<ComingSoon pageName="Privacy Policy" />} />
        <Route path="/terms"        element={<ComingSoon pageName="Terms of Service" />} />
        <Route path="/contact"      element={<ComingSoon pageName="Contact Us" />} />
        <Route path="*" element={<ComingSoon pageName="404 – Page Not Found" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
