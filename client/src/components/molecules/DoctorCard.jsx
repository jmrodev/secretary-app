
import React from 'react';
import Button from '../atoms/Button';
import { formatPrice } from '../../utils/format';

const DoctorCard = ({ doctor, currentUser, onEdit, t }) => {
    return (
        <article className="card doctor-card group animate-fadeIn">
            <header className="doctor-card__header flex items-center gap-4 mb-6">
                <div className="doctor-card__avatar w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shadow-sm">
                    {doctor.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="doctor-card__info flex-1 min-w-0">
                    <h3 className="doctor-card__name font-bold text-lg text-main-900 truncate group-hover:text-blue-700 transition-colors">
                        {doctor.full_name}
                    </h3>
                    <p className="doctor-card__specialty text-sm font-semibold text-blue-500 uppercase tracking-wide">
                        {doctor.specialty || t('general_physician') || 'Médico General'}
                    </p>
                </div>
            </header>

            <div className="doctor-card__details space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="text-lg">📞</span>
                    <span className="font-medium">{doctor.phone || t('no_phone') || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="text-lg">🏢</span>
                    <span className="font-medium">
                        {t('office') || 'Consultorio'}: <span className="text-main-900">{doctor.office_number || 'N/A'}</span>
                    </span>
                </div>
            </div>

            <div className="doctor-card__prices grid grid-cols-2 gap-3 mb-8">
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {t('consult_abbrev') || 'CONSULTA'}
                    </div>
                    <div className="font-bold text-slate-800 text-base">{formatPrice(doctor.consultation_price)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {t('rx_abbrev') || 'RECETA'}
                    </div>
                    <div className="font-bold text-slate-800 text-base">{formatPrice(doctor.prescription_price)}</div>
                </div>
            </div>

            {(currentUser.role === 'admin' || currentUser.role === 'secretary' || currentUser.user_id === doctor.user_id) && (
                <footer className="doctor-card__footer mt-auto">
                    <Button variant="secondary" className="w-full font-bold text-sm" onClick={() => onEdit(doctor)}>
                        ⚙️ {t('configure_doctor') || 'Configurar Médico'}
                    </Button>
                </footer>
            )}
        </article>
    );
};

export default DoctorCard;
