import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
<<<<<<< HEAD
import Select from '@/components/atoms/Select';
import Switch from '@/components/atoms/Switch';
import Icon from '@/components/atoms/Icon';
import './ScheduleTimeBlock.css';
=======
import Icon from '@/components/atoms/Icon';
>>>>>>> main

/**
 * ScheduleTimeBlock Feature Molecule.
 * Represents a single configurable time interval within a doctor's availability schedule.
 * Handles time selection, modality (virtual/presential), and hour alignment.
 */
const ScheduleTimeBlock = ({
    block,
    onFocus,
    onBlur,
    onChange,
    onRemove,
    t
}) => {
    return (
        <div className="time-block">
            <div className="time-block__inputs">
                <Input
                    type="time"
                    size="sm"
                    className="time-block__input"
                    value={String(block.start_time || '').slice(0, 5)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onChange={(e) => onChange(block.originalIndex, 'start_time', e.target.value)}
                />
                <span className="time-block__connector">a</span>
                <Input
                    type="time"
                    size="sm"
                    className="time-block__input"
                    value={String(block.end_time || '').slice(0, 5)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onChange={(e) => onChange(block.originalIndex, 'end_time', e.target.value)}
                />
            </div>

            <div className="time-block__divider" />

            <div className="time-block__type">
                <Select
                    className={`time-block__type-select ${block.default_type === 'virtual' ? 'time-block__type-select--virtual' : ''}`}
                    value={block.default_type || 'consultation'}
                    onChange={(e) => onChange(block.originalIndex, 'default_type', e.target.value)}
<<<<<<< HEAD
                    options={[
                        { value: 'consultation', label: t('in_person') || 'Presencial', icon: 'APPOINTMENTS' },
                        { value: 'virtual', label: t('virtual_type') || 'Videollamada', icon: 'VIRTUAL' }
                    ]}
                />
=======
                >
                    <option value="consultation">Presencial</option>
                    <option value="virtual">Videollamada</option>
                </select>
>>>>>>> main
            </div>

            <div className="time-block__options">
                <div className="time-block__alignment">
                    <Switch
                        id={`align-${block.originalIndex}`}
                        checked={block.force_hour_alignment === 1}
                        onChange={(val) => onChange(block.originalIndex, 'force_hour_alignment', val ? 1 : 0)}
                    />
<<<<<<< HEAD
                    <span className="time-block__alignment-text">
                        <Icon name="TIME" size="0.8rem" /> :00
                    </span>
                </div>
=======
                    <span className="time-block__alignment-text text-xs font-bold text-slate-400 group-hover:text-accent transition-colors"><Icon name="schedule" size="1rem" className="mr-1" />Coord. :00</span>
                </label>
>>>>>>> main

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="time-block__remove"
                    title="Eliminar franja"
<<<<<<< HEAD
                    icon="DELETE"
=======
                    icon={<Icon name="delete" />}
>>>>>>> main
                />
            </div>
        </div>
    );
};

export default ScheduleTimeBlock;
