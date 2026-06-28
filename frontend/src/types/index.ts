export type ViewMode = 'month' | 'week' | 'day';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
  count?: number;
}

export interface CalendarEvent {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
  location?: string;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  recurringEventId?: string;
  isException?: boolean;
  originalDate?: string;
  isInstance?: boolean;
}

export interface EventFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
  location: string;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule;
}

export interface OverlapWarning {
  message: string;
  overlappingEvents: Array<{
    _id: string;
    title: string;
    startTime: string;
    endTime: string;
  }>;
  requiresConfirmation: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}
