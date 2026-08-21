import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { api } from '../../services/api';
import './PostJob.css';

function PostJobPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [urgency, setUrgency] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '', category: '', description: '',
    budget: '', location: '', province: '', duration: '',
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  if (user.role !== 'employer') {
    navigate('/worker-dashboard');
    return null;
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user.verified) {
      navigate('/verification');
      return;
    }

    setLoading(true);
    setError('');
   try {
  const jobData = {
    ...formData,
    urgency,
  };

  console.log('POSTING JOB:', jobData);

  await api.createJob(jobData);

  setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
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
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1>Post a Job</h1>
          <p>Fill in the details below and workers will apply to your job</p>
        </div>

        {submitted ? (
          <div className="post-job-card">
            <div className="job-posted-success">
              <span className="success-icon">🎉</span>
              <h2>Job Posted!</h2>
              <p>
                Your job "<strong>{formData.title || 'New Job'}</strong>" has been posted.
                Workers near you will start applying soon.
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

            {error && (
              <div className="form-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>
            )}

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
                  placeholder="Describe what needs to be done..."
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
                    <option>Monthly</option>
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

              <button type="submit" className="submit-job-btn" disabled={loading}>
                {loading ? 'Posting...' : 'Post This Job'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostJobPage;
