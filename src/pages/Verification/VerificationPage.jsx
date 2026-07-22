import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './Verification.css';

// This page walks the user through 3 steps:
// Step 1: Upload their ID document
// Step 2: Take a selfie to match with the ID
// Step 3: Done! Account is verified
function VerificationPage({ user, onLogin, onLogout }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [idUploaded, setIdUploaded] = useState(false);
  const [selfieCapture, setSelfieCapture] = useState(false);

  // Step info for the progress bar
  const steps = [
    { number: 1, label: 'Upload ID' },
    { number: 2, label: 'Take Selfie' },
    { number: 3, label: 'Done!' },
  ];

  // Fake upload - in real app this sends file to server
  function handleIdUpload() {
    setIdUploaded(true);
  }

  // Fake selfie - in real app this opens the camera
  function handleSelfie() {
    setSelfieCapture(true);
  }

  function goNext() {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  }

  function goBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1); // go to previous page
    }
  }

  // When verification is complete, mark the user as verified
  function handleComplete() {
    if (onLogin && user) {
      onLogin({ ...user, verified: true });
    }
    navigate(user?.role === 'worker' ? '/worker-dashboard' : '/employer-dashboard');
  }

  return (
    <div className="verify-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="verify-container">
        {/* Header */}
        <div className="verify-header">
          <span className="lock-icon">🪪</span>
          <h1>Verify Your Identity</h1>
          <p>
            To keep WorkConnect SA safe for everyone, we need to confirm who you are.
            This only takes a few minutes.
          </p>
        </div>

        {/* Progress bar */}
        <div className="verify-steps">
          {steps.map((step, i) => (
            <React.Fragment key={step.number}>
              <div className="vstep">
                <div className={`vstep-circle ${
                  currentStep > step.number ? 'done'
                  : currentStep === step.number ? 'active'
                  : 'pending'
                }`}>
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <span className={`vstep-label ${currentStep === step.number ? 'active' : ''}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`vstep-line ${currentStep > step.number ? 'done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main card */}
        <div className="verify-card">

          {/* ===== STEP 1: Upload ID ===== */}
          {currentStep === 1 && (
            <div>
              <h2>📄 Upload Your ID Document</h2>
              <p className="step-desc">
                Please upload a clear photo of your South African ID (green ID book, smart ID card,
                or passport). Make sure all text is readable.
              </p>

              <div className="info-tip">
                <strong>Accepted documents:</strong> SA Green ID Book, Smart ID Card, SA Passport.
                Photo must be clear and not blurry. All 4 corners must be visible.
              </div>

              {/* Upload box */}
              <div
                className={`upload-box ${idUploaded ? 'uploaded' : ''}`}
                onClick={!idUploaded ? handleIdUpload : undefined}
              >
                {idUploaded ? (
                  <div className="upload-success">
                    <span style={{ fontSize: '2.5rem' }}>✅</span>
                    <div>
                      <div>ID Document Uploaded!</div>
                      <div style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.85rem' }}>
                        id_document.jpg
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="upload-icon">📁</span>
                    <h3>Click to upload your ID</h3>
                    <p>Supports JPG, PNG, PDF up to 10MB</p>
                    <button className="upload-btn" type="button">
                      Choose File
                    </button>
                  </>
                )}
              </div>

              <div className="verify-nav">
                <button className="btn-back" onClick={goBack}>← Back</button>
                <button
                  className="btn-next"
                  onClick={goNext}
                  disabled={!idUploaded}
                >
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Take Selfie ===== */}
          {currentStep === 2 && (
            <div>
              <h2>🤳 Take a Selfie</h2>
              <p className="step-desc">
                We need to match your face with your ID document. Take a clear selfie
                in good lighting. Look directly at the camera.
              </p>

              <div className="info-tip">
                <strong>Tips for a good selfie:</strong> Face the camera directly. Use good lighting.
                Remove sunglasses or hats. Make sure your whole face is visible.
              </div>

              <div className="selfie-box">
                <div className="camera-placeholder">
                  {selfieCapture ? (
                    <>
                      <span className="cam-icon">✅</span>
                      <p>Selfie captured successfully!</p>
                    </>
                  ) : (
                    <>
                      <span className="cam-icon">📷</span>
                      <p>Camera preview will appear here</p>
                    </>
                  )}
                </div>
                <div className="camera-controls">
                  <button className="cam-btn secondary" type="button" onClick={goBack}>
                    ← Back
                  </button>
                  <button
                    className="cam-btn primary"
                    type="button"
                    onClick={handleSelfie}
                  >
                    {selfieCapture ? '🔄 Retake' : '📸 Take Photo'}
                  </button>
                </div>
              </div>

              <div className="verify-nav">
                <button className="btn-back" onClick={goBack}>← Back</button>
                <button
                  className="btn-next"
                  onClick={goNext}
                  disabled={!selfieCapture}
                >
                  Submit for Review →
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Complete ===== */}
          {currentStep === 3 && (
            <div className="verify-complete">
              <span className="big-check">🎉</span>
              <h2>Verification Submitted!</h2>
              <p>
                Your documents have been submitted for review. We usually verify accounts
                within <strong>24 hours</strong>. You will get an SMS and email when your account
                is approved.
              </p>
              <p style={{ marginBottom: '28px' }}>
                You can still browse the platform while we review your documents.
              </p>
              <button className="go-dashboard-btn" onClick={handleComplete}>
                Go to My Dashboard 🚀
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerificationPage;
