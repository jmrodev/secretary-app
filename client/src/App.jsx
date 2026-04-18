import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Routing Orchestrator
import AppRouter from '@/routes/AppRouter';

// Global UI Components
import { FloatingChat } from '@/features/chat';
import ErrorBoundary from '@/components/molecules/ErrorBoundary';

/**
 * Main Application Orchestrator.
 * Pure orchestrator component that coordinates global UI and routing.
 */
function App() {
  useEffect(() => {
    // Visual indicator for Development Mode
    if (import.meta.env.DEV) {
      document.body.classList.add('dev-mode');
    } else {
      document.body.classList.remove('dev-mode');
    }
  }, []);

  return (
    <ErrorBoundary>
      <Toaster position="top-right" containerClassName="app__toaster-container" />
      <AppRouter />
      <FloatingChat />
    </ErrorBoundary>
  );
}

export default App;
