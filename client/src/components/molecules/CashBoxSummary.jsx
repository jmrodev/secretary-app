
import React from 'react';

const CashBoxSummary = ({
    doctors,
    selectedDoctorFilter,
    filterDoctorId, // function to filter or just the id?
    onSelectDoctor, // handler to clear filter
    calculateBalance,
    t
}) => {
    return (
        <div className="flex-col gap-8">
            <div className="flex justify-between items-center mb-4">
                <h3>{t('cash_boxes')}</h3>
                {selectedDoctorFilter && (
                    <button className="btn-text" onClick={() => onSelectDoctor('')}>
                        {t('view_all') || 'View All'}
                    </button>
                )}
            </div>
            <div className="grid-responsive">
                {doctors
                    .filter(d => !selectedDoctorFilter || d.id == selectedDoctorFilter)
                    .map(d => {
                        const bal = calculateBalance(d.id);
                        return (
                            <div key={d.id} className="card item-card p-4 flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-main-800 m-0">{d.full_name}</h4>
                                    <p className={`text-2xl font-bold mt-2 ${bal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        ${bal.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default CashBoxSummary;
