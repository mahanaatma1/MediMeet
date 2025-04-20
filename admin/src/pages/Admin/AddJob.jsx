import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

const AddJob = () => {
  const { aToken } = useContext(AdminContext);
  const navigate = useNavigate();
  const { jobId } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formErrors, setFormErrors] = useState({});
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
    requirements: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
    employmentType: 'Full-time',
    salaryMin: '',
    salaryMax: '',
    applicationDeadline: '',
    postedDate: new Date().toISOString().split('T')[0]
  });

  // Employment type options
  const employmentTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Temporary',
    'Internship',
    'Volunteer'
  ];

  // Fetch job details if in edit mode
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/jobs/${jobId}`,
          {
            headers: {
              atoken: aToken
            }
          }
        );

        const job = response.data.job;
        
        setFormData({
          title: job.title || '',
          department: job.department || '',
          location: job.location || '',
          description: job.description || '',
          requirements: job.requirements || '',
          contactEmail: job.contactEmail || '',
          contactPhone: job.contactPhone || '',
          isActive: job.isActive !== undefined ? job.isActive : true,
          employmentType: job.employmentType || 'Full-time',
          salaryMin: job.salaryMin || '',
          salaryMax: job.salaryMax || '',
          applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split('T')[0] : '',
          postedDate: job.postedDate ? job.postedDate.split('T')[0] : new Date().toISOString().split('T')[0]
        });
        
        setEditMode(true);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching job details:', error);
        toast.error('Failed to fetch job details');
        navigate('/job-management');
      }
    };

    if (aToken) {
      fetchJobDetails();
    }
  }, [aToken, jobId, navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Job title is required';
    if (!formData.department.trim()) errors.department = 'Department is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.requirements.trim()) errors.requirements = 'Requirements are required';
    
    if (!formData.contactEmail.trim()) {
      errors.contactEmail = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      errors.contactEmail = 'Invalid email format';
    }
    
    if (!formData.contactPhone.trim()) errors.contactPhone = 'Contact phone is required';
    
    if (formData.salaryMin && formData.salaryMax && 
        Number(formData.salaryMin) > Number(formData.salaryMax)) {
      errors.salaryMin = 'Minimum salary cannot be greater than maximum';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form to add or update a job
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Find the first tab with errors and switch to it
      if (formErrors.title || formErrors.department || formErrors.location || 
          formErrors.employmentType || formErrors.salaryMin || formErrors.salaryMax) {
        setActiveTab('basic');
      } else if (formErrors.description || formErrors.requirements) {
        setActiveTab('details');
      } else if (formErrors.contactEmail || formErrors.contactPhone) {
        setActiveTab('contact');
      }
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (editMode) {
        // Update existing job
        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/jobs/${jobId}`,
          formData,
          {
            headers: {
              atoken: aToken,
              'Content-Type': 'application/json'
            }
          }
        );
        toast.success('Job updated successfully');
      } else {
        // Add new job
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/add-job`,
          formData,
          {
            headers: {
              atoken: aToken,
              'Content-Type': 'application/json'
            }
          }
        );
        toast.success('Job added successfully');
      }
      
      navigate('/job-management');
      
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error(error.response?.data?.message || 'Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/job-management')} 
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {editMode ? 'Edit Job Posting' : 'Add New Job'}
          </h1>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          <FaSave /> {submitting ? 'Saving...' : 'Save Job'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading job details...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          {/* Tabs navigation */}
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 ${activeTab === 'basic' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Info
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'details' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('details')}
            >
              Job Details
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'contact' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('contact')}
            >
              Contact Info
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Info Tab */}
            <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="title">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded ${formErrors.title ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="department">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded ${formErrors.department ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.department && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.department}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="location">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded ${formErrors.location ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.location && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="employmentType">
                    Employment Type
                  </label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    {employmentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="salaryMin">
                    Minimum Salary
                  </label>
                  <input
                    type="number"
                    id="salaryMin"
                    name="salaryMin"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded ${formErrors.salaryMin ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.salaryMin && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.salaryMin}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="salaryMax">
                    Maximum Salary
                  </label>
                  <input
                    type="number"
                    id="salaryMax"
                    name="salaryMax"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded ${formErrors.salaryMax ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.salaryMax && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.salaryMax}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="applicationDeadline">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    id="applicationDeadline"
                    name="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="postedDate">
                    Posted Date
                  </label>
                  <input
                    type="date"
                    id="postedDate"
                    name="postedDate"
                    value={formData.postedDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary"
                    />
                    <span className="text-gray-700">Active Job Posting</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Job Details Tab */}
            <div className={activeTab === 'details' ? 'block' : 'hidden'}>
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="description">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="6"
                    className={`w-full p-2 border rounded ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                  ></textarea>
                  {formErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="requirements">
                    Requirements <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    rows="6"
                    className={`w-full p-2 border rounded ${formErrors.requirements ? 'border-red-500' : 'border-gray-300'}`}
                  ></textarea>
                  {formErrors.requirements && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.requirements}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info Tab */}
            <div className={activeTab === 'contact' ? 'block' : 'hidden'}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="contactEmail">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded ${formErrors.contactEmail ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.contactEmail && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.contactEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="contactPhone">
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded ${formErrors.contactPhone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.contactPhone && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.contactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/job-management')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              
              <div className="flex gap-3">
                {activeTab !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'details' ? 'basic' : 'details')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Previous
                  </button>
                )}
                
                {activeTab !== 'contact' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'basic' ? 'details' : 'contact')}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {submitting ? 'Saving...' : 'Save Job'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddJob; 