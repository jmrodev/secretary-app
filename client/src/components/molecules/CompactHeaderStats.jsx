import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import Icon from '@/components/atoms/Icon';
import './CompactHeaderStats.css';

/**
 * CompactHeaderStats - Molecule component for header metrics.
 */
const CompactHeaderStats = () => {
    const { t } = useLanguage();
    const { isStaff, viewDoctorId } = useDoctors();
    const { stats, newPatientStats, loadingStats } = useDashboardStats(isStaff, viewDoctorId);

    if (loadingStats || !stats) {
        return (
            <div className="compact-stats compact-stats--loading">
                <div className="compact-stats__pill"><div className="compact-stats__skeleton" /></div>
                <div className="compact-stats__pill"><div className="compact-stats__skeleton" /></div>
                <div className="compact-stats__pill"><div className="compact-stats__skeleton" /></div>
            </div>
        );
    }

    return (
        <div className="compact-stats">
            <div className="compact-stats__group">
                <div className="compact-stats__pill" title={t('today')}>
                    <div className="compact-stats__icon-wrapper" data-stat="appointments">
                        <Icon name="CALENDAR_TODAY" size="0.9rem" />
                    </div>
                    <span className="compact-stats__value">{stats.appointments_today || 0}</span>
                </div>
                <div className="compact-stats__pill" title={t('week')}>
                    <div className="compact-stats__icon-wrapper" data-stat="week">
                        <Icon name="VIEW_WEEK" size="0.9rem" />
                    </div>
                    <span className="compact-stats__value">{stats.appointments_week || 0}</span>
                </div>
                <div className="compact-stats__pill" title={t('month')}>
                    <div className="compact-stats__icon-wrapper" data-stat="month">
                        <Icon name="DATE_RANGE" size="0.9rem" />
                    </div>
                    <span className="compact-stats__value">{stats.appointments_month || 0}</span>
                </div>
                <div className="compact-stats__pill" title={t('patients')}>
                    <div className="compact-stats__icon-wrapper" data-stat="patients">
                        <Icon name="GROUPS" size="0.9rem" />
                    </div>
                    <span className="compact-stats__value">{stats.total_patients || 0}</span>
                </div>
            </div>

            {isStaff && newPatientStats && (
                <div className="compact-stats__group">
                    <div className="compact-stats__pill compact-stats__pill--growth" title={t('growth')}>
                        <div className="compact-stats__icon-wrapper" data-stat="growth">
                            <Icon name="TRENDING_UP" size="0.9rem" />
                        </div>
                        <span className="compact-stats__value">+{newPatientStats.currentDay || 0}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompactHeaderStats;
