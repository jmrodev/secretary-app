import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

/**
 * PrescriptionItemsList Molecule.
 * Displays the list of medications added to the current prescription.
 */
const PrescriptionItemsList = ({ items, handleRemoveItem, t }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="prescription-modal__items-list">
            <label className="prescription-modal__sub-label">
                {t('medications_added') || 'Medicamentos agregados'}
            </label>
            {items.map((item, idx) => (
                <div key={idx} className="prescription-modal__item">
                    <div className="prescription-modal__item-info">
                        <span className="prescription-modal__item-name">{item.name}</span>
                        <span className="prescription-modal__item-meta">
                            {item.dose && <>{item.dose} · </>}
                            {item.frequency && <>{item.frequency}</>}
                            {item.quantity && <> · {item.quantity} {parseInt(item.quantity) === 1 ? (t('box') || 'caja') : (t('boxes_plural') || 'cajas')}</>}
                            {item.days_supply && (
                                <span className="prescription-modal__item-supply">
                                    {' '}~{item.days_supply} {t('days') || 'días'}
                                </span>
                            )}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => handleRemoveItem(idx)}
                        icon={<Icon name="CLOSE" size="1.2rem" />}
                    />
                </div>
            ))}
        </div>
    );
};

export default PrescriptionItemsList;
