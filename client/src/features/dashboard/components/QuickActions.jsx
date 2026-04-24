import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './QuickActions.css';

/**
 * QuickActions Organism.
 * Bento-style grid for frequent tasks.
 */
const QuickActions = ({ t, handlers, isAdmin, isSecretary, isDoctor, compact = false }) => {
    const { 
        navigate, 
        setPaymentModal, 
    } = handlers;

    const sections = [
        {
            id: 'appointments',
            title: t('appointments'),
            icon: 'calendar_month',
            actions: [
                { label: t('new_appointment'), icon: 'add_circle', onClick: () => navigate('/appointments') },
                { label: t('search_free_slots'), icon: 'search', onClick: () => navigate('/appointments') },
            ],
            visible: true
        },
        {
            id: 'patients',
            title: t('patients'),
            icon: 'person_add',
            actions: [
                { label: t('new_patient_btn'), icon: 'person_add', onClick: () => navigate('/patients', { state: { openNewPatient: true } }) },
                { label: t('patients_list'), icon: 'groups', onClick: () => navigate('/patients') },
            ],
            visible: isAdmin || isSecretary
        },
        {
            id: 'billing',
            title: t('finances'),
            icon: 'payments',
            actions: [
                { label: t('record_payment'), icon: 'add_card', onClick: () => setPaymentModal({ open: true, initialData: {} }) },
                { label: t('view_balance'), icon: 'account_balance_wallet', onClick: () => navigate('/finances') },
            ],
            visible: isAdmin || isSecretary
        },
        {
            id: 'medical',
            title: t('documents'),
            icon: 'description',
            actions: [
                { label: t('new_request'), icon: 'assignment_add', onClick: () => navigate('/medical/requests') },
            ],
            visible: true
        }
    ].filter(s => s.visible);

    return (
        <section className={`quick-actions ${compact ? 'quick-actions--compact' : ''}`}>
            {sections.map(section => (
                <div key={section.id} className="quick-actions__section">
                    <header className="quick-actions__header">
                        <h4 className="quick-actions__title">
                            {section.title}
                        </h4>
                    </header>
                    <div className="quick-actions__horizontal-card">
                        {section.actions.map((action, idx) => (
                            <React.Fragment key={idx}>
                                {idx > 0 && <div className="horizontal-divider"></div>}
                                <button 
                                    className="horizontal-action-btn"
                                    onClick={action.onClick}
                                >
                                    <Icon name={action.icon} size="1rem" />
                                    <span>{action.label}</span>
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
};

export default QuickActions;
