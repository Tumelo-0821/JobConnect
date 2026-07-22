import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

// Navbar used across all pages
// Shows different buttons depending on if user is logged in or not
function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menu when a link is clicked
  function handleNavClick(path) {
    setMenuOpen(false);
    navigate(path);
  }

  function handleLogout() {
    setMenuOpen(false);
    if (onLogout) onLogout();
    navigate('/');
  }

  // Get the first letter of user name for avatar
  const avatarLetter = user ? user.name.charAt(0).toUpperCase() : '';

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
              <span>🔗</span>
            </div>
            JobConnect SA
<<<<<<< HEAD
=======
            <span>🤝</span>
>>>>>>> f5b8851420f97d11823ac5b15619439c9a1dc79e
          </Link>
          

          {/* Desktop links */}
          <ul className="navbar-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/workers">Browse Workers</Link></li>
            <li><Link to="/jobs">Find Jobs</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
          </ul>

          {/* Desktop buttons */}
          <div className="navbar-actions">
            {user ? (
              // If logged in - show user info
              <>
                <div className="nav-user" onClick={() =>
                  handleNavClick(user.role === 'worker' ? '/worker-dashboard' : '/employer-dashboard')
                }>
                  <div className="nav-avatar">{avatarLetter}</div>
                  <span className="nav-user-name">{user.name}</span>
                </div>
                <button className="nav-logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              // If not logged in - show login and register
              <>
                <button className="nav-login-btn" onClick={() => handleNavClick('/login')}>
                  Login
                </button>
                <button className="nav-register-btn" onClick={() => handleNavClick('/register')}>
                  Register
                </button>
              </>
            )}
          </div>

          {/* Hamburger button for mobile */}
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a onClick={() => handleNavClick('/')}>🏠 Home</a>
        <a onClick={() => handleNavClick('/workers')}>👷 Browse Workers</a>
        <a onClick={() => handleNavClick('/jobs')}>💼 Find Jobs</a>
        <a onClick={() => handleNavClick('/how-it-works')}>❓ How It Works</a>

        {user ? (
          <>
            <a onClick={() =>
              handleNavClick(user.role === 'worker' ? '/worker-dashboard' : '/employer-dashboard')
            }>
              📊 My Dashboard
            </a>
            <button onClick={handleLogout} style={{ color: 'var(--red)', background: '#fee2e2' }}>
              🚪 Logout
            </button>
          </>
        ) : (
          <>
            <a className="mobile-login" onClick={() => handleNavClick('/login')}>
              🔑 Login
            </a>
            <a className="mobile-register" onClick={() => handleNavClick('/register')}>
              ✍️ Register
            </a>
          </>
        )}
      </div>
    </>
  );
}

export default Navbar;
