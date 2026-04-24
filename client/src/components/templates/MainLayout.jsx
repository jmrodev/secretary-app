import React from 'react';
import { Sidebar } from '@/features/layout';
import './MainLayout.css';

const MainLayout = ({ children, wide = false, flush = false }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className={`main-content ${wide ? 'dashboard-wide' : ''} ${flush ? 'main-content--flush' : ''}`}>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
