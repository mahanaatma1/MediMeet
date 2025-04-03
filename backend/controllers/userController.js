import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import reviewModel from "../models/reviewModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';
import Job from '../models/jobModel.js';
import jobApplicationModel from '../models/jobApplicationModel.js';
import { sendEmail, sendVerificationEmail } from '../utils/sendEmail.js';
import { getPasswordResetTemplate, getVerificationEmailTemplate } from '../utils/emailTemplates.js';
import mongoose from 'mongoose';
import fs from 'fs';

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

// Generate verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    )
}

// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const userExists = await userModel.findOne({ email });
        if (userExists) {
            return res.json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user
        const userData = {
            name,
            email,
            password: hashedPassword,
            verificationCode,
            verificationExpires
        };

        const newUser = new userModel(userData);
        const user = await newUser.save();

        // Send verification email (simplified)
        const emailSent = await sendVerificationEmail(email, verificationCode);
        
        if (!emailSent) {
            return res.json({ success: false, message: 'Failed to send verification email' });
        }

        res.json({ success: true, message: 'Registration successful. Please check your email for verification.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.json({ success: false, message: 'Registration failed' });
    }
};

// API to login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        // Check if user is verified
        if (!user.isVerified) {
            // Generate new verification code
            const verificationCode = generateVerificationCode();
            const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

            user.verificationCode = verificationCode;
            user.verificationExpires = verificationExpires;
            await user.save();

            // Send new verification email (simplified)
            await sendVerificationEmail(email, verificationCode);

            return res.json({
                success: true,
                isVerified: false,
                message: 'Please verify your email'
            });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            isVerified: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'Login failed' });
    }
};

// API to verify email
const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        // Find user
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Check if code is valid and not expired
        if (user.verificationCode !== code) {
            return res.json({ success: false, message: 'Invalid verification code' });
        }

        if (user.verificationExpires < Date.now()) {
            return res.json({ success: false, message: 'Verification code has expired' });
        }

        // Update user
        user.isVerified = true;
        user.verificationCode = null;
        user.verificationExpires = null;
        await user.save();

        // Generate token for auto-login
        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.json({ success: false, message: 'Verification failed' });
    }
};

