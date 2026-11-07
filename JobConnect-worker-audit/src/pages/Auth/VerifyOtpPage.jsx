
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './Auth.css';

function VerifyOtpPage({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    challengeId,
    verificationMethod,
    email,
    phone,
  } = location.state || {};

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!challengeId) {
    return (
      <div className="auth-page">
        <div className="auth-form-box">
          <h2>Verification session not found</h2>
          <p>Please return to registration and try again.</p>
          <button
            type="button"
            className="auth-submit-btn"
            onClick={() => navigate('/register', { replace: true })}
          >
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the six-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const { user } = await api.verifyRegistrationOtp(challengeId, otp);

      onLogin(user);

      setMessage('Verified successfully. Your account has been created.');

      navigate(
        user.role === 'employer'
          ? '/employer-dashboard'
          : '/worker-dashboard',
        { replace: true }
      );
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setMessage('');
    setResending(true);

    try {
      const result = await api.resendRegistrationOtp(challengeId);
      setMessage(
        result?.message || 'If the request was accepted, a new code has been requested.'
      );
      setOtp('');
    } catch (err) {
      setError(err.message || 'Could not request another code.');
    } finally {
      setResending(false);
    }
  }

  const destination =
    verificationMethod === 'sms'
      ? phone
      : email;

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🔗</div>
          JobConnect SA
        </div>

        <div className="auth-left-content">
          <h2>One more step to get started</h2>
          <p>
            Verify your contact details to complete your JobConnect
            registration.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <h2>Verify Your Contact</h2>

          <p className="subtitle">
            Enter the six-digit code requested for{' '}
            {verificationMethod === 'sms' ? 'SMS' : 'email'} verification.
          </p>

          {destination && (
            <p>
              Destination: <strong>{destination}</strong>
            </p>
          )}

          {error && (
            <div className="form-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          {message && (
            <p role="status" style={{ color: '#15803d' }}>
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="otp">Six-digit verification code</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                maxLength={6}
                pattern="[0-9]{6}"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify and Create Account'}
            </button>
          </form>

          <button
            type="button"
            className="auth-submit-btn"
            style={{ marginTop: '12px' }}
            onClick={handleResend}
            disabled={resending || loading}
          >
            {resending ? 'Requesting new code...' : 'Resend Code'}
          </button>

          <div className="auth-switch" style={{ marginTop: '20px' }}>
            <span onClick={() => navigate('/register')}>
              ← Back to Registration
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtpPage;
