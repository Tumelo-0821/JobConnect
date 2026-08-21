import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './Chat.css';

function ChatPage({ user, onLogout }) {
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="chat-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="chat-layout">
        <div className="chat-sidebar" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
          <div className="chat-empty-state" style={{ padding: '80px 20px' }}>
            <span className="chat-empty-icon">💬</span>
            <h3 style={{ margin: '16px 0 8px', color: '#1a6fc4' }}>No messages yet</h3>
            <p style={{ color: '#6b7280', maxWidth: '360px', margin: '0 auto 24px' }}>
              Messaging will be available soon. For now, browse workers or jobs from your dashboard.
            </p>
            <button
              onClick={() => navigate(
                user.role === 'worker' ? '/worker-dashboard' : '/employer-dashboard'
              )}
              style={{
                background: '#1a6fc4', color: 'white', border: 'none',
                padding: '12px 28px', borderRadius: '8px',
                fontSize: '1rem', fontWeight: '700', cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
