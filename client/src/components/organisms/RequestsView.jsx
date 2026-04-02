import React from 'react';
import TabNav from '../molecules/TabNav';
import TabButton from '../atoms/TabButton';
import Icon from '../atoms/Icon';
import { MedicalRequestForm, MedicalRequestList } from '../../features/medical_documents';

const RequestsView = ({
    t,
    requestsSubTab,
    handleSubTabChange,
    doctors,
    reqType,
    sendToDoctor,
    handlers,
    requests,
    filterItem,
    handleDeleteRequest,
    openActionModal,
    openPaymentModal,
    user,
    canDeleteRequest,
    handleEditItem
}) => {
    return (
        <div className="medical-documents__requests-layout">
            <TabNav className="tab-nav--sub">
                <TabButton
                    isActive={requestsSubTab === 'list'}
                    onClick={() => handleSubTabChange('list')}
                >
                    {t('request_status')}
                </TabButton>
                <TabButton
                    isActive={requestsSubTab === 'new'}
                    onClick={() => handleSubTabChange('new')}
                    icon={<Icon name="add" size="1rem" />}
                >
                    {t('new_request')}
                </TabButton>
            </TabNav>

            {requestsSubTab === 'new' ? (
                <MedicalRequestForm
                    doctors={doctors}
                    initialType={reqType}
                    initialSendToDoctor={sendToDoctor}
                    onRequestCreated={() => {
                        handlers.fetchRequests();
                        handleSubTabChange('list');
                    }}
                />
            ) : (
                <MedicalRequestList
                    requests={requests}
                    filterItem={filterItem}
                    handleDeleteRequest={handleDeleteRequest}
                    openActionModal={openActionModal}
                    setPaymentModal={openPaymentModal}
                    canDelete={user.role === 'admin' || canDeleteRequest}
                    handleEditRequest={handleEditItem}
                />
            )}
        </div>
    );
};

export default RequestsView;
