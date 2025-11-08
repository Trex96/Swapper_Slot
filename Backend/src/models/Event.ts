import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEvent extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: 'BUSY' | 'SWAPPABLE' | 'SWAPPED';
  originalEventId?: Types.ObjectId;
  originalOwnerObject?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  duration: number;
}

const EventSchema: Schema = new Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['BUSY', 'SWAPPABLE', 'SWAPPED'],
    default: 'BUSY'
  },
  originalEventId: {
    type: mongoose.Types.ObjectId,
    ref: 'Event'
  },
  originalOwnerObject: {
    id: String,
    name: String,
    email: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add the virtual for duration calculation
EventSchema.virtual('duration').get(function(this: IEvent) {
  return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 60000);
});

// Add the pre-save hook for validation
EventSchema.pre<IEvent>('save', function(next) {
  if (this.endTime <= this.startTime) {
    return next(new Error('End time must be after start time'));
  }
  
  if (this.isNew && this.startTime < new Date()) {
    return next(new Error('Start time cannot be in the past'));
  }
  
  next();
});

// Configure JSON serialization
EventSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

// Add the static method for overlap checking
EventSchema.statics.checkOverlap = async function(userId: Types.ObjectId, startTime: Date, endTime: Date, excludeId?: Types.ObjectId) {
  const query: any = {
    userId: userId,
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const overlappingEvent = await this.findOne(query);
  return !!overlappingEvent;
};

export default mongoose.model<IEvent>('Event', EventSchema);