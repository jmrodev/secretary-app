import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import { ConfigProvider } from './context/ConfigContext';

import { LanguageProvider } from './context/LanguageContext';
import { ModalProvider } from './context/ModalContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <MessageProvider>
            <ConfigProvider>
              <ModalProvider>
                <App />
              </ModalProvider>
            </ConfigProvider>
          </MessageProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
