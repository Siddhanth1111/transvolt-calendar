import type { CalendarEvent } from '../types';

/**
 * Get all days to display in a month grid (6 rows x 7 cols).
 * Includes leading days from prev month and trailing days from next month.
 */
export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start from Sunday of the first week
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // Always show 6 weeks (42 days)
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    days.push(date);
  }

  return days;
}

/**
 * Get the 7 days of the week containing the given date.
 */
export function getWeekDays(date: Date): Date[] {
  const days: Date[] = [];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }

  return days;
}

/**
 * Format time for display (e.g., "9:30 AM")
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date for display (e.g., "Jun 28, 2024")
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date for input[type=datetime-local] (YYYY-MM-DDTHH:mm)
 */
export function formatDateTimeLocal(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format date for input[type=date] (YYYY-MM-DD)
 */
export function formatDateInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day (local time).
 */
export function isSameDay(a: Date | string, b: Date | string): boolean {
  const dateA = typeof a === 'string' ? new Date(a) : a;
  const dateB = typeof b === 'string' ? new Date(b) : b;
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

/**
 * Check if a date is today.
 */
export function isToday(date: Date | string): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get events for a specific day.
 */
export function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((event) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return start <= dayEnd && end >= dayStart;
  });
}

/**
 * Calculate event position in time grid as percentage of day.
 */
export function getEventPosition(event: CalendarEvent): { top: number; height: number } {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const duration = endMinutes - startMinutes;

  const totalMinutesInDay = 24 * 60;
  const top = (startMinutes / totalMinutesInDay) * 100;
  const height = Math.max((duration / totalMinutesInDay) * 100, (15 / totalMinutesInDay) * 100); // Min 15 min

  return { top, height };
}

/**
 * Get the start and end of a month for API queries.
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 42);
  endDate.setHours(23, 59, 59, 999);

  return { start: startDate, end: endDate };
}

/**
 * Get the start and end of a week for API queries.
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - date.getDay());
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  endDate.setHours(23, 59, 59, 999);

  return { start: startDate, end: endDate };
}

/**
 * Get the start and end of a day for API queries.
 */
export function getDayRange(date: Date): { start: Date; end: Date } {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  return { start: startDate, end: endDate };
}

/**
 * Get month name.
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month];
}

/**
 * Get short day names.
 */
export function getDayNames(short = true): string[] {
  if (short) return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
}

/**
 * Snap minutes to nearest 15-minute interval.
 */
export function snapToInterval(minutes: number, interval: number = 15): number {
  return Math.round(minutes / interval) * interval;
}

/**
 * Create a date from a specific hour (for creating events on click).
 */
export function createDateAtHour(date: Date, hour: number, minutes: number = 0): Date {
  const d = new Date(date);
  d.setHours(hour, minutes, 0, 0);
  return d;
}
