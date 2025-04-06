import { useState, useEffect, useContext } from 'react';
import { DoctorContext } from '../context/DoctorContext';
import { 
  FaTimes, 
  FaFilePdf, 
  FaEdit, 
  FaCalendarPlus,
  FaPrescriptionBottle,
  FaStethoscope,
  FaNotesMedical
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const PrescriptionView = ({ 
  prescription, 
  onClose, 
  onEdit = null, // Will be provided for doctors only
  appointmentDetails = null 
}) => {
  const { backendUrl, dToken } = useContext(DoctorContext);
  const [isLoading, setIsLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };
  
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const headers = { dtoken: dToken };
      
      const response = await axios.get(
        `${backendUrl}/api/prescription/download/${prescription._id}`,
        {
          headers,
          responseType: 'blob'
        }
      );
      
      // Create a blob from the PDF Stream
      const file = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a link to download
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `prescription_${prescription._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);
      toast.success('Prescription downloaded successfully');
    } catch (error) {
      console.error('Error downloading prescription:', error);
      toast.error('Failed to download prescription');
    } finally {
      setDownloading(false);
    }
  };
  
  // Add to calendar
  const addToCalendar = () => {
    if (!prescription.followUpDate) return;
    
    // Create Google Calendar URL
    const followUpDate = new Date(prescription.followUpDate);
    const endDate = new Date(followUpDate);
    endDate.setHours(followUpDate.getHours() + 1);
    
    const text = `Follow-up appointment for ${prescription.diagnosis}`;
    const details = prescription.followUpInstructions || 'Medical follow-up appointment';
    
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${followUpDate.toISOString().replace(/-|:|\.\d+/g, '')
}/${endDate.toISOString().replace(/-|:|\.\d+/g, '')}&details=${encodeURIComponent(details)}`;
    
    window.open(gCalUrl, '_blank');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header with Close Button */}
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaPrescriptionBottle className="mr-2 text-blue-600" />
              Prescription Details
            </h2>
            <div className="flex items-center space-x-2">
              {/* Download PDF Button */}
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <FaFilePdf className="mr-2" />
                    Download PDF
                  </>
                )}
              </button>
              
              {/* Edit Button (Doctors Only) */}
              {onEdit && (
                <button
                  onClick={() => onEdit(prescription)}
                  className="bg-yellow-500 text-white px-3 py-2 rounded-md hover:bg-yellow-600 transition-colors flex items-center"
                >
                  <FaEdit className="mr-2" />
                  Edit
                </button>
              )}
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Prescription Content */}
          <div className="mb-8">
            {/* Patient & Doctor Info */}
            {appointmentDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Patient Information</h3>
                  <p className="text-gray-700"><span className="font-medium">Name:</span> {appointmentDetails.userName}</p>
                  <p className="text-gray-700"><span className="font-medium">Email:</span> {appointmentDetails.userEmail}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Doctor Information</h3>
                  <p className="text-gray-700"><span className="font-medium">Name:</span> {appointmentDetails.docName}</p>
                  <p className="text-gray-700"><span className="font-medium">Specialty:</span> {appointmentDetails.docSpeciality}</p>
                </div>
              </div>
            )}
            
            {/* Appointment Info */}
            {appointmentDetails && (
              <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <FaStethoscope className="mr-2 text-blue-600" />
                  Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <p className="text-gray-700"><span className="font-medium">Date:</span> {appointmentDetails.date}</p>
                  <p className="text-gray-700"><span className="font-medium">Time:</span> {appointmentDetails.timeSlot}</p>
                  <p className="text-gray-700"><span className="font-medium">Type:</span> {appointmentDetails.appointmentType}</p>
                </div>
              </div>
            )}
            
            {/* Diagnosis */}
            {prescription.diagnosis && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <FaNotesMedical className="mr-2 text-red-600" />
                  Diagnosis
                </h3>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-gray-700">{prescription.diagnosis}</p>
                </div>
              </div>
            )}
            
            {/* Medications */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Medications</h3>
              <div className="space-y-4">
                {prescription.medications.map((med, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 text-lg border-b border-blue-200 pb-2 mb-2">{med.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <p className="text-gray-700"><span className="font-medium">Dosage:</span> {med.dosage}</p>
                      <p className="text-gray-700"><span className="font-medium">Frequency:</span> {med.frequency}</p>
                      <p className="text-gray-700"><span className="font-medium">Duration:</span> {med.duration}</p>
                      {med.timing && <p className="text-gray-700"><span className="font-medium">Timing:</span> {med.timing}</p>}
                    </div>
                    {med.instructions && (
                      <div className="mt-2 bg-white p-2 rounded border border-blue-100">
                        <p className="text-gray-700"><span className="font-medium">Special Instructions:</span> {med.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            {prescription.notes && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Additional Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{prescription.notes}</p>
                </div>
              </div>
            )}
            
            {/* Follow-up Information */}
            {prescription.followUpDate && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <FaCalendarPlus className="mr-2 text-green-600" />
                  Follow-Up Information
                </h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Follow-up Date:</span> {formatDate(prescription.followUpDate)}
                    </p>
                    <button
                      onClick={addToCalendar}
                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center"
                    >
                      <FaCalendarPlus className="mr-1" />
                      Add to Calendar
                    </button>
                  </div>
                  {prescription.followUpInstructions && (
                    <p className="text-gray-700"><span className="font-medium">Instructions:</span> {prescription.followUpInstructions}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Prescription Details */}
            <div className="text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
              <p>Prescription ID: {prescription._id}</p>
              <p>Created: {formatDate(prescription.createdAt)}</p>
              {prescription.updatedAt !== prescription.createdAt && (
                <p>Last Updated: {formatDate(prescription.updatedAt)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionView; 