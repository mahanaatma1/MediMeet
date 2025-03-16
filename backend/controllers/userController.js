import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';
import Job from '../models/jobModel.js';
import jobApplicationModel from '../models/jobApplicationModel.js';

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {

    try {

        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment
const bookAppointment = async (req, res) => {

    try {

        const { userId, docId, slotDate, slotTime } = req.body
        const docData = await doctorModel.findById(docId).select("-password")

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        let slots_booked = docData.slots_booked

        // checking for slot availablity 
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' })
            }
            else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select("-password")

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Booked' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        // creating options for razorpay payment
        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        }

        // creation of an order
        const order = await razorpayInstance.orders.create(options)

        res.json({ success: true, order })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

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
            
            res.json({ success: true, message: "Payment Successful" })
        }
        else {
            res.json({ success: false, message: 'Payment Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Stripe
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

    // upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "doctors",
    })

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

    // Save resume file locally
    const resumeUrl = `/uploads/${resumeFile.filename}`;

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
      resumeUrl,
      coverLetter: coverLetter || ""
    });

    await application.save();
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

export {
    loginUser,
    registerUser,
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
    completeAppointment
}