import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import './WorkersPage.css';

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'
).replace(/\/$/, '');

function getWorkerSkills(worker) {
  if (Array.isArray(worker.skills) && worker.skills.length > 0) {
    return worker.skills.filter(Boolean);
  }

  return worker.skill ? [worker.skill] : [];
}

function getWorkerLocation(worker) {
  return worker.location || worker.province || 'Location not provided';
}

function getWorkerName(worker) {
  return worker.name || 'Unnamed worker';
}

function getWorkerRating(worker) {
  const rating = Number(worker.rating);
  return Number.isFinite(rating) ? rating : 0;
}

function getWorkerReviews(worker) {
  const reviews = Number(worker.reviews ?? worker.review_count ?? 0);
  return Number.isFinite(reviews) && reviews >= 0 ? reviews : 0;
}

function WorkerCard({ worker }) {
  const skills = getWorkerSkills(worker);
  const rating = getWorkerRating(worker);
  const reviews = getWorkerReviews(worker);
  const verified = worker.verified === true;

  return (
    <article className="worker-card">
      <div className="worker-card-top">
        <div className="worker-avatar" aria-hidden="true">
          {getWorkerName(worker).charAt(0).toUpperCase()}
        </div>

        <div className="worker-identity">
          <h2>{getWorkerName(worker)}</h2>
          <p className="worker-location">
            <span aria-hidden="true"></span> {getWorkerLocation(worker)}
          </p>
        </div>

        {verified && (
          <span className="worker-verified" title="Verified worker">
            ✓ Verified
          </span>
        )}
      </div>

      <div className="worker-rating" aria-label={
        reviews > 0 ? `${rating.toFixed(1)} out of 5, ${reviews} reviews` : 'Not yet rated'
      }>
        <span className="worker-star" aria-hidden="true">★</span>

        {reviews > 0 ? (
          <>
            <strong>{rating.toFixed(1)}</strong>
            <span className="worker-review-count">
              ({reviews} {reviews === 1 ? 'review' : 'reviews'})
            </span>
          </>
        ) : (
          <span className="worker-not-rated">Not yet rated</span>
        )}
      </div>

      <div className="worker-skills">
        {skills.length > 0 ? (
          skills.map((skill, index) => (
            <span className="worker-skill-tag" key={`${skill}-${index}`}>
              {skill}
            </span>
          ))
        ) : (
          <span className="worker-no-skills">No skills listed</span>
        )}
      </div>

      <div className="worker-card-footer">
        <span className={verified ? 'worker-status verified' : 'worker-status'}>
          <span className="worker-status-dot" />
          {verified ? 'Verified profile' : 'Not verified'}
        </span>
      </div>
    </article>
  );
}

