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
  const [assistantLanguage, setAssistantLanguage] = useState('en');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const [assistantJobs, setAssistantJobs] = useState([]);
  const [searchContext, setSearchContext] = useState({ jobType: '', location: '', province: '', noExperience: false });


  async function handleSend() {
    const query = input.trim();
    if (!query || assistantLoading) return;

    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setInput('');
    setAssistantError('');

    // Keep the worker's answers between messages, without changing My Conversations.
    const next = { ...searchContext };
    const jobType = extractJobSearch(query);
    const location = detectLocation(query);
    if (jobType) next.jobType = jobType;
    if (location) {
      next.location = location.name;
      next.province = location.province;
    }
    if (/\b(no experience|without experience|no previous experience|beginner|entry.level)\b/i.test(query)) {
      next.noExperience = true;
    }
    setSearchContext(next);

    const answer = text => setMessages(prev => [...prev, { sender: 'assistant', text }]);
    if (/\b(near me|nearby|close to me)\b/i.test(query) && !next.location) {
      setAssistantJobs([]);
      answer('Which town or area would you like to work in? I cannot see your location automatically.');
      return;
    }
    if (!next.jobType) {
      setAssistantJobs([]);
      answer('What kind of job are you looking for? You can search for any household service posted on JobConnect.');
      return;
    }
    // A location is optional: without one, search all currently open jobs.

    setAssistantJobs([]);
    setAssistantLoading(true);
    try {
      const message = `Find ${next.jobType} jobs${next.location ? ` in ${next.location}` : ''}${next.noExperience ? ' with no experience required' : ''}`;
      // matchAssistantJobs expects one JSON object; the backend does not accept a plain string.
      const result = await api.matchAssistantJobs({
        message,
        language: assistantLanguage,
        province: next.province || null,
        skills: []
      });
      const jobs = Array.isArray(result?.jobs) ? result.jobs : [];
      // No-experience is a strict preference: do not show jobs requiring experience.
      const eligible = next.noExperience
        ? jobs.filter(job => !requiresExperience(job.required_experience))
        : jobs;
      setAssistantJobs(eligible);
      answer(eligible.length
        ? `Here are available ${jobTypeLabel(next.jobType)} jobs ${next.location ? `in ${next.location}` : 'on JobConnect'}. Check each job's exact location and requirements before applying.`
        : `I couldn't find matching ${jobTypeLabel(next.jobType)} household jobs${next.noExperience ? ' without experience requirements' : ''} ${next.location ? `in ${next.location}` : 'on JobConnect'} right now. You can try another area or job type.`);
    } catch (error) {
      console.error('Assistant job search failed:', error);
      setAssistantError('Unable to search jobs right now. Please try again.');
    } finally {
      setAssistantLoading(false);
    }
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

              <div className="assistant-language-row">
                <label htmlFor="jobconnect-assistant-language">Language</label>
                <select id="jobconnect-assistant-language" value={assistantLanguage} onChange={event => setAssistantLanguage(event.target.value)}>
                  <option value="en">English</option>
                  <option value="zu">isiZulu</option>
                  <option value="xh">isiXhosa</option>
                  <option value="nso">Sepedi</option>
                  <option value="tn">Setswana</option>
                  <option value="st">Sesotho</option>
                  <option value="ss">siSwati</option>
                  <option value="nr">isiNdebele</option>
                </select>
              </div>
              <div className="assistant-messages" aria-live="polite">
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
                {assistantLoading && <p className="assistant-status">Searching available jobs...</p>}
                {assistantError && <p className="assistant-error" role="alert">{assistantError}</p>}
                {assistantJobs.map(job => (
                  <div className="assistant-job-card" key={job.id}>
                    <strong>{job.title || 'Job opportunity'}</strong>
                    <span>{job.location || job.province || 'Location not specified'}</span>
                    <span>{job.pay || job.budget || 'Pay not specified'}</span>
                    {job.required_skills?.length > 0 && <small>Skills: {job.required_skills.join(', ')}</small>}
                    <small>Review the job requirements before applying.</small>
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

// Extract the requested work from any English search, not a fixed occupation list.
// Location-only replies keep the previous job; a new occupation replaces it.
function extractJobSearch(text) {
  let value = String(text || '').toLowerCase().trim();
  if (/^(yes|no|okay|ok|thanks|thank you|hello|hi)$/.test(value)) return '';
  // Remove location phrases before finding the requested occupation.
  value = value.replace(/\b(cosmo(?: city)?|johannesburg|joburg|jozi|jhb|pretoria|tshwane|benoni|boksburg|sandton|germiston|gauteng|cape town|western cape|durban|kwazulu.natal|kzn)\b/gi, ' ');
  value = value.replace(/\b(i(?:'m| am)?|looking|searching|find|show|need|want|available|any|please|for|me|someone|a|an|the|in|at|near|around|with|work|working|jobs?|positions?|vacancies|opportunities|household|domestic|no|without|previous|experience|required|entry|level)\b/gi, ' ');
  value = value.replace(/[^a-z0-9 ]/gi, ' ').replace(/\s+/g, ' ').trim();
  return value;
}

function detectLocation(text) {
  const q = (text || '').toLowerCase();
  const areas = [
    ['Cosmo City', 'Gauteng', /\bcosmo(?: city)?\b/],
    ['Johannesburg', 'Gauteng', /\b(johannesburg|joburg|jozi|jhb)\b/],
    ['Pretoria', 'Gauteng', /\b(pretoria|tshwane)\b/],
    ['Benoni', 'Gauteng', /\bbenoni\b/],
    ['Boksburg', 'Gauteng', /\bboksburg\b/],
    ['Sandton', 'Gauteng', /\bsandton\b/],
    ['Germiston', 'Gauteng', /\bgermiston\b/],
    ['Gauteng', 'Gauteng', /\bgauteng\b/],
    ['Cape Town', 'Western Cape', /\b(cape town|kaapstad)\b/],
    ['Western Cape', 'Western Cape', /\bwestern cape\b/],
    ['Durban', 'KwaZulu-Natal', /\bdurban\b/],
    ['KwaZulu-Natal', 'KwaZulu-Natal', /\b(kwazulu.natal|kzn)\b/]
  ];
  const found = areas.find(([, , pattern]) => pattern.test(q));
  return found ? { name: found[0], province: found[1] } : null;
}

function jobTypeLabel(type) {
  return type;
}

function requiresExperience(value) {
  if (!value) return false;
  const v = String(value).trim().toLowerCase();
  if (/^(none|no|not required|no experience|0|0 years?|entry.level)$/.test(v)) return false;
  // Unknown wording should not be presented as verified entry-level work.
  return true;
}

export default JobConnectChat;
