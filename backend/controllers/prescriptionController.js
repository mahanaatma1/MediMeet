import prescriptionModel from '../models/prescriptionModel.js';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import medicationModel from '../models/medicationModel.js';
import { generatePDF } from '../utils/pdfGenerator.js';
import { sendEmail } from '../utils/sendEmail.js';
import { sendPrescriptionNotification } from '../utils/notifications.js';
import mongoose from 'mongoose';

// Create a new prescription
export const createPrescription = async (req, res) => {
    try {
        console.log("Creating prescription with data:", {
            appointmentId: req.body.appointmentId,
            docId: req.body.docId || req.docId
        });
        
        const { appointmentId, medications, diagnosis, notes, followUpDate, followUpInstructions } = req.body;
        const doctorId = req.body.docId || req.docId;
        
        // Validate appointment exists and belongs to the doctor
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        console.log("Appointment found:", {
            appointmentDocId: appointment.docId.toString(),
            requestDocId: doctorId.toString(),
            isMatch: appointment.docId.toString() === doctorId.toString()
        });
        
        if (appointment.docId.toString() !== doctorId.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to create prescription for this appointment' });
        }
        
        // Check if appointment is completed
        if (!appointment.isCompleted) {
            return res.status(400).json({ success: false, message: 'Cannot create prescription for uncompleted appointment' });
        }
        
        // Check if prescription already exists for this appointment
        const existingPrescription = await prescriptionModel.findOne({ appointmentId });
        if (existingPrescription) {
            return res.status(400).json({ success: false, message: 'Prescription already exists for this appointment' });
        }
        
        // Format doctor name to prevent "Dr. Dr." duplication
        let doctorName = appointment.docData.name || '';
        if (!doctorName.startsWith('Dr.')) {
            doctorName = `Dr. ${doctorName}`;
        }
        
        // Create new prescription
        const prescription = new prescriptionModel({
            appointmentId,
            patientId: appointment.userId,
            doctorId: appointment.docId,
            medications,
            diagnosis,
            notes,
            followUpDate,
            followUpInstructions,
            digitalSignature: req.body.digitalSignature || doctorName
        });
        
        await prescription.save();

        // Update appointment with prescription information
        appointment.hasPrescription = true;
        appointment.prescriptionCreatedAt = new Date();
        await appointment.save();

        // Send email notification to patient
        const patient = await userModel.findById(appointment.userId);
        if (patient && patient.email) {
            const emailSubject = `Prescription from ${doctorName}`;
            const emailBody = `
                <h2>New Prescription Available</h2>
                <p>Dear ${patient.name},</p>
                <p>Your prescription from your recent appointment with ${doctorName} is now available.</p>
                <p>You can view and download your prescription from your MediMeet account.</p>
                <p>Date of Appointment: ${appointment.slotDate.replace(/_/g, '/')} at ${appointment.slotTime}</p>
                <p>Please follow the prescribed medication schedule and instructions carefully.</p>
                <p>If you have any questions about your prescription, please contact your doctor.</p>
                <p>Best regards,<br>The MediMeet Team</p>
            `;

            await sendEmail(patient.email, emailSubject, emailBody);
            
            // Send real-time notification via Socket.io
            const io = req.app.get('io');
            if (io) {
                sendPrescriptionNotification(io, patient._id.toString(), {
                    prescriptionId: prescription._id,
                    doctorName,
                    appointmentDate: appointment.slotDate.replace(/_/g, '/'),
                    appointmentTime: appointment.slotTime
                });
            }
        }

        res.status(201).json({ 
            success: true, 
            message: 'Prescription created successfully', 
            data: prescription 
        });
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ success: false, message: 'Failed to create prescription', error: error.message });
    }
};

