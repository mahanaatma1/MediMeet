import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaFilePdf, FaDownload, FaExclamationCircle, FaEye } from 'react-icons/fa';

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
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (aToken) {
      fetchApplications();
    }
  }, [aToken]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
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

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = searchTerm === '' || 
      app.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobId?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Function to view application details
  const viewApplication = (applicationId) => {
    navigate(`/job-applications/view/${applicationId}`);
  };
  
  // Function to download resume with authentication
  const downloadResume = async (applicationId, applicantName, event) => {
    event.stopPropagation(); // Prevent row click event
    
    const token = localStorage.getItem('aToken');
    const filename = `${applicantName.replace(/\s+/g, '_')}_resume.pdf`;
    
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="p-6 w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Job Applications</h1>
      
      {/* Stats Section */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Shortlisted</p>
          <p className="text-2xl font-bold text-green-600">{stats.shortlisted || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected || 0}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search by name, email or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded bg-white"
        >
          <option value="all">All Applications</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      
      {/* Applications List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FaExclamationCircle className="text-gray-400 text-5xl mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Applications Found</h3>
          <p className="text-gray-500">
            {searchTerm
              ? "No applications match your search criteria."
              : filter !== 'all'
                ? `No applications with status "${filter}".`
                : "There are currently no job applications in the system."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr 
                    key={application._id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => viewApplication(application._id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{application.fullName}</div>
                          <div className="text-sm text-gray-500">{application.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {application.jobId?.title || "Unknown Job"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {application.jobId?.department || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(application.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[application.status]}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => downloadResume(application._id, application.fullName, e)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        title="Download Resume"
                      >
                        <FaDownload /> Resume
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewApplication(application._id);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                      >
                        <FaEye /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplications; 