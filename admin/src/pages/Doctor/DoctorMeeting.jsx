import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import VideoMeeting from '../../components/VideoMeeting';

const DoctorMeeting = () => {
  const { appointmentId } = useParams();
  const { backendUrl } = useContext(AppContext);
  const { dToken } = useContext(DoctorContext);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meetingStarted, setMeetingStarted] = useState(false);
  const navigate = useNavigate();

  // Get appointment details
  const getAppointmentDetails = async () => {
    try {
      setLoading(true);
      
      // Get meeting status
      const { data } = await axios.post(
        `${backendUrl}/api/meeting/status`,
        { appointmentId },
        { headers: { dtoken: dToken } }
      );

      if (!data.success) {
        toast.error(data.message || 'Failed to get meeting status');
        navigate('/doctor/appointments');
        return;
      }

      // Get all appointments
      const appointmentsResponse = await axios.get(
        `${backendUrl}/api/doctor/appointments`,
        { headers: { dtoken: dToken } }
      );

      if (!appointmentsResponse.data.success) {
        toast.error('Failed to get appointments');
        navigate('/doctor/appointments');
        return;
      }

      // Find the specific appointment
      const appointmentData = appointmentsResponse.data.appointments.find(
        app => app._id === appointmentId
      );

      if (!appointmentData) {
        toast.error('Appointment not found');
        navigate('/doctor/appointments');
        return;
      }

      // Check if payment is completed
      if (!appointmentData.payment) {
        toast.error('Payment not completed for this appointment');
        navigate('/doctor/appointments');
        return;
      }

      // Check if appointment is cancelled
      if (appointmentData.cancelled) {
        toast.error('This appointment has been cancelled');
        navigate('/doctor/appointments');
        return;
      }

      // Check if appointment is completed
      if (appointmentData.isCompleted) {
        toast.error('This appointment has been completed');
        navigate('/doctor/appointments');
        return;
      }

      setAppointment(appointmentData);
      setLoading(false);
    } catch (error) {
      console.error('Error getting appointment details:', error);
      toast.error('Failed to get appointment details');
      navigate('/doctor/appointments');
    }
  };

  // Create a meeting
  const createMeeting = async () => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/meeting/create`,
        { appointmentId },
        { headers: { dtoken: dToken } }
      );

      if (!data.success) {
        toast.error(data.message || 'Failed to create meeting');
        return;
      }

      toast.success('Meeting created successfully');
      setMeetingStarted(true);
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to create meeting');
    }
  };

  useEffect(() => {
    if (dToken && appointmentId) {
      getAppointmentDetails();
    }
  }, [dToken, appointmentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading appointment details...</p>
      </div>
    );
  }

  if (!meetingStarted) {
    return (
      <div className="w-full max-w-6xl m-5">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Appointment Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600">Patient:</p>
              <p className="font-medium">{appointment?.userData?.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Date & Time:</p>
              <p className="font-medium">{appointment?.slotDate?.split('_').join('/')} | {appointment?.slotTime}</p>
            </div>
          </div>
          
          <button
            onClick={createMeeting}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Start Video Consultation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl m-5">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Video Consultation</h1>
        <p className="text-gray-600">
          Appointment with {appointment?.userData?.name}
        </p>
      </div>

      <VideoMeeting
        appointmentId={appointmentId}
        isDoctor={true}
        backendUrl={backendUrl}
        dtoken={dToken}
        onEndMeeting={() => navigate('/doctor/appointments')}
      />
    </div>
  );
};

export default DoctorMeeting; 