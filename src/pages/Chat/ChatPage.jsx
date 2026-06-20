import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './Chat.css';

// Fake conversations list
const CONVERSATIONS = [
  { id: '1', name: 'Sipho Dlamini', role: 'Construction Worker', emoji: '👷', online: true, unread: 2, time: '2 min ago', preview: 'I can start tomorrow morning' },
  { id: '2', name: 'Lindiwe Khumalo', role: 'Cleaner', emoji: '🧹', online: true, unread: 0, time: '1 hr ago', preview: 'Thank you for the review!' },
  { id: '3', name: 'Bongani Zulu', role: 'Plumber', emoji: '🔧', online: false, unread: 1, time: 'Yesterday', preview: 'What time should I arrive?' },
  { id: '4', name: 'Fatima Meyer', role: 'Employer', emoji: '🏢', online: false, unread: 0, time: '2 days ago', preview: 'The job has been completed' },
];

// Fake messages per conversation
const MESSAGES = {
  '1': [
    { id: 1, sender: 'other', text: 'Hello! I saw your job posting for construction work in Sandton.', time: '10:02 AM' },
    { id: 2, sender: 'me', text: 'Hi Sipho! Yes, we need a tiler for 2 bathrooms. Are you available this week?', time: '10:05 AM' },
    { id: 3, sender: 'other', text: 'Yes I am available. I have 8 years experience in tiling. I can start tomorrow morning.', time: '10:06 AM' },
    { id: 4, sender: 'me', text: 'Great! The budget is R1,200 for both bathrooms. Does that work for you?', time: '10:08 AM' },
    { id: 5, sender: 'other', text: 'I can start tomorrow morning', time: '10:10 AM' },
  ],
  '2': [
    { id: 1, sender: 'other', text: 'Thank you for the review! It was a pleasure working for you.', time: 'Yesterday' },
    { id: 2, sender: 'me', text: 'The house was spotless! Will definitely book again.', time: 'Yesterday' },
  ],
  '3': [
    { id: 1, sender: 'me', text: 'Hi Bongani, can you fix a leaking pipe tomorrow?', time: '2 days ago' },
    { id: 2, sender: 'other', text: 'Yes, no problem. What time should I arrive?', time: '2 days ago' },
  ],
};

function ChatPage({ user, onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams(); // conversation id from URL
  const [activeConvId, setActiveConvId] = useState(id || '1');
  const [messagesByConv, setMessagesByConv] = useState(MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const activeConv = CONVERSATIONS.find(c => c.id === activeConvId);
  const messages = messagesByConv[activeConvId] || [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    navigate('/login');
    return null;
  }

  function sendMessage() {
    const text = newMessage.trim();
    if (!text) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesByConv(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg],
    }));
    setNewMessage('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="chat-layout">
        {/* Left sidebar - conversation list */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h3>💬 Messages</h3>
            <input
              type="text"
              className="chat-search-input"
              placeholder="Search conversations..."
            />
          </div>

          <div className="conversations-list">
            {CONVERSATIONS.map(conv => (
              <div
                key={conv.id}
                className={`conversation-item ${activeConvId === conv.id ? 'active' : ''}`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <div className="conv-avatar">
                  {conv.emoji}
                  {conv.online && <div className="online-dot" />}
                </div>
                <div className="conv-info">
                  <div className="conv-name">{conv.name}</div>
                  <div className="conv-preview">{conv.preview}</div>
                </div>
                <div className="conv-meta">
                  <span className="conv-time">{conv.time}</span>
                  {conv.unread > 0 && (
                    <div className="conv-unread">{conv.unread}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right chat window */}
        <div className="chat-window">
          {activeConv ? (
            <>
              {/* Chat header */}
              <div className="chat-window-header">
                <button className="chat-back-btn" onClick={() => navigate(-1)}>←</button>
                <div className="chat-header-avatar">{activeConv.emoji}</div>
                <div className="chat-header-info">
                  <h4>{activeConv.name}</h4>
                  <p>{activeConv.online ? '🟢 Online' : '⚫ Offline'}</p>
                </div>
                <div className="chat-header-actions">
                  <button
                    className="chat-action-btn"
                    onClick={() => navigate(`/worker/${activeConvId}`)}
                  >
                    👤 View Profile
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-area">
                <div className="date-divider">Today</div>

                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`message-bubble ${msg.sender === 'me' ? 'sent' : 'received'}`}
                  >
                    {msg.sender === 'other' && (
                      <div className="msg-avatar">{activeConv.emoji}</div>
                    )}
                    <div className="msg-content">
                      <p className="msg-text">{msg.text}</p>
                      <span className="msg-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="chat-input-area">
                <textarea
                  className="chat-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button className="send-btn" onClick={sendMessage}>➤</button>
              </div>
            </>
          ) : (
            <div className="chat-empty-state">
              <span className="chat-empty-icon">💬</span>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
