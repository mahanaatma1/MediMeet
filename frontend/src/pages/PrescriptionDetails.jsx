import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/helpers';
import { 
  FaArrowLeft, 
  FaFilePdf, 
  FaStethoscope,
  FaPrescriptionBottle,
  FaNotesMedical,
  FaCalendarPlus
} from 'react-icons/fa';

const PrescriptionDetails = () => {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, token } = useContext(AppContext);
  
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Fetch prescription details when component mounts
    const fetchPrescriptionDetails = async () => {
      try {
        setLoading(true);
        
        // Get prescription details by ID
        const response = await axios.get(
          `${backendUrl}/api/prescription/view/${prescriptionId}`,
          { headers: { token } }
        );
        
        if (response.data.success) {
          const prescriptionData = response.data.data;
          
          // Get additional patient and doctor data if needed
          if (!prescriptionData.patientData || !prescriptionData.doctorData) {
            try {
              // Get patient data if missing
              if (prescriptionData.patientId && (!prescriptionData.patientData || !prescriptionData.patientData.name)) {
                const userResponse = await axios.get(
                  `${backendUrl}/api/user/${prescriptionData.patientId}`,
                  { headers: { token } }
                );
                
                if (userResponse.data.success) {
                  prescriptionData.patientData = userResponse.data.userData;
                }
              }
              
              // Get doctor data if missing
              if (prescriptionData.doctorId && (!prescriptionData.doctorData || !prescriptionData.doctorData.name)) {
                const doctorResponse = await axios.get(
                  `${backendUrl}/api/doctor/${prescriptionData.doctorId}`,
                  { headers: { token } }
                );
                
                if (doctorResponse.data.success) {
                  prescriptionData.doctorData = doctorResponse.data.doctor;
                }
              }
              
              // Get appointment data if missing
              if (prescriptionData.appointmentId && (!prescriptionData.appointmentData || !prescriptionData.appointmentData.slotTime)) {
                const appointmentResponse = await axios.get(
                  `${backendUrl}/api/meeting/appointment/${prescriptionData.appointmentId}`,
                  { headers: { token } }
                );
                
                if (appointmentResponse.data.success) {
                  prescriptionData.appointmentData = appointmentResponse.data.appointment;
                }
              }
            } catch (additionalDataError) {
              console.error('Error fetching additional prescription data:', additionalDataError);
            }
          }
          
          setPrescription(prescriptionData);
        } else {
          toast.error(response.data.message || 'Failed to load prescription details');
          navigate('/my-prescriptions');
        }
      } catch (error) {
        console.error('Error loading prescription details:', error);
        toast.error(error.response?.data?.message || 'Failed to load prescription details');
        navigate('/my-prescriptions');
      } finally {
        setLoading(false);
      }
    };

    if (token && prescriptionId) {
      fetchPrescriptionDetails();
    }
  }, [prescriptionId, token, backendUrl, navigate]);

  const handleDownloadPDF = async () => {
    if (!prescription || !prescription._id) {
      toast.error("Prescription data is missing");
      return;
    }
    
    setDownloading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/api/prescription/download/${prescription._id}`,
        {
          headers: { token },
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
    
    const text = `Follow-up appointment for ${prescription.diagnosis || 'Medical consultation'}`;
    const details = prescription.followUpInstructions || 'Medical follow-up appointment';
    
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${followUpDate.toISOString().replace(/-|:|\.\d+/g, '')
}/${endDate.toISOString().replace(/-|:|\.\d+/g, '')}&details=${encodeURIComponent(details)}`;
    
    window.open(gCalUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-500 mb-4">Prescription not found</div>
          <button
            onClick={() => navigate('/my-prescriptions')}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Prescriptions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header with Back Button */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/my-prescriptions')}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Prescriptions
        </button>
        
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
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        {/* Title */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center">
            <FaPrescriptionBottle className="mr-2" />
            Prescription Details
          </h1>
          <p className="text-blue-100">
            Issued on {formatDate(prescription.createdAt)}
          </p>
        </div>
        
        <div className="p-6">
          {/* Patient & Doctor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Patient Information</h3>
              <p className="text-gray-700"><span className="font-medium">Name:</span> {prescription.patientData?.name || prescription.userData?.name || "Not available"}</p>
              <p className="text-gray-700"><span className="font-medium">Email:</span> {prescription.patientData?.email || prescription.userData?.email || "Not available"}</p>
              {(prescription.patientData?.phone || prescription.userData?.phone) && (
                <p className="text-gray-700"><span className="font-medium">Phone:</span> {prescription.patientData?.phone || prescription.userData?.phone}</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Doctor Information</h3>
              <p className="text-gray-700"><span className="font-medium">Name:</span> {prescription.doctorData?.name || prescription.docData?.name || "Not available"}</p>
              <p className="text-gray-700"><span className="font-medium">Specialty:</span> {prescription.doctorData?.speciality || prescription.docData?.speciality || "Not available"}</p>
              {(prescription.doctorData?.experience || prescription.docData?.experience) && (
                <p className="text-gray-700"><span className="font-medium">Experience:</span> {prescription.doctorData?.experience || prescription.docData?.experience}</p>
              )}
            </div>
          </div>
          
          {/* Appointment Info */}
          <div className="mb-8 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
              <FaStethoscope className="mr-2 text-blue-600" />
              Appointment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <p className="text-gray-700"><span className="font-medium">Date:</span> {formatDate(
                prescription.appointmentData?.slotDate || 
                prescription.appointment?.slotDate || 
                prescription.createdAt
              )}</p>
              <p className="text-gray-700"><span className="font-medium">Time:</span> {
                prescription.appointmentData?.slotTime || 
                prescription.appointment?.slotTime || 
                "Not available"
              }</p>
              <p className="text-gray-700"><span className="font-medium">Type:</span> {
                prescription.appointmentData?.appointmentType || 
                prescription.appointment?.appointmentType || 
                "Consultation"
              }</p>
            </div>
          </div>
          
          {/* Status Banner */}
          <div className={`mb-8 p-3 rounded-lg text-center ${
            prescription.status === 'active' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <p className="font-semibold">
              Status: {prescription.status === 'active' ? 'Active' : 'Expired'}
            </p>
          </div>
          
          {/* Diagnosis */}
          {prescription.diagnosis && (
            <div className="mb-8">
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
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Medications</h3>
            {prescription.medications.length > 0 ? (
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
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-gray-600">No medications prescribed</p>
              </div>
            )}
          </div>
          
          {/* Notes */}
          {prescription.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Additional Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{prescription.notes}</p>
              </div>
            </div>
          )}
          
          {/* Follow-up Information */}
          {prescription.followUpDate && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Follow-up Appointment</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-700 mb-2">
                      <span className="font-medium">Date:</span> {formatDate(prescription.followUpDate)}
                    </p>
                    {prescription.followUpInstructions && (
                      <p className="text-gray-700">
                        <span className="font-medium">Instructions:</span> {prescription.followUpInstructions}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={addToCalendar}
                    className="flex items-center bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700"
                  >
                    <FaCalendarPlus className="mr-2" />
                    Add to Calendar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDetails; 