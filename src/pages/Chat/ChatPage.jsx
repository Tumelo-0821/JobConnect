import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './Chat.css';

function ChatPage({ user, onLogout }) {
  const navigate = useNavigate();
  const { workerId } = useParams();

  const [message, setMessage] = useState('');

  // Temporary messages for testing the chat interface.
  // We will replace this with the backend later.
  const [messages, setMessages] = useState([]);

  if (!user) {
    navigate('/login');
    return null;
  }

  function handleSendMessage(e) {
    e.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    const newMessage = {
      id: Date.now(),
      senderId: user.id,
      senderName: user.name,
      text: trimmedMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
  }

  return (
    <div className="chat-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="chat-container">

        {/* Chat Header */}
        <div className="chat-header">
          <button
            className="chat-back-btn"
            onClick={() =>
              navigate(
                user.role === 'worker'
                  ? '/worker-dashboard'
                  : '/employer-dashboard'
              )
            }
          >
            ←
          </button>

          <div className="chat-user-avatar">
            {user.role === 'employer' ? '👷' : '🏢'}
          </div>

          <div className="chat-user-info">
            <h3>
              {user.role === 'employer'
                ? 'Worker'
                : 'Employer'}
            </h3>

            <span>
              {user.role === 'employer'
                ? 'JobConnect Worker'
                : 'JobConnect Employer'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">

          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-empty-icon">💬</div>

              <h3>Start a conversation</h3>

              <p>
                Discuss the job, working hours, location,
                responsibilities and any other important details.
              </p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === user.id;

              return (
                <div
                  key={msg.id}
                  className={`message-row ${
                    isMine ? 'message-mine' : 'message-theirs'
                  }`}
                >
                  <div className="message-bubble">
                    <div>{msg.text}</div>

                    <span className="message-time">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })
          )}

        </div>

        {/* Message Input */}
        <form
          className="chat-input-area"
          onSubmit={handleSendMessage}
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />

          <button
            type="submit"
            disabled={!message.trim()}
          >
            Send
          </button>
        </form>

      </div>
    </div>
  );
}

export default ChatPage;