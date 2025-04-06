import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from '../context/AppContext';
import { FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaCalendarAlt, FaEnvelope, FaPhone, FaBriefcase, FaArrowLeft, FaFileUpload, FaTimes, FaCheck, FaExclamationCircle } from 'react-icons/fa';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, token, user } = useContext(AppContext);
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    experience: '',
    education: '',
    coverLetter: '',
    resume: null
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumePreview, setResumePreview] = useState(null);

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendUrl}/api/user/jobs/${jobId}`);
        setJob(response.data.job);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details. Please try again later.');
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, backendUrl]);
  
  // Check if user has already applied
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!token) return;
      
      try {
        const response = await axios.get(
          `${backendUrl}/api/user/jobs/${jobId}/check-application`,
          {
            headers: { token }
          }
        );
        
        setHasApplied(response.data.hasApplied);
      } catch (error) {
        console.error('Error checking application status:', error);
      }
    };

    if (jobId && token) {
      checkApplicationStatus();
    }
  }, [jobId, token, backendUrl]);

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address ? `${user.address.line1}, ${user.address.line2}` : ''
      }));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.experience.trim()) {
      newErrors.experience = 'Experience is required';
    }

    if (!formData.education.trim()) {
      newErrors.education = 'Education is required';
    }

    if (!formData.resume) {
      newErrors.resume = 'Resume is required';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setFormErrors(prev => ({
          ...prev,
          resume: 'Please upload a PDF file'
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setFormErrors(prev => ({
          ...prev,
          resume: 'File size should be less than 5MB'
        }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        resume: file
      }));
      setResumePreview(URL.createObjectURL(file));
      setFormErrors(prev => ({
        ...prev,
        resume: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Please login to apply for jobs');
      navigate('/login');
      return;
    }
    
    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      formDataToSend.append('jobId', jobId);
      
      if (user && user._id) {
        formDataToSend.append('userId', user._id);
      }

      await axios.post(
        `${backendUrl}/api/user/jobs/${jobId}/apply`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            token
          }
        }
      );

      toast.success('Application submitted successfully!');
      setHasApplied(true);
    } catch (error) {
      console.error('Application submission error:', error);
      toast.error(error.response?.data?.message || 'Error submitting application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-red-50 p-4 rounded-lg text-red-700">
          <p>{error}</p>
        </div>
        <button 
          onClick={() => navigate('/careers')}
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" /> Back to Jobs
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700">
          <p>Job not found.</p>
        </div>
        <button 
          onClick={() => navigate('/careers')}
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" /> Back to Jobs
        </button>
      </div>
    );
  }

  if (hasApplied) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <button 
          onClick={() => navigate('/careers')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" /> Back to Jobs
        </button>
        
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted</h2>
          <p className="text-gray-600 mb-6">
            You have successfully applied for the <span className="font-semibold">{job.title}</span> position.
            We will review your application and get back to you soon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/careers')}
              className="bg-gray-100 text-gray-800 px-6 py-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              Browse More Jobs
            </button>
            <button
              onClick={() => navigate('/my-applications')}
              className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              View My Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button 
        onClick={() => navigate('/careers')}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
      >
        <FaArrowLeft className="mr-2" /> Back to Jobs
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Details Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 -mx-6 -mt-6 px-6 py-4 rounded-t-lg border-b">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FaBuilding className="text-blue-500 text-xs" />
                  <span>{job.department}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaMapMarkerAlt className="text-blue-500 text-xs" />
                  <span>{job.location}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {job.employmentType && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {job.employmentType}
                  </span>
                )}
                {job.isActive ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    Closed
                  </span>
                )}
              </div>
            </div>
            
            <div className="py-4 space-y-4">
              <div>
                <h2 className="font-semibold text-gray-700 mb-1">Description</h2>
                <p className="text-gray-600 text-sm whitespace-pre-line">{job.description}</p>
              </div>
              
              <div>
                <h2 className="font-semibold text-gray-700 mb-1">Requirements</h2>
                <p className="text-gray-600 text-sm whitespace-pre-line">{job.requirements}</p>
              </div>
              
              {(job.salaryMin || job.salaryMax) && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <FaMoneyBillWave className="text-blue-500 text-xs" />
                  <span>
                    {job.salaryMin && job.salaryMax 
                      ? `${job.salaryMin} - ${job.salaryMax}`
                      : job.salaryMin 
                        ? `Min: ${job.salaryMin}`
                        : `Up to ${job.salaryMax}`}
                  </span>
                </div>
              )}
              
              {job.applicationDeadline && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <FaCalendarAlt className="text-blue-500 text-xs" />
                  <span>Apply by: {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                </div>
              )}
              
              <div className="border-t pt-4 mt-4">
                <h2 className="font-semibold text-gray-700 mb-1">Contact Information</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <FaEnvelope className="text-blue-500 text-xs" />
                    <span>{job.contactEmail}</span>
                  </div>
                  {job.contactPhone && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <FaPhone className="text-blue-500 text-xs" />
                      <span>{job.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Application Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Apply for this Position</h2>
            
            {!token ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-600 mb-4">Please login to apply for this position</p>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  Login to Apply
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                        formErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      formErrors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe your relevant work experience"
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      formErrors.experience ? 'border-red-500' : 'border-gray-300'
                    }`}
                  ></textarea>
                  {formErrors.experience && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.experience}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    rows="3"
                    placeholder="List your educational qualifications"
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      formErrors.education ? 'border-red-500' : 'border-gray-300'
                    }`}
                  ></textarea>
                  {formErrors.education && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.education}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Letter
                  </label>
                  <textarea
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Tell us why you are the right fit for this position"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resume (PDF) <span className="text-red-500">*</span>
                  </label>
                  <div className={`border-2 border-dashed rounded-md p-4 ${
                    formErrors.resume ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="flex flex-col items-center justify-center">
                      {resumePreview ? (
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center mr-2">
                            <FaCheck className="w-4 h-4 text-green-500" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Resume uploaded
                          </span>
                        </div>
                      ) : (
                        <FaFileUpload className="w-8 h-8 text-gray-400 mb-2" />
                      )}
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className="bg-white border border-gray-300 rounded-md px-4 py-2 cursor-pointer hover:bg-gray-50 text-sm"
                      >
                        {resumePreview ? "Change File" : "Select PDF File"}
                      </label>
                      {formErrors.resume && (
                        <p className="text-red-500 text-sm mt-2">{formErrors.resume}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Only PDF files up to 5MB are accepted
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaBriefcase className="mr-2" />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails; 