import React from 'react';

const DayHeaders = ({ daysOfWeek }) => {
  return (
    <div className="day-headers">
      {daysOfWeek.map((day, index) => (
        <div key={index} className="day-headers__day">
          {day}
        </div>
      ))}
    </div>
  );
};

export default DayHeaders;