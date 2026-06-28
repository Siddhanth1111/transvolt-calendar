import { useRef, useEffect, useState, useCallback } from 'react';
import { useCalendar } from '../../contexts/CalendarContext';
import {
  getWeekDays,
  getDayNames,
  isToday,
  getEventsForDay,
  formatTime,
  getEventPosition,
  createDateAtHour,
} from '../../utils/dateUtils';
import type { CalendarEvent } from '../../types';
import { lightenColor } from '../../utils/colors';
import { updateEvent as updateEventAPI } from '../../api/events';

export default function WeekView() {
  const {
    currentDate,
    events,
    openCreateModal,
    openPopover,
    fetchEvents,
    goToDate,
    setViewMode,
  } = useCalendar();

  const weekDays = getWeekDays(currentDate);
  const dayNames = getDayNames();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [resizingEvent, setResizingEvent] = useState<string | null>(null);
  const [dragEvent, setDragEvent] = useState<CalendarEvent | null>(null);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 8 * 48; // 48px per hour
    }
  }, []);

  // Current time indicator
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const eventDate = createDateAtHour(date, hour);
    openCreateModal(eventDate);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openPopover(event, { x: rect.right + 8, y: rect.top });
  };

  const handleDayClick = (date: Date) => {
    goToDate(date);
    setViewMode('day');
  };

  // Drag-and-drop logic
  const handleDragStart = (e: React.MouseEvent, event: CalendarEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragEvent(event);
  };

  // Resize logic
  const handleResizeStart = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingEvent(eventId);
  };

  const handleMouseUp = useCallback(async () => {
    if (resizingEvent) {
      const event = events.find((e) => e._id === resizingEvent);
      if (event) {
        try {
          await updateEventAPI(resizingEvent.includes('_') ? resizingEvent.split('_')[0] : resizingEvent, {
            startTime: event.startTime,
            endTime: event.endTime,
            forceUpdate: true,
          });
          await fetchEvents();
        } catch (err) {
          console.error('Failed to resize event:', err);
        }
      }
      setResizingEvent(null);
    }
    if (dragEvent) {
      setDragEvent(null);
    }
  }, [resizingEvent, dragEvent, events, fetchEvents]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const getCurrentTimePosition = () => {
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / (24 * 60)) * (24 * 48); // 48px per hour
  };

  return (
    <div className="week-view">
      {/* Header with day names and numbers */}
      <div className="week-header">
        <div className="week-header-gutter" />
        <div className="week-header-days">
          {weekDays.map((date, i) => (
            <div key={i} className="week-header-day">
              <div className="week-header-day-name">{dayNames[date.getDay()]}</div>
              <button
                className={`week-header-day-number ${isToday(date) ? 'today' : ''}`}
                onClick={() => handleDayClick(date)}
              >
                {date.getDate()}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* All-day events row */}
      <div className="week-allday-row">
        <div className="week-allday-gutter"></div>
        <div className="week-allday-cells">
          {weekDays.map((date, i) => {
            const dayEvents = getEventsForDay(events, date).filter((e) => e.allDay);
            return (
              <div key={i} className="week-allday-cell">
                {dayEvents.map((event) => (
                  <div
                    key={event._id}
                    className="week-allday-event"
                    style={{ backgroundColor: event.color }}
                    onClick={(e) => handleEventClick(e, event)}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid body */}
      <div className="week-body" ref={bodyRef}>
        {/* Time gutter */}
        <div className="time-gutter">
          {hours.map((hour) => (
            <div key={hour} style={{ height: 48, position: 'relative' }}>
              {hour > 0 && (
                <span
                  className="time-gutter-label"
                  style={{ top: 0 }}
                >
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              )}
            </div>
          ))}
          {/* Current time in gutter */}
          {isToday(weekDays[0]) || weekDays.some(d => isToday(d)) ? (
            <span
              className="current-time-gutter"
              style={{ top: getCurrentTimePosition() }}
            >
              {formatTime(now)}
            </span>
          ) : null}
        </div>

        {/* Time columns */}
        <div className="time-grid">
          {weekDays.map((date, colIndex) => {
            const dayEvents = getEventsForDay(events, date).filter((e) => !e.allDay);

            return (
              <div key={colIndex} className="time-column">
                {/* Hour slots */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="time-slot"
                    onClick={() => handleTimeSlotClick(date, hour)}
                  />
                ))}

                {/* Events */}
                {dayEvents.map((event) => {
                  const pos = getEventPosition(event);
                  const totalHeight = 24 * 48;
                  const topPx = (pos.top / 100) * totalHeight;
                  const heightPx = Math.max((pos.height / 100) * totalHeight, 20);
                  const bgColor = lightenColor(event.color, 0.75);

                  return (
                    <div
                      key={event._id}
                      className={`time-event ${dragEvent?._id === event._id ? 'dragging' : ''}`}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        backgroundColor: bgColor,
                        borderLeftColor: event.color,
                        color: event.color,
                      }}
                      onClick={(e) => handleEventClick(e, event)}
                      onMouseDown={(e) => handleDragStart(e, event)}
                    >
                      <div className="time-event-title">{event.title}</div>
                      <div className="time-event-time">
                        {formatTime(event.startTime)} – {formatTime(event.endTime)}
                      </div>
                      {event.location && (
                        <div className="time-event-location">{event.location}</div>
                      )}
                      <div
                        className="time-event-resize"
                        onMouseDown={(e) => handleResizeStart(e, event._id)}
                      />
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isToday(date) && (
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
