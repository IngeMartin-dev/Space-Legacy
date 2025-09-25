
// Force redeploy - Version: 1.1.0
// Latest features: notifications, player list, bans, chat, real-time updates
// START OF FILE main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx'; // CAMBIO REVERTIDO: Vuelve a importar App.jsx
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
// END OF FILE main.tsx