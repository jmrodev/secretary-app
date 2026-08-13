import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import './index.css';
import { AuthProvider } from '@/features/auth';
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
