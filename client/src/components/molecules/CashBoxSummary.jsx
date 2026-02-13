import React from 'react';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
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

    if (compact) {
        return (
            <div className="cash-box cash-box--compact">
                <h3 className="cash-box__header--compact">{t('cash_boxes')}:</h3>
                {filteredDoctors.map(d => {
                    const balances = calculateBalanceByMethod ? calculateBalanceByMethod(d.id) : { cash: 0, transfer: 0, total: calculateBalance(d.id) };
                    return (
                        <div key={d.id} className="cash-box__item--compact">
                            <span className="cash-box__name--compact">{d.full_name?.split(' ')[0]}</span>
                            <div className="cash-box__values--compact">
                                <span className="cash-box__method cash-box__method--cash">
                                    💵 ${balances.cash.toLocaleString()}
                                </span>
                                <span className="cash-box__separator">|</span>
                                <span className="cash-box__method cash-box__method--transfer">
                                    🏦 ${balances.transfer.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
                {selectedDoctorFilter && (
                    <Button variant="ghost" size="xs" onClick={() => onSelectDoctor('')} className="cash-box__view-all">
                        {t('view_all') || 'Ver todos'}
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
                        {t('view_all') || 'View All'}
                    </Button>
                )}
            </header>
            <div className="cash-box__grid">
                {filteredDoctors.map(d => {
                    const balances = calculateBalanceByMethod ? calculateBalanceByMethod(d.id) : { cash: 0, transfer: 0, total: calculateBalance(d.id) };
                    return (
                        <Card key={d.id} className="cash-box__item">
                            <h4 className="cash-box__name">{d.full_name}</h4>
                            <div className="cash-box__values">
                                <div className="flex justify-between items-center">
                                    <span className="finance-stats__label">Efectivo</span>
                                    <span className="cash-box__method cash-box__method--cash">
                                        ${balances.cash.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="finance-stats__label">Transferencia</span>
                                    <span className="cash-box__method cash-box__method--transfer">
                                        ${balances.transfer.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default CashBoxSummary;
