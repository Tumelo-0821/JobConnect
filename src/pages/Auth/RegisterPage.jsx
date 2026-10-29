
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import './Auth.css';

function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedRole = searchParams.get('role');
  const defaultRole = ['worker', 'employer'].includes(requestedRole)
    ? requestedRole
    : 'worker';

  const [role, setRole] = useState(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    idNumber: '',
    password: '',
  });

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (
      !formData.firstName.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (role === 'worker' && !/^\d{13}$/.test(formData.idNumber)) {
      setError('South African ID number must be exactly 13 digits.');
      return;
    }

    if (verificationMethod === 'sms' && !formData.phone.trim()) {
      setError('Please enter your phone number to receive an SMS OTP.');
      return;
    }

    setLoading(true);

    try {
      const result = await api.register(
        formData,
        role,
        verificationMethod
      );

      if (!result?.challenge_id) {
        throw new Error(
          'Registration started without a verification reference. Please try again.'
        );
      }

      navigate('/verify-otp', {
        state: {
          challengeId: result.challenge_id,
          verificationMethod,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
      });
    } catch (err) {
      setError(
        err.message || 'Could not start registration. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const provinces = [
    'Gauteng',
    'Western Cape',
    'KwaZulu-Natal',
    'Eastern Cape',
    'Limpopo',
    'Mpumalanga',
    'North West',
    'Free State',
    'Northern Cape',
  ];

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🔗</div>
          JobConnect SA
        </div>

        <div className="auth-left-content">
          <h2>
            Join <span>thousands</span> of South Africans
          </h2>

          <p>
            {role === 'worker'
              ? 'Create your profile and start finding opportunities near you.'
              : 'Create your employer account and get ready to hire workers.'}
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
                <span>Verify your contact before creating an account</span>
              </div>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-icon">⚡</span>
              <div className="auth-feature-text">
                <strong>Quick Setup</strong>
                <span>Get started in a few simple steps</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <h2>Create Account</h2>
          <p className="subtitle">Choose your role to get started</p>

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
            <div className="form-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  placeholder="Sipho"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  placeholder="Dlamini"
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="071 000 0000"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>

            {role === 'worker' && (
              <div className="form-group">
                <label htmlFor="idNumber">South African ID Number *</label>
                <input
                  id="idNumber"
                  type="text"
                  name="idNumber"
                  placeholder="13-digit ID number"
                  value={formData.idNumber}
                  onChange={handleChange}
                  maxLength={13}
                  inputMode="numeric"
                  pattern="[0-9]{13}"
                  required
                />
                <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                  Enter your 13-digit South African ID number. Identity
                  verification is a separate process.
                </small>
              </div>
            )}

            <div className="form-group">
              <label>How would you like to receive your OTP? *</label>

              <div className="role-tabs">
                <div
                  className={`role-tab ${
                    verificationMethod === 'email' ? 'active' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={verificationMethod === 'email'}
                  onClick={() => {
                    setVerificationMethod('email');
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setVerificationMethod('email');
                      setError('');
                    }
                  }}
                >
                  <span className="role-icon">📧</span>
                  <div className="role-name">Email OTP</div>
                  <div className="role-desc">Send a code to your email</div>
                </div>

                <div
                  className={`role-tab ${
                    verificationMethod === 'sms' ? 'active' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={verificationMethod === 'sms'}
                  onClick={() => {
                    setVerificationMethod('sms');
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setVerificationMethod('sms');
                      setError('');
                    }
                  }}
                >
                  <span className="role-icon">📱</span>
                  <div className="role-name">SMS OTP</div>
                  <div className="role-desc">Send a code to your phone</div>
                </div>
              </div>

              <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                {verificationMethod === 'email'
                  ? 'A verification code will be sent to your email address.'
                  : 'Enter your phone number above to receive a text message.'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="city">Province</label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              >
                <option value="">Select your province</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="terms-check">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />

              <label htmlFor="terms">
                I agree to the Terms of Service and Privacy Policy.
              </label>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? 'Sending verification request...'
                : 'Continue to Verification'}
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
