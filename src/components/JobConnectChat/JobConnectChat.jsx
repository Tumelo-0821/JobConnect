import React, { useState } from 'react';
import { FaComments, FaTimes, FaRobot, FaChevronLeft } from 'react-icons/fa';
import './JobConnectChat.css';

function JobConnectChat({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState('home');

  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text:
        "Hi! I'm JobConnect Assistant 👋 I can help you find domestic job opportunities, understand job listings and get help with your application."
    }
  ]);

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

  function openConversations() {
    setActiveView('conversations');
  }

  function goHome() {
    setActiveView('home');
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

          {activeView === 'conversations' && (
            <div className="conversations-view">

              <div className="conversation-empty">
                <div className="conversation-empty-icon">
                  <FaComments />
                </div>

                <h4>Your conversations</h4>

                <p>
                  Conversations with employers and workers will appear here.
                </p>

                <button
                  onClick={() => window.location.href = '/chat'}
                >
                  Open Chat
                </button>
              </div>

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