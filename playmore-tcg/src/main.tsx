/**
 * [LAYER: INFRASTRUCTURE]
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './ui/AppRouter';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </StrictMode>
);
