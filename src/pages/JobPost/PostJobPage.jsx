import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { api } from '../../services/api';
import './PostJob.css';

function getSouthAfricanToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const dateParts = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function PostJobPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    budget: '',
    location: '',
    province: '',
    duration: '',
    closing_date: '',
    closing_time: '23:59',
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user.verified) {
      navigate('/verification');
      return;
    }

    if (!formData.closing_date || !formData.closing_time) {
      setError('Please select an application closing date and time.');
      return;
    }

    // Interpret the employer-selected date and time as South African time (UTC+02:00).
    const closingDate = new Date(
      `${formData.closing_date}T${formData.closing_time}:00+02:00`
    );

    if (Number.isNaN(closingDate.getTime())) {
      setError('Please select a valid closing date and time.');
      return;
    }

    if (closingDate.getTime() <= Date.now()) {
      setError('The application closing date and time must be in the future.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const jobData = {
        ...formData,
        closing_date: closingDate.toISOString(),
      };

      // The backend receives one UTC timestamp, not a separate closing_time field.
      delete jobData.closing_time;

      // Urgency is calculated automatically by the backend.
      delete jobData.urgency;

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
    'Security', 'Moving/Loading', 'Cooking', 'Other',
  ];

  const provinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
    'Limpopo', 'Mpumalanga', 'North West', 'Free State',
    'Northern Cape',
  ];

  return (
    <div className="post-job-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="post-job-container">
        <div className="page-header">
          <button
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <h1>Post a Job</h1>
          <p>
            Fill in the details below and workers will apply to your job.
          </p>
        </div>

        {submitted ? (
          <div className="post-job-card">
            <div className="job-posted-success">
              <span className="success-icon">🎉</span>
              <h2>Job Posted!</h2>

              <p>
                Your job "<strong>{formData.title || 'New Job'}</strong>"
                has been posted. Workers near you can now apply.
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
              <div
                className="form-error"
                style={{ marginBottom: '16px' }}
              >
                ⚠️ {error}
              </div>
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
                  minLength={3}
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
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
                  minLength={3}
                  maxLength={5000}
                />
                <div className="char-count">
                  {formData.description.length} characters
                </div>
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
                    maxLength={100}
                  />
                </div>

                <div className="form-group">
                  <label>How Long Is the Job?</label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                  >
                    <option value="">Select duration</option>
                    <option value="A few hours">A few hours</option>
                    <option value="1 Day">1 Day</option>
                    <option value="2-3 Days">2-3 Days</option>
                    <option value="1 Week">1 Week</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City / Area *</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Sandton, Soweto, Benoni"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    maxLength={200}
                  />
                </div>

                <div className="form-group">
                  <label>Province *</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select province</option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="closing_date">
                    Application Closing Date *
                  </label>
                  <input
                    id="closing_date"
                    type="date"
                    name="closing_date"
                    value={formData.closing_date}
                    onChange={handleChange}
                    min={getSouthAfricanToday()}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="closing_time">
                    Application Closing Time *
                  </label>
                  <input
                    type="time"
                    id="closing_time"
                    name="closing_time"
                    value={formData.closing_time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <small>
                Select the exact date and South African time when applications
                should close. Urgency updates automatically as the deadline approaches.
              </small>

              <button
                type="submit"
                className="submit-job-btn"
                disabled={loading}
              >
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
