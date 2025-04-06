import express from 'express';
import { loginDoctor, appointmentsDoctor, appointmentCancel, doctorList, changeAvailablity, appointmentComplete, doctorDashboard, doctorProfile, updateDoctorProfile } from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';
import doctorModel from '../models/doctorModel.js';
import authUser from '../middleware/authUser.js';
const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor)
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel)
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor)
doctorRouter.get("/list", doctorList)
doctorRouter.post("/change-availability", authDoctor, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile)

// Route to get completed appointments that don't have prescriptions
doctorRouter.get("/appointments/completed-without-prescription", authDoctor, async (req, res) => {
    try {
        const doctorId = req.docId;
        
        // Find completed appointments that don't have prescriptions yet
        const appointmentModel = (await import('../models/appointmentModel.js')).default;
        const prescriptionModel = (await import('../models/prescriptionModel.js')).default;
        
        // Get all completed appointments for the doctor
        const completedAppointments = await appointmentModel.find({
            docId: doctorId,
            isCompleted: true,
            cancelled: false
        }).sort({ slotDate: -1 });
        
        // Get all prescriptions for the doctor
        const doctorPrescriptions = await prescriptionModel.find({
            doctorId: doctorId
        });
        
        // Create a set of appointment IDs that already have prescriptions
        const appointmentsWithPrescriptions = new Set(
            doctorPrescriptions.map(prescription => 
                prescription.appointmentId.toString()
            )
        );
        
        // Filter out appointments that already have prescriptions
        const appointmentsWithoutPrescriptions = completedAppointments.filter(
            appointment => !appointmentsWithPrescriptions.has(appointment._id.toString())
        );
        
        res.status(200).json({
            success: true,
            appointments: appointmentsWithoutPrescriptions
        });
    } catch (error) {
        console.error('Error fetching appointments without prescriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments'
        });
    }
});

// Add a new endpoint to get doctor details by ID
doctorRouter.get("/:doctorId", async (req, res) => {
    try {
        const { doctorId } = req.params;
        
        // Find the doctor
        const doctor = await doctorModel.findById(doctorId, { password: 0 }); // Exclude password
        
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }
        
        // Return doctor data
        res.json({ 
            success: true, 
            doctor: doctor
        });
    } catch (error) {
        console.error('Error retrieving doctor details:', error);
        res.status(500).json({ success: false, message: "Failed to retrieve doctor details" });
    }
});

export default doctorRouter;