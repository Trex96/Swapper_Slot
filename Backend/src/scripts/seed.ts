import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import Event, { IEvent } from '../models/Event';
import SwapRequest from '../models/SwapRequest';
import { env } from '../config/env';

const testUsers = [
  
  {
    name: 'Sarah Williams',
    email: 'sarah@test.com',
    password: 'Test123!'
  },
  {
    name: 'David Brown',
    email: 'david@test.com',
    password: 'Test123!'
  }
];

const eventTemplates = [
  { title: 'Team Meeting', description: 'Weekly sync with team' },
  { title: 'Client Call', description: 'Discuss project requirements' }
 
];

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const clearDatabase = async (): Promise<void> => {
  console.log('Clearing database...');
  await User.deleteMany({});
  await Event.deleteMany({});
  await SwapRequest.deleteMany({});
  console.log('Database cleared successfully');
};

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const generateRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const generateEventsForUser = async (userId: mongoose.Types.ObjectId, count: number): Promise<void> => {
  const statuses: ('BUSY' | 'SWAPPABLE' | 'SWAPPED')[] = ['BUSY', 'SWAPPABLE', 'SWAPPED'];
  
  for (let i = 0; i < count; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    
    const startTime = generateRandomDate(startDate, endDate);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    
    const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    await Event.create({
      userId,
      title: template.title,
      description: template.description,
      startTime,
      endTime,
      status
    });
  }
};

const createSwapRequests = async (users: IUser[], events: IEvent[]): Promise<void> => {
  const statuses: ('PENDING' | 'ACCEPTED' | 'REJECTED')[] = ['PENDING', 'ACCEPTED', 'REJECTED'];
  
  const requestCount = Math.floor(Math.random() * 6) + 5;
  
  for (let i = 0; i < requestCount; i++) {
    const requesterIndex = Math.floor(Math.random() * users.length);
    let targetIndex = Math.floor(Math.random() * users.length);
    
    while (targetIndex === requesterIndex) {
      targetIndex = Math.floor(Math.random() * users.length);
    }
    
    const requester = users[requesterIndex];
    const target = users[targetIndex];
    
    const requesterEvents = events.filter(event => event.userId.toString() === (requester._id as mongoose.Types.ObjectId).toString());
    const targetEvents = events.filter(event => event.userId.toString() === (target._id as mongoose.Types.ObjectId).toString());
    
    if (requesterEvents.length === 0 || targetEvents.length === 0) {
      continue;
    }
    
    const requesterEvent = requesterEvents[Math.floor(Math.random() * requesterEvents.length)];
    const targetEvent = targetEvents[Math.floor(Math.random() * targetEvents.length)];
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    await SwapRequest.create({
      requesterId: requester._id as mongoose.Types.ObjectId,
      requesterEventId: requesterEvent._id as mongoose.Types.ObjectId,
      targetUserId: target._id as mongoose.Types.ObjectId,
      targetEventId: targetEvent._id as mongoose.Types.ObjectId,
      status
    });
  }
};

const seedDatabase = async (): Promise<void> => {
  try {
    await connectDB();
    
    if (process.argv[2] === 'clear') {
      await clearDatabase();
      process.exit(0);
    }
    
    console.log('Seeding database...');
    
    await clearDatabase();
    
    const users: IUser[] = [];
    
    for (const userData of testUsers) {
      try {
        // Try to create user with explicit userName field to avoid index issues
        const user = await User.create({
          name: userData.name,
          email: userData.email,
          password: userData.password
        });
        users.push(user);
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        // Continue with other users
      }
    }
    
    console.log(`Created ${users.length} users`);
    
    let totalEvents = 0;
    
    for (const user of users) {
      const eventCount = Math.floor(Math.random() * 3) + 4;
      await generateEventsForUser(user._id as mongoose.Types.ObjectId, eventCount);
      totalEvents += eventCount;
    }
    
    console.log(`Created ${totalEvents} events`);
    
    const events = await Event.find({});
    
    console.log('Creating swap requests...');
    await createSwapRequests(users, events);
    
    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();