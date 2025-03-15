import express from 'express';
import { createMeeting, joinMeeting, endMeeting, getMeetingStatus } from '../controllers/meetingController.js';
import authUser from '../middleware/authUser.js';
import authDoctor from '../middleware/authDoctor.js';

const meetingRouter = express.Router();

// Routes for both user and doctor (no auth middleware as we'll verify in the controller)
meetingRouter.post('/join', joinMeeting);
meetingRouter.post('/status', getMeetingStatus);

// Routes for doctor only
meetingRouter.post('/create', authDoctor, createMeeting);
meetingRouter.post('/end', authDoctor, endMeeting);

export default meetingRouter; 