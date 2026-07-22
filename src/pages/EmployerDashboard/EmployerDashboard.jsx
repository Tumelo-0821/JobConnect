import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './EmployerDashboard.css';
import '../WorkerDashboard/WorkerDashboard.css';

// Fake data for the employer dashboard
const POSTED_JOBS = [
  { id: 1, title: 'House Painter – 3 Rooms', location: 'Sandton, GP', pay: 'R800', applications: 7, status: 'open' },
  { id: 2, title: 'Garden Cleanup x1 Day', location: 'Midrand, GP', pay: 'R300', applications: 3, status: 'open' },
  { id: 3, title: 'Tiler for Bathroom', location: 'Pretoria, GP', pay: 'R1,200', applications: 12, status: 'closed' },
];

const WORKERS = [
  { id: 1, name: 'Sipho M.', skill: 'Construction & Tiling', location: 'Soweto, GP', rating: 4.9, reviews: 87, emoji: '👷', verified: true },
  { id: 2, name: 'Thabo N.', skill: 'Electrical Work', location: 'Durban, KZN', rating: 4.7, reviews: 52, emoji: '⚡', verified: true },
  { id: 3, name: 'Lindiwe K.', skill: 'Cleaning & Housekeeping', location: 'Cape Town, WC', rating: 5.0, reviews: 34, emoji: '🧹', verified: true },
  { id: 4, name: 'Bongani Z.', skill: 'Plumbing & Pipes', location: 'JHB, GP', rating: 4.5, reviews: 29, emoji: '🔧', verified: false },
];

function EmployerDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [shortlisted, setShortlisted] = useState([]);
  const [hired, setHired] = useState([]);

  // Redirect if not logged in
  if (!user) {
    navigate('/login');
    return null;
  }

  // Redirect workers
  if (user.role === 'worker') {
    navigate('/worker-dashboard');
    return null;
  }

  function toggleShortlist(workerId) {
    setShortlisted(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  }

  function handleHire(workerId) {
    if (!user.verified) {
      navigate('/verification');
      return;
    }
    setHired(prev => [...prev, workerId]);
  }

  // Filter workers by search
  const filteredWorkers = WORKERS.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase())
      || w.skill.toLowerCase().includes(search.toLowerCase());
    const matchSkill = skillFilter === '' || w.skill.toLowerCase().includes(skillFilter.toLowerCase());
    return matchSearch && matchSkill;
  });

  const shortlistedWorkers = WORKERS.filter(w => shortlisted.includes(w.id));

  return (
    <div className="emp-dashboard-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="emp-dashboard-container">

        {/* Welcome banner */}
        <div className="emp-welcome">
          <div className="emp-welcome-left">
            <div className="emp-welcome-avatar">🏢</div>
            <div className="emp-welcome-text">
              <h2>Welcome, {user.name.split(' ')[0]}! 👋</h2>
              <p>Manage your jobs and find trusted workers</p>
            </div>
          </div>
          <button
            className="post-job-btn"
            onClick={() => user.verified ? navigate('/post-job') : navigate('/verification')}
          >
            ＋ Post a Job
          </button>
        </div>

        {/* Verification warning */}
        {!user.verified && (
          <div className="not-verified-warning">
            <p>⚠️ <strong>Your account is not verified.</strong> Verify your identity to post jobs and hire workers.</p>
            <button className="verify-now-btn" onClick={() => navigate('/verification')}>
              🪪 Verify My Account Now
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="emp-stats-row stats-row">
          <div className="stat-card">
            <div className="stat-icon green">📋</div>
            <div>
              <div className="stat-value">3</div>
              <div className="stat-label">Jobs Posted</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">👥</div>
            <div>
              <div className="stat-value">22</div>
              <div className="stat-label">Applications</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">⭐</div>
            <div>
              <div className="stat-value">{shortlisted.length}</div>
              <div className="stat-label">Shortlisted</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow">✅</div>
            <div>
              <div className="stat-value">{hired.length}</div>
              <div className="stat-label">Hired</div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="emp-dashboard-grid">

          {/* LEFT COLUMN */}
          <div className="emp-left">

            {/* Posted jobs */}
            <div className="section-card">
              <div className="section-card-header">
                <h3>📋 My Posted Jobs</h3>
                <button
                  className="see-all-btn"
                  onClick={() => navigate('/post-job')}
                >
                  + New Job
                </button>
              </div>

              {POSTED_JOBS.map(job => (
                <div key={job.id} className="posted-job-row">
                  <div className="posted-job-info">
                    <div className="job-title">{job.title}</div>
                    <div className="job-meta-small">
                      <span>📍 {job.location}</span>
                      <span>💰 {job.pay}</span>
                      <span>👥 {job.applications} applications</span>
                      <span className={`status-badge ${job.status === 'open' ? 'approved' : 'rejected'}`}>
                        {job.status === 'open' ? '🟢 Open' : '🔴 Closed'}
                      </span>
                    </div>
                  </div>
                  <div className="posted-job-actions">
                    <button className="view-apps-btn">View Apps</button>
                    {job.status === 'open' && (
                      <button className="close-job-btn">Close</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Find Workers section */}
            <div className="section-card">
              <div className="section-card-header">
                <h3>🔍 Find Workers</h3>
              </div>

              {/* Search and filter */}
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search by name or skill..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)}>
                  <option value="">All Skills</option>
                  <option value="construction">Construction</option>
                  <option value="electrical">Electrical</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="plumbing">Plumbing</option>
                </select>
                <button>🔍</button>
              </div>

              {/* Worker results */}
              {filteredWorkers.map(worker => (
                <div key={worker.id} className="worker-result-card">
                  <div className="worker-result-avatar">{worker.emoji}</div>
                  <div className="worker-result-info">
                    <div className="worker-result-name">
                      {worker.name}
                      {worker.verified && <span className="badge-verified">✓ Verified</span>}
                    </div>
                    <div className="worker-result-skill">{worker.skill}</div>
                    <div className="worker-result-meta">
                      <span>📍 {worker.location}</span>
                      <span>⭐ {worker.rating} ({worker.reviews} reviews)</span>
                    </div>
                  </div>
                  <div className="worker-result-actions">
                    <button
                      className="hire-btn"
                      onClick={() => handleHire(worker.id)}
                      disabled={hired.includes(worker.id)}
                    >
                      {hired.includes(worker.id) ? '✅ Hired' : '✋ Hire'}
                    </button>
                    <button
                      className="shortlist-btn"
                      onClick={() => toggleShortlist(worker.id)}
                    >
                      {shortlisted.includes(worker.id) ? '⭐ Saved' : '🔖 Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN - Shortlist */}
          <div className="emp-right">
            <div className="shortlist-card">
              <h3>⭐ Shortlisted Workers ({shortlistedWorkers.length})</h3>

              {shortlistedWorkers.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                  No workers shortlisted yet.<br />
                  Click 🔖 Save on any worker to add them here.
                </p>
              ) : (
                shortlistedWorkers.map(worker => (
                  <div key={worker.id} className="shortlist-item">
                    <div className="shortlist-avatar">{worker.emoji}</div>
                    <div>
                      <div className="shortlist-name">{worker.name}</div>
                      <div className="shortlist-skill">{worker.skill}</div>
                    </div>
                    <button
                      className="shortlist-chat-btn"
                      onClick={() => navigate(`/chat/${worker.id}`)}
                    >
                      💬 Chat
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick tips card */}
            <div className="section-card">
              <h3 style={{ marginBottom: '14px' }}>💡 Quick Tips</h3>
              {[
                { icon: '✅', tip: 'Always hire verified workers for safety' },
                { icon: '💬', tip: 'Chat before hiring to discuss the job' },
                { icon: '⭐', tip: 'Leave a review after the job is done' },
                { icon: '📍', tip: 'Filter by location for nearby workers' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  padding: '10px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: '1.5' }}>
                    {item.tip}
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

export default EmployerDashboard;
