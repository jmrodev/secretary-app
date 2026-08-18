import React from 'react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import styles from './CashBoxSummary.module.css';

/**
 * CashBoxSummary Feature Molecule.
 * Displays balances for each doctor/clinic box, supporting compact and full modes.
 * Refactored to follow BEM and Atomic Design standards.
 */
const DoctorCard = ({ id, name, balances, compact, t }) => {
    if (id === null && balances.cash === 0 && balances.transfer === 0) return null;

    if (compact) {
        return (
            <div className={`${styles.CashBoxSummary__itemCompact} animate-fade-in`}>
                <span className={`${styles.CashBoxSummary__nameCompact}`}>{name?.split(' ')[0] || t('general_clinic')}</span>
                <div className={`${styles.CashBoxSummary__valuesCompact}`}>
                    <span className={`${styles.CashBoxSummary__methodCompact} ${styles.CashBoxSummary__methodCompactCash}`}>
                        <Icon name="PAYMENTS" size="0.8rem" className={`${styles.CashBoxSummary__iconCompact}`} />
                        ${balances.cash.toLocaleString()}
                    </span>
                    <span className={`${styles.CashBoxSummary__separatorCompact}`}>|</span>
                    <span className={`${styles.CashBoxSummary__methodCompact} ${styles.CashBoxSummary__methodCompactTransfer}`}>
                        <Icon name="ACCOUNT_BALANCE" size="0.8rem" className={`${styles.CashBoxSummary__iconCompact}`} />
                        ${balances.transfer.toLocaleString()}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <Card className={`${styles.CashBoxSummary__card} animate-fade-in`}>
            <h4 className={`${styles.CashBoxSummary__doctorName}`}>{name || t('general_clinic')}</h4>
            <div className={`${styles.CashBoxSummary__details}`}>
                <div className={`${styles.CashBoxSummary__row}`}>
                    <span className={`${styles.CashBoxSummary__label}`}>
                        <Icon name="PAYMENTS" size="1.1rem" className={`${styles.CashBoxSummary__iconCash} cash-box__icon`} />
                        {t('cash')}
                        <span className={`${styles.CashBoxSummary__hint}`}>(Rendible)</span>
                    </span>
                    <span className={`${styles.CashBoxSummary__amount} ${balances.cash < 0 ? styles.CashBoxSummary__amountNegative : styles.CashBoxSummary__amountCash}`}>
                        ${balances.cash.toLocaleString()}
                    </span>
                </div>
                <div className={`${styles.CashBoxSummary__row}`}>
                    <span className={`${styles.CashBoxSummary__label}`}>
                        <Icon name="ACCOUNT_BALANCE" size="1.1rem" className={`${styles.CashBoxSummary__iconTransfer} cash-box__icon`} />
                        {t('transfer')}
                        <span className={`${styles.CashBoxSummary__hint}`}>({t('stats')})</span>
                    </span>
                    <span className={`${styles.CashBoxSummary__amount} ${balances.transfer < 0 ? styles.CashBoxSummary__amountNegative : styles.CashBoxSummary__amountTransfer}`}>
                        ${balances.transfer.toLocaleString()}
                    </span>
                </div>
            </div>
        </Card>
    );
};

export const CashBoxSummary = ({
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
            <div className={`${styles.CashBoxSummary__root} ${styles.CashBoxSummary__compact} animate-fade-in`}>
                <h3 className={`${styles.CashBoxSummary__headerCompact}`}>{t('cash_boxes')}:</h3>
                <DoctorCard id={null} name={t('general_clinic')} balances={getBalances(null)} compact={compact} t={t} />
                {filteredDoctors.map(d => (
                    <DoctorCard key={d.id} id={d.id} name={d.full_name} balances={getBalances(d.id)} compact={compact} t={t} />
                ))}
                {selectedDoctorFilter && (
                    <Button 
                        variant="ghost" 
                        size="sm-compact" 
                        onClick={() => onSelectDoctor('')} 
                        className={`${styles.CashBoxSummary__viewAllBtn}`}
                    >
                        {t('view_all')}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className={`${styles.CashBoxSummary__root} animate-fade-in`}>
            <header className={`${styles.CashBoxSummary__header}`}>
                <h3 className={`${styles.CashBoxSummary__title}`}>{t('cash_boxes')}</h3>
                {selectedDoctorFilter && (
                    <Button variant="ghost" size="sm" onClick={() => onSelectDoctor('')}>
                        {t('view_all')}
                    </Button>
                )}
            </header>
            <div className={`${styles.CashBoxSummary__grid}`}>
                <DoctorCard id={null} name={t('general_clinic')} balances={getBalances(null)} compact={compact} t={t} />
                {filteredDoctors.map(d => (
                    <DoctorCard key={d.id} id={d.id} name={d.full_name} balances={getBalances(d.id)} compact={compact} t={t} />
                ))}
            </div>
        </div>
    );
};

