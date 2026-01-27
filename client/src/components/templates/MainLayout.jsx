import React from 'react';
import Sidebar from '../organisms/Sidebar';

const MainLayout = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
