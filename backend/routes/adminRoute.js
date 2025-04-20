import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, adminDashboard, addJob, getAllJobs, getJobById, updateJob, deleteJob, changeAvailability, getAllJobApplications, getApplicationById, updateApplicationStatus, getApplicationStats } from '../controllers/adminController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
import jobApplicationModel from '../models/jobApplicationModel.js';
import jwt from 'jsonwebtoken';
import path from 'path';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailability)
adminRouter.get("/dashboard", authAdmin, adminDashboard)

// Job management routes
adminRouter.post("/add-job", authAdmin, addJob)
adminRouter.get("/jobs", authAdmin, getAllJobs)
adminRouter.get("/jobs/:id", authAdmin, getJobById)
adminRouter.put("/jobs/:id", authAdmin, updateJob)
adminRouter.delete("/jobs/:id", authAdmin, deleteJob)

// Job application management routes
adminRouter.get("/applications/stats", authAdmin, getApplicationStats)
adminRouter.get("/applications", authAdmin, getAllJobApplications)
adminRouter.get("/applications/:applicationId", authAdmin, getApplicationById)
adminRouter.put("/applications/:applicationId/status", authAdmin, updateApplicationStatus)

adminRouter.get("/job-applications", authAdmin, getAllJobApplications)
adminRouter.get("/job-applications/:applicationId", authAdmin, getApplicationById)
adminRouter.put("/job-applications/:applicationId/status", authAdmin, updateApplicationStatus)

// Add endpoint for admins to access resumes
adminRouter.get("/job-applications/:applicationId/resume", async (req, res) => {
    try {
        console.log("Resume request received");
        console.log("Headers keys:", Object.keys(req.headers));
        console.log("Query params:", req.query);
        
        // Get token from headers or query parameters - try multiple possible names
        let token = req.headers.token || req.query.token || 
                     req.headers.atoken || req.query.atoken ||
                     req.headers.aToken || req.query.aToken;
        
        console.log("Token extracted:", token ? `Found (${token.length} chars)` : "No token");
        
        // PRODUCTION MODE: Uncomment this validation when deploying
        // If you want to enforce authentication in production
        /*
        // Verify admin credentials using the same logic as authAdmin middleware
        const expectedToken = process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD;
        
        if (token !== expectedToken) {
            return res.status(401).json({ success: false, message: "Not Authorized" });
        }
        */
        
        // The application ID from the URL
        const { applicationId } = req.params;
        console.log("Attempting to retrieve application:", applicationId);
        
        // Find the application
        const application = await jobApplicationModel.findById(applicationId);
        
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }
        
        console.log("Application found:", {
            id: application._id,
            hasResumeData: !!application.resumeData,
            hasResumeUrl: !!application.resumeUrl
        });
        
        // Handle legacy applications with resumeUrl
        if (!application.resumeData && application.resumeUrl) {
            console.log("Using legacy resumeUrl:", application.resumeUrl);
            
            // For URLs starting with "/" (local files), serve the file from the server
            if (application.resumeUrl.startsWith('/')) {
                const filePath = path.join(process.cwd(), application.resumeUrl);
                console.log("Serving file from:", filePath);
                return res.sendFile(filePath, (err) => {
                    if (err) {
                        console.error('Error sending file:', err);
                        return res.status(404).json({ success: false, message: "Resume file not found" });
                    }
                });
            }
            
            // For external URLs, redirect to the URL
            console.log("Redirecting to external URL");
            return res.redirect(application.resumeUrl);
        }
        
        // Check if resumeData exists
        if (!application.resumeData) {
            console.log('Application found but resumeData is missing');
            return res.status(404).json({ success: false, message: "Resume data not found for this application" });
        }
        
        // Convert base64 string to buffer
        console.log("Converting resumeData to buffer");
        const resumeBuffer = Buffer.from(application.resumeData, 'base64');
        
        // Set appropriate headers for the PDF
        res.set({
            'Content-Type': application.resumeType || 'application/pdf',
            'Content-Disposition': `inline; filename="${application.resumeName || 'resume.pdf'}"`,
            'Content-Length': resumeBuffer.length,
            // Add additional headers for CORS if needed for production
            'Access-Control-Allow-Origin': '*', // Or specific domain in production
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, atoken'
        });
        
        console.log("Sending resume response");
        // Send the buffer as the response
        res.send(resumeBuffer);
    } catch (error) {
        console.error('Error serving resume:', error);
        res.status(500).json({ success: false, message: `Failed to retrieve resume: ${error.message}` });
    }
});

export default adminRouter;