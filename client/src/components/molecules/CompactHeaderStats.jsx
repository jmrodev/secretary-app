import React from 'react';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import Icon from '@/components/atoms/Icon';
import styles from './CompactHeaderStats.module.css';

/**
 * CompactHeaderStats - Molecule component for header metrics.
 * 
 * @param {Object} texts - Translations { today, week, month, patients, growth }
 */
const CompactHeaderStats = ({ texts = {} }) => {
    const { isStaff, viewDoctorId } = useDoctors();
    const { stats, newPatientStats, loadingStats } = useDashboardStats(isStaff, viewDoctorId);

    const tx = {
        today: texts.today || 'Hoy',
        week: texts.week || 'Semana',
        month: texts.month || 'Mes',
        patients: texts.patients || 'Pacientes',
        growth: texts.growth || 'Crecimiento'
    };

    if (loadingStats || !stats) {
        return (
            <div className={`${styles.root} compact-stats--loading`}>
                <div className={`${styles.pill}`}><div className={`${styles.skeleton}`} /></div>
                <div className={`${styles.pill}`}><div className={`${styles.skeleton}`} /></div>
                <div className={`${styles.pill}`}><div className={`${styles.skeleton}`} /></div>
            </div>
        );
    }

    return (
        <div className={`${styles.root}`}>
            <div className={`${styles.group}`}>
                <div className={`${styles.pill}`} title={tx.today}>
                    <div className={`${styles.iconWrapper}`} data-stat="appointments">
                        <Icon name="CALENDAR_TODAY" size="0.9rem" />
                    </div>
                    <span className={`${styles.value}`}>{stats.appointments_today || 0}</span>
                </div>
                <div className={`${styles.pill}`} title={tx.week}>
                    <div className={`${styles.iconWrapper}`} data-stat="week">
                        <Icon name="VIEW_WEEK" size="0.9rem" />
                    </div>
                    <span className={`${styles.value}`}>{stats.appointments_week || 0}</span>
                </div>
                <div className={`${styles.pill}`} title={tx.month}>
                    <div className={`${styles.iconWrapper}`} data-stat="month">
                        <Icon name="DATE_RANGE" size="0.9rem" />
                    </div>
                    <span className={`${styles.value}`}>{stats.appointments_month || 0}</span>
                </div>
                <div className={`${styles.pill}`} title={tx.patients}>
                    <div className={`${styles.iconWrapper}`} data-stat="patients">
                        <Icon name="GROUPS" size="0.9rem" />
                    </div>
                    <span className={`${styles.value}`}>{stats.total_patients || 0}</span>
                </div>
            </div>

            {isStaff && newPatientStats && (
                <div className={`${styles.group}`}>
                    <div className={`${styles.pill} compact-stats__pill--growth`} title={tx.growth}>
                        <div className={`${styles.iconWrapper}`} data-stat="growth">
                            <Icon name="TRENDING_UP" size="0.9rem" />
                        </div>
                        <span className={`${styles.value}`}>+{newPatientStats.currentDay || 0}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompactHeaderStats;
