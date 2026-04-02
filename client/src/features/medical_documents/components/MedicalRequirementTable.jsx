import React from 'react';
import TabButton from '../../../components/atoms/TabButton';
import Icon from '../../../components/atoms/Icon';
import Button from '../../../components/atoms/Button';
import RequirementItem from '../../../components/molecules/RequirementItem';

const MedicalRequirementTable = ({
    requests,
    filter,
    setFilter,
    handleNewTab,
    setSelectedRequest,
    handleDelete,
    openActionModal,
    canDeleteRequest,
    isAdminOrSecretary,
    hideFilters,
    typeLabels,
    setPaymentModal,
    t
}) => {
    return (
        <div className="medical-requirement-manager__content animate-fadeIn">
            {!hideFilters && (
                <div className="medical-requirement-manager__filters">
                    <TabButton
                        variant="pill"
                        isActive={filter === 'active'}
                        onClick={() => setFilter('active')}
                    >
                        {t('pending') || 'Pendientes'}
                    </TabButton>
                    <TabButton
                        variant="pill"
                        isActive={filter === 'history'}
                        onClick={() => setFilter('history')}
                    >
                        {t('history') || 'Historial'}
                    </TabButton>
                </div>
            )}

            {requests.length === 0 ? (
                <div className="medical-requirement-manager__empty">
                    <Icon name="inbox" size="3rem" />
                    <p>{t('no_requests') || (filter === 'active' ? 'No hay requerimientos pendientes.' : 'No hay historial.')}</p>
                    {filter === 'active' && (
                        <Button
                            variant="primary"
                            onClick={handleNewTab}
                            icon={<Icon name="add_circle" />}
                        >
                            {t('create_first_request') || 'Crear primera solicitud'}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="medical-requirement-manager__table-container">
                    <table className="medical-requirement-manager__table">
                        <thead className="medical-requirement-manager__table-head">
                            <tr className="medical-requirement-manager__table-row">
                                <th className="medical-requirement-manager__table-header">{t('type') || 'Tipo'}</th>
                                <th className="medical-requirement-manager__table-header">{t('date') || 'Fecha'}</th>
                                <th className="medical-requirement-manager__table-header">{t('patient') || 'Paciente'}</th>
                                <th className="medical-requirement-manager__table-header">{t('doctor') || 'Doctor'}</th>
                                <th className="medical-requirement-manager__table-header">{t('requested_by') || 'Solicitado Por'}</th>
                                <th className="medical-requirement-manager__table-header">{t('status') || 'Estado'}</th>
                                <th className="medical-requirement-manager__table-header">{t('actions') || 'Acciones'}</th>
                            </tr>
                        </thead>
                        <tbody className="medical-requirement-manager__table-body">
                            {requests.map(r => (
                                <RequirementItem
                                    key={r.id}
                                    request={r}
                                    typeLabel={typeLabels[r.type] || r.type}
                                    onSelect={setSelectedRequest}
                                    onDelete={handleDelete}
                                    onAction={openActionModal}
                                    canDelete={canDeleteRequest}
                                    isAdminOrSecretary={isAdminOrSecretary}
                                    setPaymentModal={setPaymentModal}
                                    t={t}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MedicalRequirementTable;
