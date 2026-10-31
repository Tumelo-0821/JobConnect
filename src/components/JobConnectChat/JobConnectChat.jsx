import React, { useState, useEffect } from 'react';
import { FaComments, FaTimes, FaRobot, FaChevronLeft } from 'react-icons/fa';
import './JobConnectChat.css';
import { api } from '../../services/api';

function JobConnectChat({ user, employerId, selectedJob }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessagesLoading, setChatMessagesLoading] = useState(false);
  const [chatMessagesError, setChatMessagesError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [activeView, setActiveView] = useState('home');

  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text:
        "Hi! I'm JobConnect Assistant 👋 I can help you find domestic job opportunities, understand job listings and get help with your application."
    }
  ]);

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState('');

  const [input, setInput] = useState('');

  function handleSend() {
    if (!input.trim()) return;

    const userMessage = {
      sender: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);

    const response = getAssistantResponse(input);

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: response
        }
      ]);
    }, 500);

    setInput('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      handleSend();
    }
  }

  function openAssistant() {
    setActiveView('assistant');
  }
  async function loadChatMessages(conversationId, showLoading = true) {
    if (!conversationId) return;
    try {
      if (showLoading) setChatMessagesLoading(true);
      setChatMessagesError('');
      const data = await api.getMessages(conversationId);
      setChatMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      setChatMessagesError(error.message || 'Unable to load messages.');
    } finally {
      if (showLoading) setChatMessagesLoading(false);
    }
  }

  function openMessageView(conversation) {
    if (!conversation?.id) return;
    setActiveConversation(conversation);
    setChatMessages([]);
    setChatInput('');
    setActiveView('messages');
    loadChatMessages(conversation.id);
    if (api.markConversationAsRead) {
      api.markConversationAsRead(conversation.id).catch(console.error);
    }
  }

  async function sendChatMessage(event) {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text || !activeConversation?.id || chatSending) return;
    try {
      setChatSending(true);
      setChatMessagesError('');
      await api.sendMessage(activeConversation.id, text);
      setChatInput('');
      await loadChatMessages(activeConversation.id, false);
    } catch (error) {
      console.error('Failed to send message:', error);
      setChatMessagesError(error.message || 'Unable to send message.');
    } finally {
      setChatSending(false);
    }
  }

  useEffect(() => {
    if (!employerId) return;
    let cancelled = false;
    setIsOpen(true);
    setActiveView('conversations');
    setConversationsError('');

    async function openEmployerConversation() {
      try {
        const conversation = await api.getOrCreateConversation(employerId);
        if (cancelled) return;
        openMessageView(conversation);
        loadConversations();
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to open employer conversation:', error);
        setConversationsError(error.message || 'Unable to open employer conversation.');
      }
    }
    openEmployerConversation();
    return () => { cancelled = true; };
  }, [employerId]);

  useEffect(() => {
    if (!isOpen || activeView !== 'messages' || !activeConversation?.id) return;
    const conversationId = activeConversation.id;
    const timer = window.setInterval(() => {
      loadChatMessages(conversationId, false);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isOpen, activeView, activeConversation?.id]);

  async function loadConversations() {
    if (!user) return;

    try {
      setConversationsLoading(true);
      setConversationsError('');

      const data = await api.getConversations();

      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load conversations:', error);

      setConversationsError(
        error.message || 'Unable to load conversations.'
      );
    } finally {
      setConversationsLoading(false);
    }
  }

  function openConversations() {
    setActiveView('conversations');
    loadConversations();
  }

  function goHome() {
    if (activeView === 'messages') {
      openConversations();
    } else {
      setActiveView('home');
    }
  }

  const userName = user?.name || 'there';

  return (
    <>
      {!isOpen && (
        <button
          className="jobconnect-chat-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open JobConnect Chat"
        >
          <FaComments />
        </button>
      )}

      {isOpen && (
        <div className="jobconnect-chat-widget">

          <div className="jobconnect-chat-header">
            <div className="chat-header-info">

              {activeView !== 'home' && (
                <button
                  className="chat-back-button"
                  onClick={goHome}
                  aria-label="Back"
                >
                  <FaChevronLeft />
                </button>
              )}

              <div className="chat-header-icon">
                <FaComments />
              </div>

              <div>
                <h3>JobConnect</h3>
                <span>Chat</span>
              </div>
            </div>

            <button
              className="chat-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <FaTimes />
            </button>
          </div>

          {activeView === 'home' && (
            <div className="chat-home">

              <div className="chat-welcome">
                <div className="assistant-avatar">
                  <FaRobot />
                </div>

                <h4>Hi {userName}! 👋</h4>

                <p>
                  How can I help you today?
                </p>
              </div>

              <button
                className="chat-option"
                onClick={openAssistant}
              >
                <div className="option-icon assistant-icon">
                  <FaRobot />
                </div>

                <div className="option-text">
                  <strong>JobConnect Assistant</strong>
                  <span>Find jobs and get help</span>
                </div>
              </button>

              <button
                className="chat-option"
                onClick={openConversations}
              >
                <div className="option-icon conversation-icon">
                  <FaComments />
                </div>

                <div className="option-text">
                  <strong>My Conversations</strong>
                  <span>Chat with employers or workers</span>
                </div>
              </button>

            </div>
          )}

          {activeView === 'assistant' && (
            <div className="assistant-view">

              <div className="assistant-intro">
                <div className="assistant-avatar small">
                  <FaRobot />
                </div>

                <div>
                  <strong>JobConnect Assistant</strong>
                  <span>Here to help with your job search</span>
                </div>
              </div>

              <div className="assistant-messages">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`assistant-message-row ${message.sender}`}
                  >
                    <div className="assistant-message">
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="assistant-suggestions">

                <button
                  onClick={() =>
                    setInput('Find cleaning jobs in Johannesburg')
                  }
                >
                  Cleaning jobs
                </button>

                <button
                  onClick={() =>
                    setInput('Find jobs for someone with no experience')
                  }
                >
                  No experience
                </button>

                <button
                  onClick={() =>
                    setInput('Find jobs near me')
                  }
                >
                  Jobs near me
                </button>

              </div>

              <div className="assistant-input-area">

                <input
                  type="text"
                  placeholder="Ask me about jobs..."
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <button onClick={handleSend}>
                  Send
                </button>

              </div>

            </div>
          )}

          {activeView === 'messages' && (
            <div className="conversations-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', padding: '12px', minHeight: 0, overflow: 'hidden' }}>
              <strong style={{ marginBottom: 10 }}>
                {user?.role === 'worker'
                  ? activeConversation?.employer_name || 'Employer'
                  : activeConversation?.worker_name || 'Worker'}
              </strong>
              <div aria-live="polite" style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chatMessagesLoading ? (
                  <p>Loading messages...</p>
                ) : chatMessages.length === 0 ? (
                  <p>No messages yet. Say hello!</p>
                ) : (
                  chatMessages.map((message, index) => {
                    const senderId = message.sender_id || message.senderId;
                    const isMine = senderId && String(senderId) === String(user?.id);
                    return (
                      <div key={message.id || index} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '9px 12px', borderRadius: 12, background: isMine ? '#e2e8f0' : '#f1f5f9', overflowWrap: 'anywhere' }}>
                        {message.message || message.text || message.content || ''}
                      </div>
                    );
                  })
                )}
              </div>
              {chatMessagesError && <p role="alert" style={{ color: '#b91c1c', fontSize: 12 }}>{chatMessagesError}</p>}
              <form onSubmit={sendChatMessage} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                  type="text"
                  aria-label="Message employer or worker"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  style={{ flex: 1, minWidth: 0, padding: 10, border: '1px solid #cbd5e1', borderRadius: 8 }}
                />
                <button type="submit" disabled={!chatInput.trim() || chatSending} style={{ padding: '10px 14px', border: 0, borderRadius: 8, background: '#061626', color: 'white', cursor: 'pointer' }}>
                  {chatSending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          )}

          {activeView === 'conversations' && (
            <div className="conversations-view">

              {conversationsLoading ? (
                <div className="conversation-empty">
                  <p>Loading your conversations...</p>
                </div>

              ) : conversationsError ? (
                <div className="conversation-empty">
                  <p>{conversationsError}</p>

                  <button type="button" onClick={loadConversations}>
                    Try Again
                  </button>
                </div>

              ) : conversations.length === 0 ? (
                <div className="conversation-empty">
                  <div className="conversation-empty-icon">
                    <FaComments />
                  </div>

                  <h4>Your conversations</h4>

                  <p>
                    You don't have any conversations yet.
                    When you chat with an employer,
                    your conversations will appear here.
                  </p>
                </div>

              ) : (
                <div className="conversation-list">

                  {conversations.map((conversation) => {
                    const isWorker = user?.role === 'worker';

                    const otherUserName = isWorker
                      ? conversation.employer_name || 'Employer'
                      : conversation.worker_name || 'Worker';

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        className="conversation-item"
                        onClick={() => openMessageView(conversation)}
                      >
                        <div className="conversation-item-info">

                          <strong>{otherUserName}</strong>

                          <p>
                            {conversation.last_message ||
                              'Start a conversation'}
                          </p>

                        </div>
                      </button>
                    );
                  })}

                </div>
              )}

  </div>
)}
        </div>
      )}
    </>
  );
}

