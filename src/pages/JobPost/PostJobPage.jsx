import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './PostJob.css';

function PostJobPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [urgency, setUrgency] = useState('normal');
  const [formData, setFormData] = useState({
    title: '', category: '', description: '',
    budget: '', location: '', province: '', duration: '',
  });

  // Redirect if not logged in or not verified
  if (!user) {
    navigate('/login');
    return null;
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!user.verified) {
      navigate('/verification');
      return;
    }
    // In a real app this sends the job to your backend
    setSubmitted(true);
  }

  const categories = [
    'Construction', 'Cleaning', 'Gardening', 'Electrical',
    'Plumbing', 'Painting', 'Driving', 'Childcare',
    'Security', 'Moving/Loading', 'Cooking', 'Other'
  ];

  const provinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
    'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
  ];

  return (
    <div className="post-job-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="post-job-container">

        {/* Back button and header */}
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1>Post a Job</h1>
          <p>Fill in the details below and workers will apply to your job</p>
        </div>

        {submitted ? (
          /* Success screen */
          <div className="post-job-card">
            <div className="job-posted-success">
              <span className="success-icon">🎉</span>
              <h2>Job Posted!</h2>
              <p>
                Your job "<strong>{formData.title || 'New Job'}</strong>" has been posted.
                Workers near you will start applying soon. You will get notified when
                someone applies.
              </p>
              <button
                className="back-to-dashboard-btn"
                onClick={() => navigate('/employer-dashboard')}
              >
                View My Dashboard →
              </button>
            </div>
          </div>
        ) : (
          <div className="post-job-card">
            <h2>📋 Job Details</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Job Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Need a house painter for 3 rooms"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="">Select a category</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Job Description *</label>
                <textarea
                  name="description"
                  placeholder="Describe what needs to be done. The more detail you give, the better applications you will get..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
                <div className="char-count">{formData.description.length} characters</div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Budget / Pay *</label>
                  <input
                    type="text"
                    name="budget"
                    placeholder="e.g. R500 or R300/day"
                    value={formData.budget}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>How Long is the Job?</label>
                  <select name="duration" value={formData.duration} onChange={handleChange}>
                    <option value="">Select duration</option>
                    <option>A few hours</option>
                    <option>1 Day</option>
                    <option>2-3 Days</option>
                    <option>1 Week</option>
                    <option>Ongoing / Regular</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City / Area *</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Sandton, Soweto, Bellville"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Province *</label>
                  <select name="province" value={formData.province} onChange={handleChange} required>
                    <option value="">Select province</option>
                    {provinces.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Urgency selector */}
              <div className="form-group">
                <label>How Urgent Is This Job?</label>
                <div className="urgency-toggle">
                  {[
                    { value: 'normal', icon: '🟢', label: 'Normal' },
                    { value: 'soon', icon: '🟡', label: 'Needed Soon' },
                    { value: 'urgent', icon: '🔴', label: 'Very Urgent' },
                  ].map(opt => (
                    <div
                      key={opt.value}
                      className={`urgency-option ${urgency === opt.value ? 'selected' : ''}`}
                      onClick={() => setUrgency(opt.value)}
                    >
                      <span className="urg-icon">{opt.icon}</span>
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="submit-job-btn">
                📢 Post This Job
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostJobPage;
