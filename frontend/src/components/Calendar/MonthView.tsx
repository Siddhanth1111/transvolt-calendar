import { useCalendar } from '../../contexts/CalendarContext';
import { getMonthDays, getDayNames, isToday, getEventsForDay, formatTime } from '../../utils/dateUtils';
import type { CalendarEvent } from '../../types';

export default function MonthView() {
  const { currentDate, events, openCreateModal, openPopover, setViewMode, goToDate } = useCalendar();
  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const dayNames = getDayNames();
  const MAX_VISIBLE_EVENTS = 3;

  const handleCellClick = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(9, 0, 0, 0);
    openCreateModal(newDate);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openPopover(event, { x: rect.left, y: rect.bottom + 4 });
  };

  const handleMoreClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    goToDate(date);
    setViewMode('day');
  };

  return (
    <div className="month-view">
      <div className="month-header">
        {dayNames.map((name) => (
          <div key={name} className="month-header-day">
            {name}
          </div>
        ))}
      </div>

      <div className="month-grid">
        {days.map((date, index) => {
          const isOtherMonth = date.getMonth() !== currentDate.getMonth();
          const dayEvents = getEventsForDay(events, date);
          const allDayEvents = dayEvents.filter((e) => e.allDay);
          const timedEvents = dayEvents.filter((e) => !e.allDay);
          const sortedEvents = [...allDayEvents, ...timedEvents];
          const visibleEvents = sortedEvents.slice(0, MAX_VISIBLE_EVENTS);
          const moreCount = sortedEvents.length - MAX_VISIBLE_EVENTS;

          return (
            <div
              key={index}
              className={`month-cell ${isOtherMonth ? 'other-month' : ''}`}
              onClick={() => handleCellClick(date)}
            >
              <div className={`month-cell-date ${isToday(date) ? 'today' : ''}`}>
                {date.getDate()}
              </div>
              <div className="month-cell-events">
                {visibleEvents.map((event) => (
                  <div
                    key={event._id}
                    className={`month-event-chip ${event.allDay ? 'all-day' : 'timed'}`}
                    style={
                      event.allDay
                        ? { backgroundColor: event.color }
                        : undefined
                    }
                    onClick={(e) => handleEventClick(e, event)}
                    title={event.title}
                  >
                    {event.allDay ? (
                      event.title
                    ) : (
                      <>
                        <span className="event-dot" style={{ backgroundColor: event.color }} />
                        <span className="event-time">{formatTime(event.startTime)}</span>
                        <span className="event-title-text">{event.title}</span>
                      </>
                    )}
                  </div>
                ))}
                {moreCount > 0 && (
                  <button
                    className="month-more-events"
                    onClick={(e) => handleMoreClick(e, date)}
                  >
                    {moreCount} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
