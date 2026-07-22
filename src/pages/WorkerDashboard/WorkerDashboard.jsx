import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './WorkerDashboard.css';

// Fake job data to show in the dashboard
const RECOMMENDED_JOBS = [
  {
    id: 1, title: 'General Construction Worker', company: 'BuildRight SA',
    location: 'Soweto, GP', pay: 'R350/day', type: 'Full Day', badge: 'urgent',
  },
  {
    id: 2, title: 'House Painter – 3 Rooms', company: 'Private Home Owner',
    location: 'Sandton, GP', pay: 'R800 fixed', type: '1-2 Days', badge: 'new',
  },
  {
    id: 3, title: 'Garden Maintenance', company: 'Green Gardens Co.',
    location: 'Pretoria, GP', pay: 'R250/day', type: 'Weekly', badge: 'new',
  },
];

const APPLIED_JOBS = [
  { id: 4, title: 'Tiler for Bathroom', company: 'HomeReno JHB', status: 'pending' },
  { id: 5, title: 'Security Guard – Night Shift', company: 'SafeGuard SA', status: 'approved' },
  { id: 6, title: 'Moving Helpers x2', company: 'QuickMove SA', status: 'rejected' },
];

function WorkerDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [appliedIds, setAppliedIds] = useState([]);

  // If no user, redirect to login
  if (!user) {
    navigate('/login');
    return null;
  }

  // If user is an employer, they should not be on this page
  if (user.role === 'employer') {
    navigate('/employer-dashboard');
    return null;
  }

  // Handle applying for a job
  function handleApply(jobId) {
    if (!user.verified) {
      // If not verified, send them to verification
      navigate('/verification');
      return;
    }
    setAppliedIds([...appliedIds, jobId]);
  }

  const completionTasks = [
    { label: 'Created account', done: true },
    { label: 'Verified your ID', done: user.verified },
    { label: 'Added profile photo', done: false },
    { label: 'Listed your skills', done: false },
    { label: 'Applied for first job', done: appliedIds.length > 0 },
  ];

  const completionPercent = Math.round(
    (completionTasks.filter(t => t.done).length / completionTasks.length) * 100
  );

  return (
    <div className="dashboard-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="dashboard-container">

        {/* Welcome banner */}
        <div className="dashboard-welcome">
          <div className="welcome-left">
            <div className="welcome-avatar">👷</div>
            <div className="welcome-text">
<<<<<<< HEAD
              <h2>Welcome back, {user.name.split(' ')[0]}! </h2>
=======
              <h2>Welcome back, {user.name.split(' ')[0]}! 👋</h2>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
              <p>Here are your latest job recommendations</p>
            </div>
          </div>
          <div className="welcome-right">
            {user.verified ? (
<<<<<<< HEAD
              <div className="verified-banner">ID Verified</div>
=======
              <div className="verified-banner">✅ ID Verified</div>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
            ) : (
              <div
                className="not-verified-banner"
                onClick={() => navigate('/verification')}
              >
                ⚠️ Verify your ID to apply for jobs
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon blue">💼</div>
            <div>
              <div className="stat-value">12</div>
              <div className="stat-label">Jobs Available</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div>
              <div className="stat-value">{appliedIds.length + 3}</div>
              <div className="stat-label">Applied</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">⭐</div>
            <div>
              <div className="stat-value">4.8</div>
              <div className="stat-label">My Rating</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow">💰</div>
            <div>
              <div className="stat-value">R2,400</div>
              <div className="stat-label">This Month</div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="dashboard-grid">

          {/* LEFT: Profile + Completion */}
          <div className="dashboard-left">

            {/* Profile card */}
            <div className="profile-card">
              <div className="profile-photo">👷</div>
              <div className="profile-name">{user.name}</div>
              <div className="profile-title">Construction & Tiling</div>
              <div className="profile-location">📍 Soweto, Gauteng</div>
              <div className="profile-rating">
                <span className="rating-stars">★★★★★</span>
                <span className="rating-value">4.8</span>
                <span className="rating-count">(23 reviews)</span>
              </div>
              <div className="profile-skills">
                {['Tiling', 'Plastering', 'Painting', 'Bricklaying'].map(s => (
                  <span key={s} style={{
                    background: '#e8f1fb', color: '#1a6fc4',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: '600'
                  }}>
                    {s}
                  </span>
                ))}
              </div>
              <button className="edit-profile-btn">✏️ Edit Profile</button>
            </div>

            {/* Profile completion */}
            <div className="completion-card">
              <h3>Profile Completion</h3>
              <p>Complete your profile to get more jobs</p>
              <div className="progress-bar-wrapper">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="progress-label">{completionPercent}% complete</div>
              <div className="completion-tasks">
                {completionTasks.map((task, i) => (
                  <div key={i} className="completion-task">
                    <div className={`task-check ${task.done ? 'done' : 'todo'}`}>
                      {task.done ? '✓' : '○'}
                    </div>
                    <span style={{ color: task.done ? '#333' : '#9ca3af' }}>
                      {task.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Jobs */}
          <div className="dashboard-right">

            {/* Recommended jobs */}
            <div className="section-card">
              <div className="section-card-header">
                <h3>🔍 Recommended Jobs Near You</h3>
                <button className="see-all-btn" onClick={() => navigate('/jobs')}>
                  See all
                </button>
              </div>

              {RECOMMENDED_JOBS.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-card-top">
                    <div>
                      <div className="job-title">{job.title}</div>
                      <div className="job-company">{job.company}</div>
                    </div>
                    <span className={`job-badge ${job.badge}`}>
                      {job.badge === 'urgent' ? '🔥 Urgent' : '🆕 New'}
                    </span>
                  </div>
                  <div className="job-meta">
                    <span className="job-meta-item">📍 {job.location}</span>
                    <span className="job-meta-item">💰 {job.pay}</span>
                    <span className="job-meta-item">🕐 {job.type}</span>
                  </div>
                  <div className="job-card-actions">
                    <button
                      className="apply-btn"
                      onClick={() => handleApply(job.id)}
                      disabled={appliedIds.includes(job.id)}
                      title={!user.verified ? 'Verify your ID first to apply' : ''}
                    >
                      {appliedIds.includes(job.id)
                        ? '✅ Applied'
                        : user.verified
                        ? '✋ Apply Now'
                        : '🔒 Verify ID to Apply'}
                    </button>
                    <button className="save-btn">🔖 Save</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Applied jobs */}
            <div className="section-card">
              <div className="section-card-header">
                <h3>📋 My Applications</h3>
                <button className="see-all-btn">See all</button>
              </div>

              {APPLIED_JOBS.map(job => (
                <div key={job.id} className="applied-job-row">
                  <div className="applied-job-info">
                    <div className="job-title">{job.title}</div>
                    <div className="job-company">{job.company}</div>
                  </div>
                  <span className={`status-badge ${job.status}`}>
                    {job.status === 'pending'  && '⏳ Pending'}
                    {job.status === 'approved' && '✅ Approved'}
                    {job.status === 'rejected' && '❌ Not Selected'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;
