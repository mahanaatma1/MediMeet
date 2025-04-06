import mongoose from "mongoose"

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    amount: { type: Number, required: true },
    adminShare: { type: Number, default: 0 }, // 20% of amount goes to admin
    doctorShare: { type: Number, default: 0 }, // 80% of amount goes to doctor
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    // Meeting related fields
    meetingRoomName: { type: String, default: null },
    meetingToken: { type: String, default: null },
    meetingStarted: { type: Boolean, default: false },
    meetingEnded: { type: Boolean, default: false },
    meetingStartTime: { type: Date, default: null },
    meetingEndTime: { type: Date, default: null },
    meetingDuration: { type: Number, default: 0 }, // in minutes
    // Additional fields for better tracking
    meetingJoinedByDoctor: { type: Boolean, default: false },
    meetingJoinedByUser: { type: Boolean, default: false },
    meetingNotes: { type: String, default: '' },
    // Prescription related fields
    hasPrescription: { type: Boolean, default: false },
    prescriptionCreatedAt: { type: Date, default: null }
})

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema)
export default appointmentModel