import Event from '../models/Event';

export const checkEventConflict = async (
  userId: string,
  startTime: Date,
  endTime: Date,
  excludeEventId?: string
): Promise<boolean> => {
  const query: any = {
    userId,
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  };
  
  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }
  
  const conflictingEvent = await Event.findOne(query);
  return !!conflictingEvent;
};

export const getConflictingEvents = async (
  userId: string,
  startTime: Date,
  endTime: Date
) => {
  return await Event.find({
    userId,
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  });
};