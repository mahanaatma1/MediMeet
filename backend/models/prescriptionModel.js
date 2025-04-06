import mongoose from "mongoose"

const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true }, // e.g., "Once daily", "Twice daily"
    duration: { type: String, required: true }, // e.g., "7 days", "2 weeks"
    instructions: { type: String, default: "" },
    timing: { type: String, default: "" }, // e.g., "After meals", "Before bed"
    isActive: { type: Boolean, default: true }
})

const prescriptionSchema = new mongoose.Schema({
    appointmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'appointment',
        required: true 
    },
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user',
        required: true 
    },
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'doctor',
        required: true 
    },
    medications: [medicationSchema],
    diagnosis: { type: String, default: "" },
    notes: { type: String, default: "" },
    followUpDate: { type: Date, default: null },
    followUpInstructions: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['active', 'expired', 'cancelled'], 
        default: 'active' 
    },
    digitalSignature: { type: String, default: "" }, // Doctor's digital signature
    isDownloaded: { type: Boolean, default: false }, // Track if patient downloaded the prescription
    viewedByPatient: { type: Boolean, default: false } // Track if patient viewed the prescription
}, { timestamps: true })

// Virtual field for patient data
prescriptionSchema.virtual('patientData', {
    ref: 'user',
    localField: 'patientId',
    foreignField: '_id',
    justOne: true
})

// Virtual field for doctor data
prescriptionSchema.virtual('doctorData', {
    ref: 'doctor',
    localField: 'doctorId',
    foreignField: '_id',
    justOne: true
})

// Virtual field for appointment data
prescriptionSchema.virtual('appointmentData', {
    ref: 'appointment',
    localField: 'appointmentId',
    foreignField: '_id',
    justOne: true
})

const prescriptionModel = mongoose.models.prescription || mongoose.model("prescription", prescriptionSchema)
export default prescriptionModel 