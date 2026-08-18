import React from 'react';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import { HeaderStatPill } from '@/components/atoms/HeaderStatPill';
import pillStyles from '@/components/atoms/HeaderStatPill.module.css';
import styles from './CompactHeaderStats.module.css';

const EMPTY_OBJECT = {};

/**
 * CompactHeaderStats - Molecule component for header metrics.
 * 
 * @param {Object} texts - Translations { today, week, month, patients, growth }
 */
export const CompactHeaderStats = ({ texts = EMPTY_OBJECT }) => {
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
                <div className={`${pillStyles.pill}`}><div className={`${styles.skeleton}`} /></div>
                <div className={`${pillStyles.pill}`}><div className={`${styles.skeleton}`} /></div>
                <div className={`${pillStyles.pill}`}><div className={`${styles.skeleton}`} /></div>
            </div>
        );
    }

    return (
        <div className={`${styles.root}`}>
            <div className={`${styles.group}`}>
                <HeaderStatPill icon="CALENDAR_TODAY" value={stats.appointments_today || 0} title={tx.today} tone="appointments" />
                <HeaderStatPill icon="VIEW_WEEK" value={stats.appointments_week || 0} title={tx.week} tone="week" />
                <HeaderStatPill icon="DATE_RANGE" value={stats.appointments_month || 0} title={tx.month} tone="month" />
                <HeaderStatPill icon="GROUPS" value={stats.total_patients || 0} title={tx.patients} tone="patients" />
            </div>

            {isStaff && newPatientStats && (
                <div className={`${styles.group}`}>
                    <HeaderStatPill icon="TRENDING_UP" value={`+${newPatientStats.currentDay || 0}`} title={tx.growth} tone="growth" />
                </div>
            )}
        </div>
    );
};

