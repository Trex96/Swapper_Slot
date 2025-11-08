import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISwapRequest extends Document {
  requesterId: Types.ObjectId;
  requesterEventId: Types.ObjectId;
  targetUserId: Types.ObjectId;
  targetEventId: Types.ObjectId;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const SwapRequestSchema: Schema = new Schema({
  requesterId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterEventId: {
    type: mongoose.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  targetUserId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetEventId: {
    type: mongoose.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

SwapRequestSchema.pre<ISwapRequest>('save', function(next) {
  if (this.requesterId.equals(this.targetUserId)) {
    return next(new Error('Cannot swap with yourself'));
  }
  next();
});

SwapRequestSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

export default mongoose.model<ISwapRequest>('SwapRequest', SwapRequestSchema);