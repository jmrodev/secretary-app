import React from 'react';
import TabButton from '../atoms/TabButton';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import RequirementItem from '../molecules/RequirementItem';

const RequirementsTable = ({
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
    t
}) => {
    return (
        <div className="requirements-list__content animate-fadeIn">
            {!hideFilters && (
                <div className="requirements-list__filters">
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
                <div className="requirements-list__empty">
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
                <div className="requirements-list__table-container">
                    <table className="requirements-list__table">
                        <thead className="requirements-list__table-head">
                            <tr className="requirements-list__table-row">
                                <th className="requirements-list__table-header">{t('type') || 'Tipo'}</th>
                                <th className="requirements-list__table-header">{t('date') || 'Fecha'}</th>
                                <th className="requirements-list__table-header">{t('patient') || 'Paciente'}</th>
                                <th className="requirements-list__table-header">{t('doctor') || 'Doctor'}</th>
                                <th className="requirements-list__table-header">{t('requested_by') || 'Solicitado Por'}</th>
                                <th className="requirements-list__table-header">{t('status') || 'Estado'}</th>
                                <th className="requirements-list__table-header">{t('actions') || 'Acciones'}</th>
                            </tr>
                        </thead>
                        <tbody className="requirements-list__table-body">
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

export default RequirementsTable;