// Get prescription by ID
export const getPrescriptionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const prescription = await prescriptionModel.findById(id)
            .populate('patientData', 'name email phone age gender')
            .populate('doctorData', 'name email speciality experience degree')
            .populate('appointmentData');
        
        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }
        
        // Check if the user is authorized to view this prescription
        if (req.userId && prescription.patientId.toString() === req.userId) {
            // Mark as viewed by patient if it's the patient viewing it
            if (!prescription.viewedByPatient) {
                prescription.viewedByPatient = true;
                await prescription.save();
            }
        } else if (req.docId && prescription.doctorId.toString() === req.docId) {
            // Doctor is viewing their own prescription
        } else if (!req.adminId) {
            // Not patient, doctor, or admin
            return res.status(403).json({ success: false, message: 'You are not authorized to view this prescription' });
        }
        
        res.status(200).json({ success: true, data: prescription });
    } catch (error) {
        console.error('Error fetching prescription:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch prescription', error: error.message });
    }
};

// Get all prescriptions for a patient
export const getPatientPrescriptions = async (req, res) => {
    try {
        // If a patient is requesting their own prescriptions
        const patientId = req.userId;
        
        const prescriptions = await prescriptionModel.find({ patientId })
            .populate('patientData', 'name email phone age gender')
            .populate('doctorData', 'name email speciality experience degree')
            .populate('appointmentData')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, data: prescriptions });
    } catch (error) {
        console.error('Error fetching patient prescriptions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch prescriptions', error: error.message });
    }
};

// Get all prescriptions written by a doctor
export const getDoctorPrescriptions = async (req, res) => {
    try {
        // If a doctor is requesting their own written prescriptions
        const doctorId = req.docId;
        
        const prescriptions = await prescriptionModel.find({ doctorId })
            .populate('patientData', 'name email')
            .populate('appointmentData')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, data: prescriptions });
    } catch (error) {
        console.error('Error fetching doctor prescriptions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch prescriptions', error: error.message });
    }
};

// Update an existing prescription
export const updatePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        const { medications, diagnosis, notes, followUpDate, followUpInstructions, status } = req.body;
        
        const prescription = await prescriptionModel.findById(id);
        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }
        
        // Only the doctor who created the prescription can update it
        if (prescription.doctorId.toString() !== req.docId) {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this prescription' });
        }
        
        // Only allow updates if prescription is still active
        if (prescription.status !== 'active' && !req.body.status) {
            return res.status(400).json({ success: false, message: 'Cannot update an expired or cancelled prescription' });
        }
        
        // Update fields
        if (medications) prescription.medications = medications;
        if (diagnosis) prescription.diagnosis = diagnosis;
        if (notes) prescription.notes = notes;
        if (followUpDate) prescription.followUpDate = followUpDate;
        if (followUpInstructions) prescription.followUpInstructions = followUpInstructions;
        if (status) prescription.status = status;
        
        prescription.updatedAt = Date.now();
        
        await prescription.save();
        
        // If prescription was updated, notify the patient
        if (prescription.status === 'active') {
            const patient = await userModel.findById(prescription.patientId);
            const doctor = await doctorModel.findById(prescription.doctorId);
            
            if (patient && patient.email) {
                const emailSubject = `Updated Prescription from Dr. ${doctor.name}`;
                const emailBody = `
                    <h2>Prescription Updated</h2>
                    <p>Dear ${patient.name},</p>
                    <p>Your prescription has been updated by Dr. ${doctor.name}.</p>
                    <p>Please log in to your MediMeet account to view the updated prescription details.</p>
                    <p>It's important to follow the new prescription guidelines.</p>
                    <p>Best regards,<br>The MediMeet Team</p>
                `;
                
                await sendEmail(patient.email, emailSubject, emailBody);
                
                // Send real-time notification via Socket.io
                const io = req.app.get('io');
                if (io) {
                    sendPrescriptionNotification(io, patient._id.toString(), {
                        prescriptionId: prescription._id,
                        doctorName: `Dr. ${doctor.name}`,
                        message: 'Your prescription has been updated',
                        action: 'updated'
                    });
                }
            }
        }
        
        res.status(200).json({ success: true, message: 'Prescription updated successfully', data: prescription });
    } catch (error) {
        console.error('Error updating prescription:', error);
        res.status(500).json({ success: false, message: 'Failed to update prescription', error: error.message });
    }
};

