import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';
import './PhoneNumbersManager.css';

/**
 * PhoneNumbersManager Feature Molecule.
 * Orchestrates institutional phone contacts within the communication settings domain.
 * Supports primary number selection, quick actions (call/WhatsApp), and multi-entry management.
 */
const PhoneNumbersManager = ({ phoneNumbers, onChange }) => {
    const { t } = useLanguage();

    // Ensure we always have at least one item to render (Ghost item if list is empty)
    const displayPhoneNumbers = (phoneNumbers && phoneNumbers.length > 0)
        ? phoneNumbers
        : [{ phone_number: '+549', label: 'Celular', is_primary: true }];

    const handleAdd = () => {
        onChange([...(phoneNumbers || []), { phone_number: '+549', label: 'Celular', is_primary: false }]);
    };

    const handleRemove = (index) => {
        if (!phoneNumbers || phoneNumbers.length === 0) return;
        onChange(phoneNumbers.filter((_, i) => i !== index));
    };

    const handleUpdate = (index, field, value) => {
        let currentList = (phoneNumbers && phoneNumbers.length > 0) ? [...phoneNumbers] : [{ phone_number: '+549', label: 'Celular', is_primary: true }];

        currentList[index][field] = value;

        if (field === 'is_primary' && value === true) {
            currentList.forEach((p, i) => { if (i !== index) p.is_primary = false; });
        }
        onChange(currentList);
    };

    return (
        <div className="phone-manager animate-fadeIn p-4 bg-slate-50 border border-slate-100 rounded-sm">
            <label className="phone-manager__label flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 pb-2">
                <Icon name="smartphone" size="1.2rem" color="var(--accent-color)" />
                {t('phone_numbers') || 'Números de Contacto'}
            </label>
            {displayPhoneNumbers.map((pn, index) => (
                <div key={index} className="phone-manager__item flex flex-wrap md:flex-nowrap items-center gap-4 bg-white p-3 rounded-sm border border-gray-100 mb-4 shadow-sm">
                    <input
                        className="phone-manager__input phone-manager__input--label !bg-slate-50 !border-slate-100 text-xs font-bold uppercase tracking-tighter w-full md:w-32 py-1.5 px-3 rounded-sm"
                        value={pn.label}
                        onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                        placeholder={t('label')}
                    />
                    <div className="phone-manager__number-box flex-1 flex items-center bg-slate-50 rounded-sm border border-slate-100 overflow-hidden min-w-[200px]">
                        <input
                            className="phone-manager__input phone-manager__input--number flex-1 bg-transparent border-none py-1.5 px-3 text-sm font-bold text-slate-700 tracking-wider"
                            value={pn.phone_number}
                            onChange={(e) => handleUpdate(index, 'phone_number', e.target.value)}
                            placeholder="+549..."
                            required
                        />
                        {pn.phone_number && pn.phone_number.length > 5 && (
                            <div className="phone-manager__quick-actions flex gap-1 px-2 border-l border-slate-200">
                                <Button
                                    to={`tel:${pn.phone_number.replace(/[^0-9+]/g, '')}`}
                                    variant="link"
                                    size="sm-compact"
                                    title="Llamar"
                                    className="text-accent hover:bg-slate-100 p-1"
                                    icon={<Icon name="call" size="1.1rem" />}
                                />
                                <Button
                                    to={`https://wa.me/${pn.phone_number.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    variant="link"
                                    size="sm-compact"
                                    title="WhatsApp"
                                    className="text-green-500 hover:bg-slate-100 p-1"
                                    icon={<Icon name="chat" size="1.1rem" />}
                                />
                            </div>
                        )}
                    </div>
                    <div className="phone-manager__primary-selector">
                        <label className="phone-manager__primary-label flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                className="phone-manager__radio text-accent focus:ring-accent"
                                name={`primary-phone-${index}`}
                                checked={pn.is_primary}
                                onChange={() => handleUpdate(index, 'is_primary', true)}
                            />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-accent transition-colors">{t('primary') || 'Principal'}</span>
                        </label>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        className="phone-manager__delete-btn text-slate-300 hover:text-red-500 hover:bg-red-50 p-2"
                        onClick={() => handleRemove(index)}
                        title={t('delete')}
                        icon={<Icon name="delete" size="1.1rem" />}
                    />
                </div>
            ))}
            <div className="flex justify-end mt-6 border-t border-slate-200 pt-6">
                <Button
                    variant="secondary"
                    size="sm"
                    className="phone-manager__add-btn text-[10px] uppercase font-bold tracking-widest"
                    onClick={handleAdd}
                    icon={<Icon name="add" size="1rem" />}
                >
                    {t('add_phone') || 'Agregar Contacto'}
                </Button>
            </div>
        </div>
    );
};

export default PhoneNumbersManager;
