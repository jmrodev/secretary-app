import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './DashboardLayout.css';

const DashboardLayout = ({
    t,
    showMobileSidebar,
    onToggleSidebar,
    onCloseSidebar,
    searchSlot,
    sidebarSlot,
    mainSlot
}) => {
    return (
        <section className="dashboard-layout">
            <header className="dashboard-layout__toolbar dashboard-top-actions animate-fadeIn">
                {searchSlot}
                <Button
                    variant="premium"
                    size="sm"
                    onClick={onToggleSidebar}
                    className="dashboard-sidebar-toggle-mobile"
                    title={showMobileSidebar ? t('close_panel') : t('view_metrics')}
                >
                    <Icon name={showMobileSidebar ? 'expand_less' : 'analytics'} />
                    <span className="mobile-only-label">
                        {showMobileSidebar ? t('close_panel') : t('view_metrics')}
                    </span>
                </Button>
            </header>

            <section className={`dashboard-layout__content dashboard-grid ${showMobileSidebar ? 'dashboard-grid--sidebar-visible' : ''}`}>
                {showMobileSidebar && (
                    <button
                        type="button"
                        className="dashboard-layout__backdrop dashboard-mobile-backdrop"
                        onClick={onCloseSidebar}
                        aria-label={t('close_panel')}
                    />
                )}

                <aside className="dashboard-layout__sidebar dashboard-sidebar">
                    {sidebarSlot}
                </aside>

                <section className="dashboard-layout__main dashboard-main">
                    {mainSlot}
                </section>
            </section>
        </section>
    );
};

export default DashboardLayout;
