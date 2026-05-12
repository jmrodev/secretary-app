import React from 'react';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './CashBoxSummary.css';

/**
 * CashBoxSummary Feature Molecule.
 * Displays balances for each doctor/clinic box, supporting compact and full modes.
 * Refactored to follow BEM and Atomic Design standards.
 */
const DoctorCard = ({ id, name, balances, compact, t }) => {
    if (id === null && balances.cash === 0 && balances.transfer === 0) return null;

    if (compact) {
        return (
            <div className="cash-box__item-compact animate-fade-in">
                <span className="cash-box__name-compact">{name?.split(' ')[0] || t('general_clinic')}</span>
                <div className="cash-box__values-compact">
                    <span className="cash-box__method-compact cash-box__method-compact--cash">
                        <Icon name="PAYMENTS" size="0.8rem" className="cash-box__icon-compact" />
                        ${balances.cash.toLocaleString()}
                    </span>
                    <span className="cash-box__separator-compact">|</span>
                    <span className="cash-box__method-compact cash-box__method-compact--transfer">
                        <Icon name="ACCOUNT_BALANCE" size="0.8rem" className="cash-box__icon-compact" />
                        ${balances.transfer.toLocaleString()}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <Card className="cash-box__card animate-fade-in">
            <h4 className="cash-box__doctor-name">{name || t('general_clinic')}</h4>
            <div className="cash-box__details">
                <div className="cash-box__row">
                    <span className="cash-box__label">
                        <Icon name="PAYMENTS" size="1.1rem" className="cash-box__icon cash-box__icon--cash" />
                        {t('cash')}
                        <span className="cash-box__hint">(Rendible)</span>
                    </span>
                    <span className={`cash-box__amount ${balances.cash < 0 ? 'cash-box__amount--negative' : 'cash-box__amount--cash'}`}>
                        ${balances.cash.toLocaleString()}
                    </span>
                </div>
                <div className="cash-box__row">
                    <span className="cash-box__label">
                        <Icon name="ACCOUNT_BALANCE" size="1.1rem" className="cash-box__icon cash-box__icon--transfer" />
                        {t('transfer')}
                        <span className="cash-box__hint">({t('stats')})</span>
                    </span>
                    <span className={`cash-box__amount ${balances.transfer < 0 ? 'cash-box__amount--negative' : 'cash-box__amount--transfer'}`}>
                        ${balances.transfer.toLocaleString()}
                    </span>
                </div>
            </div>
        </Card>
    );
};

const CashBoxSummary = ({
    doctors,
    selectedDoctorFilter,
    onSelectDoctor,
    calculateBalance,
    calculateBalanceByMethod,
    t,
    compact = false
}) => {
    const filteredDoctors = doctors.filter(d => !selectedDoctorFilter || d.id == selectedDoctorFilter);

    const getBalances = (id) => {
        return calculateBalanceByMethod 
            ? calculateBalanceByMethod(id) 
            : { cash: 0, transfer: 0, total: calculateBalance(id) };
    };

    if (compact) {
        return (
            <div className="cash-box cash-box--compact animate-fade-in">
                <h3 className="cash-box__header-compact">{t('cash_boxes')}:</h3>
                <DoctorCard id={null} name={t('general_clinic')} balances={getBalances(null)} compact={compact} t={t} />
                {filteredDoctors.map(d => (
                    <DoctorCard key={d.id} id={d.id} name={d.full_name} balances={getBalances(d.id)} compact={compact} t={t} />
                ))}
                {selectedDoctorFilter && (
                    <Button 
                        variant="ghost" 
                        size="sm-compact" 
                        onClick={() => onSelectDoctor('')} 
                        className="cash-box__view-all-btn"
                    >
                        {t('view_all')}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="cash-box animate-fade-in">
            <header className="cash-box__header">
                <h3 className="cash-box__title">{t('cash_boxes')}</h3>
                {selectedDoctorFilter && (
                    <Button variant="ghost" size="sm" onClick={() => onSelectDoctor('')}>
                        {t('view_all')}
                    </Button>
                )}
            </header>
            <div className="cash-box__grid">
                <DoctorCard id={null} name={t('general_clinic')} balances={getBalances(null)} compact={compact} t={t} />
                {filteredDoctors.map(d => (
                    <DoctorCard key={d.id} id={d.id} name={d.full_name} balances={getBalances(d.id)} compact={compact} t={t} />
                ))}
            </div>
        </div>
    );
};

export default CashBoxSummary;

