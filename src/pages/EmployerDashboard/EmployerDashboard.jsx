import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { api } from '../../services/api';
import './EmployerDashboard.css';
import {
  FaClipboardList,
  FaUsers,
  FaMapMarker,
  FaStar,
  FaCheckCircle,
  FaComments,
  FaMapMarkerAlt,
} from 'react-icons/fa';

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

  // Work completion and reviews
  const [workActionLoading, setWorkActionLoading] = useState(null);
  const [reviewingApplicationId, setReviewingApplicationId] = useState(null);
  const [selectedRatings, setSelectedRatings] = useState({});
  const [reviewTexts, setReviewTexts] = useState({});
  const [reviewMessage, setReviewMessage] = useState('');

  function formatRand(value) {
    if (value === null || value === undefined || value === '') {
      return 'Not specified';
    }

    const text = String(value).trim();
    return /^R/i.test(text) ? text : `R${text}`;
  }

  const formatClosingDate = (closingDate) => {
    if (!closingDate) return 'No closing date set';

    const date = new Date(closingDate);

    if (Number.isNaN(date.getTime())) {
      return 'Closing date unavailable';
    }

    return date.toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Johannesburg',
    });
  };

  async function refreshApplications() {
    const applications = await api.getEmployerApplications();
    setAllApplications(applications);
    return applications;
  }

  useEffect(() => {
    if (!user || user.role !== 'employer') {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const jobs = await api.getEmployerJobs();
        if (!cancelled) setPostedJobs(jobs);
      } catch (err) {
        console.error('Failed to load employer jobs:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to load employer jobs');
        }
      }

      try {
        const workerList = await api.getWorkers(search, skillFilter);
        if (!cancelled) setWorkers(workerList);
      } catch (err) {
        console.error('Failed to load workers:', err);
        if (!cancelled) setWorkers([]);
      }

      try {
        const stats = await api.getEmployerApplicationStats();
        if (!cancelled) setTotalApplications(stats.total || 0);
      } catch (err) {
        console.error('Failed to load application stats:', err);
        if (!cancelled) setTotalApplications(0);
      }

      try {
        const applications = await api.getEmployerApplications();
        if (!cancelled) setAllApplications(applications);
      } catch (err) {
        console.error('Failed to load employer applications:', err);
        if (!cancelled) setAllApplications([]);
      }

      if (!cancelled) setLoading(false);
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [user, search, skillFilter]);

  if (authLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
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
    setShortlisted(previous =>
      previous.includes(workerId)
        ? previous.filter(id => id !== workerId)
        : [...previous, workerId]
    );
  }

  async function handleApplicationStatus(jobId, applicationId, newStatus) {
    if (!user.verified) {
      navigate('/verification');
      return;
    }

    setUpdatingApplicationId(applicationId);
    setError('');
    setReviewMessage('');

    try {
      await api.updateApplicationStatus(jobId, applicationId, newStatus);
      await refreshApplications();
    } catch (err) {
      console.error('Failed to update application:', err);
      setError(err.message || 'Failed to update application');
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

      await refreshApplications();
      setRejectionApplication(null);
      setRejectionMessage('');
    } catch (err) {
      console.error('Failed to reject application:', err);
      setError(err.message || 'Failed to reject application.');
    } finally {
      setRejecting(false);
    }
  }

  async function handleViewCV(jobId, applicationId) {
    try {
      const blob = await api.getApplicationCV(jobId, applicationId);
      const fileUrl = window.URL.createObjectURL(blob);
      window.open(fileUrl, '_blank');

      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 60000);
    } catch (err) {
      setError(err.message || 'Failed to open CV.');
    }
  }

  async function handleDownloadCV(jobId, applicationId, fileName) {
    try {
      const blob = await api.getApplicationCV(jobId, applicationId);
      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = fileUrl;
      link.download = fileName || 'worker-cv';

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 60000);
    } catch (err) {
      setError(err.message || 'Failed to download CV.');
    }
  }

  async function handleMarkWorkCompleted(application) {
    const confirmed = window.confirm(
      `Confirm that the work for "${application.job_title}" has been completed?`
    );

    if (!confirmed) return;

    setWorkActionLoading(application.id);
    setError('');
    setReviewMessage('');

    try {
      await api.markWorkCompleted(application.job_id, application.id);
      await refreshApplications();

      setReviewingApplicationId(application.id);
      setReviewMessage(
        'Work marked as completed. You can now rate the worker.'
      );
    } catch (err) {
      console.error('Failed to mark work completed:', err);
      setError(err.message || 'Failed to mark work as completed.');
    } finally {
      setWorkActionLoading(null);
    }
  }

  async function handleSubmitWorkerReview(application) {
    const rating = Number(selectedRatings[application.id] || 0);
    const review = (reviewTexts[application.id] || '').trim();

    if (rating < 1 || rating > 5) {
      setError('Please select a rating from 1 to 5 stars.');
      return;
    }

    setWorkActionLoading(application.id);
    setError('');
    setReviewMessage('');

    try {
      await api.reviewWorker(
        application.job_id,
        application.id,
        rating,
        review
      );

      await refreshApplications();
      setReviewingApplicationId(null);

      setReviewMessage(
        `Review submitted successfully for ${application.worker_name || 'the worker'}.`
      );
    } catch (err) {
      console.error('Failed to submit worker review:', err);
      setError(err.message || 'Failed to submit the review.');
    } finally {
      setWorkActionLoading(null);
    }
  }

  async function handleCloseJob(jobId) {
    setClosingJobId(jobId);
    setError('');

    try {
      await api.closeJob(jobId);
      setPostedJobs(previous => previous.filter(job => job.id !== jobId));
    } catch (err) {
      setError(err.message || 'Failed to close job');
    } finally {
      setClosingJobId(null);
    }
  }

  const shortlistedWorkers = workers.filter(worker =>
    shortlisted.includes(worker.id)
  );

  const visibleApplications = allApplications.filter(application => {
    if (application.status === 'rejected') return false;
    if (application.status === 'hired') return true;

    return (
      application.status === 'pending' &&
      application.job_status === 'open'
    );
  });

  const hiredApplications = allApplications.filter(
    application => application.status === 'hired'
  );

  return (
    <>
      <div className="emp-dashboard-page">
        <Navbar user={user} onLogout={onLogout} />

        <div className="emp-dashboard-container">
          <div className="emp-welcome">
            <div className="emp-welcome-left">
              <div className="emp-welcome-avatar">🏢</div>

              <div className="emp-welcome-text">
                <h2>Welcome, {user.name.split(' ')[0]}!</h2>
                <p>Manage your jobs and find trusted workers</p>
              </div>
            </div>

            <button
              className="post-job-btn"
              onClick={() =>
                user.verified ? navigate('/post-job') : navigate('/verification')
              }
            >
              ＋ Post a Job
            </button>
          </div>

          {!user.verified && (
            <div className="not-verified-warning">
              <p>
                ⚠️ <strong>Your account is not verified.</strong> Verify your
                identity to post jobs and hire workers.
              </p>

              <button
                className="verify-now-btn"
                onClick={() => navigate('/verification')}
              >
                🪪 Verify My Account Now
              </button>
            </div>
          )}

          {error && (
            <div className="not-verified-warning" role="alert">
              <p>⚠️ {error}</p>
            </div>
          )}

          {reviewMessage && (
            <div
              style={{
                background: '#dcfce7',
                color: '#166534',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
              role="status"
            >
              {reviewMessage}
            </div>
          )}

          <div className="emp-stats-row stats-row">
            <div className="stat-card">
              <div className="stat-icon green"><FaClipboardList /></div>
              <div>
                <div className="stat-value">{postedJobs.length}</div>
                <div className="stat-label">Jobs Posted</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue"><FaUsers /></div>
              <div>
                <div className="stat-value">{totalApplications}</div>
                <div className="stat-label">Applications</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange"><FaStar /></div>
              <div>
                <div className="stat-value">{shortlisted.length}</div>
                <div className="stat-label">Shortlisted</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon yellow"><FaCheckCircle /></div>
              <div>
                <div className="stat-value">{hiredApplications.length}</div>
                <div className="stat-label">Hired</div>
              </div>
            </div>
          </div>

          <div className="emp-dashboard-grid">
            <div className="emp-left">
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

                {loading ? (
                  <p style={{ padding: '16px', color: '#6b7280' }}>
                    Loading jobs...
                  </p>
                ) : postedJobs.filter(job => job.status === 'open').length === 0 ? (
                  <p style={{ padding: '16px', color: '#6b7280' }}>
                    No open jobs at the moment. Post your first job!
                  </p>
                ) : (
                  postedJobs
                    .filter(job => job.status === 'open')
                    .map(job => (
                      <div key={job.id} className="posted-job-row">
                        <div className="posted-job-info">
                          <div className="job-title">{job.title}</div>

                          <div className="job-meta-small">
                            <span><FaMapMarker /> {job.location}</span>
                            <span>{formatRand(job.pay || job.budget)}</span>
                            <span><FaUsers /> {job.applications} applications</span>

                            <span className={`status-badge ${job.status === 'open' ? 'approved' : 'rejected'}`}>
                              {job.status === 'open' ? '🟢 Open' : '🔴 Closed'}
                            </span>
                          </div>

                          <div
                            className="job-closing-date"
                            style={{
                              marginTop: '8px',
                              fontSize: '0.85rem',
                              color: '#64748b',
                              lineHeight: '1.5',
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>
                              🗓️ Applications close:
                            </div>
                            <div style={{ fontWeight: 'bold', paddingLeft: '20px' }}>
                              {formatClosingDate(job.closing_date)}
                            </div>
                          </div>
                        </div>

                        <div className="posted-job-actions">
                          {job.status === 'open' && (
                            <button
                              className="close-job-btn"
                              onClick={() => handleCloseJob(job.id)}
                              disabled={closingJobId === job.id}
                            >
                              {closingJobId === job.id ? 'Closing...' : 'Close'}
                            </button>
                          )}

                          <button
                            type="button"
                            className="chat-job-btn"
                            onClick={() => {}}
                          >
                            💬 Chat
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="section-card">
                <div className="section-card-header">
                  <h3>📋 Job Applicants</h3>
                  <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    {visibleApplications.length} active
                  </span>
                </div>

                {visibleApplications.length === 0 ? (
                  <p style={{ padding: '16px', color: '#6b7280' }}>
                    No workers have applied for your jobs yet.
                  </p>
                ) : (
                  visibleApplications.map(application => (
                    <div key={application.id} className="worker-result-card">
                     <div className="worker-result-avatar">
                          {application.worker_name
                            ? application.worker_name.trim().charAt(0).toUpperCase()
                            : 'W'}
                        </div>

                      <div className="worker-result-info">
                        <div className="worker-result-name">
                          {application.worker_name || 'Worker'}
                        </div>

                        <div className="worker-result-skill">
                          {application.job_title}
                        </div>

                        <div className="worker-result-meta">
                          <span>📧 {application.worker_email || 'No email'}</span>
                          <span>📞 {application.worker_phone || 'No phone'}</span>
                          <span>📍 {application.worker_province || 'Province not provided'}</span>
                        </div>

                        <div className="worker-result-meta">
                          <span>
                            🛠️ {application.worker_skills?.length
                              ? application.worker_skills.join(', ')
                              : 'No skills listed'}
                          </span>
                        </div>
                      </div>

                      <div className="worker-result-actions">
                        {application.status === 'pending' && (
                          <>
                            <button
                              className="hire-btn"
                              onClick={() =>
                                handleApplicationStatus(
                                  application.job_id,
                                  application.id,
                                  'hired'
                                )
                              }
                              disabled={updatingApplicationId === application.id}
                            >
                              {updatingApplicationId === application.id
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
                              disabled={updatingApplicationId === application.id}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {application.status === 'hired' && (
                          <span className="status-badge approved">✅ Hired</span>
                        )}
                      </div>

                      <div className="worker-card-bottom">
                        <button
                          type="button"
                          className="learn-more-btn"
                          onClick={() =>
                            setExpandedApplicationId(
                              expandedApplicationId === application.id
                                ? null
                                : application.id
                            )
                          }
                        >
                          {expandedApplicationId === application.id
                            ? 'Show Less'
                            : 'Learn More'}
                        </button>

                        {expandedApplicationId === application.id && (
                          <div className="worker-expanded-details">
                            <h4>About {application.worker_name || 'Worker'}</h4>
                            <p>
                              {application.worker_bio ||
                                'This worker has not added a bio yet.'}
                            </p>

                            <div className="expanded-contact-details">
                              <div><strong>Email:</strong> {application.worker_email || 'Not provided'}</div>
                              <div><strong>Phone:</strong> {application.worker_phone || 'Not provided'}</div>
                              <div><strong>Province:</strong> {application.worker_province || 'Not provided'}</div>
                              <div>
                                <strong>Skills:</strong>{' '}
                                {application.worker_skills?.length
                                  ? application.worker_skills.join(', ')
                                  : 'No skills listed'}
                              </div>
                            </div>

                            {application.worker_cv_available ? (
                              <div className="worker-cv-section">
                                <div className="worker-cv-name">
                                  <strong>CV:</strong> {application.worker_cv_file_name}
                                </div>

                                <div className="worker-cv-buttons">
                                  <button
                                    type="button"
                                    className="cv-view-btn"
                                    onClick={() =>
                                      handleViewCV(application.job_id, application.id)
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
                            ) : (
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

              <div className="section-card">
                <div className="section-card-header">
                  <h3>🔍 Find Workers</h3>
                </div>

                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search by name or skill..."
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                  />

                  <select
                    value={skillFilter}
                    onChange={event => setSkillFilter(event.target.value)}
                  >
                    <option value="">All Skills</option>
                    <option value="construction">Construction</option>
                    <option value="electrical">Electrical</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="plumbing">Plumbing</option>
                  </select>
                </div>

                {loading ? (
                  <p style={{ padding: '16px', color: '#6b7280' }}>
                    Loading workers...
                  </p>
                ) : workers.length === 0 ? (
                  <p style={{ padding: '16px', color: '#6b7280' }}>
                    No workers found yet.
                  </p>
                ) : (
                  workers.map(worker => (
                    <div key={worker.id} className="worker-result-card">
                      <div className="worker-result-avatar">
                            {worker.name
                              ? worker.name.trim().charAt(0).toUpperCase()
                              : 'W'}
                          </div>

                      <div className="worker-result-info">
                        <div className="worker-result-name">
                          {worker.name}
                          {worker.verified && (
                            <span className="badge-verified">✓ Verified</span>
                          )}
                        </div>

                        <div className="worker-result-skill">{worker.skill}</div>

                        <div className="worker-result-meta">
                          <span><FaMapMarker /> {worker.location}</span>
                          <span>⭐ {worker.rating} ({worker.reviews} reviews)</span>
                        </div>
                      </div>

                      <div className="worker-result-actions">
                        <button
                          className="shortlist-btn"
                          onClick={() => toggleShortlist(worker.id)}
                        >
                          {shortlisted.includes(worker.id) ? (
                            <><FaStar /> Saved</>
                          ) : 'Save'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="emp-right">
              <div className="shortlist-card">
                <h3>
                  <FaStar /> Shortlisted Workers ({shortlistedWorkers.length})
                </h3>

                {shortlistedWorkers.length === 0 ? (
                  <p
                    style={{
                      color: '#9ca3af',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      padding: '20px 0',
                    }}
                  >
                    No workers shortlisted yet.
                    <br />
                    Click Save on any worker to add them here.
                  </p>
                ) : (
                  shortlistedWorkers.map(worker => (
                    <div key={worker.id} className="shortlist-item">
                      <div className="shortlist-avatar">👷</div>

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

              <div className="shortlist-card hired-workers-card">
                <h3>
                  <FaCheckCircle /> Hired Workers ({hiredApplications.length})
                </h3>

                {hiredApplications.length === 0 ? (
                  <p
                    style={{
                      color: '#9ca3af',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      padding: '20px 0',
                    }}
                  >
                    No workers hired yet.
                  </p>
                ) : (
                  hiredApplications.map(application => (
                    <div
                      key={application.id}
                      className="shortlist-item"
                      style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}
                    >
                      <div className="shortlist-avatar"><div className="worker-result-avatar">
                              {application.worker_name
                                ? application.worker_name.trim().charAt(0).toUpperCase()
                                : 'W'}
                            </div></div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="shortlist-name">
                          {application.worker_name || 'Worker'}
                        </div>

                        <div className="shortlist-skill">
                          {application.job_title}
                        </div>

                        {expandedHiredWorker === application.id && (
                          <div
                            style={{
                              marginTop: '12px',
                              padding: '12px',
                              background: '#f9fafb',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              lineHeight: '1.6',
                            }}
                          >
                            <div>
                              <strong>Email:</strong> {application.worker_email || 'Not provided'}
                            </div>
                            <div>
                              <strong>Phone:</strong> {application.worker_phone || 'Not provided'}
                            </div>
                            <div>
                              <strong>Skills:</strong>{' '}
                              {application.worker_skills?.length
                                ? application.worker_skills.join(', ')
                                : 'No skills listed'}
                            </div>
                            <div>
                              <strong>Province:</strong> {application.worker_province || 'Not provided'}
                            </div>
                            <div style={{ marginTop: '8px' }}>
                              <strong>About Me:</strong>
                              <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
                                {application.worker_bio || 'No bio provided'}
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
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="button"
                          className="shortlist-chat-btn"
                          onClick={() => navigate(`/chat/${application.worker_id}`)}
                        >
                          💬 Chat
                        </button>

                        <button
                          type="button"
                          className="shortlist-chat-btn"
                          onClick={() =>
                            setExpandedHiredWorker(
                              expandedHiredWorker === application.id
                                ? null
                                : application.id
                            )
                          }
                        >
                          {expandedHiredWorker === application.id
                            ? 'Hide Details'
                            : 'Learn More'}
                        </button>
                      </div>

                      {/* Work completion and worker review controls */}
                      <div
                        style={{
                          width: '100%',
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid #e5e7eb',
                        }}
                      >
                        {application.review_submitted ? (
                          <div style={{ color: '#15803d', fontSize: '0.9rem' }}>
                            <FaCheckCircle /> Review submitted
                            {application.worker_rating != null && (
                              <div style={{ marginTop: '4px' }}>
                                Your rating:{' '}
                                <span style={{ color: '#f59e0b' }}>
                                  {'★'.repeat(
                                    Math.max(
                                      0,
                                      Math.min(5, Number(application.worker_rating))
                                    )
                                  )}
                                  {'☆'.repeat(
                                    5 -
                                      Math.max(
                                        0,
                                        Math.min(5, Number(application.worker_rating))
                                      )
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : application.work_status === 'completed' ? (
                          <>
                            <p style={{ margin: '0 0 8px', fontSize: '0.9rem' }}>
                              Work completed. Please rate this worker.
                            </p>

                            {reviewingApplicationId !== application.id && (
                              <button
                                type="button"
                                className="shortlist-chat-btn"
                                onClick={() => {
                                  setReviewingApplicationId(application.id);
                                  setError('');
                                  setReviewMessage('');
                                }}
                              >
                                <FaStar /> Rate Worker
                              </button>
                            )}

                            {reviewingApplicationId === application.id && (
                              <div
                                style={{
                                  marginTop: '10px',
                                  padding: '12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  background: '#fff',
                                }}
                              >
                                <p style={{ margin: '0 0 10px', fontWeight: '600' }}>
                                  Select a rating
                                </p>

                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginBottom: '12px',
                                  }}
                                  aria-label="Worker rating"
                                >
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      type="button"
                                      aria-label={`${star} star${star === 1 ? '' : 's'}`}
                                      aria-pressed={selectedRatings[application.id] === star}
                                      onClick={() =>
                                        setSelectedRatings(previous => ({
                                          ...previous,
                                          [application.id]: star,
                                        }))
                                      }
                                      style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '1.7rem',
                                        color:
                                          star <= (selectedRatings[application.id] || 0)
                                            ? '#f59e0b'
                                            : '#d1d5db',
                                        padding: '2px',
                                      }}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>

                                <label
                                  htmlFor={`worker-review-${application.id}`}
                                  style={{
                                    display: 'block',
                                    fontSize: '0.9rem',
                                    marginBottom: '6px',
                                  }}
                                >
                                  Written review (optional)
                                </label>

                                <textarea
                                  id={`worker-review-${application.id}`}
                                  rows={4}
                                  maxLength={1000}
                                  placeholder="How was your experience working with this person?"
                                  value={reviewTexts[application.id] || ''}
                                  onChange={event =>
                                    setReviewTexts(previous => ({
                                      ...previous,
                                      [application.id]: event.target.value,
                                    }))
                                  }
                                  style={{
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    resize: 'vertical',
                                    marginBottom: '10px',
                                  }}
                                />

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className="hire-btn"
                                    onClick={() => handleSubmitWorkerReview(application)}
                                    disabled={workActionLoading === application.id}
                                  >
                                    {workActionLoading === application.id
                                      ? 'Submitting...'
                                      : 'Submit Review'}
                                  </button>

                                  <button
                                    type="button"
                                    className="shortlist-chat-btn"
                                    onClick={() => setReviewingApplicationId(null)}
                                    disabled={workActionLoading === application.id}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            className="hire-btn"
                            onClick={() => handleMarkWorkCompleted(application)}
                            disabled={workActionLoading === application.id}
                          >
                            {workActionLoading === application.id
                              ? 'Updating...'
                              : '✓ Mark Work Completed'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="section-card">
                <h3 style={{ marginBottom: '14px' }}>💡 Quick Tips</h3>

                {[
                  {
                    icon: <FaCheckCircle />,
                    tip: 'Always hire verified workers for safety',
                  },
                  {
                    icon: <FaComments />,
                    tip: 'Chat before hiring to discuss the job',
                  },
                  {
                    icon: <FaStar />,
                    tip: 'Leave a review after the job is done',
                  },
                  {
                    icon: <FaMapMarkerAlt />,
                    tip: 'Filter by location for nearby workers',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      padding: '10px 0',
                      borderBottom: index < 3 ? '1px solid #f3f4f6' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        lineHeight: '1.5',
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
              You are rejecting <strong>{rejectionApplication.workerName}</strong>
            </p>

            <label htmlFor="rejection-message" className="rejection-label">
              Reason for rejection
            </label>

            <textarea
              id="rejection-message"
              className="rejection-textarea"
              rows={5}
              placeholder="Please explain why this application was not successful..."
              value={rejectionMessage}
              onChange={event => setRejectionMessage(event.target.value)}
            />

            <p className="rejection-helper">
              This message will be sent to the worker with their rejection notification.
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
                disabled={rejecting || !rejectionMessage.trim()}
              >
                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmployerDashboard;
