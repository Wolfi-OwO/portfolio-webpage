import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import './styles/v2.css';
import './styles/v3.css';
import './styles/tooltip.css';
import './styles/career.css';
import './lib/tooltip.js';
import { BrowserRouter, HashRouter } from 'react-router-dom';

// VITE_HASH=1 builds a copy that works from any static folder (the Claude Artifact), with #/ routes and relative assets.
const Router = import.meta.env.VITE_HASH ? HashRouter : BrowserRouter;
import { AppProvider } from './store.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><Router><AppProvider><App /></AppProvider></Router></StrictMode>);
