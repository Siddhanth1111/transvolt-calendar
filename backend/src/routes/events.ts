import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Event from '../models/Event';
import auth, { AuthRequest } from '../middleware/auth';
import { checkOverlap } from '../utils/overlap';
import { expandRecurringEvent } from '../utils/recurrence';

const router = Router();

// All routes require authentication
router.use(auth);

// GET /api/events?start=<ISO>&end=<ISO>
router.get(
  '/',
  [
    query('start').isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('end').isISO8601().withMessage('End date must be a valid ISO 8601 date'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const rangeStart = new Date(req.query.start as string);
      const rangeEnd = new Date(req.query.end as string);

      // Get non-recurring events in range
      const regularEvents = await Event.find({
        userId,
        isRecurring: false,
        isException: false,
        startTime: { $lt: rangeEnd },
        endTime: { $gt: rangeStart },
      }).lean();

      // Get recurring events that could have instances in range
      const recurringEvents = await Event.find({
        userId,
        isRecurring: true,
        isException: false,
        startTime: { $lte: rangeEnd },
        $or: [
          { 'recurrenceRule.endDate': { $gte: rangeStart } },
          { 'recurrenceRule.endDate': { $exists: false } },
          { 'recurrenceRule.endDate': null },
        ],
      }).lean();

      // Get exception instances in range
      const exceptions = await Event.find({
        userId,
        isException: true,
        startTime: { $lt: rangeEnd },
        endTime: { $gt: rangeStart },
      }).lean();

      // Build a map of exception original dates by recurring event id
      const exceptionMap = new Map<string, Set<string>>();
      for (const exc of exceptions) {
        if (exc.recurringEventId) {
          const key = exc.recurringEventId.toString();
          if (!exceptionMap.has(key)) {
            exceptionMap.set(key, new Set());
          }
          if (exc.originalDate) {
            exceptionMap.get(key)!.add(exc.originalDate.toISOString().split('T')[0]);
          }
        }
      }

      // Expand recurring events
      const expandedInstances: any[] = [];
      for (const event of recurringEvents) {
        const excludedDates = [
          ...event.excludedDates,
        ];

        // Also exclude dates that have exception instances
        const excDates = exceptionMap.get(event._id.toString());
        if (excDates) {
          for (const dateStr of excDates) {
            excludedDates.push(new Date(dateStr));
          }
        }

        const instances = expandRecurringEvent(
          event as any,
          rangeStart,
          rangeEnd,
          excludedDates
        );
        expandedInstances.push(...instances);
      }

      // Combine all events
      const allEvents = [
        ...regularEvents.map((e) => ({
          ...e,
          _id: e._id.toString(),
          isInstance: false,
        })),
        ...exceptions.map((e) => ({
          ...e,
          _id: e._id.toString(),
          isInstance: false,
        })),
        ...expandedInstances,
      ];

      res.json(allEvents);
    } catch (error: any) {
      console.error('Get events error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/events
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startTime').isISO8601().withMessage('Start time must be a valid date'),
    body('endTime').isISO8601().withMessage('End time must be a valid date'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const {
        title,
        description,
        startTime,
        endTime,
        allDay,
        color,
        location,
        isRecurring,
        recurrenceRule,
        forceCreate, // Skip overlap warning
      } = req.body;

      // Check for overlapping events (unless all-day or force create)
      if (!allDay && !forceCreate) {
        const overlapResult = await checkOverlap(
          userId,
          new Date(startTime),
          new Date(endTime)
        );

        if (overlapResult.hasOverlap) {
          res.status(409).json({
            message: 'This event overlaps with existing events',
            overlappingEvents: overlapResult.overlappingEvents,
            requiresConfirmation: true,
          });
          return;
        }
      }

      const event = new Event({
        userId,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        allDay: allDay || false,
        color: color || '#4285F4',
        location,
        isRecurring: isRecurring || false,
        recurrenceRule: isRecurring ? recurrenceRule : undefined,
      });

      await event.save();
      res.status(201).json(event);
    } catch (error: any) {
      console.error('Create event error:', error);
      if (error.name === 'ValidationError') {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/events/:id
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('startTime').optional().isISO8601().withMessage('Start time must be a valid date'),
    body('endTime').optional().isISO8601().withMessage('End time must be a valid date'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const eventId = req.params.id;
      const {
        editMode, // 'single' | 'all' | 'following'
        originalDate,
        forceUpdate,
        ...updateData
      } = req.body;

      // If this is a recurring instance being edited as "single"
      if (editMode === 'single' && req.body.recurringEventId) {
        const parentEvent = await Event.findOne({
          _id: req.body.recurringEventId,
          userId,
        });

        if (!parentEvent) {
          res.status(404).json({ message: 'Parent event not found' });
          return;
        }

        // Add the original date to parent's excluded dates
        if (originalDate) {
          parentEvent.excludedDates.push(new Date(originalDate));
          await parentEvent.save();
        }

        // Create an exception event
        const exceptionEvent = new Event({
          userId,
          title: updateData.title || parentEvent.title,
          description: updateData.description ?? parentEvent.description,
          startTime: new Date(updateData.startTime || originalDate),
          endTime: new Date(
            updateData.endTime ||
              new Date(
                new Date(originalDate).getTime() +
                  (parentEvent.endTime.getTime() - parentEvent.startTime.getTime())
              )
          ),
          allDay: updateData.allDay ?? parentEvent.allDay,
          color: updateData.color || parentEvent.color,
          location: updateData.location ?? parentEvent.location,
          isRecurring: false,
          isException: true,
          recurringEventId: parentEvent._id,
          originalDate: new Date(originalDate),
        });

        await exceptionEvent.save();
        res.json(exceptionEvent);
        return;
      }

      // Check for overlaps if time is changing
      if (updateData.startTime && updateData.endTime && !updateData.allDay && !forceUpdate) {
        const overlapResult = await checkOverlap(
          userId,
          new Date(updateData.startTime),
          new Date(updateData.endTime),
          eventId
        );

        if (overlapResult.hasOverlap) {
          res.status(409).json({
            message: 'This event overlaps with existing events',
            overlappingEvents: overlapResult.overlappingEvents,
            requiresConfirmation: true,
          });
          return;
        }
      }

      // Regular update (or "all" for recurring)
      const event = await Event.findOneAndUpdate(
        { _id: eventId, userId },
        {
          ...updateData,
          ...(updateData.startTime && { startTime: new Date(updateData.startTime) }),
          ...(updateData.endTime && { endTime: new Date(updateData.endTime) }),
        },
        { new: true, runValidators: true }
      );

      if (!event) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }

      res.json(event);
    } catch (error: any) {
      console.error('Update event error:', error);
      if (error.name === 'ValidationError') {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/events/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const eventId = req.params.id;
    const { deleteMode, recurringEventId, originalDate } = req.body || {};

    // Delete single instance of recurring event
    if (deleteMode === 'single' && recurringEventId) {
      const parentEvent = await Event.findOne({
        _id: recurringEventId,
        userId,
      });

      if (!parentEvent) {
        res.status(404).json({ message: 'Parent event not found' });
        return;
      }

      // Add date to excluded dates
      if (originalDate) {
        parentEvent.excludedDates.push(new Date(originalDate));
        await parentEvent.save();
      }

      // Also delete any exception event for this date
      await Event.deleteOne({
        recurringEventId,
        originalDate: new Date(originalDate),
        userId,
      });

      res.json({ message: 'Instance deleted' });
      return;
    }

    // Delete all instances of recurring event
    if (deleteMode === 'all' && recurringEventId) {
      // Delete parent and all exceptions
      await Event.deleteMany({
        $or: [
          { _id: recurringEventId, userId },
          { recurringEventId, userId },
        ],
      });

      res.json({ message: 'All instances deleted' });
      return;
    }

    // Regular delete
    const event = await Event.findOneAndDelete({ _id: eventId, userId });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // If deleting a recurring parent, also delete all exceptions
    if (event.isRecurring) {
      await Event.deleteMany({ recurringEventId: event._id, userId });
    }

    res.json({ message: 'Event deleted' });
  } catch (error: any) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
