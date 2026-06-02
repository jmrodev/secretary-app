import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

export const SlotSection = ({ title, slots, type, onWhatsApp, onSelect, t }) => {
    if (slots.length === 0) return null;
    return (
        <div className="slots-list__section">
            <div className={`slots-list__section-header slots-list__section-header--${type === 'normal' ? 'normal' : 'extra'}`}>{title}</div>
            <table className="slots-list__table">
                <tbody>{slots.map((slot) => (
                    <tr key={`${type}-${slot.iso}`} className={`slots-list__row ${type !== 'normal' ? 'slots-list__row--extra' : ''}`}>
                        <td className="slots-list__cell">
                            <div className="slots-list__time-group">
                                <span className={`slots-list__time slots-list__time--${type}`}>{slot.time}</span>
                                {(type === 'before' || type === 'after') && <span className="slots-list__tag-extra">EXTRA</span>}
                                {type === 'break' && <span className="slots-list__tag-break">EXT</span>}
                            </div>
                        </td>
                        <td className="slots-list__cell slots-list__cell--actions">
                            <div className="slots-list__actions">
                                <Button
                                    className="slots-list__wa-btn"
                                    onClick={(e) => { e.stopPropagation(); onWhatsApp(slot); }}
                                    title="WhatsApp"
                                    unstyled
                                >
                                    <Icon name="chat" size="1.1rem" />
                                </Button>
                                <Button
                                    variant={type === 'normal' ? 'primary' : 'secondary'}
                                    size="sm-compact"
                                    onClick={() => onSelect(slot.iso, slot.is_out_of_hours)}
                                >
                                    {type === 'normal' ? t('select') : (type === 'break' ? t('assign_ext') : t('assign_extra'))}
                                </Button>
                            </div>
                        </td>
                    </tr>
                ))}</tbody>
            </table>
        </div>
    );
};
