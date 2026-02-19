import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import PatientInfoBlock from '../molecules/PatientInfoBlock';
import PatientHistoryTable from '../molecules/PatientHistoryTable';
import PatientFinancialSidebar from '../molecules/PatientFinancialSidebar';
import './PatientDetailsView.css';

const PatientDetailsView = ({
    details,
    t,
    user,
    onBack,
    onEdit,
    onDelete,
    onGenerateQR,
    onGeneratePrescriptionLink,
    onToggleNew,
    onPayDebt,
    children
}) => {
    return (
        <div className="patient-details animate-fadeIn">
            <header className="patient-details__header">
                <Button variant="secondary" onClick={onBack}>
                    &larr; {t('back_to_list')}
                </Button>
                <div className="config-flex config-flex--gap-2">
                    {user.role === 'secretary' && (
                        <Button
                            size="sm"
                            variant={details.is_new_patient ? 'primary' : 'secondary'}
                            onClick={() => onToggleNew(details.id)}
                            icon={details.is_new_patient ? <Icon name="NEW" size="1rem" /> : <Icon name="PROFILE" size="1rem" />}
                        >
                            {details.is_new_patient ? t('new_patient') : t('existing_patient')}
                        </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={onEdit} icon={<Icon name="EDIT" size="1rem" />}>
                        {t('edit_info')}
                    </Button>
                </div>
            </header>

            <h1 className="patient-details__title">{details.full_name}</h1>

            <div className="patient-details__grid">
                {/* Main Content Area */}
                <div className="patient-details__main">
                    <PatientInfoBlock
                        details={details}
                        t={t}
                        onGeneratePrescriptionLink={onGeneratePrescriptionLink}
                    />

                    <PatientHistoryTable
                        details={details}
                        t={t}
                        onPayDebt={onPayDebt}
                    />

                    {children}
                </div>

                {/* Sidebar Info Area */}
                <PatientFinancialSidebar
                    details={details}
                    t={t}
                    user={user}
                    onPayDebt={onPayDebt}
                    onGenerateQR={onGenerateQR}
                    onGeneratePrescriptionLink={onGeneratePrescriptionLink}
                    onDelete={onDelete}
                />
            </div>
        </div>
    );
};

export default PatientDetailsView;

