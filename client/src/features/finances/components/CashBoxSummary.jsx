import React from 'react';
import Card from '../../../components/atoms/Card';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';
import './CashBoxSummary.css';

/**
 * CashBoxSummary Feature Molecule.
 * Displays balances for each doctor/clinic box, supporting compact and full modes.
 * Core visual feedback for daily cash flow management in the finances domain.
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
                <div key={id || 'null'} className="cash-box__item--compact animate-fadeIn">
                    <span className="cash-box__name--compact">{name?.split(' ')[0] || t('general_clinic')}</span>
                    <div className="cash-box__values--compact">
                        <span className="cash-box__method cash-box__method--cash">
                            <Icon name="payments" size="0.8rem" color="var(--green-600)" className="cash-box__icon" />
                            ${balances.cash.toLocaleString()}
                        </span>
                        <span className="cash-box__separator">|</span>
                        <span className="cash-box__method cash-box__method--transfer">
                            <Icon name="account_balance" size="0.8rem" color="var(--blue-600)" className="cash-box__icon" />
                            ${balances.transfer.toLocaleString()}
                        </span>
                    </div>
                </div>
            );
        }

        return (
            <Card key={id || 'null'} className="cash-box__item animate-fadeIn">
                <h4 className="cash-box__name">{name || t('general_clinic')}</h4>
                <div className="cash-box__values">
                    <div className="cash-box__header-group">
                        <span className="cash-box__label">
                            <Icon name="payments" size="1rem" color="var(--green-600)" className="cash-box__icon" />
                            {t('cash')}
                            <span className="cash-box__label-hint">(Rendible)</span>
                        </span>
                        <span className={`cash-box__method cash-box__method--bold ${balances.cash < 0 ? 'cash-box__method--red' : 'cash-box__method--cash'}`}>
                            ${balances.cash.toLocaleString()}
                        </span>
                    </div>
                    <div className="cash-box__flex-between">
                        <span className="cash-box__label">
                            <Icon name="account_balance" size="1rem" color="var(--blue-600)" className="cash-box__icon" />
                            {t('transfer')}
                            <span className="cash-box__label-hint">({t('stats')})</span>
                        </span>
                        <span className={`cash-box__method cash-box__method--bold ${balances.transfer < 0 ? 'cash-box__method--red' : 'cash-box__method--transfer'}`}>
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
                <h3 className="cash-box__header--compact">{t('cash_boxes')}:</h3>
                {renderDoctorCard(null, null, t('general_clinic'))}
                {filteredDoctors.map(d => renderDoctorCard(d, d.id, d.full_name))}
                {selectedDoctorFilter && (
                    <Button 
                        variant="ghost" 
                        size="sm-compact" 
                        onClick={() => onSelectDoctor('')} 
                        className="cash-box__view-all"
                    >
                        {t('view_all')}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="cash-box animate-fadeIn">
            <header className="cash-box__title-group">
                <h3 className="cash-box__header">{t('cash_boxes')}</h3>
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

