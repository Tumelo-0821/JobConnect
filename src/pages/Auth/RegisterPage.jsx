import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Auth.css';

function RegisterPage({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If someone clicked "Hire a Worker" on landing page, default to employer
  const defaultRole = searchParams.get('role') || 'worker';

  const [role, setRole] = useState(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
  });

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Basic validation
    if (!formData.firstName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Create a fake user and log them in
    // In a real app this would call your backend API
    const newUser = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      role: role,
      verified: false, // new users start unverified
    };

    onLogin(newUser);

    // After register, send them to verify their identity
    navigate('/verification');
  }

  const provinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
    'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
  ];

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🔗</div>
          WorkConnect SA
        </div>

        <div className="auth-left-content">
          <h2>Join <span>thousands</span> of South Africans</h2>
          <p>
            {role === 'worker'
              ? 'Create your profile, get verified, and start finding jobs near you today.'
              : 'Register your account, verify your business, and hire trusted workers fast.'}
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">🆓</span>
              <div className="auth-feature-text">
                <strong>Free to Join</strong>
                <span>Creating an account costs nothing</span>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🔒</span>
              <div className="auth-feature-text">
                <strong>Safe & Secure</strong>
                <span>Your data is private and protected</span>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">⚡</span>
              <div className="auth-feature-text">
                <strong>Quick Setup</strong>
                <span>Takes less than 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-form-box">
          <h2>Create Account</h2>
          <p className="subtitle">Choose your role to get started</p>

          {/* Role selector */}
          <div className="role-tabs">
            <div
              className={`role-tab ${role === 'worker' ? 'active' : ''}`}
              onClick={() => setRole('worker')}
            >
              <span className="role-icon">👷</span>
              <div className="role-name">I'm a Worker</div>
              <div className="role-desc">Looking for jobs</div>
            </div>
            <div
              className={`role-tab ${role === 'employer' ? 'active' : ''}`}
              onClick={() => setRole('employer')}
            >
              <span className="role-icon">🏢</span>
              <div className="role-name">I'm an Employer</div>
              <div className="role-desc">Looking to hire</div>
            </div>
          </div>

          {error && (
            <div className="form-error">⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name row */}
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Sipho"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Dlamini"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="071 000 0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Province</label>
              <select name="city" value={formData.city} onChange={handleChange}>
                <option value="">Select your province</option>
                {provinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Password *</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="At least 6 characters"
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

            {/* Terms checkbox */}
            <div className="terms-check">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
              />
              <label htmlFor="terms">
                I agree to the <a href="#">Terms of Service</a> and{' '}
                <a href="#">Privacy Policy</a>. I understand my ID will be verified.
              </label>
            </div>

            <button type="submit" className="auth-submit-btn">
              ✍️ Create My Account
            </button>
          </form>

          <div className="auth-switch" style={{ marginTop: '20px' }}>
            Already have an account?{' '}
            <span onClick={() => navigate('/login')}>Login here</span>
          </div>

          <div className="auth-switch" style={{ marginTop: '10px' }}>
            <span onClick={() => navigate('/')}>← Back to Home</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
