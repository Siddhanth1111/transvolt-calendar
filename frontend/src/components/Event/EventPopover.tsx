import { useEffect, useRef } from 'react';
import { useCalendar } from '../../contexts/CalendarContext';
import { formatTime, formatDate } from '../../utils/dateUtils';

export default function EventPopover() {
  const { showPopover, popoverPosition, closePopover, openEditModal } = useCalendar();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closePopover();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePopover();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [closePopover]);

  if (!showPopover || !popoverPosition) return null;

  const event = showPopover;

  // Position the popover smartly
  const style: React.CSSProperties = {
    left: Math.min(popoverPosition.x, window.innerWidth - 340),
    top: Math.min(popoverPosition.y, window.innerHeight - 300),
  };

  return (
    <div className="event-popover" style={style} ref={popoverRef}>
      <div className="popover-header">
        <button
          className="popover-action-btn"
          onClick={() => openEditModal(event)}
          title="Edit event"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </button>
        <button
          className="popover-action-btn"
          onClick={closePopover}
          title="Close"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      <div className="popover-body">
        <div className="popover-title">
          <span className="popover-color-dot" style={{ backgroundColor: event.color }} />
          {event.title}
        </div>

        <div className="popover-detail">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
          <div className="popover-detail-text">
            {event.allDay ? (
              <div>{formatDate(event.startTime)}</div>
            ) : (
              <>
                <div>{formatDate(event.startTime)}</div>
                <div>
                  {formatTime(event.startTime)} – {formatTime(event.endTime)}
                </div>
              </>
            )}
          </div>
        </div>

        {event.location && (
          <div className="popover-detail">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span className="popover-detail-text">{event.location}</span>
          </div>
        )}

        {event.description && (
          <div className="popover-detail">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
            <span className="popover-detail-text">{event.description}</span>
          </div>
        )}

        {event.isRecurring && (
          <div className="popover-detail">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 11h2v2H7v-2zm14-5v14c0 1.1-.9 2-2 2H5a2 2 0 01-2-2l.01-14c0-1.1.88-2 1.99-2h1V2h2v2h8V2h2v2h1c1.1 0 2 .9 2 2zM5 8h14V6H5v2zm14 12V10H5v10h14z" />
            </svg>
            <span className="popover-detail-text">
              Repeats {event.recurrenceRule?.frequency}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
