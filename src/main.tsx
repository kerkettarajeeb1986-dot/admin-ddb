import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (err: any) {
    console.error('Fatal initialization error:', err);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; font-family: system-ui, -apple-system, sans-serif; color: white; padding: 24px; text-align: center;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #ef4444; font-size: 28px; font-weight: bold;">!</div>
        <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">App Initialization Notice</h2>
        <p style="font-size: 14px; color: #94a3b8; max-width: 450px; margin: 0 0 20px 0;">${err?.message || 'An error occurred while loading the application.'}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #10b981; color: white; font-weight: 600; border: none; border-radius: 8px; cursor: pointer;">Reload Application</button>
      </div>
    `;
  }
}
