import React from 'react';

const StatCard = ({
    icon,
    label,
    value,
    colorClass = 'text-main-900',
    hoverColorClass = 'group-hover:text-indigo-600',
    bgClass = 'bg-white',
    borderClass = 'border-slate-100',
    textClass = 'text-main-900'
}) => {
    return (
        <div className={`${bgClass} p-3 rounded-2xl border ${borderClass} shadow-sm hover:shadow-md transition-all group`}>
            <div className={`flex items-center gap-2 mb-1 ${bgClass === 'bg-white' || bgClass.includes('slate-50') ? 'text-slate-500' : 'opacity-80'}`}>
                <span className="text-sm">{icon}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-2xl font-black ${textClass} ${hoverColorClass} transition-colors`}>
                {value}
            </div>
        </div>
    );
};

export default StatCard;