// API to resend verification code
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Generate new verification code
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

        // Update user
        user.verificationCode = verificationCode;
        user.verificationExpires = verificationExpires;
        await user.save();

        // Send verification email (simplified)
        const emailSent = await sendVerificationEmail(email, verificationCode);
        
        if (!emailSent) {
            return res.json({ success: false, message: 'Failed to send verification email' });
        }

        res.json({ success: true, message: 'Verification code sent' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.json({ success: false, message: 'Failed to resend verification code' });
    }
};

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const userData = await userModel.findById(userId).select('-password');

        res.json({ success: true, userData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update user profile
const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" });
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender });

        if (imageFile) {
            // Create the image URL for local storage
            const imageURL = `/api/user/images/${imageFile.filename}`;
            
            // Update the user's image in the database
            await userModel.findByIdAndUpdate(userId, { image: imageURL });
        }

        res.json({ success: true, message: 'Profile Updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to book appointment
const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body;
        const docData = await doctorModel.findById(docId).select("-password");

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' });
        }

        let slots_booked = docData.slots_booked;

        // checking for slot availablity 
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' });
            }
            else {
                slots_booked[slotDate].push(slotTime);
            }
        } else {
            slots_booked[slotDate] = [];
            slots_booked[slotDate].push(slotTime);
        }

        const userData = await userModel.findById(userId).select("-password");

        delete docData.slots_booked;

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        res.json({ success: true, message: 'Appointment Booked' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        // verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData;

        const doctorData = await doctorModel.findById(docId);

        let slots_booked = doctorData.slots_booked;

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        res.json({ success: true, message: 'Appointment Cancelled' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body;
        const appointments = await appointmentModel.find({ userId });

        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' });
        }

        // creating options for razorpay payment
        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        };

        // creation of an order
        const order = await razorpayInstance.orders.create(options);

        res.json({ success: true, order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        if (orderInfo.status === 'paid') {
            const appointmentId = orderInfo.receipt;
            const appointmentData = await appointmentModel.findById(appointmentId);
            
            // Calculate revenue shares (20% admin, 80% doctor)
            const adminShare = Math.round(appointmentData.amount * 0.2);
            const doctorShare = appointmentData.amount - adminShare;
            
            await appointmentModel.findByIdAndUpdate(appointmentId, { 
                payment: true,
                adminShare: adminShare,
                doctorShare: doctorShare
            });
            
            res.json({ success: true, message: "Payment Successful" });
        }
        else {
            res.json({ success: false, message: 'Payment Failed' });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const { origin } = req.headers;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' });
        }

        if (!process.env.CURRENCY) {
            throw new Error("Currency is not defined in environment variables");
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase();

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const verifyStripe = async (req, res) => {
    try {
        const { appointmentId, success } = req.body;

        if (success === "true") {
            const appointmentData = await appointmentModel.findById(appointmentId);
            
            // Calculate revenue shares (20% admin, 80% doctor)
            const adminShare = Math.round(appointmentData.amount * 0.2);
            const doctorShare = appointmentData.amount - adminShare;
            
            await appointmentModel.findByIdAndUpdate(appointmentId, { 
                payment: true,
                adminShare: adminShare,
                doctorShare: doctorShare
            });
            
            return res.json({ success: true, message: 'Payment Successful' });
        }

        res.json({ success: false, message: 'Payment Failed' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get active jobs for users
const getActiveJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, jobs });
    } catch (error) {
        console.error("Error getting active jobs:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Check if user has already applied for a job
const checkJobApplication = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { userId } = req.body;

        const existingApplication = await jobApplicationModel.findOne({ userId, jobId });
        
        if (existingApplication) {
            return res.json({ 
                success: true, 
                hasApplied: true,
                message: "You have already applied for this position"
            });
        }

        res.json({ 
            success: true, 
            hasApplied: false,
            message: "You can apply for this position"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Submit a job application
const submitJobApplication = async (req, res) => {
    try {
        // The userId should come from the auth middleware, but we'll also check the form data as a fallback
        // This ensures we're using the authenticated user's ID for security
        const userId = req.body.userId; // This comes from the authUser middleware
        const { jobId, fullName, email, phone, address, experience, education, coverLetter } = req.body;
        const resumeFile = req.file;

        // Validate required fields
        if (!userId || !fullName || !email || !phone || !address || !experience || !education || !resumeFile) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Ensure jobId is available
        const actualJobId = jobId || req.params.jobId;
        if (!actualJobId) {
            return res.status(400).json({ success: false, message: "Job ID is required" });
        }

        // Check if user has already applied
        const existingApplication = await jobApplicationModel.findOne({ userId, jobId: actualJobId });
        if (existingApplication) {
            return res.status(400).json({ 
                success: false, 
                message: "You have already applied for this position" 
            });
        }

        // Read the resume file and convert to base64
        const resumeData = fs.readFileSync(resumeFile.path).toString('base64');
        
        // Create new application
        const application = new jobApplicationModel({
            userId,
            jobId: actualJobId,
            fullName,
            email,
            phone,
            address,
            experience,
            education,
            resumeData,
            resumeName: resumeFile.originalname,
            resumeType: resumeFile.mimetype,
            coverLetter: coverLetter || ""
        });

        await application.save();
        
        // Delete the temporary file from disk
        fs.unlinkSync(resumeFile.path);
        
        res.status(201).json({ 
            success: true, 
            message: "Application submitted successfully" 
        });
    } catch (error) {
        console.error("Job application error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user's job applications
const getUserApplications = async (req, res) => {
    try {
        const userId = req.body.userId;
        
        const applications = await jobApplicationModel.find({ userId: userId })
            .populate('jobId')
            .sort({ createdAt: -1 });
        
        return res.json({
            success: true,
            applications
        });
    } catch (error) {
        console.error('Error fetching user applications:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch applications'
        });
    }
};

// API to mark appointment as completed by user
const completeAppointment = async (req, res) => {
    try {
        const { appointmentId, userId } = req.body;
        
        // Validate input
        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID is required'
            });
        }
        
        // Find the appointment
        const appointment = await appointmentModel.findById(appointmentId);
        
        // Check if appointment exists
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }
        
        // Check if the appointment belongs to the user
        if (appointment.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to complete this appointment'
            });
        }
        
        // Check if appointment is already cancelled
        if (appointment.isCancelled) {
            return res.status(400).json({
                success: false,
                message: 'Cannot complete a cancelled appointment'
            });
        }
        
        // Check if appointment is already completed
        if (appointment.isCompleted) {
            return res.status(400).json({
                success: false,
                message: 'Appointment is already marked as completed'
            });
        }
        
        // Mark appointment as completed
        appointment.isCompleted = true;
        
        // If the meeting was started but not properly ended, set the end time
        if (appointment.meetingStarted && !appointment.meetingEnded) {
            appointment.meetingEnded = new Date();
        }
        
        // Save the updated appointment
        await appointment.save();
        
        return res.json({
            success: true,
            message: 'Appointment marked as completed successfully',
            appointment
        });
    } catch (error) {
        console.error('Error completing appointment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to complete appointment'
        });
    }
};

// API for Google authentication
const googleAuth = async (req, res) => {
    try {
        const { name, email, image } = req.body;

        // Find or create user
        let user = await userModel.findOne({ email });

        if (!user) {
            user = await userModel.create({
                name,
                email,
                password: await bcrypt.hash(Math.random().toString(36), 10),
                image,
                isVerified: true // Google users are automatically verified
            });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.json({ success: false, message: 'Authentication failed' });
    }
};

// Add these functions after the resendVerification function

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check if user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate verification code
        const resetCode = generateVerificationCode();
        
        // Set expiry time (30 minutes)
        const resetCodeExpiry = new Date();
        resetCodeExpiry.setMinutes(resetCodeExpiry.getMinutes() + 30);
        
        // Save reset code to user
        user.resetPasswordCode = resetCode;
        user.resetPasswordExpiry = resetCodeExpiry;
        await user.save();
        
        // Send email with reset code
        const subject = 'MediMeet Password Reset';
        const emailContent = getPasswordResetTemplate(resetCode);
        const emailSent = await sendEmail(email, subject, emailContent);
        
        if (!emailSent) {
            return res.status(500).json({ success: false, message: 'Failed to send reset code email' });
        }
        
        return res.status(200).json({ success: true, message: 'Reset code sent to your email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({ success: false, message: 'Email and code are required' });
        }
        
        // Find user
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Check if reset code exists and is valid
        if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
            return res.status(400).json({ success: false, message: 'Invalid reset code' });
        }
        
        // Check if code is expired
        if (user.resetPasswordExpiry < new Date()) {
            return res.status(400).json({ success: false, message: 'Reset code has expired' });
        }
        
        return res.status(200).json({ success: true, message: 'Reset code verified successfully' });
    } catch (error) {
        console.error('Verify reset code error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        
        if (!email || !code || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email, code and new password are required' });
        }
        
        // Find user
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Check if reset code exists and is valid
        if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
            return res.status(400).json({ success: false, message: 'Invalid reset code' });
        }
        
        // Check if code is expired
        if (user.resetPasswordExpiry < new Date()) {
            return res.status(400).json({ success: false, message: 'Reset code has expired' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update user password and clear reset code
        user.password = hashedPassword;
        user.resetPasswordCode = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();
        
        return res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// API to submit a review for a doctor
const submitReview = async (req, res) => {
    try {
        const { doctorId, appointmentId, rating, reviewText } = req.body;
        const userId = req.user.id;

        // Verify the appointment exists and belongs to this user
        const appointment = await appointmentModel.findOne({ 
            _id: appointmentId,
            userId: userId,
            docId: doctorId,
            status: 'completed' // Only allow reviews for completed appointments
        });

        if (!appointment) {
            return res.json({ 
                success: false, 
                message: 'You can only review doctors after a completed appointment' 
            });
        }

        // Check if a review already exists
        const existingReview = await reviewModel.findOne({
            doctorId,
            userId,
            appointmentId
        });

        if (existingReview) {
            // Update existing review
            existingReview.rating = rating;
            existingReview.reviewText = reviewText;
            await existingReview.save();

            return res.json({ 
                success: true, 
                message: 'Review updated successfully',
                review: existingReview
            });
        }

        // Create new review
        const newReview = new reviewModel({
            doctorId,
            userId,
            appointmentId,
            rating,
            reviewText
        });

        await newReview.save();

        // Update doctor's average rating
        await updateDoctorRating(doctorId);

        res.json({ 
            success: true, 
            message: 'Review submitted successfully',
            review: newReview
        });
    } catch (error) {
        console.error('Submit review error:', error);
        res.json({ success: false, message: 'Failed to submit review' });
    }
};

// API to get reviews for a doctor
const getDoctorReviews = async (req, res) => {
    try {
        const { doctorId } = req.params;
        
        const reviews = await reviewModel.find({ doctorId })
            .populate('userId', 'name image')
            .sort({ createdAt: -1 });

        // Calculate average rating
        const averageRating = await calculateAverageRating(doctorId);

        res.json({ 
            success: true, 
            reviews,
            averageRating,
            totalReviews: reviews.length
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.json({ success: false, message: 'Failed to get reviews' });
    }
};

// Helper function to calculate average rating
const calculateAverageRating = async (doctorId) => {
    const result = await reviewModel.aggregate([
        { $match: { doctorId: mongoose.Types.ObjectId(doctorId) } },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } }
    ]);

    return result.length > 0 ? result[0].averageRating : 0;
};

// Helper function to update doctor's rating
const updateDoctorRating = async (doctorId) => {
    const averageRating = await calculateAverageRating(doctorId);
    
    // Store the average rating in the doctor model for quick access
    await doctorModel.findByIdAndUpdate(doctorId, { 
        averageRating: parseFloat(averageRating.toFixed(1)) 
    });
};

export {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe,
    getActiveJobs,
    checkJobApplication,
    submitJobApplication,
    getUserApplications,
    completeAppointment,
    googleAuth,
    verifyEmail,
    resendVerification,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    submitReview,
    getDoctorReviews
}