import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import VideoMeeting from '../components/VideoMeeting';
import axios from 'axios';
import { toast } from 'react-toastify';

const MeetingRoom = () => {
  const { appointmentId } = useParams();
  const { backendUrl, token } = useContext(AppContext);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get appointment details
  const getAppointmentDetails = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        `${backendUrl}/api/meeting/status`,
        { appointmentId },
        { headers: { token } }
      );

      if (!data.success) {
        toast.error(data.message || 'Failed to get appointment details');
        navigate('/my-appointments');
        return;
      }

      // Get appointment data
      const appointmentResponse = await axios.get(
        `${backendUrl}/api/user/appointments`,
        { headers: { token } }
      );

      if (!appointmentResponse.data.success) {
        toast.error('Failed to get appointment details');
        navigate('/my-appointments');
        return;
      }

      // Find the specific appointment
      const appointmentData = appointmentResponse.data.appointments.find(
        app => app._id === appointmentId
      );

      if (!appointmentData) {
        toast.error('Appointment not found');
        navigate('/my-appointments');
        return;
      }

      // Check if payment is completed
      if (!appointmentData.payment) {
        toast.error('Payment not completed for this appointment');
        navigate('/my-appointments');
        return;
      }

      // Check if appointment is cancelled
      if (appointmentData.cancelled) {
        toast.error('This appointment has been cancelled');
        navigate('/my-appointments');
        return;
      }

      // Check if appointment is completed
      if (appointmentData.isCompleted) {
        toast.error('This appointment has been completed');
        navigate('/my-appointments');
        return;
      }

      setAppointment(appointmentData);
      setLoading(false);
    } catch (error) {
      console.error('Error getting appointment details:', error);
      toast.error('Failed to get appointment details');
      navigate('/my-appointments');
    }
  };

  useEffect(() => {
    if (token && appointmentId) {
      getAppointmentDetails();
    }
  }, [token, appointmentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading appointment details...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Video Consultation</h1>
        <p className="text-gray-600">
          Appointment with Dr. {appointment?.docData?.name}
        </p>
      </div>

      <VideoMeeting
        appointmentId={appointmentId}
        isDoctor={false}
        backendUrl={backendUrl}
        token={token}
        onEndMeeting={() => navigate('/my-appointments')}
      />
    </div>
  );
};

export default MeetingRoom; 