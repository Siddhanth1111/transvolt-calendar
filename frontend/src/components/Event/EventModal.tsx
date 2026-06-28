import { useState, useEffect } from 'react';
import { useCalendar } from '../../contexts/CalendarContext';
import type { EventFormData, OverlapWarning } from '../../types';
import { createEvent, updateEvent, deleteEvent } from '../../api/events';
import { EVENT_COLORS, DEFAULT_EVENT_COLOR } from '../../utils/colors';
import { formatDateTimeLocal } from '../../utils/dateUtils';

const DRAFT_KEY = 'transvolt-event-draft';

export default function EventModal() {
  const {
    showEventModal,
    modalMode,
    selectedEvent,
    modalDefaultDate,
    closeModal,
    fetchEvents,
  } = useCalendar();

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    allDay: false,
    color: DEFAULT_EVENT_COLOR,
    location: '',
    isRecurring: false,
    recurrenceRule: { frequency: 'weekly', interval: 1 },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overlapWarning, setOverlapWarning] = useState<OverlapWarning | null>(null);
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const [recurrenceEditMode, setRecurrenceEditMode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load draft or event data
  useEffect(() => {
    if (!showEventModal) return;

    if (modalMode === 'edit' && selectedEvent) {
      setFormData({
        title: selectedEvent.title,
        description: selectedEvent.description || '',
        startTime: formatDateTimeLocal(selectedEvent.startTime),
        endTime: formatDateTimeLocal(selectedEvent.endTime),
        allDay: selectedEvent.allDay,
        color: selectedEvent.color,
        location: selectedEvent.location || '',
        isRecurring: selectedEvent.isRecurring,
        recurrenceRule: selectedEvent.recurrenceRule || { frequency: 'weekly', interval: 1 },
      });
    } else {
      // Check for draft
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          setFormData(JSON.parse(draft));
          return;
        } catch { /* ignore */ }
      }

      // Default: 1-hour event starting now or at clicked time
      const start = modalDefaultDate || new Date();
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      setFormData({
        title: '',
        description: '',
        startTime: formatDateTimeLocal(start),
        endTime: formatDateTimeLocal(end),
        allDay: false,
        color: DEFAULT_EVENT_COLOR,
        location: '',
        isRecurring: false,
        recurrenceRule: { frequency: 'weekly', interval: 1 },
      });
    }

    setOverlapWarning(null);
    setError(null);
  }, [showEventModal, modalMode, selectedEvent, modalDefaultDate]);

  // Save draft on change (create mode only)
  useEffect(() => {
    if (modalMode === 'create' && showEventModal && formData.title) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }
  }, [formData, modalMode, showEventModal]);

  const handleChange = (field: keyof EventFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setOverlapWarning(null);
    setError(null);
  };

  const handleSubmit = async (forceCreate = false) => {
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (modalMode === 'create') {
        await createEvent({
          ...formData,
          forceCreate,
        });
      } else if (selectedEvent) {
        // If recurring event, show dialog
        if (selectedEvent.isRecurring && !recurrenceEditMode && (selectedEvent.isInstance || selectedEvent.recurringEventId)) {
          setShowRecurrenceDialog(true);
          setIsSubmitting(false);
          return;
        }

        const updateData: any = { ...formData, forceUpdate: forceCreate };
        
        if (recurrenceEditMode === 'single') {
          updateData.editMode = 'single';
          updateData.recurringEventId = selectedEvent.recurringEventId || selectedEvent._id.split('_')[0];
          updateData.originalDate = selectedEvent.originalDate || selectedEvent.startTime;
        }

        const eventId = selectedEvent.isInstance
          ? selectedEvent._id.split('_')[0]
          : selectedEvent._id;

        await updateEvent(eventId, updateData);
      }

      localStorage.removeItem(DRAFT_KEY);
      await fetchEvents();
      closeModal();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.requiresConfirmation) {
        setOverlapWarning(err.response.data);
      } else {
        setError(err.response?.data?.message || 'Failed to save event');
      }
    } finally {
      setIsSubmitting(false);
      setRecurrenceEditMode(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    // If recurring, show dialog
    if (selectedEvent.isRecurring || selectedEvent.isInstance || selectedEvent.recurringEventId) {
      setShowRecurrenceDialog(true);
      return;
    }

    try {
      await deleteEvent(selectedEvent._id);
      await fetchEvents();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleRecurrenceAction = async (mode: 'single' | 'all') => {
    if (!selectedEvent) return;
    setShowRecurrenceDialog(false);

    if (recurrenceEditMode === null) {
      // This was triggered from delete
      try {
        const recurringId = selectedEvent.recurringEventId || selectedEvent._id.split('_')[0];
        await deleteEvent(
          selectedEvent.isInstance ? recurringId : selectedEvent._id,
          {
            deleteMode: mode,
            recurringEventId: recurringId,
            originalDate: selectedEvent.originalDate || selectedEvent.startTime,
          }
        );
        await fetchEvents();
        closeModal();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete event');
      }
    } else {
      // This was triggered from edit
      setRecurrenceEditMode(mode);
      handleSubmit();
    }
  };

  if (!showEventModal) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      {showRecurrenceDialog ? (
        <div className="recurrence-dialog" onClick={(e) => e.stopPropagation()}>
          <h3>Edit recurring event</h3>
          <div className="recurrence-dialog-options">
            <button
              className="recurrence-dialog-option"
              onClick={() => handleRecurrenceAction('single')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
              </svg>
              This event only
            </button>
            <button
              className="recurrence-dialog-option"
              onClick={() => handleRecurrenceAction('all')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
              </svg>
              All events in the series
            </button>
          </div>
          <div className="recurrence-dialog-footer">
            <button className="btn btn-secondary" onClick={() => setShowRecurrenceDialog(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="event-modal" onClick={(e) => e.stopPropagation()}>
          <div className="event-modal-header">
            <h2>{modalMode === 'create' ? 'New Event' : 'Edit Event'}</h2>
            <button className="modal-close-btn" onClick={closeModal}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          <div className="event-modal-body">
            {error && <div className="auth-error">{error}</div>}

            {overlapWarning && (
              <div className="overlap-warning">
                <div className="overlap-warning-title">
                  ⚠️ Schedule Conflict
                </div>
                <div className="overlap-warning-events">
                  {overlapWarning.overlappingEvents.map((e) => (
                    <div key={e._id} className="overlap-warning-event">
                      <strong>{e.title}</strong> ({new Date(e.startTime).toLocaleTimeString()} – {new Date(e.endTime).toLocaleTimeString()})
                    </div>
                  ))}
                </div>
                <div className="overlap-warning-actions">
                  <button className="btn btn-primary" onClick={() => handleSubmit(true)}>
                    Save Anyway
                  </button>
                  <button className="btn btn-secondary" onClick={() => setOverlapWarning(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Title */}
            <input
              className="modal-input title-input"
              type="text"
              placeholder="Add title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              autoFocus
            />

            {/* All-day toggle */}
            <div className="toggle-switch" onClick={() => handleChange('allDay', !formData.allDay)}>
              <div className={`toggle-track ${formData.allDay ? 'active' : ''}`}>
                <div className="toggle-thumb" />
              </div>
              <span className="toggle-label">All day</span>
            </div>

            {/* Date/Time */}
            <div className="modal-field">
              <div className="modal-field-row">
                <svg className="modal-field-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
                <input
                  className="modal-input"
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  value={formData.allDay ? formData.startTime.split('T')[0] : formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                />
              </div>
              <div className="modal-field-row">
                <div className="modal-field-icon" />
                <input
                  className="modal-input"
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  value={formData.allDay ? formData.endTime.split('T')[0] : formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                />
              </div>
            </div>

            {/* Recurrence */}
            <div className="modal-field">
              <div className="modal-field-row">
                <svg className="modal-field-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 11h2v2H7v-2zm14-5v14c0 1.1-.9 2-2 2H5a2 2 0 01-2-2l.01-14c0-1.1.88-2 1.99-2h1V2h2v2h8V2h2v2h1c1.1 0 2 .9 2 2zM5 8h14V6H5v2zm14 12V10H5v10h14zm-4-7h2v-2h-2v2zm-4 0h2v-2h-2v2z" />
                </svg>
                <select
                  className="recurrence-select"
                  value={formData.isRecurring ? formData.recurrenceRule.frequency : 'none'}
                  onChange={(e) => {
                    if (e.target.value === 'none') {
                      handleChange('isRecurring', false);
                    } else {
                      handleChange('isRecurring', true);
                      handleChange('recurrenceRule', {
                        ...formData.recurrenceRule,
                        frequency: e.target.value,
                      });
                    }
                  }}
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="modal-field">
              <div className="modal-field-row">
                <svg className="modal-field-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Add location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="modal-field">
              <div className="modal-field-row" style={{ alignItems: 'flex-start' }}>
                <svg className="modal-field-icon" viewBox="0 0 24 24" fill="currentColor" style={{ marginTop: 8 }}>
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
                <textarea
                  className="modal-textarea"
                  placeholder="Add description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Color picker */}
            <div className="modal-field">
              <label>Event color</label>
              <div className="color-picker">
                {EVENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={`color-swatch ${formData.color === color.value ? 'selected' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleChange('color', color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="event-modal-footer">
            {modalMode === 'edit' && (
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            )}
            <button className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