export default function WorkersPage({ user, onLogout, authLoading }) {
  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function fetchWorkers() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/workers`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `The server returned ${response.status}. Please check the backend.`
          );
        }

        const data = await response.json();

        // The current API returns a list. Also handle common wrapped responses.
        const records = Array.isArray(data)
          ? data
          : Array.isArray(data.workers)
            ? data.workers
            : Array.isArray(data.items)
              ? data.items
              : null;

        if (!records) {
          throw new Error('The workers API returned an unexpected response.');
        }

        setWorkers(records);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            err.message === 'Failed to fetch'
              ? 'Could not connect to the backend. Make sure the FastAPI server is running and CORS allows the frontend origin.'
              : err.message || 'Could not load workers.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchWorkers();

    return () => controller.abort();
  }, []);

  const locations = useMemo(() => {
    return [...new Set(
      workers
        .map(getWorkerLocation)
        .filter((location) => location !== 'Location not provided')
    )].sort((a, b) => a.localeCompare(b));
  }, [workers]);

  const skills = useMemo(() => {
    return [...new Set(workers.flatMap(getWorkerSkills))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return workers
      .filter((worker) => {
        const searchableText = [
          getWorkerName(worker),
          ...getWorkerSkills(worker),
          worker.skill || '',
          getWorkerLocation(worker),
        ].join(' ').toLowerCase();

        const matchesSearch = !query || searchableText.includes(query);

        const matchesLocation =
          !locationFilter || getWorkerLocation(worker) === locationFilter;

        const workerSkills = getWorkerSkills(worker).map((item) =>
          item.toLowerCase()
        );

        const matchesSkill =
          !skillFilter ||
          workerSkills.includes(skillFilter.toLowerCase()) ||
          (worker.skill || '').toLowerCase() === skillFilter.toLowerCase();

        const isVerified = worker.verified === true;

        const matchesVerification =
          verificationFilter === 'all' ||
          (verificationFilter === 'verified' && isVerified) ||
          (verificationFilter === 'unverified' && !isVerified);

        return (
          matchesSearch &&
          matchesLocation &&
          matchesSkill &&
          matchesVerification
        );
      })
      .sort((a, b) => {
        // Workers with reviews appear first, ordered by actual average rating.
        const aReviews = getWorkerReviews(a);
        const bReviews = getWorkerReviews(b);

        if ((aReviews > 0) !== (bReviews > 0)) {
          return aReviews > 0 ? -1 : 1;
        }

        if (getWorkerRating(b) !== getWorkerRating(a)) {
          return getWorkerRating(b) - getWorkerRating(a);
        }

        return getWorkerReviews(b) - getWorkerReviews(a);
      });
  }, [workers, search, locationFilter, skillFilter, verificationFilter]);

  function clearFilters() {
    setSearch('');
    setLocationFilter('');
    setSkillFilter('');
    setVerificationFilter('all');
  }

  return (
    <div className="workers-page">
      <Navbar user={user} onLogout={onLogout} />

      <main className="workers-main">
        <section className="workers-hero">
          <div className="workers-hero-content">
            <span className="workers-eyebrow"></span>
            <h1>Find trusted workers near you</h1>
            <p>
              Explore worker profiles, compare real ratings, and find people
              with the skills you need.
            </p>
          </div>
        </section>

        <section className="workers-content">
          <div className="workers-heading-row">
            <div>
              <h2>Browse workers</h2>
              <p>Find the right skills for your next job.</p>
            </div>

            {!loading && !error && (
              <span className="workers-result-count">
                {filteredWorkers.length}{' '}
                {filteredWorkers.length === 1 ? 'worker' : 'workers'}
              </span>
            )}
          </div>

          <section className="workers-filters" aria-label="Filter workers">
            <div className="workers-search-field">
              <label htmlFor="worker-search">Search workers</label>
              <input
                id="worker-search"
                type="search"
                placeholder="Search by name or skill..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="workers-filter-field">
              <label htmlFor="worker-location">Location</label>
              <select
                id="worker-location"
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
              >
                <option value="">All locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="workers-filter-field">
              <label htmlFor="worker-skill">Service category</label>
              <select
                id="worker-skill"
                value={skillFilter}
                onChange={(event) => setSkillFilter(event.target.value)}
              >
                <option value="">All services</option>
                {skills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>

            <div className="workers-filter-field">
              <label htmlFor="worker-verification">Verification</label>
              <select
                id="worker-verification"
                value={verificationFilter}
                onChange={(event) => setVerificationFilter(event.target.value)}
              >
                <option value="all">All profiles</option>
                <option value="verified">Verified only</option>
                <option value="unverified">Not verified</option>
              </select>
            </div>

            <button
              className="workers-clear-button"
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </section>

          {loading && (
            <div className="workers-message" role="status">
              <span className="workers-spinner" />
              <p>Loading worker profiles...</p>
            </div>
          )}

          {!loading && error && (
            <div className="workers-message workers-error" role="alert">
              <h3>We couldn't load the workers</h3>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredWorkers.length === 0 && (
            <div className="workers-message">
              <div className="workers-empty-icon" aria-hidden="true">⌕</div>
              <h3>No workers found</h3>
              <p>
                {workers.length === 0
                  ? 'There are currently no worker profiles available in the database.'
                  : 'Try another search or clear your filters.'}
              </p>
              {workers.length > 0 && (
                <button
                  className="workers-clear-button"
                  type="button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredWorkers.length > 0 && (
            <div className="workers-grid">
              {filteredWorkers.map((worker, index) => (
                <WorkerCard
                  key={worker.id || `${getWorkerName(worker)}-${index}`}
                  worker={worker}
                />
              ))}
            </div>
          )}

          <p className="workers-data-note">
            Ratings and verification labels are based on the information
            returned by JobConnect's .
          </p>
        </section>
      </main>
    </div>
  );
}