import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['appointment', 'prescription', 'message', 'payment', 'system'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    action: {
      type: String,
      default: null
    },
    actionUrl: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Default expiration: 30 days after creation
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for efficient queries
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Methods
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return this.save();
};

// Statics
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, read: false });
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany({ userId, read: false }, { read: true });
};

notificationSchema.statics.getRecentNotifications = async function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 