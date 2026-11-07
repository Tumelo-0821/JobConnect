import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import './Auth.css';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
 const [selectedRole, setSelectedRole] = useState('worker');  
  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  }
  
  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { user } = await api.login(formData.email, formData.password);
      onLogin(user);
      navigate(user.role === 'worker' ? '/worker-dashboard' : '/employer-dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
           {/*<div className="auth-brand-icon"></div>*/ }
            <h2>JobConnect SA </h2>
        </div>

        <div className="auth-left-content">
          <h2>Welcome <span>back!</span></h2>
          <p>Log in to find work or hire trusted workers near you across South Africa.</p>

          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon"></span>
              <div className="auth-feature-text">
                <strong>Verified Workers</strong>
                <span>Every worker has ID verification</span>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon"></span>
              <div className="auth-feature-text">
                <strong>Near You</strong>
                <span>Find workers in your area</span>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon"></span>
              <div className="auth-feature-text">
                <strong>Direct Chat</strong>
                <span>Message workers instantly</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <h2>Login</h2>
          <p className="subtitle">Enter your details to access your account</p>

          {error && (
            <div className="form-error">⚠️ {error}</div>
          )}
          {/*Try and lets see */}
           <div className="role-tabs">
            <div
                className={`role-tab ${selectedRole === 'worker' ? 'active' : ''}`}
                onClick={() => setSelectedRole('worker')}
                >
              <span className="role-icon">👷</span>
              <div className="role-name">I'm a Worker</div>
              <div className="role-desc">Looking for jobs</div>
            </div>
            <div
               className={`role-tab ${selectedRole === 'employer' ? 'active' : ''}`}
                onClick={() => setSelectedRole('employer')}
                      >   
              <span className="role-icon">🏢</span>
              <div className="role-name">I'm an Employer</div>
              <div className="role-desc">Looking to hire</div>
            </div>
          </div>

         { /*remove if not working */}
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
              <Link to="#" style={{ color: '#1a6fc4', fontSize: '0.85rem', fontWeight: '600' }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Logging in...' : ' Login to My Account'}
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
