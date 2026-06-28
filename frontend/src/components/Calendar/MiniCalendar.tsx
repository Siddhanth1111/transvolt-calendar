import { useState } from 'react';
import { useCalendar } from '../../contexts/CalendarContext';
import { getMonthDays, getMonthName, isToday, isSameDay } from '../../utils/dateUtils';

export default function MiniCalendar() {
  const { currentDate, goToDate, setViewMode } = useCalendar();
  const [displayMonth, setDisplayMonth] = useState(new Date(currentDate));

  const days = getMonthDays(displayMonth.getFullYear(), displayMonth.getMonth());
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const goToPrevMonth = () => {
    setDisplayMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const goToNextMonth = () => {
    setDisplayMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const handleDayClick = (date: Date) => {
    goToDate(date);
    setViewMode('day');
  };

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <span className="mini-calendar-title">
          {getMonthName(displayMonth.getMonth())} {displayMonth.getFullYear()}
        </span>
        <div className="mini-calendar-nav">
          <button onClick={goToPrevMonth} aria-label="Previous month">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <button onClick={goToNextMonth} aria-label="Next month">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mini-calendar-grid">
        {dayNames.map((name, i) => (
          <div key={i} className="mini-calendar-day-name">
            {name}
          </div>
        ))}
        {days.map((date, i) => {
          const isOtherMonth = date.getMonth() !== displayMonth.getMonth();
          const isTodayDate = isToday(date);
          const isSelected = isSameDay(date, currentDate);

          return (
            <button
              key={i}
              className={`mini-calendar-day ${isOtherMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''} ${isSelected && !isTodayDate ? 'selected' : ''}`}
              onClick={() => handleDayClick(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
