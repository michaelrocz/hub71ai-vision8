import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { RehearsalProvider } from './context/RehearsalContext';
import Intake from './pages/Intake';
import Futures from './pages/Futures';
import App from './App';
import Compare from './pages/Compare';
import Recap from './pages/Recap';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RehearsalProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Intake />} />
          <Route path="/futures" element={<Futures />} />
          <Route path="/moment" element={<App />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/recap" element={<Recap />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </RehearsalProvider>
  </StrictMode>,
);
