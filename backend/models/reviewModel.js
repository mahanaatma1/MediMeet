import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
        unique: true // Each appointment can only have one review
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviewText: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create index for faster query lookups
reviewSchema.index({ doctorId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ appointmentId: 1 }, { unique: true });

// Add a static method to calculate a doctor's average rating
reviewSchema.statics.getAverageRating = async function(doctorId) {
    const result = await this.aggregate([
        { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
        {
            $group: {
                _id: '$doctorId',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    if (result.length > 0) {
        return {
            averageRating: result[0].averageRating,
            totalReviews: result[0].totalReviews
        };
    }

    return { averageRating: 0, totalReviews: 0 };
};

const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema);
export default reviewModel; 