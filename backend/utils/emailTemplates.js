/**
 * Email template utility functions for MediMeet
 * Contains reusable email templates for various application features
 */

/**
 * Generates a verification email template
 * @param {string} code - The verification code to include in the email
 * @returns {string} HTML email template
 */
export const getVerificationEmailTemplate = (code) => {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4f46e5;">Welcome to MediMeet!</h2>
      </div>
      <p style="color: #666; font-size: 16px; line-height: 1.5;">
        Thank you for registering. To complete your registration, please use the verification code below:
      </p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
        <h1 style="color: #4f46e5; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
      </div>
      <p style="color: #666; font-size: 14px; line-height: 1.5;">
        This code will expire in 10 minutes. If you didn't request this verification, you can safely ignore this email.
      </p>
      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} MediMeet. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Generates a password reset email template
 * @param {string} code - The reset code to include in the email
 * @returns {string} HTML email template
 */
export const getPasswordResetTemplate = (code) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4f46e5;">MediMeet Password Reset</h2>
      </div>
      <p>Hello,</p>
      <p>We received a request to reset your password for your MediMeet account. Please use the following code to reset your password:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
        <h2 style="margin: 0; color: #4f46e5; letter-spacing: 5px;">${code}</h2>
      </div>
      <p>This code will expire in 30 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>Thank you,<br>The MediMeet Team</p>
      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} MediMeet. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Generates an appointment confirmation email template
 * @param {Object} appointment - The appointment details
 * @returns {string} HTML email template
 */
export const getAppointmentConfirmationTemplate = (appointment) => {
  const { docData, slotDate, slotTime } = appointment;
  const formattedDate = new Date(slotDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4f46e5;">MediMeet Appointment Confirmation</h2>
      </div>
      <p>Hello,</p>
      <p>Your appointment has been successfully booked with the following details:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Doctor:</strong> Dr. ${docData.name}</p>
        <p><strong>Specialization:</strong> ${docData.specialization}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${slotTime}</p>
        <p><strong>Fees:</strong> ${docData.fees}</p>
      </div>
      
      <p>Please make sure to arrive 10 minutes before your scheduled appointment time.</p>
      <p>Thank you for choosing MediMeet for your healthcare needs.</p>
      <p>Best regards,<br>The MediMeet Team</p>
      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} MediMeet. All rights reserved.</p>
      </div>
    </div>
  `;
}; 