import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import VideoMeeting from '../../components/VideoMeeting';

const UserMeeting = () => {
  const { appointmentId } = useParams();
  const { token, user } = useContext(UserContext);
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meetingStarted, setMeetingStarted] = useState(false);
  
  // Fetch appointment details
  const getAppointmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await axios.get(
        `${backendUrl}/api/user/appointment/${appointmentId}`,
        { headers: { token } }
      );
      
      if (!data.success) {
        setError(data.message);
        toast.error(data.message);
        setLoading(false);
        return;
      }
      
      // Check if appointment exists
      if (!data.appointment) {
        setError('Appointment not found');
        toast.error('Appointment not found');
        setLoading(false);
        return;
      }
      
      // Check if payment is completed
      if (!data.appointment.paymentCompleted) {
        setError('Payment for this appointment is not completed');
        toast.error('Payment for this appointment is not completed');
        setLoading(false);
        return;
      }
      
      // Check if appointment is cancelled
      if (data.appointment.status === 'cancelled') {
        setError('This appointment has been cancelled');
        toast.error('This appointment has been cancelled');
        setLoading(false);
        return;
      }
      
      // Check if appointment is completed
      if (data.appointment.status === 'completed') {
        setError('This appointment has already been completed');
        toast.error('This appointment has already been completed');
        setLoading(false);
        return;
      }
      
      // Check if meeting has started
      if (data.appointment.meetingStarted) {
        setMeetingStarted(true);
      }
      
      setAppointment(data.appointment);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      setError('Failed to fetch appointment details. Please try again.');
      toast.error('Failed to fetch appointment details. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle end meeting
  const handleEndMeeting = () => {
    toast.success('Meeting ended');
    navigate('/user/appointments');
  };
  
  // Fetch appointment details on component mount
  useEffect(() => {
    if (token && appointmentId) {
      getAppointmentDetails();
    }
  }, [token, appointmentId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
        <p className="text-gray-700 mb-4">{error}</p>
        <button
          onClick={() => navigate('/user/appointments')}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Back to Appointments
        </button>
      </div>
    );
  }
  
  if (!appointment) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Appointment Not Found</h2>
        <p className="text-gray-700 mb-4">The appointment you're looking for doesn't exist or you don't have access to it.</p>
        <button
          onClick={() => navigate('/user/appointments')}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Back to Appointments
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Video Consultation</h2>
      
      {!meetingStarted ? (
        <div className="mb-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Appointment Details</h3>
            <p className="text-gray-700"><span className="font-medium">Doctor:</span> {appointment.doctorId.name}</p>
            <p className="text-gray-700"><span className="font-medium">Specialization:</span> {appointment.doctorId.specialization}</p>
            <p className="text-gray-700"><span className="font-medium">Date:</span> {new Date(appointment.date).toLocaleDateString()}</p>
            <p className="text-gray-700"><span className="font-medium">Time:</span> {appointment.time}</p>
            <p className="text-gray-700"><span className="font-medium">Status:</span> {appointment.status}</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Important Information</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>Please ensure you have a stable internet connection</li>
              <li>Find a quiet place for your consultation</li>
              <li>Test your camera and microphone before joining</li>
              <li>Have your medical records ready if needed</li>
              <li>The doctor will join the meeting shortly</li>
            </ul>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => setMeetingStarted(true)}
              className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Join Video Consultation
            </button>
          </div>
        </div>
      ) : (
        <VideoMeeting
          appointmentId={appointmentId}
          isDoctor={false}
          backendUrl={backendUrl}
          token={token}
          onEndMeeting={handleEndMeeting}
        />
      )}
    </div>
  );
};

export default UserMeeting; 