import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, adminDashboard, addJob, getAllJobs, getJobById, updateJob, deleteJob, changeAvailability, getAllJobApplications, updateApplicationStatus, getApplicationStats } from '../controllers/adminController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
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
adminRouter.get("/applications", authAdmin, getAllJobApplications)
adminRouter.put("/applications/:applicationId/status", authAdmin, updateApplicationStatus)
adminRouter.get("/applications/stats", authAdmin, getApplicationStats)

export default adminRouter;