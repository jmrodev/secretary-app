import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/App';
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
    <HashRouter>
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
    </HashRouter>
  </React.StrictMode>
);
