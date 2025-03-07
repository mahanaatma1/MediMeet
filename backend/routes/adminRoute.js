import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, adminDashboard } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import { addJob, getAllJobs, getJobById, updateJob, deleteJob } from '../controllers/jobController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/dashboard", authAdmin, adminDashboard)

// Job management routes
adminRouter.post("/add-job", authAdmin, addJob)
adminRouter.get("/jobs", authAdmin, getAllJobs)
adminRouter.get("/jobs/:id", authAdmin, getJobById)
adminRouter.put("/jobs/:id", authAdmin, updateJob)
adminRouter.delete("/jobs/:id", authAdmin, deleteJob)

export default adminRouter;