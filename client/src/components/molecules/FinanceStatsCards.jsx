
import React from 'react';
import Card from '../atoms/Card';

const FinanceStatsCards = ({ stats, t }) => {
    return (
        <div className="stats-grid mb-8">
            {stats.map((s, idx) => (
                <Card key={idx} className="text-center">
                    <h3 className="text-sm-muted uppercase">{t(s.type) || s.type.replace('_', ' ')}</h3>
                    <p className="stat-value">${s.total}</p>
                </Card>
            ))}
        </div>
    );
};

export default FinanceStatsCards;
