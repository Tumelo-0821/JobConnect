import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { api } from '../../services/api';
import './WorkerDashboard.css';
import {
  FaClipboardList,
  FaBriefcase,
  FaEdit,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaMoneyBillWave,
  FaStar,
  FaHandPaper,
  FaMapMarker,
} from "react-icons/fa";

function WorkerDashboard({ user, onLogout, authLoading }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [appliedIds, setAppliedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'worker') return;

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [jobList, appList] = await Promise.all([
          api.browseJobs(),
          api.getMyApplications(),
        ]);
        setJobs(jobList);
        setApplications(appList);
        setAppliedIds(appList.map(a => a.job_id));
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  if (authLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (user.role === 'employer') {
    navigate('/employer-dashboard');
    return null;
  }

  async function handleApply(jobId) {
    if (!user.verified) {
      navigate('/verification');
      return;
    }

    setApplyingId(jobId);
    try {
      const application = await api.applyForJob(jobId);
      setAppliedIds(prev => [...prev, jobId]);
      setApplications(prev => [application, ...prev]);
    } catch (err) {
      setError(err.message || 'Failed to apply for job');
    } finally {
      setApplyingId(null);
    }
  }

  const skills = user.skills?.length ? user.skills : [];
  const rating = user.rating || 0;
  const reviewCount = user.review_count || 0;
  const location = user.province || 'South Africa';

    // Jobs that match at least one of the worker's skills
  const matchingJobs = jobs.filter(job => {
    if (!skills.length) return false;

    const workerSkills = skills.map(skill => skill.toLowerCase().trim());

    const jobCategory = (job.category || '').toLowerCase().trim();

    const requiredSkills = (job.required_skills || [])
      .map(skill => skill.toLowerCase().trim());

    return (
      workerSkills.some(skill =>
        jobCategory.includes(skill) || skill.includes(jobCategory)
      ) ||
      workerSkills.some(skill =>
        requiredSkills.some(required =>
          required.includes(skill) || skill.includes(required)
        )
      )
    );
  });

  // Everything else goes into Other Jobs
  const matchingJobIds = new Set(matchingJobs.map(job => job.id));

  const otherJobs = jobs.filter(job => !matchingJobIds.has(job.id));

  const completionTasks = [
    { label: 'Created account', done: true },
    { label: 'Verified your ID', done: user.verified },
    { label: 'Added profile photo', done: false },
    { label: 'Listed your skills', done: skills.length > 0 },
    { label: 'Applied for first job', done: appliedIds.length > 0 },
  ];

  const completionPercent = Math.round(
    (completionTasks.filter(t => t.done).length / completionTasks.length) * 100
  );

  function getJobBadge(job) {
    if (job.urgency === 'urgent') return { className: 'urgent', label: '🔥 Urgent' };
    return { className: 'new', label: '🆕 New' };
  }

  return (
    <div className="dashboard-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="dashboard-container">
        <div className="dashboard-welcome">
          <div className="welcome-left">
            <div className="welcome-avatar">{user.name.charAt(0)}</div>
            <div className="welcome-text">
              <h2>Welcome back, {user.name.split(' ')[0]}! </h2>
              <p>Here are your latest job recommendations</p>
            </div>
          </div>
          <div className="welcome-right">
            {user.verified ? (
              <div className="verified-banner">ID Verified</div>
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

        {error && (
          <div className="not-verified-banner" style={{ marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon blue"><FaBriefcase/></div>
            <div>
              <div className="stat-value">{jobs.length}</div>
              <div className="stat-label">Jobs Available</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><FaCheckCircle/></div>
            <div>
              <div className="stat-value">{applications.length}</div>
              <div className="stat-label">Applied</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><FaStar/></div>
            <div>
              <div className="stat-value">{rating > 0 ? rating.toFixed(1) : '—'}</div>
              <div className="stat-label">My Rating</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow"><FaMoneyBillWave/></div>
            <div>
              <div className="stat-value">{reviewCount}</div>
              <div className="stat-label">Reviews</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-left">
            <div className="profile-card">
              <div className="profile-photo">{user.name.charAt(0)}</div>
              <div className="profile-name">{user.name}</div>
              <div className="profile-title">
                {skills.length ? skills.join(' & ') : 'Add your skills'}
              </div>
              <div className="profile-location"><FaMapMarkerAlt/> {location}</div>
              <div className="profile-rating">
                <span className="rating-stars">★★★★★</span>
                <span className="rating-value">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                <span className="rating-count">({reviewCount} reviews)</span>
              </div>
              <div className="profile-skills">
                {skills.length > 0 ? skills.map(s => (
                  <span key={s} style={{
                    background: '#e8f1fb', color: '#1a6fc4',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: '600'
                  }}>
                    {s}
                  </span>
                )) : (
                  <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No skills listed yet</span>
                )}
              </div>
              <button
                  className="edit-profile-btn"
                  onClick={() => navigate('/worker-profile')}
                >
                  <FaEdit style={{ marginRight: "10px" }} />
                  Edit Profile
                </button>
            </div>

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

          <div className="dashboard-right">
            <div className="section-card">
              <div className="section-card-header">
                <h3>🎯 Jobs Matching Your Skills</h3>
              </div>

              {loading ? (
                <p style={{ padding: '16px', color: '#6b7280' }}>
                  Loading jobs...
                </p>
              ) : matchingJobs.length === 0 ? (
                <div style={{ padding: '16px', color: '#6b7280' }}>
                  {skills.length === 0
                    ? 'Add your skills to your profile to see matching jobs.'
                    : 'No jobs currently match your skills.'}
                </div>
              ) : (
                matchingJobs.map(job => {
                  const badge = getJobBadge(job);

                  return (
                    <div key={job.id} className="job-card">
                      <div className="job-card-top">
                        <div>
                          <div className="job-title">{job.title}</div>
                          <div className="job-company">{job.category}</div>
                        </div>

                        <span className={`job-badge ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="job-meta">
                        <span className="job-meta-item">
                          <FaMapMarkerAlt /> {job.location}
                        </span>

                        <span className="job-meta-item">
                          <FaMoneyBillWave /> {job.pay || job.budget}
                        </span>

                        {job.duration && (
                          <span className="job-meta-item">
                            🕐 {job.duration}
                          </span>
                        )}
                      </div>

                      <div className="job-card-actions">
                        <button
                          className="apply-btn"
                          onClick={() => handleApply(job.id)}
                          disabled={
                            appliedIds.includes(job.id) ||
                            applyingId === job.id
                          }
                          title={
                            !user.verified
                              ? 'Verify your ID first to apply'
                              : ''
                          }
                        >
                          {appliedIds.includes(job.id)
                            ? '✅ Applied'
                            : applyingId === job.id
                            ? 'Applying...'
                            : user.verified
                            ? <><FaHandPaper /> Apply Now</>
                            : '🔒 Verify ID to Apply'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="section-card" style={{ marginTop: '20px' }}>
              <div className="section-card-header">
                <h3>🔍 Other Jobs</h3>
              </div>

              {loading ? (
                <p style={{ padding: '16px', color: '#6b7280' }}>
                  Loading jobs...
                </p>
              ) : otherJobs.length === 0 ? (
                <p style={{ padding: '16px', color: '#6b7280' }}>
                  No other jobs available right now.
                </p>
              ) : (
                otherJobs.map(job => {
                  const badge = getJobBadge(job);

                  return (
                    <div key={job.id} className="job-card">
                      <div className="job-card-top">
                        <div>
                          <div className="job-title">{job.title}</div>
                          <div className="job-company">{job.category}</div>
                        </div>

                        <span className={`job-badge ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="job-meta">
                          <span className="job-meta-item">
                            <FaMapMarkerAlt /> {job.location}
                          </span>

                          <span className="job-meta-item">
                            <FaMoneyBillWave /> {job.pay || job.budget}
                          </span>

                          {job.duration && (
                            <span className="job-meta-item">
                              🕐 {job.duration}
                            </span>
                          )}
                        </div>

                      <div className="job-card-actions">
                        <button
                          className="apply-btn"
                          onClick={() => handleApply(job.id)}
                          disabled={
                            appliedIds.includes(job.id) ||
                            applyingId === job.id
                          }
                          title={
                            !user.verified
                              ? 'Verify your ID first to apply'
                              : ''
                          }
                        >
                          {appliedIds.includes(job.id)
                            ? '✅ Applied'
                            : applyingId === job.id
                            ? 'Applying...'
                            : user.verified
                            ? <><FaHandPaper /> Apply Now</>
                            : '🔒 Verify ID to Apply'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>


<div className="section-card" style={{ marginTop: '20px' }}>
  <div className="section-card-header">
    <h3><FaClipboardList /> My Applications</h3>
  </div>

  {applications.length === 0 ? (
    <p style={{ padding: '16px', color: '#6b7280' }}>
      You haven't applied to any jobs yet.
    </p>
  ) : (
    applications.map(app => (
      <div key={app.id} className="applied-job-row">
        
        <div className="applied-job-info">
          <div className="job-title">{app.job_title}</div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>

          <span className={`status-badge ${app.status}`}>
            {app.status === 'pending' && '⏳ Pending'}
            {app.status === 'approved' && '✅ Approved'}
            {app.status === 'hired' && '✅ Hired'}
            {app.status === 'rejected' && '❌ Not Selected'}
          </span>

          {app.employer_id && (
            <button
              type="button"
              onClick={() => navigate(`/chat/${app.employer_id}`)}
              style={{
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                background: '#1a6fc4',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              💬 Message Employer
            </button>
          )}

        </div>

      </div>
    ))
  )}
</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;
