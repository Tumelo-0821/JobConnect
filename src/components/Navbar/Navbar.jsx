import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaBell, FaTimes, FaCheck } from 'react-icons/fa';
import { api } from '../../services/api';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    loadNotifications();

    // Check for new notifications every 15 seconds
    const interval = setInterval(() => {
      loadNotifications(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  async function loadNotifications(silent = false) {
    if (!user) return;

    if (!silent) {
      setNotificationLoading(true);
    }

    try {
      const data = await api.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      if (!silent) {
        setNotificationLoading(false);
      }
    }
  }

  const unreadCount = notifications.filter(
    notification => !notification.is_read
  ).length;

  async function handleNotificationClick(notification) {
    try {
      if (!notification.is_read) {
        await api.markNotificationAsRead(notification.id);

        setNotifications(prev =>
          prev.map(item =>
            item.id === notification.id
              ? { ...item, is_read: true }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }

    setNotificationsOpen(false);

    // Navigate to the related job/application where possible
    if (notification.related_job_id) {
      if (user.role === 'employer') {
        navigate('/employer-dashboard');
      } else {
        navigate('/worker-dashboard');
      }
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api.markAllNotificationsAsRead();

      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }

  function handleNavClick(path) {
    setMenuOpen(false);
    navigate(path);
  }

  function handleLogout() {
    setMenuOpen(false);
    setNotificationsOpen(false);

    if (onLogout) {
      onLogout();
    }

    navigate('/');
  }

  const avatarLetter = user
    ? user.name.charAt(0).toUpperCase()
    : '';

  function getNotificationIcon(type) {
    switch (type) {
      case 'application_received':
        return '📩';

      case 'application_hired':
        return '🎉';

      case 'application_rejected':
        return '❌';

      case 'job_match':
        return '💼';

      default:
        return '🔔';
    }
  }

  function formatNotificationTime(createdAt) {
    if (!createdAt) return '';

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const difference = now - date;

    const minutes = Math.floor(difference / 60000);
    const hours = Math.floor(difference / 3600000);
    const days = Math.floor(difference / 86400000);

    if (minutes < 1) {
      return 'Just now';
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString();
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">

          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
              <span>🔨</span>
            </div>
            JobConnect SA
          </Link>

          {/* Desktop links */}
          <ul className="navbar-links">
  <li>
    <Link to="/">Home</Link>
  </li>

  {user?.role === 'employer' && (
    <li>
      <Link to="/workers">Browse Workers</Link>
    </li>
  )}

  {user?.role === 'worker' && (
    <li>
      <Link to="/jobs">Find Jobs</Link>
    </li>
  )}

  <li>
    <Link to="/how-it-works">How It Works</Link>
  </li>

  {user && (
    <li>
      <Link to="/chat">Messages</Link>
    </li>
  )}
</ul>

          {/* Desktop buttons */}
          <div className="navbar-actions">

            {user ? (
              <>
                {/* Notification Bell */}
                <div className="notification-wrapper">

                  <button
                    type="button"
                    className="notification-button"
                    onClick={() =>
                      setNotificationsOpen(prev => !prev)
                    }
                    aria-label="Notifications"
                  >
                    <FaBell />

                    {unreadCount > 0 && (
                      <span className="notification-count">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="notification-dropdown">

                      <div className="notification-header">
                        <div>
                          <strong>Notifications</strong>

                          {unreadCount > 0 && (
                            <span className="notification-header-count">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="notification-close"
                          onClick={() =>
                            setNotificationsOpen(false)
                          }
                        >
                          <FaTimes />
                        </button>
                      </div>

                      {notificationLoading ? (
                        <div className="notification-empty">
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="notification-empty">
                          <FaBell
                            style={{
                              fontSize: '28px',
                              marginBottom: '8px',
                              opacity: 0.4,
                            }}
                          />

                          <div>No notifications yet</div>
                        </div>
                      ) : (
                        <>
                          <div className="notification-list">

                            {notifications.map(notification => (
                              <button
                                type="button"
                                key={notification.id}
                                className={`notification-item ${
                                  notification.is_read
                                    ? 'read'
                                    : 'unread'
                                }`}
                                onClick={() =>
                                  handleNotificationClick(
                                    notification
                                  )
                                }
                              >
                                <div className="notification-icon">
                                  {getNotificationIcon(
                                    notification.type
                                  )}
                                </div>

                                <div className="notification-content">

                                  <div className="notification-title">
                                    {notification.title}
                                  </div>

                                  <div className="notification-message">
                                    {notification.message}
                                  </div>

                                  <div className="notification-time">
                                    {formatNotificationTime(
                                      notification.created_at
                                    )}
                                  </div>

                                </div>

                                {!notification.is_read && (
                                  <span className="notification-unread-dot" />
                                )}
                              </button>
                            ))}

                          </div>

                          {unreadCount > 0 && (
                            <div className="notification-footer">
                              <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                              >
                                <FaCheck />
                                Mark all as read
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* User */}
                <div
                  className="nav-user"
                  onClick={() =>
                    handleNavClick(
                      user.role === 'worker'
                        ? '/worker-dashboard'
                        : '/employer-dashboard'
                    )
                  }
                >
                  <div className="nav-avatar">
                    {avatarLetter}
                  </div>

                  <span className="nav-user-name">
                    {user.name}
                  </span>
                </div>

                <button
                  className="nav-logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="nav-login-btn"
                  onClick={() =>
                    handleNavClick('/login')
                  }
                >
                  Login
                </button>

                <button
                  className="nav-register-btn"
                  onClick={() =>
                    handleNavClick('/register')
                  }
                >
                  Register
                </button>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className={`hamburger ${
              menuOpen ? 'open' : ''
            }`}
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>
      </nav>

      {/* Mobile dropdown */}
      <div
        className={`mobile-menu ${
          menuOpen ? 'open' : ''
        }`}
      >

       <a onClick={() => handleNavClick('/')}>
  🏠 Home
</a>

{user?.role === 'employer' && (
  <a onClick={() => handleNavClick('/workers')}>
    👷 Browse Workers
  </a>
)}

{user?.role === 'worker' && (
  <a onClick={() => handleNavClick('/jobs')}>
    💼 Find Jobs
  </a>
)}

<a onClick={() => handleNavClick('/how-it-works')}>
  ❓ How It Works
</a>

{user && (
  <a onClick={() => handleNavClick('/chat')}>
    💬 Messages
  </a>
)}

        {user ? (
          <>
            <a
              onClick={() =>
                handleNavClick(
                  user.role === 'worker'
                    ? '/worker-dashboard'
                    : '/employer-dashboard'
                )
              }
            >
              📊 My Dashboard
            </a>

            <button
              onClick={handleLogout}
              style={{
                color: 'var(--red)',
                background: '#fee2e2',
              }}
            >
              🚪 Logout
            </button>
          </>
        ) : (
          <>
            <a
              className="mobile-login"
              onClick={() =>
                handleNavClick('/login')
              }
            >
              🔐 Login
            </a>

            <a
              className="mobile-register"
              onClick={() =>
                handleNavClick('/register')
              }
            >
              ✅ Register
            </a>
          </>
        )}
      </div>
    </>
  );
}

export default Navbar;