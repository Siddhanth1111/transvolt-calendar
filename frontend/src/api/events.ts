import api from './axios';
import type { CalendarEvent, EventFormData } from '../types';

export const getEvents = async (start: string, end: string): Promise<CalendarEvent[]> => {
  const response = await api.get('/events', {
    params: { start, end },
  });
  return response.data;
};

export const createEvent = async (
  eventData: Partial<EventFormData> & { forceCreate?: boolean }
): Promise<CalendarEvent> => {
  const response = await api.post('/events', eventData);
  return response.data;
};

export const updateEvent = async (
  id: string,
  eventData: Partial<EventFormData> & {
    editMode?: string;
    recurringEventId?: string;
    originalDate?: string;
    forceUpdate?: boolean;
  }
): Promise<CalendarEvent> => {
  const response = await api.put(`/events/${id}`, eventData);
  return response.data;
};

export const deleteEvent = async (
  id: string,
  data?: {
    deleteMode?: string;
    recurringEventId?: string;
    originalDate?: string;
  }
): Promise<void> => {
  await api.delete(`/events/${id}`, { data });
};
