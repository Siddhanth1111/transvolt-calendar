import { useRef, useEffect, useState } from 'react';
import { useCalendar } from '../../contexts/CalendarContext';
import {
  getDayNames,
  isToday,
  getEventsForDay,
  formatTime,
  getEventPosition,
  createDateAtHour,
} from '../../utils/dateUtils';
import type { CalendarEvent } from '../../types';
import { lightenColor } from '../../utils/colors';

export default function DayView() {
  const { currentDate, events, openCreateModal, openPopover } = useCalendar();
  const bodyRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayNames = getDayNames(false);

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 8 * 48;
    }
  }, []);

  // Current time
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const dayEvents = getEventsForDay(events, currentDate);
  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay);

  const handleTimeSlotClick = (hour: number) => {
    const eventDate = createDateAtHour(currentDate, hour);
    openCreateModal(eventDate);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openPopover(event, { x: rect.right + 8, y: rect.top });
  };

  const getCurrentTimePosition = () => {
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / (24 * 60)) * (24 * 48);
  };

  return (
    <div className="day-view">
      {/* Header */}
      <div className="day-header">
        <div className="day-header-info">
          <div className="day-header-day-name">
            {dayNames[currentDate.getDay()]}
          </div>
          <div className={`day-header-day-number ${isToday(currentDate) ? 'today' : ''}`}>
            {currentDate.getDate()}
          </div>
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="day-allday-row">
          <div className="day-allday-gutter" />
          <div className="day-allday-content">
            {allDayEvents.map((event) => (
              <div
                key={event._id}
                className="week-allday-event"
                style={{ backgroundColor: event.color }}
                onClick={(e) => handleEventClick(e, event)}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid body */}
      <div className="day-body" ref={bodyRef}>
        <div className="time-gutter">
          {hours.map((hour) => (
            <div key={hour} style={{ height: 48, position: 'relative' }}>
              {hour > 0 && (
                <span className="time-gutter-label" style={{ top: 0 }}>
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="time-grid day-view-grid">
          <div className="time-column">
            {/* Hour slots */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="time-slot"
                onClick={() => handleTimeSlotClick(hour)}
              />
            ))}

            {/* Events */}
            {timedEvents.map((event) => {
              const pos = getEventPosition(event);
              const totalHeight = 24 * 48;
              const topPx = (pos.top / 100) * totalHeight;
              const heightPx = Math.max((pos.height / 100) * totalHeight, 20);
              const bgColor = lightenColor(event.color, 0.75);

              return (
                <div
                  key={event._id}
                  className="time-event"
                  style={{
                    top: `${topPx}px`,
                    height: `${heightPx}px`,
                    backgroundColor: bgColor,
                    borderLeftColor: event.color,
                    color: event.color,
                    right: '20%',
                  }}
                  onClick={(e) => handleEventClick(e, event)}
                >
                  <div className="time-event-title">{event.title}</div>
                  <div className="time-event-time">
                    {formatTime(event.startTime)} – {formatTime(event.endTime)}
                  </div>
                  {event.location && (
                    <div className="time-event-location">{event.location}</div>
                  )}
                  <div className="time-event-resize" />
                </div>
              );
            })}

            {/* Current time indicator */}
            {isToday(currentDate) && (
              <div
                className="current-time-indicator"
                style={{ top: `${getCurrentTimePosition()}px` }}
              >
                <div className="current-time-line">
                  <div className="current-time-dot" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
