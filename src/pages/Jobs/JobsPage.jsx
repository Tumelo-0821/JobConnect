
import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import './JobsPage.css';

const API_URL = 'http://localhost:8000/api/v1/jobs';

function formatDate(value) {
  if (!value) return 'Not specified';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Not specified';

  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatBudget(job) {
  const amount = job.budget ?? job.pay;

  if (amount === null || amount === undefined || amount === '') {
    return 'Not specified';
  }

  if (typeof amount === 'number') {
    return `R${amount.toLocaleString('en-ZA')}`;
  }

  return String(amount);
}

function getSkills(job) {
  if (Array.isArray(job.required_skills)) {
    return job.required_skills;
  }

  return [];
}

function JobCard({ job }) {
  const skills = getSkills(job);

  return (
    <article className="jobs-card">
      <div className="jobs-card-top">
        <span className="jobs-category">
          {job.category || 'General work'}
        </span>

        {job.urgency && (
          <span className="jobs-urgency">{job.urgency}</span>
        )}
      </div>

      <h2 className="jobs-card-title">
        {job.title || 'Untitled job'}
      </h2>

      <p className="jobs-card-description">
        {job.description || 'No description provided.'}
      </p>

      <div className="jobs-details">
        <div className="jobs-detail">
          <span className="jobs-detail-label">Location</span>
          <span className="jobs-detail-value">
            {[job.location, job.province].filter(Boolean).join(', ') ||
              'Not specified'}
          </span>
        </div>

        <div className="jobs-detail">
          <span className="jobs-detail-label">Budget / Pay</span>
          <span className="jobs-detail-value">
            {formatBudget(job)}
          </span>
        </div>

        <div className="jobs-detail">
          <span className="jobs-detail-label">Duration</span>
          <span className="jobs-detail-value">
            {job.duration || 'Not specified'}
          </span>
        </div>

        <div className="jobs-detail">
          <span className="jobs-detail-label">Employment type</span>
          <span className="jobs-detail-value">
            {job.employment_type || 'Not specified'}
          </span>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="jobs-skills">
          <span className="jobs-detail-label">Required skills</span>
          <div className="jobs-skill-list">
            {skills.map((skill, index) => (
              <span className="jobs-skill" key={`${skill}-${index}`}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="jobs-card-footer">
        <span>
          Posted {formatDate(job.created_at)}
        </span>

        <span>
          Closes {formatDate(job.closing_date)}
        </span>
      </div>
    </article>
  );
}

export default function JobsPage({
  user,
  onLogout,
}) {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [province, setProvince] = useState('All provinces');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Unable to load jobs (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('The jobs API returned an unexpected response.');
        }

        setJobs(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            err.message ||
              'Could not connect to the jobs service. Please try again.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => controller.abort();
  }, []);

  const categories = useMemo(
    () => [
      'All categories',
      ...new Set(
        jobs.map((job) => job.category).filter(Boolean)
      ),
    ],
    [jobs]
  );

  const provinces = useMemo(
    () => [
      'All provinces',
      ...new Set(
        jobs.map((job) => job.province).filter(Boolean)
      ),
    ],
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.description,
        job.category,
        job.location,
        job.province,
        job.employment_type,
        ...(Array.isArray(job.required_skills)
          ? job.required_skills
          : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !term || searchableText.includes(term);

      const matchesCategory =
        category === 'All categories' ||
        job.category === category;

      const matchesProvince =
        province === 'All provinces' ||
        job.province === province;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesProvince
      );
    });
  }, [jobs, search, category, province]);

  return (
    <div className="jobs-page">
      <Navbar user={user} onLogout={onLogout} />

      <main className="jobs-main">
        <section className="jobs-hero">
          <span className="jobs-eyebrow"></span>
          <h1>Find work that works for you.</h1>
          <p>
            Explore available opportunities and find a job that
            matches your skills, location and goals.
          </p>
        </section>

        <section className="jobs-search-panel">
          <label className="jobs-search-label" htmlFor="jobs-search">
            Search opportunities
          </label>

          <input
            id="jobs-search"
            className="jobs-search-input"
            type="search"
            placeholder="Search by job title, skill or keyword..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="jobs-filter-row">
            <label className="jobs-filter">
              <span>Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="jobs-filter">
              <span>Province</span>
              <select
                value={province}
                onChange={(event) => setProvince(event.target.value)}
              >
                {provinces.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="jobs-reset-button"
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('All categories');
                setProvince('All provinces');
              }}
            >
              Clear filters
            </button>
          </div>
        </section>

        <section className="jobs-results">
          <div className="jobs-results-heading">
            <div>
              <h2>Available jobs</h2>
              <p>
                {loading
                  ? 'Loading opportunities...'
                  : `${filteredJobs.length} ${
                      filteredJobs.length === 1 ? 'job' : 'jobs'
                    } found`}
              </p>
            </div>
          </div>

          {loading && (
            <div className="jobs-message" role="status">
              <span className="jobs-spinner" />
              <p>Loading available jobs...</p>
            </div>
          )}

          {!loading && error && (
            <div className="jobs-message jobs-error" role="alert">
              <h3>We couldn't load the jobs</h3>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredJobs.length === 0 && (
            <div className="jobs-message">
              <h3>No jobs found</h3>
              <p>
                {jobs.length === 0
                  ? 'There are no open jobs available right now. Please check again later.'
                  : 'Try changing your search or clearing the filters.'}
              </p>
            </div>
          )}

          {!loading && !error && filteredJobs.length > 0 && (
            <div className="jobs-grid">
              {filteredJobs.map((job, index) => (
                <JobCard
                  key={job.id || `${job.title}-${index}`}
                  job={job}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

