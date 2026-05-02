import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from '@/App';
import './index.css';
import { AuthProvider } from '@/features/auth';
import { MessageProvider } from '@/context/MessageContext';
import { ConfigProvider } from '@/context/ConfigContext';

import { LanguageProvider } from '@/context/LanguageContext';
import { ModalProvider } from '@/context/ModalContext';
import { DoctorProvider } from '@/context/DoctorContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <LanguageProvider>
          <MessageProvider>
            <ConfigProvider>
              <DoctorProvider>
                <ModalProvider>
                  <App />
                </ModalProvider>
              </DoctorProvider>
            </ConfigProvider>
          </MessageProvider>
        </LanguageProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
