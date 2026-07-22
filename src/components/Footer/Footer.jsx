import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Brand column */}
        <div className="footer-brand">
          <div className="footer-logo">
            <span>🔗</span>
<<<<<<< HEAD
            JobConnect SA
=======
            WorkConnect SA
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
          </div>
          <p>
            Connecting informal workers with trusted employers across South Africa.
            Simple, safe, and accessible for everyone.
          </p>
          <div className="footer-badges">
            <span>🇿🇦 South Africa</span>
<<<<<<< HEAD
            <span>Verified Workers</span>
            <span>Safe Platform</span>
=======
            <span>✅ Verified Workers</span>
            <span>🔒 Safe Platform</span>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
          </div>
        </div>

        {/* Workers column */}
        <div className="footer-col">
          <h4>For Workers</h4>
          <ul>
            <li><Link to="/register">Create Profile</Link></li>
            <li><Link to="/jobs">Find Jobs</Link></li>
            <li><Link to="/worker-dashboard">My Dashboard</Link></li>
            <li><Link to="/verification">Get Verified</Link></li>
          </ul>
        </div>

        {/* Employers column */}
        <div className="footer-col">
          <h4>For Employers</h4>
          <ul>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/workers">Find Workers</Link></li>
            <li><Link to="/post-job">Post a Job</Link></li>
            <li><Link to="/employer-dashboard">Dashboard</Link></li>
          </ul>
        </div>

        {/* Company column */}
        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
            <li><Link to="/support">Support</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
<<<<<<< HEAD
        <p>© 2024 JobConnect SA. All rights reserved.</p>
=======
        <p>© 2024 WorkConnect SA. All rights reserved.</p>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
        <div className="footer-bottom-links">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
