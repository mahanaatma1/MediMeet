import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'
import { FaVideo, FaCheck, FaTimes, FaFilePdf } from 'react-icons/fa'

const DoctorAppointments = () => {
  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment, backendUrl } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all') // 'all', 'upcoming', 'completed', 'cancelled'
  const [currentTime, setCurrentTime] = useState(new Date())
  const [justCompletedId, setJustCompletedId] = useState(null)
  
  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])
  
  // Update current time more frequently for accurate countdown
  useEffect(() => {
    // Update every second for more accurate countdown
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second
    
    return () => clearInterval(timer);
  }, []);
  
  // Function to convert slot date and time to Date object
  const getAppointmentDateTime = (slotDate, slotTime) => {
    try {
      // Validate inputs
      if (!slotDate || !slotTime) {
        console.error(`Doctor: Missing slotDate or slotTime: ${slotDate} ${slotTime}`);
        return new Date(); // Return current date as fallback
      }
      
      const dateParts = slotDate.split('_');
      
      // Validate format
      if (dateParts.length !== 3) {
        console.error(`Doctor: Invalid date format: ${slotDate}`);
        return new Date(); // Return current date as fallback
      }
      
      const [day, month, year] = dateParts.map(Number);
      
      // Handle time format with AM/PM
      let timeHours, timeMinutes;
      if (slotTime.toLowerCase().includes('am') || slotTime.toLowerCase().includes('pm')) {
        // Time format like "01:30 pm" or "1:30 am"
        const timeStr = slotTime.toLowerCase();
        const isPM = timeStr.includes('pm');
        const timeComponents = timeStr.replace(/\s*[ap]m\s*$/i, '').split(':');
        
        if (timeComponents.length !== 2) {
          console.error(`Doctor: Invalid time format: ${slotTime}`);
          return new Date(); // Return current date as fallback
        }
        
        timeHours = parseInt(timeComponents[0], 10);
        timeMinutes = parseInt(timeComponents[1], 10);
        
        // Convert to 24-hour format if PM
        if (isPM && timeHours < 12) {
          timeHours += 12;
        }
        // Handle 12 AM special case
        if (!isPM && timeHours === 12) {
          timeHours = 0;
        }
      } else {
        // Regular time format like "13:30"
        const timeParts = slotTime.split(':');
        if (timeParts.length !== 2) {
          console.error(`Doctor: Invalid time format: ${slotTime}`);
          return new Date(); // Return current date as fallback
        }
        
        [timeHours, timeMinutes] = timeParts.map(Number);
      }
      
      // Validate numeric values
      if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(timeHours) || isNaN(timeMinutes)) {
        console.error(`Doctor: Non-numeric values in date or time: ${slotDate} ${slotTime}`);
        return new Date(); // Return current date as fallback
      }
      
      // IMPORTANT: In our system, the month is now 1-indexed in the database (after our fix)
      // so we need to subtract 1 from the month value for JavaScript's Date object
      const appointmentDate = new Date(year, month - 1, day, timeHours, timeMinutes);
      
      // Check if date is valid
      if (isNaN(appointmentDate.getTime())) {
        console.error(`Doctor: Invalid date created for ${slotDate} ${slotTime}`);
        return new Date(); // Return current date as fallback
      }
      
      return appointmentDate;
    } catch (error) {
      console.error(`Doctor: Error parsing date ${slotDate} ${slotTime}:`, error);
      return new Date(); // Return current date as fallback
    }
  }

  // Function to check if appointment time is now (only from exact time to 45 minutes after)
  const isAppointmentTimeNow = (slotDate, slotTime) => {
    try {
      // Validate inputs
      if (!slotDate || !slotTime) {
        console.error(`Doctor: Missing slotDate or slotTime: ${slotDate} ${slotTime}`);
        return false;
      }
      
      // Parse the appointment date and time
      const dateParts = slotDate.split('_');
      if (dateParts.length !== 3) {
        console.error(`Doctor: Invalid date format: ${slotDate}`);
        return false;
      }
      
      const [day, month, year] = dateParts.map(Number);
      
      // Handle time format with AM/PM
      let timeHours, timeMinutes;
      if (slotTime.toLowerCase().includes('am') || slotTime.toLowerCase().includes('pm')) {
        // Time format like "01:30 pm" or "1:30 am"
        const timeStr = slotTime.toLowerCase();
        const isPM = timeStr.includes('pm');
        const timeComponents = timeStr.replace(/\s*[ap]m\s*$/i, '').split(':');
        
        timeHours = parseInt(timeComponents[0], 10);
        timeMinutes = parseInt(timeComponents[1], 10);
        
        // Convert to 24-hour format if PM
        if (isPM && timeHours < 12) {
          timeHours += 12;
        }
        // Handle 12 AM special case
        if (!isPM && timeHours === 12) {
          timeHours = 0;
        }
      } else {
        // Regular time format like "13:30"
        [timeHours, timeMinutes] = slotTime.split(':').map(Number);
      }
      
      // Create appointment date object
      // IMPORTANT: In our system, the month is now 1-indexed in the database (after our fix)
      // so we need to subtract 1 from the month value for JavaScript's Date object
      const appointmentTime = new Date(year, month - 1, day, timeHours, timeMinutes, 0, 0);
      
      // Validate the appointment time to ensure it's a valid date
      if (isNaN(appointmentTime.getTime())) {
        console.error(`Doctor: Invalid appointment time for ${slotDate} ${slotTime}`);
        return false; // Cannot join an appointment with invalid time
      }
      
      // Use currentTime state variable for more reactive updates
      const now = currentTime;
      
      // Create the latest join time (appointment time + 45 minutes)
      const latestJoinTime = new Date(appointmentTime);
      latestJoinTime.setMinutes(latestJoinTime.getMinutes() + 45);
      
      // Compare timestamps for precise comparison
      const appointmentTimestamp = appointmentTime.getTime();
      const nowTimestamp = now.getTime();
      const latestTimestamp = latestJoinTime.getTime();
      
      // Check if the appointment is today (same year, month, and day)
      const isToday = 
          appointmentTime.getFullYear() === now.getFullYear() && 
          appointmentTime.getMonth() === now.getMonth() && 
          appointmentTime.getDate() === now.getDate();
      
      // If it's not today, the appointment is not now
      if (!isToday) {
          return false;
      }
      
      // Check if current time is between appointment time and latest join time
      const canJoin = nowTimestamp >= appointmentTimestamp && nowTimestamp <= latestTimestamp;
      
      return canJoin;
    } catch (error) {
      console.error(`Doctor: Error checking appointment time:`, error);
      return false;
    }
  }

  // Function to calculate time remaining until appointment
  const getTimeRemaining = (slotDate, slotTime) => {
    try {
      // Validate inputs
      if (!slotDate || !slotTime) {
        console.error(`Doctor: Missing slotDate or slotTime: ${slotDate} ${slotTime}`);
        return "Soon";
      }
      
      // Parse the appointment date and time
      const dateParts = slotDate.split('_');
      if (dateParts.length !== 3) {
        console.error(`Doctor: Invalid date format: ${slotDate}`);
        return "Soon";
      }
      
      const [day, month, year] = dateParts.map(Number);
      
      // Handle time format with AM/PM
      let timeHours, timeMinutes;
      if (slotTime.toLowerCase().includes('am') || slotTime.toLowerCase().includes('pm')) {
        // Time format like "01:30 pm" or "1:30 am"
        const timeStr = slotTime.toLowerCase();
        const isPM = timeStr.includes('pm');
        const timeComponents = timeStr.replace(/\s*[ap]m\s*$/i, '').split(':');
        
        timeHours = parseInt(timeComponents[0], 10);
        timeMinutes = parseInt(timeComponents[1], 10);
        
        // Convert to 24-hour format if PM
        if (isPM && timeHours < 12) {
          timeHours += 12;
        }
        // Handle 12 AM special case
        if (!isPM && timeHours === 12) {
          timeHours = 0;
        }
      } else {
        // Regular time format like "13:30"
        [timeHours, timeMinutes] = slotTime.split(':').map(Number);
      }
      
      // Create appointment date object
      // IMPORTANT: In our system, the month is now 1-indexed in the database (after our fix)
      // so we need to subtract 1 from the month value for JavaScript's Date object
      const appointmentTime = new Date(year, month - 1, day, timeHours, timeMinutes, 0, 0);
      
      // Validate appointment time 
      if (isNaN(appointmentTime.getTime())) {
        console.error(`Doctor: Invalid appointment time for ${slotDate} ${slotTime}`);
        return "Soon"; // Return a generic message for invalid time
      }
      
      // Use currentTime state variable for more reactive updates
      const now = currentTime;
      
      // Check if appointment time has passed
      if (appointmentTime.getTime() < now.getTime()) {
        if (isAppointmentTimeNow(slotDate, slotTime)) {
          return "Now"; // Appointment is happening now (within the 45-minute window)
        }
        return "Overdue"; // Appointment time has passed
      }
      
      // Calculate time difference in milliseconds
      const timeDiff = appointmentTime.getTime() - now.getTime();
      
      // Calculate days, hours, and minutes
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      // Format the time remaining based on how much time is left
      if (days > 0) {
        return `${days}d ${hours}h`;
      } else if (hours > 0) {
        return `${hours}h ${mins}m`;
      } else if (mins > 0) {
        return `${mins} min`;
      } else {
        return "Less than 1 min";
      }
    } catch (error) {
      console.error(`Doctor: Error calculating time remaining:`, error);
      return "Soon"; // Return a generic message in case of error
    }
  }
  
  // Get status badge based on appointment status
  const getStatusBadge = (appointment) => {
    if (appointment.cancelled) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">Cancelled</span>
    } else if (appointment.isCompleted) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Completed</span>
    } else if (isAppointmentTimeNow(appointment.slotDate, appointment.slotTime)) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium animate-pulse">Ongoing</span>
    } else {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Scheduled</span>
    }
  }
  
  // Handle appointment cancellation with confirmation
  const handleCancelAppointment = (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      cancelAppointment(id)
    }
  }
  
  // Handle navigating to create prescription for a completed appointment
  const handleCreatePrescription = (appointmentId) => {
    // Navigate to the prescription creation page
    navigate('/doctor-prescriptions');
    // The prescription page will show all completed appointments without prescriptions
  }
  
  // Handle appointment completion with confirmation
  const handleCompleteAppointment = (id) => {
    if (window.confirm('Mark this appointment as completed?')) {
      completeAppointment(id)
      setJustCompletedId(id)
      
      // Show a confirmation dialog to create prescription
      setTimeout(() => {
        if (window.confirm('Appointment completed! Would you like to create a prescription for this patient?')) {
          handleCreatePrescription(id)
        }
      }, 1000)
    }
  }

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(item => {
    // Filter by tab
    if (activeTab === 'all') return true
    if (activeTab === 'upcoming') return !item.isCompleted && !item.cancelled
    if (activeTab === 'completed') return item.isCompleted && !item.cancelled
    if (activeTab === 'cancelled') return item.cancelled
    return true
  })

  return (
    <div className='bg-white shadow rounded-lg p-6'>
      <h1 className='text-2xl font-bold mb-6'>My Appointments</h1>
      
      {/* Filter tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="bg-gray-100 inline-flex p-1 rounded-md">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'all' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'upcoming' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'completed' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Completed
          </button>
          <button 
            onClick={() => setActiveTab('cancelled')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'cancelled' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Desktop view - Table */}
      <div className='hidden sm:block bg-white border rounded-lg shadow-sm overflow-hidden'>
        <div className='grid grid-cols-[0.5fr_2fr_1fr_1fr_2fr_1fr_1.5fr] gap-1 py-4 px-6 border-b bg-gray-50'>
          <p className="font-medium text-gray-700">#</p>
          <p className="font-medium text-gray-700">Patient</p>
          <p className="font-medium text-gray-700">Payment</p>
          <p className="font-medium text-gray-700">Age</p>
          <p className="font-medium text-gray-700">Date & Time</p>
          <p className="font-medium text-gray-700">Fees</p>
          <p className="font-medium text-gray-700">Action</p>
        </div>
        
        {filteredAppointments.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No appointments found
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            {filteredAppointments.map((item, index) => (
              <div className='grid grid-cols-[0.5fr_2fr_1fr_1fr_2fr_1fr_1.5fr] gap-1 items-center text-gray-600 py-4 px-6 border-b hover:bg-gray-50 transition-colors' key={index}>
                <p>{index + 1}</p>
                <div className='flex items-center gap-3'>
                  <img src={item.userData.image || assets.avatar} className='w-10 h-10 rounded-full object-cover border' alt={item.userData.name} /> 
                  <div>
                    <p className="font-medium text-gray-800">{item.userData.name}</p>
                    <p className="text-xs text-gray-500">{item.userData.email}</p>
                  </div>
                </div>
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full ${item.payment ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {item.payment ? 'Online' : 'CASH'}
                  </span>
                </div>
                <p>{calculateAge(item.userData.dob)}</p>
                <div>
                  <p className="font-medium">{slotDateFormat(item.slotDate)}</p>
                  <p className="text-sm text-gray-500">{item.slotTime}</p>
                  {/* Countdown timer for upcoming appointments */}
                  {item.payment && !item.isCompleted && !item.cancelled && (
                    <div className="mt-1 bg-gray-50 p-1.5 rounded-md border border-gray-200" key={currentTime.getTime()}>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500">Appointment in:</p>
                          <p className={`text-xs font-medium ${
                            isAppointmentTimeNow(item.slotDate, item.slotTime) 
                              ? 'text-green-600' 
                              : 'text-primary'
                          }`}>
                            {getTimeRemaining(item.slotDate, item.slotTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="font-medium text-gray-800">{currency}{item.amount ? item.amount : '0'}</p>
                
                {item.cancelled ? (
                  <p className='text-red-500 text-sm font-medium'>Cancelled</p>
                ) : item.isCompleted ? (
                  <div className='flex items-center gap-2'>
                    <span className='text-green-500 text-sm font-medium'>Completed</span>
                    <button 
                      onClick={() => handleCreatePrescription(item._id)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      title="Create Prescription"
                    >
                      <FaFilePdf className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className='flex gap-2'>
                    {/* Join meeting button - only active at appointment time */}
                    {item.payment && (
                      <button 
                        key={`meeting-btn-${currentTime.getTime()}`}
                        onClick={() => navigate(`/doctor-meeting/${item._id}`)}
                        className={`p-2 rounded-md transition-colors ${
                          isAppointmentTimeNow(item.slotDate, item.slotTime)
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!isAppointmentTimeNow(item.slotDate, item.slotTime)}
                        title={
                          isAppointmentTimeNow(item.slotDate, item.slotTime)
                            ? 'Start video consultation'
                            : 'Video consultation will be available at the scheduled time'
                        }
                      >
                        <FaVideo className="h-5 w-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleCompleteAppointment(item._id)}
                      className="p-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      title="Mark as completed"
                    >
                      <FaCheck className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleCancelAppointment(item._id)}
                      className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      title="Cancel appointment"
                    >
                      <FaTimes className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile view - Cards */}
      <div className='sm:hidden space-y-4'>
        {filteredAppointments.length === 0 ? (
          <div className="py-8 text-center text-gray-500 bg-white rounded-lg shadow-sm border">
            No appointments found
          </div>
        ) : (
          filteredAppointments.map((item, index) => (
            <div className='bg-white rounded-lg shadow-sm border overflow-hidden' key={index}>
              <div className='p-4'>
                <div className="flex justify-between items-start mb-3">
                  <div className='flex items-center gap-3'>
                    <img src={item.userData.image || assets.avatar} className='w-12 h-12 rounded-full object-cover border' alt={item.userData.name} /> 
                    <div>
                      <p className="font-medium text-gray-800">{item.userData.name}</p>
                      <p className="text-xs text-gray-500">Age: {calculateAge(item.userData.dob)}</p>
                    </div>
                  </div>
                  {getStatusBadge(item)}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Date & Time</p>
                    <p className="font-medium">{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                    {/* Countdown timer for upcoming appointments */}
                    {item.payment && !item.isCompleted && !item.cancelled && (
                      <div className="mt-1 bg-gray-50 p-1.5 rounded-md border border-gray-200" key={currentTime.getTime()}>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Appointment in:</p>
                            <p className={`text-xs font-medium ${
                              isAppointmentTimeNow(item.slotDate, item.slotTime) 
                                ? 'text-green-600' 
                                : 'text-primary'
                            }`}>
                              {getTimeRemaining(item.slotDate, item.slotTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500">Payment</p>
                    <p className="font-medium">{item.payment ? 'Online' : 'CASH'} - {currency}{item.amount ? item.amount : '0'}</p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col gap-2 mt-2">
                  {item.cancelled ? (
                    <p className='text-red-500 text-sm font-medium my-2'>Cancelled</p>
                  ) : item.isCompleted ? (
                    <div className='flex items-center gap-2 my-2'>
                      <span className='text-green-500 text-sm font-medium'>Completed</span>
                      <button 
                        onClick={() => handleCreatePrescription(item._id)}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-1 text-sm"
                        title="Create Prescription"
                      >
                        <FaFilePdf className="h-4 w-4" /> Create Prescription
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-4">
                      {/* Join meeting button - only active at appointment time */}
                      {item.payment && (
                        <button 
                          key={`meeting-btn-${currentTime.getTime()}`}
                          onClick={() => navigate(`/doctor-meeting/${item._id}`)}
                          className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                            isAppointmentTimeNow(item.slotDate, item.slotTime)
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!isAppointmentTimeNow(item.slotDate, item.slotTime)}
                        >
                          <FaVideo className="h-4 w-4 mr-1" />
                          {isAppointmentTimeNow(item.slotDate, item.slotTime) ? 'Join' : 'Join'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleCompleteAppointment(item._id)}
                        className="flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                      >
                        <FaCheck className="h-4 w-4 mr-1" />
                        Complete
                      </button>
                      <button 
                        onClick={() => handleCancelAppointment(item._id)}
                        className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                      >
                        <FaTimes className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default DoctorAppointments