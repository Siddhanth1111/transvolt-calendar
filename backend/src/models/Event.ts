import mongoose, { Document, Schema } from 'mongoose';

export interface IRecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  count?: number;
}

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  color: string;
  location?: string;
  // Recurrence fields
  isRecurring: boolean;
  recurrenceRule?: IRecurrenceRule;
  recurringEventId?: mongoose.Types.ObjectId; // Parent recurring event
  isException: boolean; // Is this an exception to a recurring event?
  originalDate?: Date; // Original date this exception replaces
  excludedDates: Date[]; // Dates excluded from recurrence (for "delete this instance")
  createdAt: Date;
  updatedAt: Date;
}

const recurrenceRuleSchema = new Schema<IRecurrenceRule>(
  {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    interval: {
      type: Number,
      default: 1,
      min: 1,
    },
    endDate: {
      type: Date,
    },
    daysOfWeek: {
      type: [Number],
    },
    count: {
      type: Number,
    },
  },
  { _id: false }
);

const eventSchema = new Schema<IEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must not exceed 2000 characters'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: '#4285F4', // Google Blue
    },
    location: {
      type: String,
      trim: true,
      maxlength: [500, 'Location must not exceed 500 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceRule: {
      type: recurrenceRuleSchema,
    },
    recurringEventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
    isException: {
      type: Boolean,
      default: false,
    },
    originalDate: {
      type: Date,
    },
    excludedDates: {
      type: [Date],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Validate that endTime is after startTime
eventSchema.pre('validate', function (next) {
  if (this.endTime <= this.startTime && !this.allDay) {
    this.invalidate('endTime', 'End time must be after start time');
  }
  next();
});

// Compound index for efficient querying
eventSchema.index({ userId: 1, startTime: 1, endTime: 1 });
eventSchema.index({ userId: 1, isRecurring: 1 });

const Event = mongoose.model<IEvent>('Event', eventSchema);
export default Event;
