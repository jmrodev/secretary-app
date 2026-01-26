
import React from 'react';
import Card from '../atoms/Card';

const FinanceStatsCards = ({ stats, t }) => {
    return (
        <div className="stats-grid mb-8">
            {stats.map((s, idx) => (
                <Card key={idx} className="stats-card">
                    <header className="stats-card__header">
                        <h4 className="stats-card__title">{t(s.type) || s.type.replace('_', ' ')}</h4>
                    </header>
                    <div className="stats-card__body">
                        <span className="stats-card__value">${Number(s.total).toLocaleString()}</span>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default FinanceStatsCards;
