import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/notificationModel.js';
import {
  getUnreadNotificationsCount,
  getRecentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../utils/notifications.js';

const router = express.Router();

/**
 * @route GET /api/notifications
 * @desc Get recent notifications for the authenticated user
 * @access Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId || req.docId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ userId });
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          unreadCount,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

/**
 * @route GET /api/notifications/unread/count
 * @desc Get count of unread notifications
 * @access Private
 */
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const userId = req.userId || req.docId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const count = await getUnreadNotificationsCount(userId);
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count', error: error.message });
  }
});

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const userId = req.userId || req.docId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Ensure user can only mark their own notifications as read
    if (notification.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this notification' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification', error: error.message });
  }
});

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read for the authenticated user
 * @access Private
 */
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.userId || req.docId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const result = await markAllNotificationsAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { count: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications', error: error.message });
  }
});

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.userId || req.docId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Ensure user can only delete their own notifications
    if (notification.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this notification' });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
  }
});

/**
 * @route DELETE /api/notifications
 * @desc Delete all notifications for the authenticated user
 * @access Private
 */
router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId || req.docId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully',
      data: { count: result.deletedCount }
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notifications', error: error.message });
  }
});

export default router; 