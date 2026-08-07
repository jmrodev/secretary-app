import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequirementManagerController } from '@/features/medical_documents/hooks/useRequirementManagerController';

// Components
import TabButton from '@/components/atoms/TabButton';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import MedicalRequirementTable from '@/features/medical_documents/components/lists/MedicalRequirementTable';
import MedicalRequirementRecycleBin from '@/features/medical_documents/components/lists/MedicalRequirementRecycleBin';
import MedicalRequirementDetailModal from '@/features/medical_documents/components/modals/MedicalRequirementDetailModal';
import MedicalRequirementActionModal from '@/features/medical_documents/components/modals/MedicalRequirementActionModal';
import MedicalRequestModal from '@/features/medical_documents/components/modals/MedicalRequestModal';

import styles from './MedicalRequirementManager.module.css';

/**
 * MedicalRequirementManager Organism (Feature-based).
 * ECC-Pattern: Standard Orchestrator without early returns to protect Hooks.
 */
const MedicalRequirementManager = ({ 
    user, 
    variant = 'full', 
    setPaymentModal 
}) => {
    const { t } = useLanguage();
    const controller = useRequirementManagerController(user);
    
    const {
        requests, loading, selectedRequest, setSelectedRequest, isNewModalOpen, setIsNewModalOpen,
        actionModal, setActionModal, actionNote, setActionNote, activeTab, setActiveTab,
        recycleRequests, doctors, filter, setFilter, confirmAction, handleDelete, fetchRequests, canDeleteRequest,
        fetched
    } = controller;

    const isCompact = variant === 'compact';
    const hideTabs = isCompact;
    const hideFilters = isCompact;

    const handleCloseDetail = () => setSelectedRequest(null);
    const handleCloseAction = () => setActionModal({ open: false, type: '', id: null });
    const handleNewClick = () => setIsNewModalOpen(true);

    const typeLabels = {
        'prescription': t('prescription'),
        'license': t('license'),
        'certificate': t('certificate'),
        'referral': t('referral')
    };

    const isAdminOrSecretary = ['admin', 'secretary'].includes(user?.role);
    const canEdit = user?.role === 'admin' || user?.role === 'secretary' || user?.role === 'doctor';

    // ECC: Avoid early return to keep Hooks stable. Render skeleton instead.
    const showLoader = loading && !fetched;

    return (
        <section className={styles.root}>
            {!hideTabs && (
                <nav className="${styles.root}__tabs">
                    <TabButton isActive={activeTab === 'list'} onClick={() => setActiveTab('list')} variant="pill" icon={<Icon name="view_list" />}>
                        {t('request_status')}
                    </TabButton>
                    <div className="${styles.root}__tab-wrapper">
                        <TabButton isActive={activeTab === 'recycle'} onClick={() => setActiveTab('recycle')} variant="pill" icon={<Icon name="delete" />}>
                            {t('recycle_bin')}
                        </TabButton>
                        {recycleRequests.length > 0 && <span className="${styles.root}__badge">{recycleRequests.length}</span>}
                    </div>
                </nav>
            )}

            <article className="${styles.root}__content animate-fade-in">
                {showLoader ? <Loading variant="centered" /> : (
                    activeTab === 'list' ? (
                        <MedicalRequirementTable
                            requests={requests} filter={filter} setFilter={setFilter} handleNewTab={handleNewClick}
                            setSelectedRequest={setSelectedRequest} handleDelete={handleDelete} openActionModal={(type, id) => setActionModal({ open: true, type, id })}
                            canDeleteRequest={canDeleteRequest} isAdminOrSecretary={isAdminOrSecretary} hideFilters={hideFilters}
                            typeLabels={typeLabels} setPaymentModal={setPaymentModal} currentPage={controller.currentPage}
                            totalPages={controller.totalPages} onPageChange={controller.handlePageChange} t={t}
                        />
                    ) : (
                        <MedicalRequirementRecycleBin recycleRequests={recycleRequests} handleRestore={controller.handleRestore} t={t} />
                    )
                )}
            </article>

            <MedicalRequestModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} doctors={doctors} t={t} onRequestCreated={fetchRequests} />

            <MedicalRequirementDetailModal
                selectedRequest={selectedRequest} onClose={handleCloseDetail} t={t} canEdit={canEdit} typeLabels={typeLabels}
                {...controller}
            />

            <MedicalRequirementActionModal
                actionModal={actionModal} onClose={handleCloseAction} t={t} confirmAction={confirmAction}
                actionNote={actionNote} setActionNote={setActionNote}
            />
        </section>
    );
};

export default MedicalRequirementManager;
