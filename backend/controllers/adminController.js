import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import Job from '../models/jobModel.js';
import jobApplicationModel from '../models/jobApplicationModel.js';

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}


// API for admin to get all appointments
const appointmentsAdmin = async (req, res) => {
    try {
        console.log("Admin requesting appointments");
        const appointments = await appointmentModel.find();
        
        // Ensure all appointments have the required fields
        const validatedAppointments = appointments.map(appointment => {
            const appointmentObj = appointment.toObject();
            
            // Ensure userData and docData exist
            if (!appointmentObj.userData) appointmentObj.userData = {};
            if (!appointmentObj.docData) appointmentObj.docData = {};
            
            return appointmentObj;
        });
        
        console.log(`Found ${validatedAppointments.length} appointments`);
        res.json({ success: true, appointments: validatedAppointments });
    } catch (error) {
        console.log("Error in appointmentsAdmin:", error);
        res.json({ success: false, message: error.message });
    }
}

// API for admin to cancel appointment
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" })
        }
        appointment.cancelled = true
        await appointment.save()
        res.json({ success: true, message: "Appointment cancelled" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for admin to add doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, phone, specialization, experience, fees, startTime, endTime } = req.body

        // validations
        if (!name || !email || !password || !phone || !specialization || !experience || !fees || !startTime || !endTime) {
            return res.json({ success: false, message: "All fields are required" })
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Invalid email" })
        }

        if (!validator.isMobilePhone(phone)) {
            return res.json({ success: false, message: "Invalid phone number" })
        }

        // check if doctor already exists
        const doctorExists = await doctorModel.findOne({ email })
        if (doctorExists) {
            return res.json({ success: false, message: "Doctor already exists" })
        }

        // check if user exists with same email
        const userExists = await userModel.findOne({ email })
        if (userExists) {
            return res.json({ success: false, message: "User exists with this email" })
        }

        // hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // upload image to cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "doctors",
        })

        // create doctor
        const doctor = new doctorModel({
            name,
            email,
            password: hashedPassword,
            phone,
            specialization,
            experience,
            fees,
            startTime,
            endTime,
            image: {
                public_id: result.public_id,
                url: result.secure_url
            }
        })

        await doctor.save()
        res.json({ success: true, message: "Doctor added successfully" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for admin to get all doctors
const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find()
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for admin dashboard
const adminDashboard = async (req, res) => {
    try {
        const users = await userModel.countDocuments();
        const doctors = await doctorModel.countDocuments();
        const appointmentsCount = await appointmentModel.countDocuments();
        
        // Get latest appointments without using populate
        const latestAppointments = await appointmentModel.find().sort({ date: -1 }).limit(10);
        
        const dashData = {
            patients: users,
            doctors: doctors,
            appointments: appointmentsCount,
            latestAppointments: latestAppointments
        };
        
        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Add a new job
const addJob = async (req, res) => {
  try {
    const { 
      title, 
      department, 
      location, 
      description, 
      requirements, 
      contactEmail, 
      contactPhone,
      employmentType,
      salaryMin,
      salaryMax,
      applicationDeadline,
      postedDate,
      isActive
    } = req.body;

    // Validate required fields
    if (!title || !department || !location || !description || !requirements || !contactEmail || !contactPhone) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Validate email format
    if (!validator.isEmail(contactEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate salary range if provided
    if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
      return res.status(400).json({ message: "Minimum salary cannot be greater than maximum salary" });
    }

    // Create new job
    const newJob = new Job({
      title,
      department,
      location,
      description,
      requirements,
      contactEmail,
      contactPhone,
      employmentType,
      salaryMin,
      salaryMax,
      applicationDeadline,
      postedDate,
      isActive: isActive !== undefined ? isActive : true
    });

    await newJob.save();
    res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all jobs
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get job by ID
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    
    res.status(200).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update job
const updateJob = async (req, res) => {
  try {
    const { 
      title, 
      department, 
      location, 
      description, 
      requirements, 
      contactEmail, 
      contactPhone,
      employmentType,
      salaryMin,
      salaryMax,
      applicationDeadline,
      postedDate,
      isActive 
    } = req.body;
    
    // Find job
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    
    // Validate email format if provided
    if (contactEmail && !validator.isEmail(contactEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate salary range if provided
    if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
      return res.status(400).json({ message: "Minimum salary cannot be greater than maximum salary" });
    }
    
    // Update fields
    if (title) job.title = title;
    if (department) job.department = department;
    if (location) job.location = location;
    if (description) job.description = description;
    if (requirements) job.requirements = requirements;
    if (contactEmail) job.contactEmail = contactEmail;
    if (contactPhone) job.contactPhone = contactPhone;
    if (employmentType) job.employmentType = employmentType;
    if (salaryMin !== undefined) job.salaryMin = salaryMin;
    if (salaryMax !== undefined) job.salaryMax = salaryMax;
    if (applicationDeadline) job.applicationDeadline = applicationDeadline;
    if (postedDate) job.postedDate = postedDate;
    if (isActive !== undefined) job.isActive = isActive;
    
    await job.save();
    res.status(200).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete job
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    
    res.status(200).json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change doctor availability
const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body
    const docData = await doctorModel.findById(docId)
    await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
    res.json({ success: true, message: 'Availability Changed' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Get all job applications
const getAllJobApplications = async (req, res) => {
  try {
    // Fetch applications with populated job information
    const applications = await jobApplicationModel
      .find()
      .populate('jobId')
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'shortlisted', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status" 
      });
    }

    const application = await jobApplicationModel.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: "Application not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Application status updated successfully",
      application 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get application statistics
const getApplicationStats = async (req, res) => {
  try {
    // Count applications by status
    const pending = await jobApplicationModel.countDocuments({ status: 'pending' });
    const reviewed = await jobApplicationModel.countDocuments({ status: 'reviewed' });
    const shortlisted = await jobApplicationModel.countDocuments({ status: 'shortlisted' });
    const rejected = await jobApplicationModel.countDocuments({ status: 'rejected' });
    const total = await jobApplicationModel.countDocuments();

    res.json({ 
      success: true, 
      pending,
      reviewed,
      shortlisted,
      rejected,
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    addJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    changeAvailability,
    getAllJobApplications,
    updateApplicationStatus,
    getApplicationStats
}