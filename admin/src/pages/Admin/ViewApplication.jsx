import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaFilePdf, FaDownload, FaEnvelope, FaPhone, FaBuilding, 
  FaMapMarkerAlt, FaCalendarAlt, FaBriefcase, FaGraduationCap, FaUserTie, FaSave } from 'react-icons/fa';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
  shortlisted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' }
];

const ViewApplication = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const { applicationId } = useParams();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  
  useEffect(() => {
    if (aToken && applicationId) {
      fetchApplicationDetails();
    }
  }, [aToken, applicationId]);
  
  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      
      // Use the direct endpoint to get application by ID
      const response = await axios.get(
        `${backendUrl}/api/admin/applications/${applicationId}`,
        { headers: { atoken: aToken } }
      );
      
      if (response.data.success && response.data.application) {
        setApplication(response.data.application);
        setSelectedStatus(response.data.application.status);
      } else {
        toast.error(response.data.message || 'Failed to fetch application details');
        navigate('/job-applications');
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch application details');
      navigate('/job-applications');
    } finally {
      setLoading(false);
    }
  };
  
  const updateApplicationStatus = async () => {
    if (selectedStatus === application.status) {
      return; // No change in status
    }
    
    try {
      setSubmitting(true);
      
      // Use the correct endpoint for updating application status
      await axios.put(
        `${backendUrl}/api/admin/applications/${applicationId}/status`,
        { status: selectedStatus },
        { headers: { atoken: aToken } }
      );
      
      // Update the application in the state
      setApplication({ ...application, status: selectedStatus });
      toast.success('Application status updated successfully');
      
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error(error.response?.data?.message || 'Failed to update application status');
    } finally {
      setSubmitting(false);
    }
  };

  // Function to view resume with authentication
  const viewResume = async () => {
    const token = localStorage.getItem('aToken');
    
    try {
      // Using the endpoint that worked in JobApplications
      const response = await axios.get(
        `${backendUrl}/api/admin/job-applications/${applicationId}/resume`,
        {
          headers: { atoken: token },
          responseType: 'blob' // Important: We need the response as a blob
        }
      );
      
      // Create a Blob URL from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Open the PDF in a new tab
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error("Error fetching resume:", error);
      toast.error("Failed to load resume. Please try again.");
    }
  };
  
  // Function to download resume with authentication
  const downloadResume = async () => {
    const token = localStorage.getItem('aToken');
    const filename = `${application.fullName.replace(/\s+/g, '_')}_resume.pdf`;
    
    try {
      // Using the endpoint that worked in JobApplications
      const response = await axios.get(
        `${backendUrl}/api/admin/job-applications/${applicationId}/resume`,
        {
          headers: { atoken: token },
          responseType: 'blob' // Important: We need the response as a blob
        }
      );
      
      // Create a Blob URL from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a link to download the file
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast.error("Failed to download resume. Please try again.");
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="p-6 w-full">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate('/job-applications')} 
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Application Details
          </h1>
        </div>
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }
  
  if (!application) {
    return (
      <div className="p-6 w-full">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate('/job-applications')} 
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Application Not Found
          </h1>
        </div>
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          The requested application could not be found or you don't have permission to view it.
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/job-applications')} 
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Application Details
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={updateApplicationStatus}
            disabled={submitting || selectedStatus === application.status}
            className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <FaSave /> {submitting ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applicant Information */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Applicant Information</h2>
            
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="bg-blue-50 rounded-lg p-6 w-full md:w-64 flex-shrink-0">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaUserTie className="text-blue-500 text-2xl" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">{application.fullName}</h3>
                  
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${statusColors[application.status]}`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                    <FaEnvelope className="text-blue-400" />
                    <span className="truncate">{application.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <FaPhone className="text-blue-400" />
                    <span>{application.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Date Applied</h4>
                    <p className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400" />
                      <span>{formatDate(application.appliedDate || application.createdAt)}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Current Location</h4>
                    <p className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-gray-400" />
                      <span>{application.location || application.address || 'Not specified'}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Current Position</h4>
                    <p className="flex items-center gap-2">
                      <FaBriefcase className="text-gray-400" />
                      <span>{application.currentPosition || 'Not specified'}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Experience</h4>
                    <p className="flex items-center gap-2">
                      <FaUserTie className="text-gray-400" />
                      <span>{application.experience || 'Not specified'}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Expected Salary</h4>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-400">$</span>
                      <span>{application.expectedSalary || 'Not specified'}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Education</h4>
                    <p className="flex items-center gap-2">
                      <FaGraduationCap className="text-gray-400" />
                      <span>{application.education || 'Not specified'}</span>
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Cover Letter / Additional Information</h4>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700 max-h-48 overflow-y-auto">
                    {application.coverLetter || 'No cover letter provided.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Resume</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={viewResume}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors"
              >
                <FaFilePdf /> View Resume
              </button>
              
              <button
                onClick={downloadResume}
                className="flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <FaDownload /> Download
              </button>
            </div>
          </div>
        </div>
        
        {/* Job Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Job Information</h2>
          
          {application.jobId ? (
            <div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-bold text-lg text-gray-800 mb-1">{application.jobId.title}</h3>
                <div className="text-sm text-gray-600 mb-2">{application.jobId.department}</div>
                
                <div className="flex items-center gap-2 text-sm text-gray-700 mt-3">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <span>{application.jobId.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                  <FaBriefcase className="text-gray-400" />
                  <span>{application.jobId.employmentType}</span>
                </div>
                
                {(application.jobId.salaryMin || application.jobId.salaryMax) && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                    <span className="text-gray-400">$</span>
                    <span>
                      {application.jobId.salaryMin && application.jobId.salaryMax 
                        ? `${application.jobId.salaryMin} - ${application.jobId.salaryMax}`
                        : application.jobId.salaryMin || application.jobId.salaryMax}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Job Description</h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                  {application.jobId.description}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Requirements</h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                  {application.jobId.requirements}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
              Job information is not available or has been deleted.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewApplication; 