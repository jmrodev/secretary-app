import React from 'react';
import { capitalizeFirst } from '@/utils/core/stringUtils';

export const PrescriptionExtraFields = ({ instructions, setInstructions, bonified, setBonified, t }) => {
    return (
        <>
            <article className="prescription-modal__group">
                <h3 className="visually-hidden">{t('instructions')}</h3>
                <label className="prescription-modal__label">{t('instructions')}</label>
                <textarea
                    className="input-field"
                    rows="3"
                    value={instructions}
                    onChange={e => setInstructions(capitalizeFirst(e.target.value))}
                    placeholder={t('instructions_placeholder') || 'ej. Tomar con comida. No superar dosis máxima.'}
                />
            </article>

            <article className="prescription-modal__group checkbox-group">
                <h3 className="visually-hidden">{t('bonified')}</h3>
                <input
                    type="checkbox"
                    id="bonified-prescription"
                    checked={bonified}
                    onChange={e => setBonified(e.target.checked)}
                    className="prescription-modal__checkbox"
                />
                <label htmlFor="bonified-prescription" className="input-label checkbox-label">
                    {t('bonified')}
                </label>
            </article>
        </>
    );
};

