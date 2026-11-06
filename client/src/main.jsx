import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { App } from '@/App';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
// Deliberate exception to the CSS Modules rule: index.css is the root-level
// global stylesheet (tokens, resets, theme variables). Component styles live
// in *.module.css; only this root file and App.css are global on purpose.
import './index.css';
import { AuthProvider } from '@/features/auth/AuthContext';
import { MessageProvider } from '@/context/MessageContext';
import { ConfigProvider } from '@/context/ConfigContext';

import { LanguageProvider } from '@/context/LanguageProvider';
import { ModalProvider } from '@/context/ModalContext';
import { DoctorProvider } from '@/context/DoctorContext';
import { SearchProvider } from '@/context/SearchProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <MessageProvider>
            <ConfigProvider>
              <DoctorProvider>
                <SearchProvider>
                  <ModalProvider>
                    <App />
                  </ModalProvider>
                </SearchProvider>
              </DoctorProvider>
            </ConfigProvider>
          </MessageProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
