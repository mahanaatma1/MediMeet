import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

// Create Twilio client
const twilioClient = twilio(accountSid, authToken);

export { twilioClient, apiKeySid, apiKeySecret }; 