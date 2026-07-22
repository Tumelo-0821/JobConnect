import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './LandingPage.css';

// The main landing page - first thing people see
function LandingPage({ user, onLogout }) {
  const navigate = useNavigate();

  // Job categories available on the platform
  const categories = [
<<<<<<< HEAD
    { name: 'Construction', count: '1,200+ workers' },
    { name: 'Cleaning', count: '850+ workers' },
    { name: 'Gardening', count: '620+ workers' },
    { name: 'Electrical', count: '430+ workers' },
    { name: 'Plumbing', count: '380+ workers' },
    { name: 'Painting', count: '510+ workers' },
    { name: 'Driving', count: '740+ workers' },
    { name: 'Childcare', count: '290+ workers' },
=======
    { icon: '🔨', name: 'Construction', count: '1,200+ workers' },
    { icon: '🧹', name: 'Cleaning', count: '850+ workers' },
    { icon: '🌿', name: 'Gardening', count: '620+ workers' },
    { icon: '🔌', name: 'Electrical', count: '430+ workers' },
    { icon: '🚿', name: 'Plumbing', count: '380+ workers' },
    { icon: '🎨', name: 'Painting', count: '510+ workers' },
    { icon: '🚗', name: 'Driving', count: '740+ workers' },
    { icon: '👶', name: 'Childcare', count: '290+ workers' },
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
  ];

  // Fake testimonials to show on the page
  const testimonials = [
    {
      name: 'Sipho Dlamini',
      role: 'Construction Worker, Soweto',
<<<<<<< HEAD
=======
      avatar: '👷',
      avatarBg: '#e8f1fb',
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
      stars: '★★★★★',
      text: 'WorkConnect changed my life! I found 5 jobs in my first month. The app is easy to use even for me who is not good with phones.',
    },
    {
      name: 'Fatima Meyer',
      role: 'Employer, Cape Town',
<<<<<<< HEAD
=======
      avatar: '👩‍💼',
      avatarBg: '#e8f8f0',
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
      stars: '★★★★★',
      text: 'I found a reliable cleaner within 2 days. The verification system gives me peace of mind. I can see their ID and background check.',
    },
    {
      name: 'Thabo Nkosi',
      role: 'Electrician, Durban',
<<<<<<< HEAD
      stars: '★★★★★',
=======
      avatar: '⚡',
      avatarBg: '#fff8e8',
      stars: '★★★★⭐',
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
      text: 'Before WorkConnect I was struggling. Now I have regular clients. The payment system is safe and I always get paid on time.',
    },
  ];

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />

      {/* ===== HERO SECTION ===== */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
<<<<<<< HEAD
=======
            <div className="badge">
              🇿🇦 Proudly South African Platform
            </div>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
            <h1>
              Find <span>Trusted Workers</span> Near You
            </h1>
            <p>
              Connect with verified local workers for any job — construction, cleaning, gardening, and more.
              Safe, simple, and built for South Africa.
            </p>

            {/* Main action buttons */}
            <div className="hero-buttons">
              <button
                className="hero-btn-main"
                onClick={() => navigate('/register?role=employer')}
              >
<<<<<<< HEAD
                Hire a Worker
=======
                🏗️ Hire a Worker
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
              </button>
              <button
                className="hero-btn-outline"
                onClick={() => navigate('/register?role=worker')}
              >
<<<<<<< HEAD
                Find Work
=======
                💼 Find Work
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
              </button>
            </div>

            {/* Quick stats */}
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="number">5,000+</div>
                <div className="label">Verified Workers</div>
              </div>
              <div className="hero-stat">
                <div className="number">2,400+</div>
                <div className="label">Happy Employers</div>
              </div>
              <div className="hero-stat">
                <div className="number">9 Provinces</div>
                <div className="label">Across SA</div>
              </div>
            </div>
          </div>

          {/* Visual card stack (desktop only) */}
          <div className="hero-visual">
            <div className="hero-card-stack">
              {/* Card 1 - main card */}
              <div className="hero-worker-card card-1">
                <div className="worker-card-header">
<<<<<<< HEAD
                  <div className="worker-card-info">
                    <h3>Sipho M.</h3>
                    <p>Johannesburg, GP</p>
=======
                  <div className="worker-card-avatar">👷</div>
                  <div className="worker-card-info">
                    <h3>Sipho M.</h3>
                    <p>📍 Johannesburg, GP</p>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
                  </div>
                </div>
                <div className="worker-card-skills">
                  <span className="skill-tag">Construction</span>
                  <span className="skill-tag">Tiling</span>
                  <span className="skill-tag">Plastering</span>
                </div>
                <div className="worker-card-footer">
                  <div>
                    <div className="stars">★★★★★</div>
                    <small style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>
                      4.9 · 87 reviews
                    </small>
                  </div>
                  <span className="badge-verified">✓ Verified</span>
                </div>
              </div>
<<<<<<< HEAD
=======

              {/* Background cards (decorative) */}
              <div className="hero-worker-card card-2"></div>
              <div className="hero-worker-card card-3"></div>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">How It Works</div>
            <h2>Get started in 3 easy steps</h2>
            <p>We made it simple so everyone can use it, even if you are new to apps</p>
          </div>

          <div className="steps-grid">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-icon">
<<<<<<< HEAD
=======
                <span>📝</span>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
                <div className="step-number">1</div>
              </div>
              <h3>Create Your Account</h3>
              <p>
                Sign up as a worker or employer. Upload your ID and take a selfie to verify your identity.
                It only takes a few minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-icon">
<<<<<<< HEAD
=======
                <span>🔍</span>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
                <div className="step-number">2</div>
              </div>
              <h3>Find Work or Workers</h3>
              <p>
                Browse jobs near you, or search for verified workers by skill and location.
                See ratings and reviews before you decide.
              </p>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-icon">
<<<<<<< HEAD
=======
                <span>✅</span>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
                <div className="step-number">3</div>
              </div>
              <h3>Get Hired or Hire</h3>
              <p>
                Apply for jobs or hire a worker with one click. Chat directly in the app,
                agree on the job, and get paid safely.
              </p>
            </div>
          </div>
        </div>
<<<<<<< HEAD

        
=======
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
      </section>

      {/* ===== JOB CATEGORIES ===== */}
      <section className="categories">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Browse by Category</div>
            <h2>Find workers for any job</h2>
            <p>Thousands of skilled workers ready to help you today</p>
          </div>

          <div className="categories-grid">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="category-card"
                onClick={() => navigate('/workers')}
              >
                <span className="category-icon">{cat.icon}</span>
                <h3>{cat.name}</h3>
                <p>{cat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Real Stories</div>
            <h2>People love WorkConnect SA</h2>
            <p>Hear from workers and employers who changed their lives</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <span className="quote-mark">"</span>
                <div className="testimonial-top">
                  <div
                    className="testimonial-avatar"
                    style={{ background: t.avatarBg }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
                <div className="testimonial-stars">{t.stars}</div>
                <p className="testimonial-text">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST / CTA SECTION ===== */}
      <section className="trust-section">
        <h2>Ready to get started?</h2>
        <p>Join thousands of South Africans already using WorkConnect SA</p>

        <div className="trust-indicators">
          <div className="trust-item">
<<<<<<< HEAD
            <span className="label">ID Verified</span>
          </div>
          <div className="trust-item">
            <span className="label">Rated Workers</span>
          </div>
          <div className="trust-item">
            <span className="label">Near You</span>
          </div>
          <div className="trust-item">
            <span className="label">Direct Chat</span>
          </div>
          <div className="trust-item">
=======
            <span className="icon">🔒</span>
            <span className="label">ID Verified</span>
          </div>
          <div className="trust-item">
            <span className="icon">⭐</span>
            <span className="label">Rated Workers</span>
          </div>
          <div className="trust-item">
            <span className="icon">📍</span>
            <span className="label">Near You</span>
          </div>
          <div className="trust-item">
            <span className="icon">💬</span>
            <span className="label">Direct Chat</span>
          </div>
          <div className="trust-item">
            <span className="icon">💰</span>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
            <span className="label">Safe Payment</span>
          </div>
        </div>

        <div className="cta-buttons">
          <button
            className="cta-btn-white"
            onClick={() => navigate('/register?role=employer')}
          >
<<<<<<< HEAD
            I Need a Worker
=======
            🏗️ I Need a Worker
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
          </button>
          <button
            className="cta-btn-transparent"
            onClick={() => navigate('/register?role=worker')}
          >
<<<<<<< HEAD
            I Want to Work
=======
            💼 I Want to Work
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
<<<<<<< HEAD

=======
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
}

export default LandingPage;
