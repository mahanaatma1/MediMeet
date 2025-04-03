import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaFilePdf, FaDownload, FaTimes, FaExclamationCircle } from 'react-icons/fa';

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

const JobApplications = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    if (aToken) {
      fetchApplications();
    }
  }, [aToken]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log("Token being sent:", aToken);
      console.log("Headers:", { atoken: aToken });
      
      const [applicationsResponse, statsResponse] = await Promise.all([
        axios.get(
          `${backendUrl}/api/admin/applications`,
          { headers: { atoken: aToken } }
        ),
        axios.get(
          `${backendUrl}/api/admin/applications/stats`,
          { headers: { atoken: aToken } }
        )
      ]);
      
      if (applicationsResponse.data.success) {
        setApplications(applicationsResponse.data.applications);
      } else {
        toast.error(applicationsResponse.data.message || 'Failed to fetch applications');
      }
      
      if (statsResponse.data.success) {
        setStats({
          pending: statsResponse.data.pending || 0,
          reviewed: statsResponse.data.reviewed || 0,
          shortlisted: statsResponse.data.shortlisted || 0,
          rejected: statsResponse.data.rejected || 0,
          total: statsResponse.data.total || 0
        });
      } else {
        toast.error(statsResponse.data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await axios.put(
        `${backendUrl}/api/admin/applications/${applicationId}/status`,
        { status },
        { headers: { atoken: aToken } }
      );
      
      // Update the application in the state
      setApplications(applications.map(app => 
        app._id === applicationId ? { ...app, status } : app
      ));
      
      // Refresh stats
      fetchStats();
      
      toast.success('Application status updated successfully');
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error(error.response?.data?.message || 'Failed to update application status');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/admin/applications/stats`,
        { headers: { atoken: aToken } }
      );
      
      if (response.data.success) {
        setStats({
          pending: response.data.pending || 0,
          reviewed: response.data.reviewed || 0,
          shortlisted: response.data.shortlisted || 0,
          rejected: response.data.rejected || 0,
          total: response.data.total || 0
        });
      } else {
        toast.error(response.data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = searchTerm === '' || 
      app.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobId?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Function to view resume with authentication
  const viewResume = async (applicationId) => {
    const token = localStorage.getItem('aToken');
    console.log("Using admin token for resume view:", token ? "Token found" : "No token");
    
    // OPTION 1: Direct URL approach (works for sharing, but requires proper CORS and authentication handling)
    // Uncomment this code and comment out Option 2 when deploying to production if you want direct URLs
    /*
    const directUrl = `${backendUrl}/api/admin/job-applications/${applicationId}/resume?atoken=${encodeURIComponent(token)}`;
    window.open(directUrl, '_blank');
    */
    
    // OPTION 2: Blob URL approach (more secure, but generates temporary URLs)
    try {
      // Fetch the PDF data using axios with proper authentication
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
      
      // When hosted, the blob URL will look like: blob:https://yourdomain.com/random-id
      // These are temporary URLs that only work in the browser session where they were created
      console.log("Generated blob URL:", blobUrl);
      
      // Open the PDF in a new tab
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error("Error fetching resume:", error);
      toast.error("Failed to load resume. Please try again.");
    }
  };
  
  // Function to download resume with authentication
  const downloadResume = async (applicationId, filename = 'resume.pdf') => {
    const token = localStorage.getItem('aToken');
    console.log("Using admin token for resume download:", token ? "Token found" : "No token");
    
    try {
      // Fetch the PDF data using axios with proper authentication
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Job Applications</h2>
      
      {/* Stats Cards */}
      <div className="lg:hidden overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-min">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 w-[200px] flex-shrink-0">
            <p className="text-sm text-gray-500">Total Applications</p>
            <p className="text-2xl font-bold">{stats.total || 0}</p>
          </div>
          {statusOptions.map(status => (
            <div key={status.value} className={`bg-white rounded-lg shadow-sm p-4 border ${statusColors[status.value]} w-[200px] flex-shrink-0`}>
              <p className="text-sm">{status.label}</p>
              <p className="text-2xl font-bold">{stats[status.value] || 0}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="hidden lg:grid lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Applications</p>
          <p className="text-2xl font-bold">{stats.total || 0}</p>
        </div>
        {statusOptions.map(status => (
          <div key={status.value} className={`bg-white rounded-lg shadow-sm p-4 border ${statusColors[status.value]}`}>
            <p className="text-sm">{status.label}</p>
            <p className="text-2xl font-bold">{stats[status.value] || 0}</p>
          </div>
        ))}
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="lg:hidden overflow-x-auto pb-2">
            <div className="flex space-x-2 min-w-min">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {statusOptions.map(status => (
                <button 
                  key={status.value}
                  onClick={() => setFilter(status.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                    filter === status.value 
                      ? 'bg-blue-600 text-white' 
                      : `${statusColors[status.value]} hover:opacity-80`
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="hidden lg:flex lg:flex-wrap lg:gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {statusOptions.map(status => (
              <button 
                key={status.value}
                onClick={() => setFilter(status.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === status.value 
                    ? 'bg-blue-600 text-white' 
                    : `${statusColors[status.value]} hover:opacity-80`
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <svg 
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        {/* Mobile View */}
        <div className="lg:hidden space-y-4 p-4">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No applications found
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div key={application._id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                {/* Applicant Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{application.fullName}</h3>
                    <p className="text-sm text-gray-500">{application.email}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    statusColors[application.status]
                  }`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>

                {/* Job Details */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-900">{application.jobId?.title || 'N/A'}</h4>
                  <p className="text-sm text-gray-500">{application.jobId?.department || 'N/A'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Applied on {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedApplication(application)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => viewResume(application._id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Resume
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => (
                  <tr key={application._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{application.fullName}</div>
                          <div className="text-sm text-gray-500">{application.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{application.jobId?.title || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{application.jobId?.department || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[application.status]
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => viewResume(application._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Resume
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Application Details</h2>
              <button onClick={() => setSelectedApplication(null)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {selectedApplication.jobId?.title || 'Job Title Unavailable'}
              </h3>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Department:</span> {selectedApplication.jobId?.department || 'N/A'}</p>
                <p><span className="font-medium">Location:</span> {selectedApplication.jobId?.location || 'N/A'}</p>
                <p><span className="font-medium">Applied on:</span> {new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Personal Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Full Name:</span> {selectedApplication.fullName}</p>
                  <p><span className="font-medium">Email:</span> {selectedApplication.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedApplication.phone}</p>
                  <p><span className="font-medium">Address:</span> {selectedApplication.address}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Qualifications</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Experience:</span> {selectedApplication.experience}</p>
                  <p><span className="font-medium">Education:</span> {selectedApplication.education}</p>
                </div>
              </div>
            </div>
            
            {selectedApplication.coverLetter && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Cover Letter</h4>
                <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-600 border border-gray-200">
                  {selectedApplication.coverLetter}
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">Resume</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaFilePdf className="w-5 h-5 text-red-500" />
                  <span className="text-sm">{selectedApplication.resumeName || 'Resume.pdf'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => viewResume(selectedApplication._id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaFilePdf className="w-4 h-4 mr-1.5" />
                    View Resume
                  </button>
                  <button
                    onClick={() => downloadResume(selectedApplication._id, selectedApplication.resumeName || 'resume.pdf')}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaDownload className="w-4 h-4 mr-1.5" />
                    Download
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>Note: The resume is stored securely and can only be accessed by authorized personnel.</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-700 mb-2">Update Application Status</h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(status => (
                  <button
                    key={status.value}
                    onClick={() => updateApplicationStatus(selectedApplication._id, status.value)}
                    disabled={selectedApplication.status === status.value}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedApplication.status === status.value
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : `${statusColors[status.value]} hover:opacity-80`
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplications; 