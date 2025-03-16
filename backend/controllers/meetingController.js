import { twilioClient, apiKeySid, apiKeySecret } from '../config/twilioConfig.js';
import appointmentModel from '../models/appointmentModel.js';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Generate an Access Token for a video meeting
const generateToken = (identity, roomName) => {
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;
    
    // Create an access token
    const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        apiKeySid,
        apiKeySecret,
        { identity: identity }
    );
    
    // Create a video grant for this specific room
    const videoGrant = new VideoGrant({
        room: roomName
    });
    
    // Add the video grant to the token
    token.addGrant(videoGrant);
    
    // Serialize the token to a JWT string
    return token.toJwt();
};

// Create a meeting room for an appointment
const createMeeting = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        
        if (!appointmentId) {
            return res.status(400).json({ success: false, message: 'Appointment ID is required' });
        }
        
        // Find the appointment
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        if (appointment.cancelled) {
            return res.status(400).json({ success: false, message: 'Appointment is cancelled' });
        }
        
        if (!appointment.payment) {
            return res.status(400).json({ success: false, message: 'Payment not completed for this appointment' });
        }
        
        if (appointment.isCompleted) {
            return res.status(400).json({ success: false, message: 'Appointment is already completed' });
        }
        
        // If meeting already exists, return the existing room name
        if (appointment.meetingRoomName) {
            return res.json({ 
                success: true, 
                message: 'Meeting already exists',
                roomName: appointment.meetingRoomName
            });
        }
        
        // Create a unique room name
        const roomName = `medimeet-${appointmentId}-${Date.now()}`;
        
        // Update appointment with room name
        appointment.meetingRoomName = roomName;
        await appointment.save();
        
        res.json({ 
            success: true, 
            message: 'Meeting created successfully',
            roomName
        });
        
    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({ success: false, message: 'Server error creating meeting' });
    }
};

// Generate token for a participant (doctor or patient)
const joinMeeting = async (req, res) => {
    try {
        const { appointmentId, identity } = req.body;
        
        if (!appointmentId || !identity) {
            return res.status(400).json({ success: false, message: 'Appointment ID and identity are required' });
        }
        
        // Find the appointment
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        if (appointment.cancelled) {
            return res.status(400).json({ success: false, message: 'Appointment is cancelled' });
        }
        
        if (!appointment.payment) {
            return res.status(400).json({ success: false, message: 'Payment not completed for this appointment' });
        }
        
        if (appointment.isCompleted) {
            return res.status(400).json({ success: false, message: 'Appointment is already completed' });
        }
        
        // If meeting room doesn't exist yet, create it
        if (!appointment.meetingRoomName) {
            // Create a unique room name
            const roomName = `medimeet-${appointmentId}-${Date.now()}`;
            appointment.meetingRoomName = roomName;
            await appointment.save();
        }
        
        // Generate token for the participant
        const token = generateToken(identity, appointment.meetingRoomName);
        
        // If this is the doctor joining, mark the meeting as started
        if (identity.includes('doctor')) {
            appointment.meetingStarted = true;
            appointment.meetingJoinedByDoctor = true;
            if (!appointment.meetingStartTime) {
                appointment.meetingStartTime = new Date();
            }
            await appointment.save();
        }
        
        // If this is the patient joining, mark that they joined
        if (identity.includes('patient')) {
            appointment.meetingJoinedByUser = true;
            await appointment.save();
        }
        
        res.json({ 
            success: true, 
            token,
            roomName: appointment.meetingRoomName
        });
        
    } catch (error) {
        console.error('Error joining meeting:', error);
        res.status(500).json({ success: false, message: 'Server error joining meeting' });
    }
};

// End a meeting
const endMeeting = async (req, res) => {
    try {
        const { appointmentId, notes } = req.body;
        
        if (!appointmentId) {
            return res.status(400).json({ success: false, message: 'Appointment ID is required' });
        }
        
        // Find the appointment
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        if (!appointment.meetingStarted) {
            return res.status(400).json({ success: false, message: 'Meeting has not started yet' });
        }
        
        if (appointment.meetingEnded) {
            return res.status(400).json({ success: false, message: 'Meeting has already ended' });
        }
        
        // Mark meeting as ended
        appointment.meetingEnded = true;
        appointment.meetingEndTime = new Date();
        
        // Save meeting notes if provided
        if (notes) {
            appointment.meetingNotes = notes;
        }
        
        // Calculate duration in minutes
        if (appointment.meetingStartTime) {
            const durationMs = appointment.meetingEndTime - appointment.meetingStartTime;
            appointment.meetingDuration = Math.round(durationMs / (1000 * 60));
        }
        
        // Mark appointment as completed
        appointment.isCompleted = true;
        
        await appointment.save();
        
        res.json({ 
            success: true, 
            message: 'Meeting ended successfully',
            duration: appointment.meetingDuration
        });
        
    } catch (error) {
        console.error('Error ending meeting:', error);
        res.status(500).json({ success: false, message: 'Server error ending meeting' });
    }
};

// Get meeting status
const getMeetingStatus = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        
        if (!appointmentId) {
            return res.status(400).json({ success: false, message: 'Appointment ID is required' });
        }
        
        // Find the appointment
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        res.json({ 
            success: true, 
            meetingStatus: {
                roomName: appointment.meetingRoomName,
                started: appointment.meetingStarted,
                ended: appointment.meetingEnded,
                startTime: appointment.meetingStartTime,
                endTime: appointment.meetingEndTime,
                duration: appointment.meetingDuration,
                isCompleted: appointment.isCompleted,
                joinedByDoctor: appointment.meetingJoinedByDoctor,
                joinedByUser: appointment.meetingJoinedByUser,
                notes: appointment.meetingNotes
            }
        });
        
    } catch (error) {
        console.error('Error getting meeting status:', error);
        res.status(500).json({ success: false, message: 'Server error getting meeting status' });
    }
};

// Add meeting notes
const addMeetingNotes = async (req, res) => {
    try {
        const { appointmentId, notes } = req.body;
        
        if (!appointmentId || !notes) {
            return res.status(400).json({ success: false, message: 'Appointment ID and notes are required' });
        }
        
        // Find the appointment
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        // Save meeting notes
        appointment.meetingNotes = notes;
        await appointment.save();
        
        res.json({ 
            success: true, 
            message: 'Meeting notes added successfully'
        });
        
    } catch (error) {
        console.error('Error adding meeting notes:', error);
        res.status(500).json({ success: false, message: 'Server error adding meeting notes' });
    }
};

export { createMeeting, joinMeeting, endMeeting, getMeetingStatus, addMeetingNotes }; 