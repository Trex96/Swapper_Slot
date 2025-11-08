import mongoose, { Schema, Document } from 'mongoose';

interface ISwapHistory extends Document {
  user1Id: mongoose.Types.ObjectId;
  user1EventId: mongoose.Types.ObjectId;
  user1EventSnapshot: any;
  user2Id: mongoose.Types.ObjectId;
  user2EventId: mongoose.Types.ObjectId;
  user2EventSnapshot: any;
  swapRequestId: mongoose.Types.ObjectId;
  completedAt: Date;
}

const swapHistorySchema = new Schema({
  user1Id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  user1EventId: { type: Schema.Types.ObjectId, required: true },
  user1EventSnapshot: { type: Object, required: true },
  user2Id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  user2EventId: { type: Schema.Types.ObjectId, required: true },
  user2EventSnapshot: { type: Object, required: true },
  swapRequestId: { type: Schema.Types.ObjectId, ref: 'SwapRequest', required: true },
  completedAt: { type: Date, default: Date.now }
});

swapHistorySchema.set('toJSON', {
  transform: function(doc: any, ret: any, options: any) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

export default mongoose.model<ISwapHistory>('SwapHistory', swapHistorySchema);