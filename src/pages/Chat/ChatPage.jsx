import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { api } from '../../services/api';
import './Chat.css';

function ChatPage({ user, onLogout }) {
  const navigate = useNavigate();

const { id, workerId, userId, conversationId } = useParams();

const otherUserId = workerId || userId || id;

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  // ---------------------------------------------------------
  // REDIRECT IF NOT LOGGED IN
  // ---------------------------------------------------------

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // ---------------------------------------------------------
  // LOAD CONVERSATION
  // ---------------------------------------------------------

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadConversation() {
      try {
        setLoading(true);
        setError('');

        let conversationData;

        // If a conversation ID was supplied, load it directly.
        if (conversationId) {
          conversationData = await api.getConversation(conversationId);
        } else {
          // Otherwise get/create a conversation with the other user.
          if (!otherUserId) {
            throw new Error(
              'No user was specified for this conversation.'
            );
          }

          conversationData =
            await api.getOrCreateConversation(otherUserId);
        }

        if (cancelled) return;

        setConversation(conversationData);

        // Load messages.
        const messageData = await api.getMessages(
          conversationData.id
        );

        if (cancelled) return;

        setMessages(messageData || []);

        // Mark incoming messages as read.
        try {
          await api.markConversationAsRead(
            conversationData.id
          );
        } catch (readError) {
          console.warn(
            'Could not mark messages as read:',
            readError
          );
        }
      } catch (err) {
        console.error('Failed to load chat:', err);

        if (!cancelled) {
          setError(
            err.message ||
              'Unable to load this conversation.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadConversation();

    return () => {
      cancelled = true;
    };
  }, [user, otherUserId, conversationId]);

  // ---------------------------------------------------------
  // REFRESH MESSAGES
  // ---------------------------------------------------------

  useEffect(() => {
    if (!conversation?.id) return;

    const interval = setInterval(async () => {
      try {
        const messageData = await api.getMessages(
          conversation.id
        );

        setMessages(messageData || []);
      } catch (err) {
        console.warn(
          'Could not refresh messages:',
          err
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversation?.id]);

  // ---------------------------------------------------------
  // AUTO SCROLL
  // ---------------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  // ---------------------------------------------------------
  // SEND MESSAGE
  // ---------------------------------------------------------

  async function handleSendMessage(e) {
    e.preventDefault();

    const trimmedMessage = message.trim();

    if (
      !trimmedMessage ||
      !conversation ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);
      setError('');

      const newMessage = await api.sendMessage(
        conversation.id,
        trimmedMessage
      );

      setMessages((prev) => [
        ...prev,
        newMessage,
      ]);

      setMessage('');
    } catch (err) {
      console.error(
        'Failed to send message:',
        err
      );

      setError(
        err.message ||
          'Unable to send your message.'
      );
    } finally {
      setSending(false);
    }
  }

  // ---------------------------------------------------------
  // FORMAT TIME
  // ---------------------------------------------------------

  function formatMessageTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ---------------------------------------------------------
  // OTHER USER ROLE
  // ---------------------------------------------------------

  function getOtherUserRole() {
    if (!conversation || !user) {
      return '';
    }

    return conversation.employer_id === user.id
      ? 'Worker'
      : 'Employer';
  }

  // ---------------------------------------------------------
  // BACK BUTTON
  // ---------------------------------------------------------

  function handleBack() {
    navigate(
      user?.role === 'worker'
        ? '/worker-dashboard'
        : '/employer-dashboard'
    );
  }

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="chat-page">
        <Navbar
          user={user}
          onLogout={onLogout}
        />

        <div className="chat-container">
          <div className="chat-loading">
            Loading conversation...
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="chat-page">
      <Navbar
        user={user}
        onLogout={onLogout}
      />

      <div className="chat-container">

        {/* CHAT HEADER */}
        <div className="chat-header">

          <button
            className="chat-back-btn"
            onClick={handleBack}
            type="button"
            aria-label="Go back"
          >
            ←
          </button>

          <div className="chat-user-avatar">
            {getOtherUserRole() === 'Worker'
              ? '👤'
              : '🏢'}
          </div>

          <div className="chat-user-info">
            <h3>
              {getOtherUserRole()}
            </h3>

            <span>
              JobConnect {getOtherUserRole()}
            </span>
          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div className="chat-error">
            {error}
          </div>
        )}

        {/* MESSAGES */}
        <div className="chat-messages">

          {messages.length === 0 ? (
            <div className="chat-welcome">

              <div className="chat-empty-icon">
                💬
              </div>

              <h3>
                Start a conversation
              </h3>

              <p>
                Discuss the job, working hours,
                location, responsibilities and
                any other important details.
              </p>

            </div>
          ) : (
            messages.map((msg) => {

              const isMine =
                msg.sender_id === user.id;

              return (
                <div
                  key={msg.id}
                  className={`message-row ${
                    isMine
                      ? 'message-mine'
                      : 'message-theirs'
                  }`}
                >

                  <div className="message-bubble">

                    <div>
                      {msg.message}
                    </div>

                    <span className="message-time">
                      {formatMessageTime(
                        msg.created_at
                      )}
                    </span>

                  </div>

                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />

        </div>

        {/* MESSAGE INPUT */}
        <form
          className="chat-input-area"
          onSubmit={handleSendMessage}
        >

          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            maxLength={2000}
            disabled={sending}
          />

          <button
            type="submit"
            disabled={
              !message.trim() ||
              !conversation ||
              sending
            }
          >
            {sending ? 'Sending...' : 'Send'}
          </button>

        </form>

      </div>
    </div>
  );
}

export default ChatPage;
