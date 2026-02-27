import React from 'react';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import './CashBoxSummary.css';

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
                <div key={id || 'null'} className="cash-box__item--compact">
                    <span className="cash-box__name--compact">{name?.split(' ')[0] || t('general_clinic')}</span>
                    <div className="cash-box__values--compact">
                        <span className="cash-box__method cash-box__method--cash">
                            <Icon name="payments" size="0.8rem" color="var(--green-600)" className="mr-1" />
                            ${balances.cash.toLocaleString()}
                        </span>
                        <span className="cash-box__separator">|</span>
                        <span className="cash-box__method cash-box__method--transfer">
                            <Icon name="account_balance" size="0.8rem" color="var(--blue-600)" className="mr-1" />
                            ${balances.transfer.toLocaleString()}
                        </span>
                    </div>
                </div>
            );
        }

        return (
            <Card key={id || 'null'} className="cash-box__item">
                <h4 className="cash-box__name">{name || t('general_clinic')}</h4>
                <div className="cash-box__values">
                    <div className="flex justify-between items-center">
                        <span className="finance-stats__label">
                            <Icon name="payments" size="1rem" color="var(--green-600)" className="mr-1" />
                            {t('cash')}
                            <span className="text-[10px] ml-1 opacity-50 font-normal uppercase tracking-tighter">(Rendible)</span>
                        </span>
                        <span className={`cash-box__method ${balances.cash < 0 ? 'text-red-600 font-black animate-pulse' : 'cash-box__method--cash'}`}>
                            ${balances.cash.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="finance-stats__label">
                            <Icon name="account_balance" size="1rem" color="var(--blue-600)" className="mr-1" />
                            {t('transfer')}
                            <span className="text-[10px] ml-1 opacity-50 font-normal uppercase tracking-tighter">({t('stats')})</span>
                        </span>
                        <span className={`cash-box__method ${balances.transfer < 0 ? 'text-red-500 opacity-70 italic' : 'cash-box__method--transfer'}`}>
                            ${balances.transfer.toLocaleString()}
                        </span>
                    </div>
                </div>
            </Card>
        );
    };

    if (compact) {
        return (
            <div className="cash-box cash-box--compact">
                <h3 className="cash-box__header--compact">{t('cash_boxes')}:</h3>
                {renderDoctorCard(null, null, t('general_clinic'))}
                {filteredDoctors.map(d => renderDoctorCard(d, d.id, d.full_name))}
                {selectedDoctorFilter && (
                    <Button variant="ghost" size="xs" onClick={() => onSelectDoctor('')} className="cash-box__view-all">
                        {t('view_all')}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="cash-box">
            <header className="flex justify-between items-center mb-2">
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
