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
 * Generates an appointment booking email template (before payment)
 * @param {Object} appointment - The appointment details
 * @returns {string} HTML email template
 */
export const getAppointmentBookingTemplate = (appointment) => {
  const { docData, slotDate, slotTime, amount, _id } = appointment;
  
  // Format the doctor name to avoid duplicate "Dr." prefix
  const doctorName = docData.name.startsWith("Dr.") ? docData.name : `Dr. ${docData.name}`;
  
  // Parse and format date safely
  let formattedDate = "Scheduled Date";
  try {
    // Handle different date formats
    let appointmentDate;
    if (typeof slotDate === 'string') {
      // Handle "day_month_year" format (e.g. "6_3_2025")
      const underscoreMatch = slotDate.match(/^(\d+)_(\d+)_(\d+)$/);
      if (underscoreMatch) {
        const [_, day, month, year] = underscoreMatch;
        appointmentDate = new Date(year, month - 1, day);
      } else if (slotDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // ISO format YYYY-MM-DD
        appointmentDate = new Date(slotDate);
      } else {
        // Try parsing with Date.parse
        const timestamp = Date.parse(slotDate);
        if (!isNaN(timestamp)) {
          appointmentDate = new Date(timestamp);
        } else {
          console.error("Invalid date format in booking email:", slotDate);
          appointmentDate = null;
        }
      }
    } else if (slotDate instanceof Date) {
      appointmentDate = slotDate;
    } else {
      console.error("Unknown date format in booking email:", slotDate);
      appointmentDate = null;
    }

    // Format the date if we have a valid one
    if (appointmentDate && !isNaN(appointmentDate.getTime())) {
      formattedDate = appointmentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  } catch (error) {
    console.error("Error formatting date for booking email:", error);
    // Keep the default value
  }
  
  // Format time
  let formattedTime = slotTime || "Scheduled Time";
  if (slotTime && !slotTime.match(/am|pm/i)) {
    // Try to convert 24-hour time to 12-hour format
    try {
      const [hours, minutes] = slotTime.split(':').map(num => parseInt(num, 10));
      if (!isNaN(hours) && !isNaN(minutes)) {
        const date = new Date();
        date.setHours(hours, minutes, 0);
        formattedTime = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (error) {
      console.error("Error formatting time:", error);
      // Keep the default value
    }
  }
  
  // Use the appropriate frontend URL based on environment
  const paymentUrl = `${process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : process.env.FRONTEND_URL_LOCAL || 'http://localhost:5173'}/my-appointments`;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4f46e5;">MediMeet Appointment Booking</h2>
      </div>
      <p>Hello,</p>
      <p>You have successfully booked an appointment with the following details:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Doctor:</strong> ${doctorName}</p>
        <p><strong>Speciality:</strong> ${docData.speciality}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Fees:</strong> ₹${amount}</p>
      </div>
      
      <div style="background-color: #fff4e5; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; border-radius: 3px;">
        <p style="margin: 0; color: #e65100;"><strong>Important:</strong> Your appointment booking is not confirmed until payment is made.</p>
      </div>
      
      <p>To confirm your appointment, please complete the payment by clicking the button below:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${paymentUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Complete Payment
        </a>
      </div>
      
      <p>If you don't complete the payment, your appointment slot may be released for other patients.</p>
      <p>Thank you for choosing MediMeet for your healthcare needs.</p>
      <p>Best regards,<br>The MediMeet Team</p>
      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px;">
        <p>© ${new Date().getFullYear()} MediMeet. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Generates a payment confirmation email template with calendar integration
 * @param {Object} appointment - The appointment details
 * @returns {string} HTML email template
 */
export const getPaymentConfirmationTemplate = (appointment) => {
  const { docData, slotDate, slotTime, _id } = appointment;
  
  // Format the doctor name to avoid duplicate "Dr." prefix
  const doctorName = docData.name.startsWith("Dr.") ? docData.name : `Dr. ${docData.name}`;
  
  // Parse date and time for calendar
  let appointmentDate;
  try {
    // Handle different date formats
    if (typeof slotDate === 'string') {
      // Handle "day_month_year" format (e.g. "6_3_2025")
      const underscoreMatch = slotDate.match(/^(\d+)_(\d+)_(\d+)$/);
      if (underscoreMatch) {
        const [_, day, month, year] = underscoreMatch;
        appointmentDate = new Date(year, month - 1, day);
      } else if (slotDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // ISO format YYYY-MM-DD
        appointmentDate = new Date(slotDate);
      } else {
        // Try parsing with Date.parse
        const timestamp = Date.parse(slotDate);
        if (!isNaN(timestamp)) {
          appointmentDate = new Date(timestamp);
        } else {
          // Fallback to current date
          console.error("Invalid date format:", slotDate);
          appointmentDate = new Date();
        }
      }
    } else if (slotDate instanceof Date) {
      appointmentDate = slotDate;
    } else {
      // Fallback to current date
      console.error("Unknown date format:", slotDate);
      appointmentDate = new Date();
    }

    // Ensure we have a valid date
    if (isNaN(appointmentDate.getTime())) {
      console.error("Invalid date after parsing:", appointmentDate);
      appointmentDate = new Date(); // Use current date as fallback
    }
    
    // Parse time (handle both 12-hour and 24-hour formats)
    let hours = 0;
    let minutes = 0;
    
    if (slotTime) {
      // Handle 12-hour format (e.g., "11:30 am")
      const twelveHourMatch = slotTime.match(/(\d+):(\d+)\s*([ap]m)?/i);
      if (twelveHourMatch) {
        hours = parseInt(twelveHourMatch[1], 10);
        minutes = parseInt(twelveHourMatch[2], 10);
        const meridiem = twelveHourMatch[3]?.toLowerCase();
        
        // Convert to 24-hour format if PM
        if (meridiem === 'pm' && hours < 12) {
          hours += 12;
        } else if (meridiem === 'am' && hours === 12) {
          hours = 0;
        }
      } else {
        // Handle 24-hour format (e.g., "14:30")
        const twentyFourHourMatch = slotTime.match(/(\d+):(\d+)/);
        if (twentyFourHourMatch) {
          hours = parseInt(twentyFourHourMatch[1], 10);
          minutes = parseInt(twentyFourHourMatch[2], 10);
        }
      }
    }
    
    // Set appointment start time
    appointmentDate.setHours(hours, minutes, 0, 0);
  } catch (error) {
    console.error("Error parsing date/time:", error);
    appointmentDate = new Date(); // Use current date as fallback
  }
  
  // Set appointment end time (assume 30 minutes duration)
  const endDate = new Date(appointmentDate.getTime());
  endDate.setMinutes(endDate.getMinutes() + 30);
  
  // Format dates for calendar links
  const startIso = appointmentDate.toISOString().replace(/-|:|\.\d+/g, '');
  const endIso = endDate.toISOString().replace(/-|:|\.\d+/g, '');
  
  // Format for display
  const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Use the appropriate frontend URL based on environment
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : process.env.FRONTEND_URL_LOCAL || 'http://localhost:5173';
  
  // Create calendar links
  const meetingUrl = `${baseUrl}/meeting/${_id}`;
  const eventDetails = `Appointment with ${doctorName}`;
  const eventLocation = "Online via MediMeet";
  
  // Google Calendar link
  const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(`Join using this link: ${meetingUrl}`)}&location=${encodeURIComponent(eventLocation)}`;
  
  // Outlook Web link
  const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventDetails)}&startdt=${appointmentDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent(`Join using this link: ${meetingUrl}`)}&location=${encodeURIComponent(eventLocation)}`;
  
  // iCal (Apple Calendar) data
  const iCalData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startIso}Z
DTEND:${endIso}Z
SUMMARY:${eventDetails}
DESCRIPTION:Join using this link: ${meetingUrl}
LOCATION:${eventLocation}
END:VEVENT
END:VCALENDAR`;
  
  const iCalLink = `data:text/calendar;charset=utf8,${encodeURIComponent(iCalData)}`;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4f46e5;">MediMeet Appointment Confirmed</h2>
      </div>
      <p>Hello,</p>
      <p>Your payment was successful! Your appointment has been confirmed with the following details:</p>
      
      <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4f46e5;">
        <p><strong>Doctor:</strong> ${doctorName}</p>
        <p><strong>Speciality:</strong> ${docData.speciality}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
      </div>
      
      <p>When it's time for your appointment, you can join the video consultation by clicking the button below:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${meetingUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Join Meeting
        </a>
      </div>
      
      <p style="margin-bottom: 5px;"><strong>Add this appointment to your calendar:</strong></p>
      
      <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin: 20px 0;">
        <a href="${googleCalendarLink}" target="_blank" style="background-color: #DB4437; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-size: 14px; margin: 5px;">
          Google Calendar
        </a>
        <a href="${outlookLink}" target="_blank" style="background-color: #0078D4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-size: 14px; margin: 5px;">
          Outlook
        </a>
        <a href="${iCalLink}" download="medimeet_appointment.ics" style="background-color: #5D5D5D; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-size: 14px; margin: 5px;">
          Apple Calendar
        </a>
      </div>
      
      <div style="background-color: #e9f7ef; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
        <p style="margin: 0;"><strong>Reminder:</strong> Please join the meeting 5 minutes before your scheduled time.</p>
      </div>
      
      <p>Thank you for choosing MediMeet for your healthcare needs.</p>
      <p>Best regards,<br>The MediMeet Team</p>
      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px;">
        <p>© ${new Date().getFullYear()} MediMeet. All rights reserved.</p>
      </div>
    </div>
  `;
}; 