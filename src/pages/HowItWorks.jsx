import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import './HowItWorks.css';

const steps = [
  {
    number: '01',
    icon: '',
    title: 'Create an account',
    description:
      'Register as a worker looking for opportunities or an employer looking for reliable help.',
  },
  {
    number: '02',
    
    title: 'Find the right match',
    description:
      'Workers can explore suitable jobs, while employers can post opportunities and review applicants.',
  },
  {
    number: '03',
    icon: '',
    title: 'Connect and agree',
    description:
      'Review applications, discuss the work, and agree on the responsibilities and payment before starting.',
  },
  {
    number: '04',
    icon: '',
    title: 'Complete and review',
    description:
      'Complete the agreed work and, where available, leave a review to help build trust on JobConnect SA.',
  },
];

function HowItWorks({ user, onLogout }) {
  return (
    <>
      <Navbar user={user} onLogout={onLogout} />

      <main className="how-page">
        <section className="how-hero">
          <span className="how-eyebrow">
            SIMPLE. TRUSTED. CONNECTED.
          </span>

          <h1>Good work starts with the right connection.</h1>

          <p>
            JobConnect SA helps connect people looking for work with
            employers who need reliable help. Here is how to get started.
          </p>

          <div className="how-hero-actions">
            <Link
              to="/register"
              className="how-button how-button-primary"
            >
              Get Started
            </Link>

            <Link
              to="/"
              className="how-button how-button-secondary"
            >
              Back to Home
            </Link>
          </div>
        </section>

        <section className="how-steps-section">
          <div className="how-section-heading">
            <span className="how-eyebrow" style={{ color: '#151b54' }}>FOUR SIMPLE STEPS</span>
            <h2>How JobConnect SA works</h2>
            <p>From creating an account to completing the job.</p>
          </div>

          <div className="how-steps-grid">
            {steps.map((step) => (
              <article
                className="how-step-card"
                key={step.number}
              >
                <div className="how-step-top">
                  <span className="how-step-number">
                    {step.number}
                  </span>
                   {/*
                  <span
                    className="how-step-icon"
                    aria-hidden="true"
                  >
                    {step.icon}
                  </span>*/}
                </div>

                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="how-audience-section">
          <article className="how-audience-card">
            
            
            <h2>Looking for work?</h2>

            <p>
              Create your worker account, build your profile, explore
              job opportunities, and apply for work that suits your skills.
            </p>

            <Link to="/register" className="how-text-link">
              Join as a worker →
            </Link>
          </article>
          {/*<span
              className="how-audience-icon"
              aria-hidden="true"
            >
              
            </span> */}

          <article className="how-audience-card how-employer-card">
            {/*<span
              className="how-audience-icon"
              aria-hidden="true"
            >
              🏡
            </span> */}

            <h2>Need to hire someone?</h2>

            <p>
              Create an employer account, post a job, review applications,
              and manage your hiring process from your dashboard.
            </p>

            <Link to="/register" className="how-text-link">
              Join as an employer →
            </Link>
          </article>
        </section>

        <section className="how-bottom-cta">
          <h2>Your next opportunity starts here.</h2>

          <p>
            Join JobConnect SA and take the next step today.
          </p>

          <Link
            to="/register"
            className="how-button how-button-primary"
          >
            Create Your Account
          </Link>
        </section>
      </main>
    </>
  );
}

export default HowItWorks;