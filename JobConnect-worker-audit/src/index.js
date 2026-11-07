import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// This is the entry point of the whole app
// It finds the <div id="root"> in public/index.html and renders the app inside it
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
