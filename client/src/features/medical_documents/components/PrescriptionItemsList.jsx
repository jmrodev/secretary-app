
import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import './PrescriptionItemsList.css';

/**
 * PrescriptionItemsList Molecule.
 * Displays the current medications added to the batch prescription.
 */
const PrescriptionItemsList = ({ items, handleRemoveItem, t }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="prescription-items">
            <label className="prescription-modal__label">
                {t('added_medications') || 'Medicamentos agregados'} ({items.length})
            </label>
            <div className="prescription-items__list">
                {items.map((item, idx) => (
                    <div key={idx} className="prescription-item animate-slideIn">
                        <div className="prescription-item__info">
                            <div className="prescription-item__header">
                                <span className="prescription-item__name">{item.name}</span>
                                {item.dose && <span className="prescription-item__dose">{item.dose}</span>}
                            </div>
                            <div className="prescription-item__meta">
                                <span className="prescription-item__freq">
                                    <Icon name="schedule" size="0.9rem" />
                                    {item.frequency}
                                </span>
                                {item.quantity && item.quantity !== '0' && (
                                    <span className="prescription-item__qty">
                                        <Icon name="inventory_2" size="0.9rem" />
                                        {item.quantity} {parseInt(item.quantity) === 1 ? (t('box') || 'caja') : (t('boxes_plural') || 'cajas')}
                                    </span>
                                )}
                                {item.days_supply && (
                                    <span className="prescription-item__days">
                                        <Icon name="event" size="0.9rem" />
                                        ~{item.days_supply} {t('days') || 'días'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm-compact"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-danger"
                            icon={<Icon name="close" size="1.2rem" />}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrescriptionItemsList;
