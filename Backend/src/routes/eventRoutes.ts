import express from 'express';
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  markEventAsSwappable
} from '../controllers/eventController';
import { protect } from '../middleware/auth';
import {
  validateEventCreation,
  validateIdParam
} from '../middleware/validator';

const router = express.Router();

router.route('/')
  .post(protect, validateEventCreation, createEvent)
  .get(protect, getEvents);

router.route('/:id')
  .get(protect, validateIdParam, getEvent)
  .put(protect, validateIdParam, updateEvent)
  .delete(protect, validateIdParam, deleteEvent);

router.patch('/:id/mark-swappable', protect, validateIdParam, markEventAsSwappable);

export default router;