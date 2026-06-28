import Event from '../models/Event';

export interface OverlapResult {
  hasOverlap: boolean;
  overlappingEvents: Array<{
    _id: string;
    title: string;
    startTime: Date;
    endTime: Date;
  }>;
}

/**
 * Check if a new event overlaps with existing events for a user.
 * Ignores the event itself when editing (via excludeEventId).
 */
export async function checkOverlap(
  userId: string,
  startTime: Date,
  endTime: Date,
  excludeEventId?: string
): Promise<OverlapResult> {
  const query: any = {
    userId,
    // Two events overlap if one starts before the other ends
    // and ends after the other starts
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
    allDay: false, // Don't check all-day events for time overlaps
  };

  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }

  const overlapping = await Event.find(query)
    .select('title startTime endTime')
    .lean();

  return {
    hasOverlap: overlapping.length > 0,
    overlappingEvents: overlapping.map((e) => ({
      _id: (e._id as any).toString(),
      title: e.title,
      startTime: e.startTime,
      endTime: e.endTime,
    })),
  };
}
