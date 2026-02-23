import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useRequirementsController } from '../../controllers/useRequirementsController';

// Components
import Button from '../atoms/Button';
import TabButton from '../atoms/TabButton';
import Icon from '../atoms/Icon';
import Loading from '../atoms/Loading';
import MedicalRequestForm from './MedicalRequestForm';
import RequirementsTable from './RequirementsTable';
import RequirementsRecycleBin from './RequirementsRecycleBin';
import RequirementDetailModal from './RequirementDetailModal';
import RequirementActionModal from './RequirementActionModal';

// Styles
import './RequirementsList.css';

/**
 * RequirementsList Organism.
 * Displays and manages medical requests with list, new, and recycle bin views.
 */
const RequirementsList = ({ user, hideNew = false, hideRecycle = false, hideTabs = false, hideFilters = false, setPaymentModal }) => {
    const { t } = useLanguage();
    const {
        requests,
        loading,
        selectedRequest,
        setSelectedRequest,
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
        checkIsKnown,
        canDeleteRequest,
        // Medication / Edit
        isEditing, setIsEditing,
        editMeds, setEditMeds,
        editNotes, setEditNotes,
        newMedInput, setNewMedInput,
        addToChronic, handleSaveEdit,
        updateEditMed, handleAddMed,
        editDoctorNote, setEditDoctorNote
    } = useRequirementsController(user);

    const handleCloseDetail = () => setSelectedRequest(null);
    const handleCloseAction = () => setActionModal({ open: false, type: '', id: null });
    const handleOpenEdit = () => setIsEditing(true);
    const handleCancelEdit = () => setIsEditing(false);
    const handleNewTab = () => setActiveTab('new');
    const handleListTab = () => setActiveTab('list');
    const handleRecycleTab = () => setActiveTab('recycle');

    const typeLabels = {
        'prescription': t('prescription'),
        'license': t('license'),
        'certificate': t('certificate'),
        'referral': t('referral')
    };

    if (loading) return <Loading variant="centered" text={t('loading')} />;

    const isAdminOrSecretary = ['admin', 'secretary'].includes(user.role);
    const canEdit = user.role === 'admin' || user.role === 'secretary' || user.role === 'doctor';

    const baseClass = 'requirements-list';

    return (
        <div className={baseClass}>
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
                            isActive={activeTab === 'new'}
                            onClick={handleNewTab}
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
                                {t('recycle_bin') || 'Papelera'}
                            </TabButton>
                            {recycleRequests.length > 0 && (
                                <span className={`${baseClass}__badge`}>{recycleRequests.length}</span>
                            )}
                        </div>
                    )}
                </nav>
            )}

            <div className={`${baseClass}__content animate-fadeIn`}>
                {activeTab === 'new' ? (
                    <MedicalRequestForm
                        doctors={doctors}
                        onRequestCreated={() => {
                            fetchRequests();
                            setActiveTab('list');
                        }}
                    />
                ) : activeTab === 'list' ? (
                    <RequirementsTable
                        requests={requests}
                        filter={filter}
                        setFilter={setFilter}
                        handleNewTab={handleNewTab}
                        setSelectedRequest={setSelectedRequest}
                        handleDelete={handleDelete}
                        openActionModal={openActionModal}
                        canDeleteRequest={canDeleteRequest}
                        isAdminOrSecretary={isAdminOrSecretary}
                        hideFilters={hideFilters}
                        typeLabels={typeLabels}
                        setPaymentModal={setPaymentModal}
                        t={t}
                    />
                ) : (
                    <RequirementsRecycleBin
                        recycleRequests={recycleRequests}
                        handleRestore={handleRestore}
                        t={t}
                    />
                )}
            </div>

            <RequirementDetailModal
                selectedRequest={selectedRequest}
                onClose={handleCloseDetail}
                t={t}
                canEdit={canEdit}
                isEditing={isEditing}
                handleOpenEdit={handleOpenEdit}
                handleCancelEdit={handleCancelEdit}
                handleSaveEdit={handleSaveEdit}
                editMeds={editMeds}
                updateEditMed={updateEditMed}
                setEditMeds={setEditMeds}
                newMedInput={newMedInput}
                setNewMedInput={setNewMedInput}
                handleAddMed={handleAddMed}
                editNotes={editNotes}
                setEditNotes={setEditNotes}
                editDoctorNote={editDoctorNote}
                setEditDoctorNote={setEditDoctorNote}
                checkIsKnown={checkIsKnown}
                addToChronic={addToChronic}
                typeLabels={typeLabels}
            />

            <RequirementActionModal
                actionModal={actionModal}
                onClose={handleCloseAction}
                t={t}
                confirmAction={confirmAction}
                actionNote={actionNote}
                setActionNote={setActionNote}
            />
        </div>
    );
};

export default RequirementsList;

