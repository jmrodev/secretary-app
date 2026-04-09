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

    const renderDoctorCard = (d, id, name) => {
        const balances = calculateBalanceByMethod ? calculateBalanceByMethod(id) : { cash: 0, transfer: 0, total: calculateBalance(id) };
        if (id === null && balances.cash === 0 && balances.transfer === 0) return null;

        if (compact) {
            return (
                <div key={id || 'null'} className="cash-box__item-compact animate-fadeIn">
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
            <Card key={id || 'null'} className="cash-box__card animate-fadeIn">
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

    if (compact) {
        return (
            <div className="cash-box cash-box--compact animate-fadeIn">
                <h3 className="cash-box__header-compact">{t('cash_boxes')}:</h3>
                {renderDoctorCard(null, null, t('general_clinic'))}
                {filteredDoctors.map(d => renderDoctorCard(d, d.id, d.full_name))}
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
        <div className="cash-box animate-fadeIn">
            <header className="cash-box__header">
                <h3 className="cash-box__title">{t('cash_boxes')}</h3>
                {selectedDoctorFilter && (
                    <Button variant="ghost" size="sm" onClick={() => onSelectDoctor('')}>
                        {t('view_all')}
                    </Button>
                )}
            </header>
            <div className="cash-box__grid">
                {renderDoctorCard(null, null, t('general_clinic'))}
                {filteredDoctors.map(d => renderDoctorCard(d, d.id, d.full_name))}
            </div>
        </div>
    );
};

export default CashBoxSummary;