function getAssistantResponse(input) {
  const message = input.toLowerCase().trim();

  const cleaning =
    message.includes('cleaning') ||
    message.includes('cleaner') ||
    message.includes('cleaners');

  const nanny =
    message.includes('nanny') ||
    message.includes('childcare') ||
    message.includes('babysitter');

  const gardening =
    message.includes('gardening') ||
    message.includes('gardener') ||
    message.includes('garden');

  const caregiving =
    message.includes('caregiver') ||
    message.includes('care giving') ||
    message.includes('elderly care');

  const housekeeping =
    message.includes('housekeeping') ||
    message.includes('housekeeper');

  const cooking =
    message.includes('cooking') ||
    message.includes('cook');

  const hasJohannesburg =
    message.includes('johannesburg');

  const hasPretoria =
    message.includes('pretoria');

  const hasCapeTown =
    message.includes('cape town');

  const noExperience =
    message.includes('no experience') ||
    message.includes('entry') ||
    message.includes('entry-level') ||
    message.includes('beginner') ||
    message.includes('graduate');

  if (cleaning) {
    if (hasJohannesburg) {
      return 'Great! I can help you find domestic cleaning jobs in Johannesburg. Do you have previous cleaning experience?';
    }

    if (hasPretoria) {
      return 'Great! I can help you find domestic cleaning jobs in Pretoria. Do you have previous cleaning experience?';
    }

    if (hasCapeTown) {
      return 'Great! I can help you find domestic cleaning jobs in Cape Town. Do you have previous cleaning experience?';
    }

    return 'Great! I can help you find domestic cleaning jobs. Which location are you looking for?';
  }

  if (nanny) {
    return 'I can help you find domestic nanny and childcare jobs. Which location are you looking for, and do you have previous childcare experience?';
  }

  if (gardening) {
    return 'I can help you find domestic gardening jobs. Which location are you looking for, and do you have previous gardening experience?';
  }

  if (caregiving) {
    return 'I can help you find domestic caregiving opportunities. Which location are you looking for, and do you have previous caregiving experience?';
  }

  if (housekeeping) {
    return 'I can help you find domestic housekeeping jobs. Which location are you looking for, and do you have previous housekeeping experience?';
  }

  if (cooking) {
    return 'I can help you find domestic cooking jobs. Which location are you looking for, and do you have previous cooking experience?';
  }

  if (noExperience) {
    return 'That is okay! JobConnect can help you find domestic jobs that do not require previous experience. What type of work are you interested in?';
  }

  if (hasJohannesburg || hasPretoria || hasCapeTown) {
    return 'I can help you search for domestic jobs in that location. What type of work are you interested in?';
  }

  if (message.includes('help')) {
    return 'I can help you search for domestic jobs such as cleaning, nanny work, gardening, caregiving, housekeeping and cooking. You can also tell me your location and experience level.';
  }

  return 'I would be happy to help! Tell me what type of domestic job you are looking for, your experience level and your preferred location.';
}

export default JobConnectChat;
