import nodemailer from 'nodemailer'
import { getVerificationEmailTemplate } from './emailTemplates.js'

/**
 * Sends an email using nodemailer
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 * @returns {boolean} - Success status of the email sending operation
 */
const sendEmail = async (email, subject, html) => {
    try {
        // Create a transporter using SMTP configuration from environment variables
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            connectionTimeout: 30000, // 30 seconds timeout
            greetingTimeout: 30000,
            socketTimeout: 60000, // 1 minute
            debug: false, // Disable debug mode
            logger: false // Disable logger
        });

        // Send the email
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: subject,
            html: html,
        });
        
        return true;
    } catch (error) {
        console.error('Email error:', error.message);
        return false;
    }
}

/**
 * Sends a verification email
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject (optional)
 * @param {string} content - Email content (optional)
 * @returns {boolean} - Success status of the email sending operation
 */
const sendVerificationEmail = async (email, subject, content) => {
    // If only two parameters are provided, assume it's a verification code
    if (!content) {
        const code = subject;
        subject = 'Verify your email address';
        content = getVerificationEmailTemplate(code);
    }

    return await sendEmail(email, subject, content);
}

export { sendEmail, sendVerificationEmail } 