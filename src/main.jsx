import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { applyTheme, DEFAULT_THEME } from './lib/theme.js';
import { WorkspaceProvider } from './hooks/useWorkspace.jsx';

applyTheme(DEFAULT_THEME);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </StrictMode>,
);
