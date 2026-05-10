import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequirementManagerController } from '@/features/medical_documents/hooks/useRequirementManagerController';

// Components
import TabButton from '@/components/atoms/TabButton';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import MedicalRequestForm from '@/features/medical_documents/components/forms/MedicalRequestForm';
import MedicalRequirementTable from '@/features/medical_documents/components/lists/MedicalRequirementTable';
import MedicalRequirementRecycleBin from '@/features/medical_documents/components/lists/MedicalRequirementRecycleBin';
import MedicalRequirementDetailModal from '@/features/medical_documents/components/modals/MedicalRequirementDetailModal';
import MedicalRequirementActionModal from '@/features/medical_documents/components/modals/MedicalRequirementActionModal';
import MedicalRequestModal from '@/features/medical_documents/components/modals/MedicalRequestModal';

// Styles
import './MedicalRequirementManager.css';

/**
 * MedicalRequirementManager Organism (Feature-based).
 * Central orchestrator for medical requests (prescriptions, licenses, certificates).
 * Manages the transition between list view, manual creation, and recycle bin.
 */
const MedicalRequirementManager = ({ 
    user, 
    hideNew = false, 
    hideRecycle = false, 
    hideTabs = false, 
    hideFilters = false, 
    setPaymentModal 
}) => {
    const { t } = useLanguage();
    const controller = useRequirementManagerController(user);
    
    const {
        requests,
        loading,
        selectedRequest,
        setSelectedRequest,
        isNewModalOpen,
        setIsNewModalOpen,
        actionModal,
        setActionModal,
        actionNote,
        setActionNote,
        activeTab,
        setActiveTab,
        recycleRequests,
        doctors,
        filter,
        setFilter,
        handleRestore,
        openActionModal,
        confirmAction,
        handleDelete,
        fetchRequests,
        canDeleteRequest
    } = controller;

    const handleCloseDetail = () => setSelectedRequest(null);
    const handleCloseAction = () => setActionModal({ open: false, type: '', id: null });
    const handleNewClick = () => setIsNewModalOpen(true);
    const handleListTab = () => setActiveTab('list');
    const handleRecycleTab = () => setActiveTab('recycle');

    const typeLabels = {
        'prescription': t('prescription'),
        'license': t('license'),
        'certificate': t('certificate'),
        'referral': t('referral')
    };

    // Only show global loading if we haven't fetched anything yet (initial load)
    if (loading && !controller.fetched) return <Loading variant="centered" text={t('loading')} />;



    const isAdminOrSecretary = ['admin', 'secretary'].includes(user?.role);
    const canEdit = user?.role === 'admin' || user?.role === 'secretary' || user?.role === 'doctor';

    const baseClass = 'medical-requirement-manager';

    return (
        <section className={baseClass}>
            <h2 className="visually-hidden">{t('medical_requirements')}</h2>
            {!hideTabs && (
                <nav className={`${baseClass}__tabs`}>
                    <TabButton
                        isActive={activeTab === 'list'}
                        onClick={handleListTab}
                        variant="pill"
                        icon={<Icon name="view_list" />}
                    >
                        {t('request_status')}
                    </TabButton>
                    {!hideNew && (
                        <TabButton
                            isActive={false}
                            onClick={handleNewClick}
                            variant="pill"
                            icon={<Icon name="add_circle" />}
                        >
                            {t('new_request')}
                        </TabButton>
                    )}
                    {isAdminOrSecretary && canDeleteRequest && !hideRecycle && (
                        <div className={`${baseClass}__tab-wrapper`}>
                            <TabButton
                                isActive={activeTab === 'recycle'}
                                onClick={handleRecycleTab}
                                variant="pill"
                                icon={<Icon name="delete" />}
                            >
                                {t('recycle_bin')}
                            </TabButton>
                            {recycleRequests.length > 0 && (
                                <span className={`${baseClass}__badge`}>{recycleRequests.length}</span>
                            )}
                        </div>
                    )}
                </nav>
            )}

            <article className={`${baseClass}__content animate-fade-in`}>
                {activeTab === 'list' ? (
                    <MedicalRequirementTable
                        requests={requests}
                        filter={filter}
                        setFilter={setFilter}
                        handleNewTab={handleNewClick}
                        setSelectedRequest={setSelectedRequest}
                        handleDelete={handleDelete}
                        openActionModal={openActionModal}
                        canDeleteRequest={canDeleteRequest}
                        isAdminOrSecretary={isAdminOrSecretary}
                        hideFilters={hideFilters}
                        typeLabels={typeLabels}
                        setPaymentModal={setPaymentModal}
                        currentPage={controller.currentPage}
                        totalPages={controller.totalPages}
                        onPageChange={controller.handlePageChange}
                        t={t}
                    />
                ) : (
                    <MedicalRequirementRecycleBin
                        recycleRequests={recycleRequests}
                        handleRestore={handleRestore}
                        t={t}
                    />
                )}
            </article>

            <MedicalRequestModal 
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                doctors={doctors}
                t={t}
                onRequestCreated={fetchRequests}
            />

            <MedicalRequirementDetailModal
                selectedRequest={selectedRequest}
                onClose={handleCloseDetail}
                t={t}
                canEdit={canEdit}
                typeLabels={typeLabels}
                {...controller} // Spread medication handlers/state
            />

            <MedicalRequirementActionModal
                actionModal={actionModal}
                onClose={handleCloseAction}
                t={t}
                confirmAction={confirmAction}
                actionNote={actionNote}
                setActionNote={setActionNote}
            />
        </section>
    );
};

export default MedicalRequirementManager;
