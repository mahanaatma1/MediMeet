import reviewModel from '../models/reviewModel.js';
import appointmentModel from '../models/appointmentModel.js';
import mongoose from 'mongoose';

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { doctorId, appointmentId, rating, reviewText } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!doctorId || !appointmentId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, appointment ID, and rating are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if appointment exists and belongs to this user
    const appointment = await appointmentModel.findOne({
      _id: appointmentId,
      userId,
      docId: doctorId,
      isCompleted: true,
      cancelled: false
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Valid completed appointment not found'
      });
    }

    // Check if review already exists for this appointment
    const existingReview = await reviewModel.findOne({ appointmentId });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this appointment'
      });
    }

    // Create the review
    const newReview = new reviewModel({
      userId,
      doctorId,
      appointmentId,
      rating,
      reviewText: reviewText || ''
    });

    await newReview.save();

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get reviews for a specific doctor
export const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID'
      });
    }

    // Get reviews for the doctor
    const reviews = await reviewModel.find({ doctorId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name image')
      .lean();

    // Get doctor's average rating
    const ratingData = await reviewModel.getAverageRating(doctorId);

    return res.status(200).json({
      success: true,
      reviews,
      averageRating: ratingData.averageRating,
      totalReviews: ratingData.totalReviews
    });
  } catch (error) {
    console.error('Error getting doctor reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get reviews by a specific user
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;

    const reviews = await reviewModel.find({ userId })
      .sort({ createdAt: -1 })
      .populate('doctorId', 'fullName specialization image')
      .lean();

    return res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error getting user reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    // Validate rating range if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Find the review and make sure it belongs to this user
    const review = await reviewModel.findOne({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you are not authorized to update it'
      });
    }

    // Update the review
    if (rating) review.rating = rating;
    if (reviewText !== undefined) review.reviewText = reviewText;

    await review.save();

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    // Find the review and make sure it belongs to this user
    const review = await reviewModel.findOne({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you are not authorized to delete it'
      });
    }

    await reviewModel.deleteOne({ _id: reviewId });

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 