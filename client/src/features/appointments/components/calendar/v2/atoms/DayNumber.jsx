import React from 'react';

/**
 * DayNumber (Atom Component)
 * Displays the numeric day and visual indicator if it is today.
 */
const DayNumber = ({ day, isToday = false }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: isToday ? 'var(--accent, #6366f1)' : 'rgba(255, 255, 255, 0.95)', lineHeight: 1 }}>
        {day}
      </span>
      {isToday && (
        <span
          style={{
            width: '6px',
            height: '6px',
            background: 'var(--accent, #6366f1)',
            borderRadius: '50%',
            boxShadow: '0 0 8px var(--accent, #6366f1)'
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default DayNumber;
