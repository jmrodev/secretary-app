import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Routing Orchestrator
import AppRouter from './routes/AppRouter';

// Global UI Components
import FloatingChat from './components/organisms/FloatingChat';

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
    <>
      <Toaster position="top-right" containerStyle={{ zIndex: 9999 }} />
      <AppRouter />
      <FloatingChat />
    </>
  );
}

export default App;
