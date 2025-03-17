import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const MyApplications = () => {
  const { token } = useContext(AppContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/my-applications`,
          { headers: { token } }
        );
        console.log("Applications data:", response.data.applications);
        setApplications(response.data.applications);
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch your applications');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchApplications();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Applications</h2>
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
          <p className="text-gray-600">You haven't applied for any jobs yet.</p>
          <button 
            onClick={() => window.location.href = '/careers'}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">My Applications</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.map((application) => (
          <div key={application._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{application.jobId?.title || 'Job Title Unavailable'}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[application.status]}`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Applied on:</span> {new Date(application.createdAt).toLocaleDateString()}</p>
                <p><span className="font-medium">Department:</span> {application.jobId?.department || 'N/A'}</p>
                <p><span className="font-medium">Location:</span> {application.jobId?.location || 'N/A'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyApplications; 