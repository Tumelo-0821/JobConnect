import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Basic check - in real app this talks to a backend
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // FAKE login - just for frontend demo
    // We check email to decide role
    const isWorker = formData.email.includes('worker') || formData.email.includes('w@');
    const fakeUser = {
      name: isWorker ? 'Sipho Dlamini' : 'Fatima Meyer',
      email: formData.email,
      role: isWorker ? 'worker' : 'employer',
      verified: true,
    };

    onLogin(fakeUser);
    navigate(isWorker ? '/worker-dashboard' : '/employer-dashboard');
  }

  return (
    <div className="auth-page">
      {/* Left blue panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🔗</div>
          WorkConnect SA
        </div>

        <div className="auth-left-content">
          <h2>Welcome <span>back!</span></h2>
          <p>Log in to find work or hire trusted workers near you across South Africa.</p>

          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">✅</span>
              <div className="auth-feature-text">
                <strong>Verified Workers</strong>
                <span>Every worker has ID verification</span>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">📍</span>
              <div className="auth-feature-text">
                <strong>Near You</strong>
                <span>Find workers in your area</span>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">💬</span>
              <div className="auth-feature-text">
                <strong>Direct Chat</strong>
                <span>Message workers instantly</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-form-box">
          <h2>Login</h2>
          <p className="subtitle">Enter your details to access your account</p>

          {error && (
            <div className="form-error">⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <a href="#" style={{ color: '#1a6fc4', fontSize: '0.85rem', fontWeight: '600' }}>
                Forgot password?
              </a>
            </div>

            <button type="submit" className="auth-submit-btn">
              🔑 Login to My Account
            </button>
          </form>

          <div className="auth-divider">or</div>

          <div className="auth-switch">
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')}>Register here</span>
          </div>

          <div className="auth-switch" style={{ marginTop: '10px' }}>
            <span onClick={() => navigate('/')}>← Back to Home</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
