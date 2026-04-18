import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import './QuickActions.css';

/**
 * QuickActions Organism.
 * Bento-style grid for frequent tasks.
 */
const QuickActions = ({ t, handlers, isAdmin, isSecretary, isDoctor, compact = false }) => {
    const { 
        navigate, 
        setPaymentModal, 
        setPrescribeModal,
        // Assuming these handlers might need to be passed or inferred
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
            <header className="quick-actions__header">
                <h3 className="quick-actions__title">
                    <Icon name="bolt" size="1.25rem" />
                    {t('quick_actions')}
                </h3>
            </header>
            <div className="quick-actions__grid">
                {sections.map(section => (
                    <div key={section.id} className="quick-actions__section">
                        <div className="quick-actions__section-header">
                            <Icon name={section.icon} size="1rem" />
                            <span>{section.title}</span>
                        </div>
                        <div className="quick-actions__buttons">
                            {section.actions.map((action, idx) => (
                                <Button 
                                    key={idx} 
                                    variant="ghost" 
                                    className="quick-actions__btn"
                                    onClick={action.onClick}
                                    unstyled
                                >
                                    <Icon name={action.icon} size="1.1rem" />
                                    <span>{action.label}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default QuickActions;
