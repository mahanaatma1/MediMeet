import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay, paymentStripe, verifyStripe, getActiveJobs, checkJobApplication, submitJobApplication, getUserApplications, completeAppointment, googleAuth, verifyEmail, resendVerification, forgotPassword, verifyResetCode, resetPassword, testEmail, getJobById } from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
import path from 'path';
import { fileURLToPath } from 'url';
import jobApplicationModel from '../models/jobApplicationModel.js';
import userModel from '../models/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userRouter = express.Router();

// Image serving endpoint
userRouter.get('/images/:filename', (req, res) => {
  const { filename } = req.params;
  
  // Construct the path to the uploads directory
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  
  // Send the file
  res.sendFile(path.join(uploadsDir, filename), (err) => {
    if (err) {
      console.error('Error serving image:', err);
      res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }
  });
});

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.post("/google-auth", googleAuth)

// Email verification routes
userRouter.post("/verify", verifyEmail)
userRouter.post("/resend-verification", resendVerification)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/book-appointment", authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)
userRouter.post("/complete-appointment", authUser, completeAppointment)
userRouter.post("/payment-razorpay", authUser, paymentRazorpay)
userRouter.post("/verifyRazorpay", authUser, verifyRazorpay)
userRouter.post("/payment-stripe", authUser, paymentStripe)
userRouter.post("/verifyStripe", authUser, verifyStripe)
userRouter.get("/jobs", getActiveJobs)

// Job application routes
userRouter.get("/jobs/:jobId", getJobById)
userRouter.get("/jobs/:jobId/check-application", authUser, checkJobApplication)
userRouter.post("/jobs/:jobId/apply", authUser, upload.single('resume'), submitJobApplication)
userRouter.get("/my-applications", authUser, getUserApplications)

// New endpoint to get the resume
userRouter.get("/applications/:applicationId/resume", authUser, async (req, res) => {
    try {
        const { applicationId } = req.params;
        const userId = req.body.userId;
        
        // Find the application
        const application = await jobApplicationModel.findById(applicationId);
        
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }
        
        // Security check: Only allow access if the user is the applicant or an admin
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        
        if (application.userId.toString() !== userId && user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "You don't have permission to access this resume" });
        }
        
        // Convert base64 string to buffer
        const resumeBuffer = Buffer.from(application.resumeData, 'base64');
        
        // Set appropriate headers
        res.set({
            'Content-Type': application.resumeType || 'application/pdf',
            'Content-Disposition': `inline; filename="${application.resumeName || 'resume.pdf'}"`,
            'Content-Length': resumeBuffer.length
        });
        
        // Send the buffer as the response
        res.send(resumeBuffer);
    } catch (error) {
        console.error('Error serving resume:', error);
        res.status(500).json({ success: false, message: "Failed to retrieve resume" });
    }
});

// Password reset routes
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/verify-reset-code", verifyResetCode);
userRouter.post("/reset-password", resetPassword);

// Test email route
userRouter.post("/test-email", testEmail);

// Add a new endpoint to get user details by ID
userRouter.get("/:userId", authUser, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find the user
        const user = await userModel.findById(userId, { password: 0 }); // Exclude password
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Return user data
        res.json({ 
            success: true, 
            userData: user
        });
    } catch (error) {
        console.error('Error retrieving user details:', error);
        res.status(500).json({ success: false, message: "Failed to retrieve user details" });
    }
});

export default userRouter;