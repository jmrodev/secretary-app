import React from 'react';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
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
            <div className={`${styles.itemCompact} animate-fade-in`}>
                <span className={`${styles.nameCompact}`}>{name?.split(' ')[0] || t('general_clinic')}</span>
                <div className={`${styles.valuesCompact}`}>
                    <span className={`${styles.methodCompact} ${styles.methodCompactCash}`}>
                        <Icon name="PAYMENTS" size="0.8rem" className={`${styles.iconCompact}`} />
                        ${balances.cash.toLocaleString()}
                    </span>
                    <span className={`${styles.separatorCompact}`}>|</span>
                    <span className={`${styles.methodCompact} ${styles.methodCompactTransfer}`}>
                        <Icon name="ACCOUNT_BALANCE" size="0.8rem" className={`${styles.iconCompact}`} />
                        ${balances.transfer.toLocaleString()}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <Card className={`${styles.card} animate-fade-in`}>
            <h4 className={`${styles.doctorName}`}>{name || t('general_clinic')}</h4>
            <div className={`${styles.details}`}>
                <div className={`${styles.row}`}>
                    <span className={`${styles.label}`}>
                        <Icon name="PAYMENTS" size="1.1rem" className={`${styles.iconCash} cash-box__icon`} />
                        {t('cash')}
                        <span className={`${styles.hint}`}>(Rendible)</span>
                    </span>
                    <span className={`${styles.amount} ${balances.cash < 0 ? styles.amountNegative : styles.amountCash}`}>
                        ${balances.cash.toLocaleString()}
                    </span>
                </div>
                <div className={`${styles.row}`}>
                    <span className={`${styles.label}`}>
                        <Icon name="ACCOUNT_BALANCE" size="1.1rem" className={`${styles.iconTransfer} cash-box__icon`} />
                        {t('transfer')}
                        <span className={`${styles.hint}`}>({t('stats')})</span>
                    </span>
                    <span className={`${styles.amount} ${balances.transfer < 0 ? styles.amountNegative : styles.amountTransfer}`}>
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
            <div className={`${styles.root} ${styles.compact} animate-fade-in`}>
                <h3 className={`${styles.headerCompact}`}>{t('cash_boxes')}:</h3>
                <DoctorCard id={null} name={t('general_clinic')} balances={getBalances(null)} compact={compact} t={t} />
                {filteredDoctors.map(d => (
                    <DoctorCard key={d.id} id={d.id} name={d.full_name} balances={getBalances(d.id)} compact={compact} t={t} />
                ))}
                {selectedDoctorFilter && (
                    <Button 
                        variant="ghost" 
                        size="sm-compact" 
                        onClick={() => onSelectDoctor('')} 
                        className={`${styles.viewAllBtn}`}
                    >
                        {t('view_all')}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className={`${styles.root} animate-fade-in`}>
            <header className={`${styles.header}`}>
                <h3 className={`${styles.title}`}>{t('cash_boxes')}</h3>
                {selectedDoctorFilter && (
                    <Button variant="ghost" size="sm" onClick={() => onSelectDoctor('')}>
                        {t('view_all')}
                    </Button>
                )}
            </header>
            <div className={`${styles.grid}`}>
                <DoctorCard id={null} name={t('general_clinic')} balances={getBalances(null)} compact={compact} t={t} />
                {filteredDoctors.map(d => (
                    <DoctorCard key={d.id} id={d.id} name={d.full_name} balances={getBalances(d.id)} compact={compact} t={t} />
                ))}
            </div>
        </div>
    );
};

export default CashBoxSummary;