// Download prescription as PDF
export const downloadPrescription = async (req, res) => {
    try {
        const { id } = req.params;
        
        const prescription = await prescriptionModel.findById(id)
            .populate('patientData', 'name email phone age gender')
            .populate('doctorData', 'name email speciality experience degree')
            .populate('appointmentData');
        
        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }
        
        // Check authorization
        if (req.userId && prescription.patientId.toString() === req.userId) {
            // Patient downloading their own prescription
            prescription.isDownloaded = true;
            await prescription.save();
        } else if (req.docId && prescription.doctorId.toString() === req.docId) {
            // Doctor downloading prescription they wrote
        } else if (!req.adminId) {
            // Not patient, doctor or admin
            return res.status(403).json({ success: false, message: 'You are not authorized to download this prescription' });
        }
        
        // Generate PDF
        const pdfBuffer = await generatePDF(prescription);
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription_${id}.pdf`);
        
        // Send PDF
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error downloading prescription:', error);
        res.status(500).json({ success: false, message: 'Failed to download prescription', error: error.message });
    }
};

// Search medications in the database
export const searchMedications = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.length < 2) {
            return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
        }
        
        let medications;
        
        // If query is short, use regex search for better results
        if (query.length < 4) {
            medications = await medicationModel.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { genericName: { $regex: query, $options: 'i' } }
                ],
                isActive: true
            }).limit(20);
        } else {
            // Use text search for longer queries
            medications = await medicationModel.find(
                { $text: { $search: query }, isActive: true },
                { score: { $meta: "textScore" } }
            )
            .sort({ score: { $meta: "textScore" } })
            .limit(20);
        }
        
        res.status(200).json({ success: true, data: medications });
    } catch (error) {
        console.error('Error searching medications:', error);
        res.status(500).json({ success: false, message: 'Failed to search medications', error: error.message });
    }
};

// Mark prescription as expired (for admin or scheduled job)
export const expirePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Only admins should be able to manually expire prescriptions
        if (!req.adminId) {
            return res.status(403).json({ success: false, message: 'Only administrators can expire prescriptions' });
        }
        
        const prescription = await prescriptionModel.findById(id);
        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }
        
        prescription.status = 'expired';
        prescription.updatedAt = Date.now();
        
        await prescription.save();
        
        res.status(200).json({ success: true, message: 'Prescription marked as expired', data: prescription });
    } catch (error) {
        console.error('Error expiring prescription:', error);
        res.status(500).json({ success: false, message: 'Failed to expire prescription', error: error.message });
    }
};

// Get count of prescriptions (for admin dashboard)
export const getPrescriptionStats = async (req, res) => {
    try {
        // Only admins should be able to access stats
        if (!req.adminId) {
            return res.status(403).json({ success: false, message: 'Only administrators can access prescription statistics' });
        }
        
        const totalCount = await prescriptionModel.countDocuments();
        
        const statusCounts = await prescriptionModel.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        
        const last30DaysCount = await prescriptionModel.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
        
        res.status(200).json({
            success: true,
            data: {
                totalCount,
                statusCounts: statusCounts.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                last30DaysCount
            }
        });
    } catch (error) {
        console.error('Error fetching prescription stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch prescription statistics', error: error.message });
    }
};

// Get prescription by appointment ID
export const getPrescriptionByAppointmentId = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        // Validate appointment ID
        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
        }
        
        // Find prescription by appointment ID
        const prescription = await prescriptionModel.findOne({ appointmentId })
            .populate('patientData', 'name email phone')
            .populate('doctorData', 'name email speciality')
            .populate('appointmentData');
        
        if (!prescription) {
            return res.status(404).json({ success: false, message: 'No prescription found for this appointment' });
        }
        
        // Check if the user is authorized to view this prescription
        // For patients
        if (req.userId && prescription.patientId.toString() === req.userId) {
            // Mark as viewed by patient
            if (!prescription.viewedByPatient) {
                prescription.viewedByPatient = true;
                await prescription.save();
            }
        } 
        // For doctors
        else if (req.docId && prescription.doctorId.toString() === req.docId) {
            // Doctor is viewing their own prescription - no additional action needed
        } 
        // Not authorized
        else if (!req.adminId) {
            return res.status(403).json({ success: false, message: 'You are not authorized to view this prescription' });
        }
        
        res.status(200).json({ success: true, data: prescription });
    } catch (error) {
        console.error('Error fetching prescription by appointment ID:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch prescription', error: error.message });
    }
}; 