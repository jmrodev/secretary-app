import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/dateUtils';
import styles from '../modals/NextSlotCalendarModal.module.css';

export const SlotSection = ({ title, icon, slots, type, t, onWhatsApp, onSelect }) => {
    if (slots.length === 0) return null;
    return (
        <div className={styles.section}>
            <div className={`${styles.sectionHeader} ${type === 'normal' ? styles.sectionHeaderNormal : styles.sectionHeaderExtra}`}>
                <Icon name={icon} size="0.95rem" />
                {title}
            </div>
            <table className={styles.table}>
                <tbody>
                    {slots.map(slot => (
                        <tr key={slot.iso} className={styles.row}>
                            <td className={styles.cell}>
                                <div className={styles.timeGroup}>
                                    <span className={styles.time}>{slot.time}</span>
                                    {(type === 'before' || type === 'after') && <span className={styles.tagExtra}>EXTRA</span>}
                                    {type === 'break' && <span className={styles.tagBreak}>EXT</span>}
                                </div>
                            </td>
                            <td className={`${styles.cell} ${styles.cellActions}`}>
                                <div className={styles.actions}>
                                    <Button
                                        variant="whatsapp"
                                        size="icon"
                                        round
                                        className={styles.waBtn}
                                        onClick={() => onWhatsApp({ 
                                            ...slot, 
                                            dayName: slot.dayName?.split(' ')[0] || formatDate(slot.iso, { weekday: true }), 
                                            formattedDate: formatDate(slot.iso, { monthName: true }) 
                                        })}
                                        icon={<Icon name="chat" size="1.2rem" />}
                                        title="WhatsApp"
                                    />
                                    <Button
                                        variant={type === 'normal' ? "dark" : "accent"}
                                        size="md"
                                        className={styles.selectBtn}
                                        onClick={() => onSelect(slot.iso, type !== 'normal')}
                                    >
                                        {t('select') || 'Seleccionar'}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
