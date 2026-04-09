import React from 'react';
import { Sidebar } from '@/features/layout';
import './MainLayout.css';

const MainLayout = ({ children, wide = false }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className={`main-content ${wide ? 'dashboard-wide' : ''}`}>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
