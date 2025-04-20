/**
 * Socket.io based notification system for MediMeet
 * Handles various types of notifications throughout the application
 */
import Notification from '../models/notificationModel.js';

/**
 * Send a notification to a specific user and save it to database
 * 
 * @param {Object} io - Socket.io instance 
 * @param {String} userId - User ID to send notification to
 * @param {Object} notification - Notification data object
 * @param {String} notification.type - Type of notification (appointment, message, system, etc.)
 * @param {String} notification.title - Title of the notification
 * @param {String} notification.message - Message content
 * @param {Object} notification.data - Additional data related to the notification
 * @param {String} notification.action - Optional action identifier
 * @param {String} notification.actionUrl - Optional URL for the action
 * @param {Date} notification.expiresAt - Optional expiration date
 * @returns {Promise<Object>} The saved notification document
 */
export const sendUserNotification = async (io, userId, notification) => {
  // Generate notification object with timestamp and ID
  const notificationObj = {
    ...notification,
    timestamp: new Date(),
    read: false,
    id: generateNotificationId()
  };

  // Send via Socket.io to online users
  io.to(userId).emit('notification', notificationObj);
  
  // Save to database for persistence
  try {
    const dbNotification = new Notification({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      action: notification.action || null,
      actionUrl: notification.actionUrl || null,
      expiresAt: notification.expiresAt || undefined
    });
    
    await dbNotification.save();
    return dbNotification;
  } catch (error) {
    console.error('Error saving notification to database:', error);
    // Still return the notification object even if DB save fails
    return notificationObj;
  }
};

/**
 * Send a notification to multiple users
 * 
 * @param {Object} io - Socket.io instance 
 * @param {Array} userIds - Array of user IDs to send notification to
 * @param {Object} notification - Notification data object
 * @returns {Promise<Array>} Array of saved notification documents
 */
export const sendMultiUserNotification = async (io, userIds, notification) => {
  const promises = userIds.map(userId => sendUserNotification(io, userId, notification));
  return Promise.all(promises);
};

/**
 * Send a system-wide notification to all connected users
 * 
 * @param {Object} io - Socket.io instance
 * @param {Object} notification - Notification data object
 * @param {Array} excludeUsers - Optional array of user IDs to exclude
 * @returns {Promise<void>}
 */
export const sendSystemNotification = async (io, notification, excludeUsers = []) => {
  // For system notifications to all connected users
  const notificationObj = {
    ...notification,
    type: 'system',
    timestamp: new Date(),
    read: false,
    id: generateNotificationId()
  };
  
  // Broadcast to all connected users
  io.emit('notification', notificationObj);
  
  try {
    // If we want to save system notifications for specific users, we'd need to get all users
    // This could be implemented based on your requirements
  } catch (error) {
    console.error('Error with system notification:', error);
  }
};

/**
 * Send an appointment notification
 * 
 * @param {Object} io - Socket.io instance
 * @param {String} userId - User ID to send notification to
 * @param {Object} appointmentData - Appointment related data
 * @returns {Promise<Object>} The saved notification document
 */
export const sendAppointmentNotification = async (io, userId, appointmentData) => {
  return sendUserNotification(io, userId, {
    type: 'appointment',
    title: 'Appointment Update',
    message: appointmentData.message || 'You have an update regarding your appointment',
    data: appointmentData,
    actionUrl: `/appointments/${appointmentData.appointmentId}`
  });
};

/**
 * Send a prescription notification
 * 
 * @param {Object} io - Socket.io instance
 * @param {String} userId - User ID to send notification to
 * @param {Object} prescriptionData - Prescription related data
 * @returns {Promise<Object>} The saved notification document
 */
export const sendPrescriptionNotification = async (io, userId, prescriptionData) => {
  return sendUserNotification(io, userId, {
    type: 'prescription',
    title: prescriptionData.action === 'updated' ? 'Prescription Updated' : 'New Prescription',
    message: prescriptionData.message || 'A new prescription has been issued for you',
    data: prescriptionData,
    actionUrl: `/prescriptions/${prescriptionData.prescriptionId}`
  });
};

/**
 * Generate a unique notification ID
 * 
 * @returns {String} Unique notification ID
 */
const generateNotificationId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Get unread notifications count for a user
 * 
 * @param {String} userId - User ID
 * @returns {Promise<Number>} Count of unread notifications
 */
export const getUnreadNotificationsCount = async (userId) => {
  return Notification.getUnreadCount(userId);
};

/**
 * Get recent notifications for a user
 * 
 * @param {String} userId - User ID
 * @param {Number} limit - Maximum number of notifications to return
 * @returns {Promise<Array>} Array of notifications
 */
export const getRecentNotifications = async (userId, limit = 10) => {
  return Notification.getRecentNotifications(userId, limit);
};

/**
 * Mark a notification as read
 * 
 * @param {String} notificationId - Notification ID
 * @returns {Promise<Object>} The updated notification
 */
export const markNotificationAsRead = async (notificationId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }
  return notification.markAsRead();
};

/**
 * Mark all notifications as read for a user
 * 
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Result of the update operation
 */
export const markAllNotificationsAsRead = async (userId) => {
  return Notification.markAllAsRead(userId);
};

export default {
  sendUserNotification,
  sendMultiUserNotification,
  sendSystemNotification,
  sendAppointmentNotification,
  sendPrescriptionNotification,
  getUnreadNotificationsCount,
  getRecentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
}; 