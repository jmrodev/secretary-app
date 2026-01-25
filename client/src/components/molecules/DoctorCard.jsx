
import React from 'react';
import Button from '../atoms/Button';
import { formatPrice } from '../../utils/format';

const DoctorCard = ({ doctor, currentUser, onEdit, t }) => {
    return (
        <div className="item-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4 mb-4">
                <div className="doctor-avatar w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                    {doctor.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-main-900 truncate">{doctor.full_name}</h3>
                    <p className="text-sm font-medium text-indigo-500">{doctor.specialty || 'Médico General'}</p>
                </div>
            </div>

            <div className="space-y-2 mb-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                    <span>📞</span> {doctor.phone || 'Sin teléfono'}
                </div>
                <div className="flex items-center gap-2">
                    <span>🏢</span> Consultorio: <span className="font-semibold">{doctor.office_number || 'N/A'}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">{t('consult_abbrev') || 'CONSULTA'}</div>
                    <div className="font-bold text-slate-700">{formatPrice(doctor.consultation_price)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">{t('rx_abbrev') || 'RECETA'}</div>
                    <div className="font-bold text-slate-700">{formatPrice(doctor.prescription_price)}</div>
                </div>
            </div>

            {(currentUser.role === 'admin' || currentUser.role === 'secretary' || currentUser.user_id === doctor.user_id) && (
                <Button variant="secondary" className="w-full text-sm py-2" onClick={() => onEdit(doctor)}>
                    ⚙️ Configurar Médico
                </Button>
            )}
        </div>
    );
};

export default DoctorCard;
