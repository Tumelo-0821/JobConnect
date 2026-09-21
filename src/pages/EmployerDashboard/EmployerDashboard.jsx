import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { api } from '../../services/api';
import './EmployerDashboard.css';
import {
  FaClipboardList,
  FaUsers,
  FaMapMarker,
  FaMoneyBillWave,
  FaStar,
  FaCheckCircle,
  FaHandPaper,
  FaComments,
  FaMapMarkerAlt,
} from "react-icons/fa";

function EmployerDashboard({ user, onLogout, authLoading }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [shortlisted, setShortlisted] = useState([]);
  const [postedJobs, setPostedJobs] = useState([]);

  const [allApplications, setAllApplications] = useState([]);
  const [updatingApplicationId, setUpdatingApplicationId] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closingJobId, setClosingJobId] = useState(null);
  const [expandedHiredWorker, setExpandedHiredWorker] = useState(null);
  const [expandedApplicationId, setExpandedApplicationId] = useState(null);
  const [rejectionApplication, setRejectionApplication] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [rejecting, setRejecting] = useState(false);

  function formatRand(value) {
  if (!value) return 'Not specified';

  const text = String(value).trim();

  if (/^R/i.test(text)) {
    return text;
  }

  return `R${text}`;
}

  useEffect(() => {
    if (!user || user.role !== 'employer') return;

    async function loadData() {
      setLoading(true);
      setError('');

      // Load employer's posted jobs first
      try {
        const jobs = await api.getEmployerJobs();
        setPostedJobs(jobs);
      } catch (err) {
        console.error('Failed to load employer jobs:', err);
        setError(err.message || 'Failed to load employer jobs');
      }

      // Load workers separately
      try {
        const workerList = await api.getWorkers(search, skillFilter);
        setWorkers(workerList);
      } catch (err) {
        console.error('Failed to load workers:', err);
        setWorkers([]);
      }

      // Load application statistics separately
      try {
        const stats = await api.getEmployerApplicationStats();
        setTotalApplications(stats.total || 0);
      } catch (err) {
        console.error('Failed to load application stats:', err);
        setTotalApplications(0);
      }

      // Load ALL applications belonging to this employer
      try {
        const applications = await api.getEmployerApplications();
        setAllApplications(applications);
      } catch (err) {
        console.error('Failed to load employer applications:', err);
        setAllApplications([]);
      }

      setLoading(false);
    }

    loadData();
  }, [user, search, skillFilter]);

  if (authLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

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

  async function handleApplicationStatus(
    jobId,
    applicationId,
    newStatus
  ) {
    if (!user.verified) {
      navigate('/verification');
      return;
    }

    setUpdatingApplicationId(applicationId);
    setError('');

    try {
      await api.updateApplicationStatus(
        jobId,
        applicationId,
        newStatus
      );

      const applications =
        await api.getEmployerApplications();

      setAllApplications(applications);
    } catch (err) {
      console.error('Failed to update application:', err);
      setError(
        err.message || 'Failed to update application'
      );
    } finally {
      setUpdatingApplicationId(null);
    }
  }

  async function handleRejectApplication() {
  if (!rejectionApplication) return;

  const message = rejectionMessage.trim();

  if (!message) {
    setError('Please provide a reason for rejecting this application.');
    return;
  }

  setRejecting(true);
  setError('');

  try {
    await api.updateApplicationStatus(
      rejectionApplication.jobId,
      rejectionApplication.applicationId,
      'rejected',
      message
    );

    const applications =
      await api.getEmployerApplications();

    setAllApplications(applications);

    setRejectionApplication(null);
    setRejectionMessage('');
  } catch (err) {
    console.error('Failed to reject application:', err);

    setError(
      err.message ||
      'Failed to reject application.'
    );
  } finally {
    setRejecting(false);
  }
}

  async function handleViewCV(jobId, applicationId) {
    try {
      const blob = await api.getApplicationCV(
        jobId,
        applicationId
      );

      const fileUrl =
        window.URL.createObjectURL(blob);

      window.open(fileUrl, '_blank');

      setTimeout(() => {
        window.URL.revokeObjectURL(fileUrl);
      }, 60000);
    } catch (err) {
      setError(
        err.message || 'Failed to open CV.'
      );
    }
  }

  async function handleDownloadCV(
    jobId,
    applicationId,
    fileName
  ) {
    try {
      const blob = await api.getApplicationCV(
        jobId,
        applicationId
      );

      const fileUrl =
        window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = fileUrl;
      link.download =
        fileName || 'worker-cv';

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(fileUrl);
      }, 60000);
    } catch (err) {
      setError(
        err.message || 'Failed to download CV.'
      );
    }
  }

  async function handleCloseJob(jobId) {
    setClosingJobId(jobId);

    try {
      await api.closeJob(jobId);

      // Remove the closed job from the active jobs list
      setPostedJobs(prev =>
        prev.filter(job => job.id !== jobId)
      );
    } catch (err) {
      setError(
        err.message || 'Failed to close job'
      );
    } finally {
      setClosingJobId(null);
    }
  }

  const shortlistedWorkers =
    workers.filter(w =>
      shortlisted.includes(w.id)
    );

  // Only show:
  // 1. Pending applications for OPEN jobs
  // 2. Hired applications even when the job is CLOSED
  const visibleApplications =
    allApplications.filter(application => {
      if (application.status === 'rejected') {
        return false;
      }

      if (application.status === 'hired') {
        return true;
      }

      return (
        application.status === 'pending' &&
        application.job_status === 'open'
      );
    });

  const hiredApplications =
    allApplications.filter(
      application =>
        application.status === 'hired'
    );

  const pendingApplications =
    allApplications.filter(
      application =>
        application.status === 'pending' &&
        application.job_status === 'open'
    );

  return (
    <>
    <div className="emp-dashboard-page">
      <Navbar
        user={user}
        onLogout={onLogout}
      />

      <div className="emp-dashboard-container">

        <div className="emp-welcome">
          <div className="emp-welcome-left">

            <div className="emp-welcome-avatar">
              🏢
            </div>

            <div className="emp-welcome-text">
              <h2>
                Welcome, {user.name.split(' ')[0]}! 👋
              </h2>

              <p>
                Manage your jobs and find trusted workers
              </p>
            </div>
          </div>

          <button
            className="post-job-btn"
            onClick={() =>
              user.verified
                ? navigate('/post-job')
                : navigate('/verification')
            }
          >
            ＋ Post a Job
          </button>
        </div>

        {!user.verified && (
          <div className="not-verified-warning">
            <p>
              ⚠️{' '}
              <strong>
                Your account is not verified.
              </strong>{' '}
              Verify your identity to post jobs and hire workers.
            </p>

            <button
              className="verify-now-btn"
              onClick={() =>
                navigate('/verification')
              }
            >
              🪪 Verify My Account Now
            </button>
          </div>
        )}

        {error && (
          <div className="not-verified-warning">
            <p>⚠️ {error}</p>
          </div>
        )}

        <div className="emp-stats-row stats-row">

          <div className="stat-card">
            <div className="stat-icon green">
              <FaClipboardList />
            </div>

            <div>
              <div className="stat-value">
                {postedJobs.length}
              </div>

              <div className="stat-label">
                Jobs Posted
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <FaUsers />
            </div>

            <div>
              <div className="stat-value">
                {totalApplications}
              </div>

              <div className="stat-label">
                Applications
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <FaStar />
            </div>

            <div>
              <div className="stat-value">
                {shortlisted.length}
              </div>

              <div className="stat-label">
                Shortlisted
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon yellow">
              <FaCheckCircle />
            </div>

            <div>
              <div className="stat-value">
                {hiredApplications.length}
              </div>

              <div className="stat-label">
                Hired
              </div>
            </div>
          </div>

        </div>

        <div className="emp-dashboard-grid">

          <div className="emp-left">

            <div className="section-card">

              <div className="section-card-header">

                <h3>
                  📋 My Posted Jobs
                </h3>

                <button
                  className="see-all-btn"
                  onClick={() =>
                    navigate('/post-job')
                  }
                >
                  + New Job
                </button>

              </div>

              {loading ? (
                <p
                  style={{
                    padding: '16px',
                    color: '#6b7280'
                  }}
                >
                  Loading jobs...
                </p>
              ) : postedJobs.length === 0 ? (
                <p
                  style={{
                    padding: '16px',
                    color: '#6b7280'
                  }}
                >
                  No jobs posted yet. Post your first job!
                </p>
              ) : (
                postedJobs
                  .filter(job => job.status === 'open')
                  .map(job => (

                    <div
                      key={job.id}
                      className="posted-job-row"
                    >

                      <div className="posted-job-info">

                        <div className="job-title">
                          {job.title}
                        </div>

                        <div className="job-meta-small">

                          <span>
                            <FaMapMarker />{' '}
                            {job.location}
                          </span>

                          <span>
                             {formatRand(job.pay || job.budget)}

                          </span>

                          <span>
                            <FaUsers />{' '}
                            {job.applications} applications
                          </span>

                          <span
                            className={`status-badge ${
                              job.status === 'open'
                                ? 'approved'
                                : 'rejected'
                            }`}
                          >
                            {job.status === 'open'
                              ? '🟢 Open'
                              : '🔴 Closed'}
                          </span>

                        </div>
                      </div>

                      <div className="posted-job-actions">

                        {job.status === 'open' && (
                          <button
                            className="close-job-btn"
                            onClick={() =>
                              handleCloseJob(job.id)
                            }
                            disabled={
                              closingJobId === job.id
                            }
                          >
                            {closingJobId === job.id
                              ? 'Closing...'
                              : 'Close'}
                          </button>
                        )}

                      </div>

                    </div>
                  ))
              )}

            </div>

            {/* All Employer Applications */}

            <div className="section-card">

              <div className="section-card-header">

                <h3>
                  📋 Job Applicants
                </h3>

                <span
                  style={{
                    color: '#6b7280',
                    fontSize: '0.9rem'
                  }}
                >
                  {visibleApplications.length} active
                </span>

              </div>

              {visibleApplications.length === 0 ? (

                <p
                  style={{
                    padding: '16px',
                    color: '#6b7280'
                  }}
                >
                  No workers have applied for your jobs yet.
                </p>

              ) : (

                visibleApplications.map(application => (

                  <div
                    key={application.id}
                    className="worker-result-card"
                  >

                    {/* Worker avatar */}

                    <div className="worker-result-avatar">
                      👷
                    </div>

                    {/* Worker information */}

                    <div className="worker-result-info">

                      <div className="worker-result-name">
                        {application.worker_name || 'Worker'}
                      </div>

                      <div className="worker-result-skill">
                        {application.job_title}
                      </div>

                      <div className="worker-result-meta">

                        <span>
                          📧{' '}
                          {application.worker_email ||
                            'No email'}
                        </span>

                        <span>
                          📞{' '}
                          {application.worker_phone ||
                            'No phone'}
                        </span>

                        <span>
                          📍{' '}
                          {application.worker_province ||
                            'Province not provided'}
                        </span>

                      </div>

                      <div className="worker-result-meta">

                        <span>
                          🛠️{' '}

                          {application.worker_skills?.length
                            ? application.worker_skills.join(', ')
                            : 'No skills listed'}
                        </span>

                      </div>

                    </div>

                    {/* Hire / Reject actions */}

                    <div className="worker-result-actions">

                      {application.status === 'pending' && (
                        <>
                          <button
                            className="hire-btn"
                            onClick={async () => {

                              await handleApplicationStatus(
                                application.job_id,
                                application.id,
                                'hired'
                              );

                              const applications =
                                await api.getEmployerApplications();

                              setAllApplications(applications);

                            }}
                            disabled={
                              updatingApplicationId ===
                              application.id
                            }
                          >
                            {updatingApplicationId ===
                            application.id
                              ? 'Hiring...'
                              : 'Hire'}
                          </button>

                          <button
                              className="shortlist-btn"
                              onClick={() => {
                                setRejectionApplication({
                                  jobId: application.job_id,
                                  applicationId: application.id,
                                  workerName: application.worker_name || 'Worker',
                                });

                                setRejectionMessage('');
                                setError('');
                              }}
                              disabled={
                                updatingApplicationId ===
                                application.id
                              }
                            >
                              Reject
                            </button>
                        </>
                      )}

                      {application.status === 'hired' && (
                        <span className="status-badge approved">
                          ✅ Hired
                        </span>
                      )}

                      {application.status === 'rejected' && (
                        <span className="status-badge rejected">
                          ❌ Rejected
                        </span>
                      )}

                    </div>

                    {/* Learn More section - always at the bottom */}

                    <div className="worker-card-bottom">

                      <button
                        type="button"
                        className="learn-more-btn"
                        onClick={() =>
                          setExpandedApplicationId(
                            expandedApplicationId ===
                            application.id
                              ? null
                              : application.id
                          )
                        }
                      >
                        {expandedApplicationId ===
                        application.id
                          ? 'Show Less'
                          : 'Learn More'}
                      </button>

                      {expandedApplicationId ===
                        application.id && (

                        <div className="worker-expanded-details">

                          <h4>
                            About{' '}
                            {application.worker_name ||
                              'Worker'}
                          </h4>

                          <p>
                            {application.worker_bio ||
                              'This worker has not added a bio yet.'}
                          </p>

                          <div className="expanded-contact-details">

                            <div>
                              <strong>Email:</strong>{' '}
                              {application.worker_email ||
                                'Not provided'}
                            </div>

                            <div>
                              <strong>Phone:</strong>{' '}
                              {application.worker_phone ||
                                'Not provided'}
                            </div>

                            <div>
                              <strong>Province:</strong>{' '}
                              {application.worker_province ||
                                'Not provided'}
                            </div>

                            <div>
                              <strong>Skills:</strong>{' '}
                              {application.worker_skills?.length
                                ? application.worker_skills.join(', ')
                                : 'No skills listed'}
                            </div>

                          </div>

                          {/* CV */}

                          {application.worker_cv_available && (
                            <div className="worker-cv-section">

                              <div className="worker-cv-name">

                                <strong>CV:</strong>{' '}

                                {application.worker_cv_file_name}

                              </div>

                              <div className="worker-cv-buttons">

                                <button
                                  type="button"
                                  className="cv-view-btn"
                                  onClick={() =>
                                    handleViewCV(
                                      application.job_id,
                                      application.id
                                    )
                                  }
                                >
                                  View CV
                                </button>

                                <button
                                  type="button"
                                  className="cv-download-btn"
                                  onClick={() =>
                                    handleDownloadCV(
                                      application.job_id,
                                      application.id,
                                      application.worker_cv_file_name
                                    )
                                  }
                                >
                                  Download CV
                                </button>

                              </div>

                            </div>
                          )}

                          {!application.worker_cv_available && (
                            <div className="no-cv-message">
                              No CV uploaded by this worker.
                            </div>
                          )}

                        </div>
                      )}

                    </div>

                  </div>

                ))
              )}

            </div>

            {/* Find Workers */}

            <div className="section-card">

              <div className="section-card-header">

                <h3>
                  🔍 Find Workers
                </h3>

              </div>

              <div className="search-bar">

                <input
                  type="text"
                  placeholder="Search by name or skill..."
                  value={search}
                  onChange={e =>
                    setSearch(e.target.value)
                  }
                />

                <select
                  value={skillFilter}
                  onChange={e =>
                    setSkillFilter(e.target.value)
                  }
                >
                  <option value="">
                    All Skills
                  </option>

                  <option value="construction">
                    Construction
                  </option>

                  <option value="electrical">
                    Electrical
                  </option>

                  <option value="cleaning">
                    Cleaning
                  </option>

                  <option value="plumbing">
                    Plumbing
                  </option>

                </select>

              </div>

              {loading ? (

                <p
                  style={{
                    padding: '16px',
                    color: '#6b7280'
                  }}
                >
                  Loading workers...
                </p>

              ) : workers.length === 0 ? (

                <p
                  style={{
                    padding: '16px',
                    color: '#6b7280'
                  }}
                >
                  No workers found yet.
                </p>

              ) : (

                workers.map(worker => (

                  <div
                    key={worker.id}
                    className="worker-result-card"
                  >

                    <div className="worker-result-avatar">
                      👷
                    </div>

                    <div className="worker-result-info">

                      <div className="worker-result-name">

                        {worker.name}

                        {worker.verified && (
                          <span className="badge-verified">
                            ✓ Verified
                          </span>
                        )}

                      </div>

                      <div className="worker-result-skill">
                        {worker.skill}
                      </div>

                      <div className="worker-result-meta">

                        <span>
                          <FaMapMarker />{' '}
                          {worker.location}
                        </span>

                        <span>
                          ⭐ {worker.rating} (
                          {worker.reviews} reviews)
                        </span>

                      </div>

                    </div>

                    <div className="worker-result-actions">

                      <button
                        className="shortlist-btn"
                        onClick={() =>
                          toggleShortlist(worker.id)
                        }
                      >
                        {shortlisted.includes(worker.id) ? (
                          <>
                            <FaStar /> Saved
                          </>
                        ) : (
                          'Save'
                        )}
                      </button>

                    </div>

                  </div>

                ))
              )}

            </div>

          </div>

          {/* RIGHT SIDE */}

          <div className="emp-right">

            {/* Shortlisted workers */}

            <div className="shortlist-card">

              <h3>
                <FaStar /> Shortlisted Workers (
                {shortlistedWorkers.length})
              </h3>

              {shortlistedWorkers.length === 0 ? (

                <p
                  style={{
                    color: '#9ca3af',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    padding: '20px 0'
                  }}
                >
                  No workers shortlisted yet.
                  <br />
                  Click Save on any worker to add them here.
                </p>

              ) : (

                shortlistedWorkers.map(worker => (

                  <div
                    key={worker.id}
                    className="shortlist-item"
                  >

                    <div className="shortlist-avatar">
                      👷
                    </div>

                    <div>
                      <div className="shortlist-name">
                        {worker.name}
                      </div>

                      <div className="shortlist-skill">
                        {worker.skill}
                      </div>
                    </div>

                    <button
                      className="shortlist-chat-btn"
                      onClick={() =>
                        navigate(`/chat/${worker.id}`)
                      }
                    >
                      💬 Chat
                    </button>

                  </div>

                ))
              )}

            </div>

            {/* Hired workers */}

            <div className="shortlist-card hired-workers-card">

              <h3>
                <FaCheckCircle /> Hired Workers (
                {hiredApplications.length})
              </h3>

              {hiredApplications.length === 0 ? (

                <p
                  style={{
                    color: '#9ca3af',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    padding: '20px 0'
                  }}
                >
                  No workers hired yet.
                </p>

              ) : (

                hiredApplications.map(application => (

                  <div
                    key={application.id}
                    className="shortlist-item"
                    style={{
                      flexWrap: 'wrap',
                      alignItems: 'flex-start'
                    }}
                  >

                    <div className="shortlist-avatar">
                      👤
                    </div>

                    <div style={{ flex: 1 }}>

                      <div className="shortlist-name">
                        {application.worker_name ||
                          'Worker'}
                      </div>

                      <div className="shortlist-skill">
                        {application.job_title}
                      </div>

                      {expandedHiredWorker ===
                        application.id && (

                        <div
                          style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            lineHeight: '1.6'
                          }}
                        >

                          <div>
                            <strong>Email:</strong>{' '}
                            {application.worker_email ||
                              'Not provided'}
                          </div>

                          <div>
                            <strong>Phone:</strong>{' '}
                            {application.worker_phone ||
                              'Not provided'}
                          </div>

                          <div>
                            <strong>Skills:</strong>{' '}
                            {application.worker_skills?.length
                              ? application.worker_skills.join(', ')
                              : 'No skills listed'}
                          </div>

                          <div>
                            <strong>Province:</strong>{' '}
                            {application.worker_province ||
                              'Not provided'}
                          </div>

                          <div
                            style={{
                              marginTop: '8px'
                            }}
                          >

                            <strong>About Me:</strong>

                            <p
                              style={{
                                margin: '4px 0 0',
                                color: '#6b7280'
                              }}
                            >
                              {application.worker_bio ||
                                'No bio provided'}
                            </p>

                          </div>

                        </div>
                      )}

                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}
                    >

                      <button
                        className="shortlist-chat-btn"
                        onClick={() =>
                          navigate(
                            `/chat/${application.worker_id}`
                          )
                        }
                      >
                        💬 Chat
                      </button>

                      <button
                        className="shortlist-chat-btn"
                        onClick={() =>
                          setExpandedHiredWorker(
                            expandedHiredWorker ===
                            application.id
                              ? null
                              : application.id
                          )
                        }
                      >
                        {expandedHiredWorker ===
                        application.id
                          ? 'Hide Details'
                          : 'Learn More'}
                      </button>

                    </div>

                  </div>

                ))
              )}

            </div>

            {/* Quick tips */}

            <div className="section-card">

              <h3
                style={{
                  marginBottom: '14px'
                }}
              >
                💡 Quick Tips
              </h3>

              {[
                {
                  icon: <FaCheckCircle />,
                  tip: 'Always hire verified workers for safety'
                },
                {
                  icon: <FaComments />,
                  tip: 'Chat before hiring to discuss the job'
                },
                {
                  icon: <FaStar />,
                  tip: 'Leave a review after the job is done'
                },
                {
                  icon: <FaMapMarkerAlt />,
                  tip: 'Filter by location for nearby workers'
                },
              ].map((item, i) => (

                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    padding: '10px 0',
                    borderBottom:
                      i < 3
                        ? '1px solid #f3f4f6'
                        : 'none'
                  }}
                >

                  <span
                    style={{
                      fontSize: '1.1rem',
                      flexShrink: 0
                    }}
                  >
                    {item.icon}
                  </span>

                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: '#6b7280',
                      lineHeight: '1.5'
                    }}
                  >
                    {item.tip}
                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </div>

    {rejectionApplication && (
  <div className="rejection-modal-overlay">

    <div className="rejection-modal">

      <div className="rejection-modal-header">
        <h3>Reject Application</h3>

        <button
          type="button"
          className="rejection-close-btn"
          onClick={() => {
            setRejectionApplication(null);
            setRejectionMessage('');
            setError('');
          }}
        >
          ×
        </button>
      </div>

      <p className="rejection-worker-name">
        You are rejecting{' '}
        <strong>
          {rejectionApplication.workerName}
        </strong>
      </p>

      <label
        htmlFor="rejection-message"
        className="rejection-label"
      >
        Reason for rejection
      </label>

      <textarea
        id="rejection-message"
        className="rejection-textarea"
        rows="5"
        placeholder="Please explain why this application was not successful..."
        value={rejectionMessage}
        onChange={(e) =>
          setRejectionMessage(e.target.value)
        }
      />

      <p className="rejection-helper">
        This message will be sent to the worker with
        their rejection notification.
      </p>

      <div className="rejection-modal-actions">

        <button
          type="button"
          className="rejection-cancel-btn"
          onClick={() => {
            setRejectionApplication(null);
            setRejectionMessage('');
            setError('');
          }}
          disabled={rejecting}
        >
          Cancel
        </button>

        <button
          type="button"
          className="rejection-confirm-btn"
          onClick={handleRejectApplication}
          disabled={
            rejecting ||
            !rejectionMessage.trim()
          }
        >
          {rejecting
            ? 'Rejecting...'
            : 'Confirm Rejection'}
        </button>

      </div>

    </div>

  </div>
    )}
    </>
);
}

export default EmployerDashboard;
