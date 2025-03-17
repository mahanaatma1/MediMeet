import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus, FaBriefcase, FaMapMarkerAlt, FaBuilding, 
  FaEnvelope, FaPhone, FaMoneyBillWave, FaClock, FaCalendarAlt, FaTimes } from 'react-icons/fa';

const JobManagement = () => {
  const { aToken } = useContext(AdminContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [formErrors, setFormErrors] = useState({});
  
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

  // Fetch all jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/jobs`, {
        headers: {
          atoken: aToken
        }
      });
      setJobs(response.data.jobs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aToken) {
      fetchJobs();
    }
  }, [aToken]);

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

  // Open modal for adding a new job
  const handleAddJob = () => {
    setFormData({
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
    setFormErrors({});
    setActiveTab('basic');
    setEditMode(false);
    setShowModal(true);
  };

  // Open modal for editing a job
  const handleEditJob = (job) => {
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      description: job.description,
      requirements: job.requirements,
      contactEmail: job.contactEmail,
      contactPhone: job.contactPhone,
      isActive: job.isActive,
      employmentType: job.employmentType || 'Full-time',
      salaryMin: job.salaryMin || '',
      salaryMax: job.salaryMax || '',
      applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split('T')[0] : '',
      postedDate: job.postedDate ? job.postedDate.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setActiveTab('basic');
    setCurrentJob(job);
    setEditMode(true);
    setShowModal(true);
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
      if (editMode) {
        // Update existing job
        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/jobs/${currentJob._id}`,
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
      
      setShowModal(false);
      fetchJobs();
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error(error.response?.data?.message || 'Failed to save job');
    }
  };

  // Delete a job
  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/jobs/${jobId}`, {
          headers: {
            atoken: aToken
          }
        });
        toast.success('Job deleted successfully');
        fetchJobs();
      } catch (error) {
        console.error('Error deleting job:', error);
        toast.error('Failed to delete job');
      }
    }
  };

  // Employment type options
  const employmentTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Temporary',
    'Internship',
    'Volunteer'
  ];

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Job Management</h1>
        <button
          onClick={handleAddJob}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <FaPlus /> Add New Job
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="spinner"></div>
          <p className="mt-2 text-gray-600">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
          <FaBriefcase className="mx-auto text-gray-400 text-5xl mb-4" />
          <p className="text-gray-600 text-lg mb-4">No jobs found. Add your first job listing!</p>
          <button
            onClick={handleAddJob}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 mx-auto transition-colors"
          >
            <FaPlus /> Add New Job
          </button>
        </div>
      ) : (
        <div>
          {/* Mobile View */}
          <div className="lg:hidden space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <FaBuilding className="text-gray-400" />
                        <span className="text-sm text-gray-600">{job.department}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        job.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {job.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaMapMarkerAlt className="text-gray-400" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaMoneyBillWave className="text-gray-400" />
                      <span>{job.salaryMin} - {job.salaryMax}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaClock className="text-gray-400" />
                      <span>{job.employmentType}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <button
                      onClick={() => handleEditJob(job)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1 text-sm"
                    >
                      <FaEdit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center gap-1 text-sm"
                    >
                      <FaTrash size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Title</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Department</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Location</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Status</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">{job.title}</td>
                    <td className="py-3 px-4 text-gray-700">{job.department}</td>
                    <td className="py-3 px-4 text-gray-700">{job.location}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {job.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditJob(job)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit job"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete job"
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaBriefcase className="text-blue-600" />
                {editMode ? 'Edit Job' : 'Add New Job'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b">
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'basic' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Info
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'details' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Job Details
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'contact' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('contact')}
              >
                Contact Info
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
              <form onSubmit={handleSubmit}>
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <FaBriefcase className="inline mr-2 text-gray-500" />
                          Job Title*
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.title ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g. Senior Medical Officer"
                        />
                        {formErrors.title && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <FaBuilding className="inline mr-2 text-gray-500" />
                          Department*
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.department ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g. Cardiology"
                        />
                        {formErrors.department && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.department}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <FaMapMarkerAlt className="inline mr-2 text-gray-500" />
                          Location*
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.location ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g. New York, NY"
                        />
                        {formErrors.location && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.location}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <FaClock className="inline mr-2 text-gray-500" />
                          Employment Type
                        </label>
                        <select
                          name="employmentType"
                          value={formData.employmentType}
                          onChange={handleChange}
                          className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {employmentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <FaMoneyBillWave className="inline mr-2 text-gray-500" />
                          Salary Range (Min)
                        </label>
                        <input
                          type="number"
                          name="salaryMin"
                          value={formData.salaryMin}
                          onChange={handleChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.salaryMin ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g. 50000"
                        />
                        {formErrors.salaryMin && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.salaryMin}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <FaMoneyBillWave className="inline mr-2 text-gray-500" />
                          Salary Range (Max)
                        </label>
                        <input
                          type="number"
                          name="salaryMax"
                          value={formData.salaryMax}
                          onChange={handleChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.salaryMax ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g. 80000"
                        />
                        {formErrors.salaryMax && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.salaryMax}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <FaCalendarAlt className="inline mr-2 text-gray-500" />
                          Application Deadline
                        </label>
                        <input
                          type="date"
                          name="applicationDeadline"
                          value={formData.applicationDeadline}
                          onChange={handleChange}
                          className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center h-full pt-6">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Job Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Description*
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className={`w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                        rows="6"
                        placeholder="Provide a detailed description of the job role, responsibilities, and expectations..."
                      ></textarea>
                      {formErrors.description && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Tip: Include key responsibilities, day-to-day activities, and reporting structure.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Requirements*
                      </label>
                      <textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleChange}
                        className={`w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.requirements ? 'border-red-500' : 'border-gray-300'
                        }`}
                        rows="6"
                        placeholder="List qualifications, skills, experience, and education requirements..."
                      ></textarea>
                      {formErrors.requirements && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.requirements}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Tip: Use bullet points for better readability. Include both required and preferred qualifications.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Contact Info Tab */}
                {activeTab === 'contact' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <FaEnvelope className="inline mr-2 text-gray-500" />
                          Contact Email*
                        </label>
                        <input
                          type="email"
                          name="contactEmail"
                          value={formData.contactEmail}
                          onChange={handleChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.contactEmail ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g. careers@medimeet.com"
                        />
                        {formErrors.contactEmail && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.contactEmail}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <FaPhone className="inline mr-2 text-gray-500" />
                          Contact Phone*
                        </label>
                        <input
                          type="text"
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={handleChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.contactPhone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g. (123) 456-7890"
                        />
                        {formErrors.contactPhone && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.contactPhone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                      <h3 className="text-sm font-medium text-blue-800 mb-2">Contact Information Note</h3>
                      <p className="text-sm text-blue-700">
                        This contact information will be visible to job applicants. Make sure it's monitored regularly.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Form Actions */}
                <div className="flex justify-between mt-8 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <div className="flex space-x-3">
                    {activeTab !== 'basic' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab(activeTab === 'details' ? 'basic' : 'details')}
                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        Previous
                      </button>
                    )}
                    
                    {activeTab !== 'contact' ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab(activeTab === 'basic' ? 'details' : 'contact')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {editMode ? 'Update Job' : 'Add Job'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement; 