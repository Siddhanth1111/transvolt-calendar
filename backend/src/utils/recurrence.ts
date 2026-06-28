import { IEvent, IRecurrenceRule } from '../models/Event';

interface ExpandedEvent {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  color: string;
  location?: string;
  isRecurring: boolean;
  recurrenceRule?: IRecurrenceRule;
  recurringEventId: string;
  isInstance: boolean;
  originalDate: Date;
}

/**
 * Expand a recurring event into individual instances within a date range.
 */
export function expandRecurringEvent(
  event: IEvent,
  rangeStart: Date,
  rangeEnd: Date,
  excludedDates: Date[] = []
): ExpandedEvent[] {
  const instances: ExpandedEvent[] = [];
  const rule = event.recurrenceRule;

  if (!rule) return instances;

  const eventDuration = event.endTime.getTime() - event.startTime.getTime();
  const interval = rule.interval || 1;

  // Normalize excluded dates to date strings for comparison
  const excludedSet = new Set(
    excludedDates.map((d) => new Date(d).toISOString().split('T')[0])
  );

  let currentDate = new Date(event.startTime);
  const maxIterations = 365 * 3; // Safety limit: 3 years of daily events
  let count = 0;

  // Determine recurrence end
  const recurrenceEnd = rule.endDate
    ? new Date(Math.min(new Date(rule.endDate).getTime(), rangeEnd.getTime()))
    : rangeEnd;

  while (currentDate <= recurrenceEnd && count < maxIterations) {
    count++;

    const instanceStart = new Date(currentDate);
    const instanceEnd = new Date(instanceStart.getTime() + eventDuration);

    // Check if instance falls within the query range
    if (instanceEnd >= rangeStart && instanceStart <= rangeEnd) {
      const dateStr = instanceStart.toISOString().split('T')[0];

      // Skip excluded dates
      if (!excludedSet.has(dateStr)) {
        // For weekly recurrence with specific days of week
        if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          if (rule.daysOfWeek.includes(instanceStart.getUTCDay())) {
            instances.push(createInstance(event, instanceStart, instanceEnd));
          }
        } else {
          instances.push(createInstance(event, instanceStart, instanceEnd));
        }
      }
    }

    // Advance to next occurrence
    currentDate = getNextOccurrence(currentDate, rule.frequency, interval);

    // Check count limit
    if (rule.count && count >= rule.count) break;
  }

  return instances;
}

function getNextOccurrence(
  current: Date,
  frequency: string,
  interval: number
): Date {
  const next = new Date(current);

  switch (frequency) {
    case 'daily':
      next.setUTCDate(next.getUTCDate() + interval);
      break;
    case 'weekly':
      next.setUTCDate(next.getUTCDate() + 7 * interval);
      break;
    case 'monthly':
      next.setUTCMonth(next.getUTCMonth() + interval);
      break;
    case 'yearly':
      next.setUTCFullYear(next.getUTCFullYear() + interval);
      break;
  }

  return next;
}

function createInstance(
  event: IEvent,
  startTime: Date,
  endTime: Date
): ExpandedEvent {
  return {
    _id: `${event._id.toString()}_${startTime.toISOString()}`,
    userId: event.userId.toString(),
    title: event.title,
    description: event.description,
    startTime,
    endTime,
    allDay: event.allDay,
    color: event.color,
    location: event.location,
    isRecurring: true,
    recurrenceRule: event.recurrenceRule,
    recurringEventId: event._id.toString(),
    isInstance: true,
    originalDate: startTime,
  };
}
