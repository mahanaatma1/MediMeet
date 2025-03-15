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
        
        // Find the appointment
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }
        
        if (appointment.cancelled) {
            return res.json({ success: false, message: 'Appointment is cancelled' });
        }
        
        if (!appointment.payment) {
            return res.json({ success: false, message: 'Payment not completed for this appointment' });
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
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Generate token for a participant (doctor or patient)
const joinMeeting = async (req, res) => {
    try {
        const { appointmentId, identity } = req.body;
        
        // Find the appointment
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }
        
        if (appointment.cancelled) {
            return res.json({ success: false, message: 'Appointment is cancelled' });
        }
        
        if (!appointment.payment) {
            return res.json({ success: false, message: 'Payment not completed for this appointment' });
        }
        
        if (!appointment.meetingRoomName) {
            return res.json({ success: false, message: 'Meeting not created yet' });
        }
        
        // Generate token for the participant
        const token = generateToken(identity, appointment.meetingRoomName);
        
        // If this is the doctor joining, mark the meeting as started
        if (identity.includes('doctor')) {
            appointment.meetingStarted = true;
            appointment.meetingStartTime = new Date();
            await appointment.save();
        }
        
        res.json({ 
            success: true, 
            token,
            roomName: appointment.meetingRoomName
        });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// End a meeting
const endMeeting = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        
        // Find the appointment
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }
        
        if (!appointment.meetingStarted) {
            return res.json({ success: false, message: 'Meeting has not started yet' });
        }
        
        // Mark meeting as ended
        appointment.meetingEnded = true;
        appointment.meetingEndTime = new Date();
        
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
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get meeting status
const getMeetingStatus = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        
        // Find the appointment
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }
        
        res.json({ 
            success: true, 
            meetingStatus: {
                roomName: appointment.meetingRoomName,
                started: appointment.meetingStarted,
                ended: appointment.meetingEnded,
                startTime: appointment.meetingStartTime,
                endTime: appointment.meetingEndTime,
                duration: appointment.meetingDuration
            }
        });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { createMeeting, joinMeeting, endMeeting, getMeetingStatus }; 