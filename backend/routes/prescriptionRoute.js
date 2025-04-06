import express from 'express';
import { 
    createPrescription, 
    getPrescriptionById, 
    getPatientPrescriptions, 
    getDoctorPrescriptions, 
    updatePrescription, 
    downloadPrescription, 
    searchMedications,
    expirePrescription,
    getPrescriptionStats,
    getPrescriptionByAppointmentId
} from '../controllers/prescriptionController.js';
import authDoctor from '../middleware/authDoctor.js';
import authUser from '../middleware/authUser.js';
import authAdmin from '../middleware/authAdmin.js';

const router = express.Router();

// Doctor routes (require doctor authentication)
router.post('/create', authDoctor, createPrescription);
router.get('/doctor', authDoctor, getDoctorPrescriptions);
router.put('/update/:id', authDoctor, updatePrescription);

// Patient routes (require user authentication)
router.get('/patient', authUser, getPatientPrescriptions);

// Shared routes (accessible by both doctor and patient with proper permissions)
router.get('/view/:id', (req, res, next) => {
    // Use custom middleware to allow either doctor, patient, or admin to access
    if (req.headers.token) {
        authUser(req, res, () => {
            next();
        });
    } else if (req.headers.dtoken) {
        authDoctor(req, res, () => {
            next();
        });
    } else if (req.headers.atoken) {
        authAdmin(req, res, () => {
            next();
        });
    } else {
        res.status(401).json({ success: false, message: 'Authentication required' });
    }
}, getPrescriptionById);

// Route to get prescription by appointment ID
router.get('/appointment/:appointmentId', (req, res, next) => {
    // Use custom middleware to allow either doctor, patient, or admin to access
    if (req.headers.token) {
        authUser(req, res, () => {
            next();
        });
    } else if (req.headers.dtoken) {
        authDoctor(req, res, () => {
            next();
        });
    } else if (req.headers.atoken) {
        authAdmin(req, res, () => {
            next();
        });
    } else {
        res.status(401).json({ success: false, message: 'Authentication required' });
    }
}, getPrescriptionByAppointmentId);

router.get('/download/:id', (req, res, next) => {
    // Similar authentication for download
    if (req.headers.token) {
        authUser(req, res, () => {
            next();
        });
    } else if (req.headers.dtoken) {
        authDoctor(req, res, () => {
            next();
        });
    } else if (req.headers.atoken) {
        authAdmin(req, res, () => {
            next();
        });
    } else {
        res.status(401).json({ success: false, message: 'Authentication required' });
    }
}, downloadPrescription);

// Medication search (available to doctors only)
router.get('/medications/search', authDoctor, searchMedications);

// Admin routes
router.put('/expire/:id', authAdmin, expirePrescription);
router.get('/stats', authAdmin, getPrescriptionStats);

export default router; 