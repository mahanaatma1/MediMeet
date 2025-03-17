import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay, paymentStripe, verifyStripe, getActiveJobs, checkJobApplication, submitJobApplication, getUserApplications, completeAppointment, googleAuth, verifyEmail, resendVerification, forgotPassword, verifyResetCode, resetPassword } from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
const userRouter = express.Router();

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
userRouter.get("/jobs/:jobId/check-application", authUser, checkJobApplication)
userRouter.post("/jobs/:jobId/apply", authUser, upload.single('resume'), submitJobApplication)
userRouter.get("/my-applications", authUser, getUserApplications)

// Add these routes after the verification routes
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/verify-reset-code", verifyResetCode);
userRouter.post("/reset-password", resetPassword);

export default userRouter;