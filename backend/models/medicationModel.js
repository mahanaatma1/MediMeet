import mongoose from "mongoose"

const medicationSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    genericName: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        required: true 
    }, // e.g., "Antibiotic", "Painkiller", "Antiviral"
    form: { 
        type: String, 
        required: true 
    }, // e.g., "Tablet", "Capsule", "Syrup", "Injection"
    strength: { 
        type: String, 
        required: true 
    }, // e.g., "500mg", "10mg"
    manufacturer: { 
        type: String, 
        default: "" 
    },
    description: { 
        type: String, 
        default: "" 
    },
    sideEffects: { 
        type: [String], 
        default: [] 
    },
    contraindications: { 
        type: [String], 
        default: [] 
    },
    interactions: { 
        type: [String], 
        default: [] 
    }, // Other medications it interacts with
    commonDosages: { 
        type: [String], 
        default: [] 
    }, // e.g., ["500mg twice daily", "250mg three times daily"]
    requiresPrescription: { 
        type: Boolean, 
        default: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true })

// Add text index for search functionality
medicationSchema.index({ 
    name: 'text', 
    genericName: 'text', 
    category: 'text' 
});

const medicationModel = mongoose.models.medication || mongoose.model("medication", medicationSchema)
export default medicationModel 