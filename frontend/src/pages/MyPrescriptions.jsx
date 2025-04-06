import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { formatDate } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'

const MyPrescriptions = () => {
    const { backendUrl, token } = useContext(AppContext)
    const navigate = useNavigate()
    
    const [prescriptions, setPrescriptions] = useState([])
    const [loading, setLoading] = useState(true)

    // Get all user prescriptions
    const getUserPrescriptions = async () => {
        try {
            setLoading(true)
            
            console.log("Fetching prescriptions with token:", token ? "Token exists" : "No token");
            
            const { data } = await axios.get(
                `${backendUrl}/api/prescription/patient`, 
                { headers: { token } }
            )
            
            console.log("Prescription API response:", data);
            
            if (data.success) {
                setPrescriptions(data.data)
                
                if (data.data.length === 0) {
                    console.log("No prescriptions found for this user");
                }
            } else {
                toast.error(data.message || 'Error fetching prescriptions')
                console.error("Failed to fetch prescriptions:", data.message);
            }
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            
            // More detailed error logging
            if (error.response) {
                // The request was made and the server responded with a status code
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
                toast.error(error.response?.data?.message || `Error: ${error.response.status}`);
            } else if (error.request) {
                // The request was made but no response was received
                console.error("No response received:", error.request);
                toast.error("No response from server. Please check your connection.");
            } else {
                // Something happened in setting up the request
                console.error("Error setting up request:", error.message);
                toast.error(error.message || 'Failed to fetch prescriptions');
            }
        } finally {
            setLoading(false)
        }
    }

    // Navigate to prescription details page
    const handleViewPrescription = (prescriptionId) => {
        navigate(`/my-prescriptions/${prescriptionId}`);
    }

    // Load prescriptions when component mounts
    useEffect(() => {
        if (token) {
            getUserPrescriptions()
        }
    }, [token])

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">My Prescriptions</h1>
                <div className="flex justify-center items-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">My Prescriptions</h1>
            
            {prescriptions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                    <div className="text-gray-500 mb-4">No prescriptions found</div>
                    <p className="text-sm text-gray-500">
                        After completing an appointment, your doctor may create prescriptions that will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prescriptions.map((prescription) => {
                        console.log("Rendering prescription card:", prescription);
                        return (
                            <div 
                                key={prescription._id} 
                                className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="bg-blue-100 p-2 rounded-lg mr-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">
                                                {prescription.diagnosis ? (
                                                    <span>{prescription.diagnosis.substring(0, 30)}{prescription.diagnosis.length > 30 ? '...' : ''}</span>
                                                ) : (
                                                    <span>Prescription</span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {prescription.doctorData?.name || 'Doctor'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4 text-sm">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-600">Date:</span>
                                            <span className="text-gray-800 font-medium">
                                                {formatDate(prescription.createdAt)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`font-medium ${
                                                prescription.status === 'active' 
                                                    ? 'text-green-600' 
                                                    : 'text-red-600'
                                            }`}>
                                                {prescription.status === 'active' ? 'Active' : 'Expired'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Medications:</span>
                                            <span className="text-gray-800 font-medium">
                                                {prescription.medications?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex mt-4">
                                        <button
                                            onClick={() => handleViewPrescription(prescription._id)}
                                            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default MyPrescriptions 