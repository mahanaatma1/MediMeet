import Job from '../models/jobModel.js';

// Add a new job
export const addJob = async (req, res) => {
  try {
    const { title, department, location, description, requirements, contactEmail, contactPhone } = req.body;

    // Validate required fields
    if (!title || !department || !location || !description || !requirements || !contactEmail || !contactPhone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create new job
    const newJob = new Job({
      title,
      department,
      location,
      description,
      requirements,
      contactEmail,
      contactPhone
    });

    // Save job to database
    await newJob.save();

    res.status(201).json({ 
      message: "Job added successfully", 
      job: newJob 
    });
  } catch (error) {
    console.error("Error adding job:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all jobs
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.status(200).json({ jobs });
  } catch (error) {
    console.error("Error getting jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get active jobs (for public careers page)
export const getActiveJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ jobs });
  } catch (error) {
    console.error("Error getting active jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single job by ID
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    res.status(200).json({ job });
  } catch (error) {
    console.error("Error getting job:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a job
export const updateJob = async (req, res) => {
  try {
    const { title, department, location, description, requirements, contactEmail, contactPhone, isActive } = req.body;
    
    // Find and update the job
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      {
        title,
        department,
        location,
        description,
        requirements,
        contactEmail,
        contactPhone,
        isActive
      },
      { new: true }
    );
    
    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    res.status(200).json({ 
      message: "Job updated successfully", 
      job: updatedJob 
    });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a job
export const deleteJob = async (req, res) => {
  try {
    const deletedJob = await Job.findByIdAndDelete(req.params.id);
    
    if (!deletedJob) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Server error" });
  }
}; 