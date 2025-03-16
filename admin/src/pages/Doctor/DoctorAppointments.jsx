import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const DoctorAppointments = () => {
  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all') // 'all', 'upcoming', 'completed', 'cancelled'
  const [currentTime, setCurrentTime] = useState(new Date())
  
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
      let hours, minutes;
      if (slotTime.toLowerCase().includes('am') || slotTime.toLowerCase().includes('pm')) {
        // Time format like "01:30 pm" or "1:30 am"
        const timeStr = slotTime.toLowerCase();
        const isPM = timeStr.includes('pm');
        const timeComponents = timeStr.replace(/\s*[ap]m\s*$/i, '').split(':');
        
        if (timeComponents.length !== 2) {
          console.error(`Doctor: Invalid time format: ${slotTime}`);
          return new Date(); // Return current date as fallback
        }
        
        hours = parseInt(timeComponents[0], 10);
        minutes = parseInt(timeComponents[1], 10);
        
        // Convert to 24-hour format if PM
        if (isPM && hours < 12) {
          hours += 12;
        }
        // Handle 12 AM special case
        if (!isPM && hours === 12) {
          hours = 0;
        }
      } else {
        // Regular time format like "13:30"
        const timeParts = slotTime.split(':');
        if (timeParts.length !== 2) {
          console.error(`Doctor: Invalid time format: ${slotTime}`);
          return new Date(); // Return current date as fallback
        }
        
        [hours, minutes] = timeParts.map(Number);
      }
      
      // Validate numeric values
      if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
        console.error(`Doctor: Non-numeric values in date or time: ${slotDate} ${slotTime}`);
        return new Date(); // Return current date as fallback
      }
      
      // IMPORTANT: In our system, the month is already 0-indexed in the database
      // so we don't need to subtract 1 from the month value
      const appointmentDate = new Date(year, month, day, hours, minutes);
      
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

  // Function to check if appointment time is now (only from exact time to 30 minutes after)
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
      let hours, minutes;
      if (slotTime.toLowerCase().includes('am') || slotTime.toLowerCase().includes('pm')) {
        // Time format like "01:30 pm" or "1:30 am"
        const timeStr = slotTime.toLowerCase();
        const isPM = timeStr.includes('pm');
        const timeComponents = timeStr.replace(/\s*[ap]m\s*$/i, '').split(':');
        
        hours = parseInt(timeComponents[0], 10);
        minutes = parseInt(timeComponents[1], 10);
        
        // Convert to 24-hour format if PM
        if (isPM && hours < 12) {
          hours += 12;
        }
        // Handle 12 AM special case
        if (!isPM && hours === 12) {
          hours = 0;
        }
      } else {
        // Regular time format like "13:30"
        [hours, minutes] = slotTime.split(':').map(Number);
      }
      
      // Create appointment date object
      // IMPORTANT: In our system, the month is already 0-indexed in the database
      // so we don't need to subtract 1 from the month value
      const appointmentTime = new Date(year, month, day, hours, minutes, 0, 0);
      
      // Validate the appointment time to ensure it's a valid date
      if (isNaN(appointmentTime.getTime())) {
        console.error(`Doctor: Invalid appointment time for ${slotDate} ${slotTime}`);
        return false; // Cannot join an appointment with invalid time
      }
      
      // Use currentTime state variable for more reactive updates
      const now = currentTime;
      
      // Create the latest join time (appointment time + 30 minutes)
      const latestJoinTime = new Date(appointmentTime);
      latestJoinTime.setMinutes(latestJoinTime.getMinutes() + 30);
      
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
      let hours, minutes;
      if (slotTime.toLowerCase().includes('am') || slotTime.toLowerCase().includes('pm')) {
        // Time format like "01:30 pm" or "1:30 am"
        const timeStr = slotTime.toLowerCase();
        const isPM = timeStr.includes('pm');
        const timeComponents = timeStr.replace(/\s*[ap]m\s*$/i, '').split(':');
        
        hours = parseInt(timeComponents[0], 10);
        minutes = parseInt(timeComponents[1], 10);
        
        // Convert to 24-hour format if PM
        if (isPM && hours < 12) {
          hours += 12;
        }
        // Handle 12 AM special case
        if (!isPM && hours === 12) {
          hours = 0;
        }
      } else {
        // Regular time format like "13:30"
        [hours, minutes] = slotTime.split(':').map(Number);
      }
      
      // Create appointment date object
      // IMPORTANT: In our system, the month is already 0-indexed in the database
      // so we don't need to subtract 1 from the month value
      const appointmentTime = new Date(year, month, day, hours, minutes, 0, 0);
      
      // Use currentTime state variable for more reactive updates
      const now = currentTime;
      
      // Validate the appointment time to ensure it's a valid date
      if (isNaN(appointmentTime.getTime())) {
        console.error(`Doctor: Invalid appointment time for ${slotDate} ${slotTime}`);
        return "Soon"; // Return a user-friendly message instead of showing NaN
      }
      
      // Create the latest join time (appointment time + 30 minutes)
      const latestJoinTime = new Date(appointmentTime);
      latestJoinTime.setMinutes(latestJoinTime.getMinutes() + 30);
      
      // Get timestamps for precise comparison
      const appointmentTimestamp = appointmentTime.getTime();
      const nowTimestamp = now.getTime();
      const latestTimestamp = latestJoinTime.getTime();
      
      // First check if this is a future date (year, month, day comparison)
      const isFutureDate = 
          appointmentTime.getFullYear() > now.getFullYear() || 
          (appointmentTime.getFullYear() === now.getFullYear() && 
              (appointmentTime.getMonth() > now.getMonth() || 
                  (appointmentTime.getMonth() === now.getMonth() && 
                      appointmentTime.getDate() > now.getDate())));
      
      // If it's a future date, we know it's not "Appointment time passed"
      if (isFutureDate) {
          // Calculate time difference in milliseconds
          const diffMs = appointmentTimestamp - nowTimestamp;
          
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
          
          let timeRemaining;
          if (diffDays > 0) {
              timeRemaining = `${diffDays}d ${diffHours}h ${diffMinutes}m`;
          } else if (diffHours > 0) {
              timeRemaining = `${diffHours}h ${diffMinutes}m`;
          } else if (diffMinutes > 0) {
              timeRemaining = `${diffMinutes}m ${diffSeconds}s`;
          } else {
              timeRemaining = `${diffSeconds}s`;
          }
          
          return timeRemaining;
      }
      
      // Check if the appointment is today (same year, month, and day)
      const isToday = 
          appointmentTime.getFullYear() === now.getFullYear() && 
          appointmentTime.getMonth() === now.getMonth() && 
          appointmentTime.getDate() === now.getDate();
      
      // For same-day appointments, use the more precise timestamp comparison
      // Check if we're within the appointment window (from start time to 30 minutes after)
      if (isToday && nowTimestamp >= appointmentTimestamp && nowTimestamp <= latestTimestamp) {
        return "Join now";
      }
      
      // Check if appointment time has passed (more than 30 minutes after start time)
      if (isToday && nowTimestamp > latestTimestamp) {
        return "Appointment time passed";
      }
      
      // Check if the appointment date is in the past (before today)
      const isPastDate = 
          appointmentTime.getFullYear() < now.getFullYear() || 
          (appointmentTime.getFullYear() === now.getFullYear() && 
              (appointmentTime.getMonth() < now.getMonth() || 
                  (appointmentTime.getMonth() === now.getMonth() && 
                      appointmentTime.getDate() < now.getDate())));
      
      if (isPastDate) {
          return "Appointment time passed";
      }
      
      // If we're here, the appointment is today but in the future
      // Calculate time difference in milliseconds
      const diffMs = appointmentTimestamp - nowTimestamp;
      
      // Ensure we have a positive time difference
      if (diffMs <= 0) {
        return "Join now";
      }
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      // Check for NaN values in any time component
      if (isNaN(diffDays) || isNaN(diffHours) || isNaN(diffMinutes) || isNaN(diffSeconds)) {
        console.error(`Doctor: NaN detected in time components for ${slotDate} ${slotTime}`);
        return "Soon"; // Return a user-friendly message instead of showing NaN
      }
      
      let timeRemaining;
      if (diffDays > 0) {
        timeRemaining = `${diffDays}d ${diffHours}h ${diffMinutes}m`;
      } else if (diffHours > 0) {
        timeRemaining = `${diffHours}h ${diffMinutes}m`;
      } else if (diffMinutes > 0) {
        timeRemaining = `${diffMinutes}m ${diffSeconds}s`;
      } else {
        timeRemaining = `${diffSeconds}s`;
      }
      
      return timeRemaining;
    } catch (error) {
      console.error(`Doctor: Error calculating time remaining:`, error);
      return "Soon";
    }
  }
  
  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(appointment => {
    if (activeTab === 'all') return true
    if (activeTab === 'upcoming') return !appointment.cancelled && !appointment.isCompleted
    if (activeTab === 'completed') return appointment.isCompleted
    if (activeTab === 'cancelled') return appointment.cancelled
    return true
  })
  
  // Get status badge based on appointment status
  const getStatusBadge = (appointment) => {
    if (appointment.cancelled) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Cancelled</span>
    } else if (appointment.isCompleted) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Upcoming</span>
    }
  }
  
  // Handle appointment cancellation with confirmation
  const handleCancelAppointment = (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      cancelAppointment(id)
    }
  }
  
  // Handle appointment completion with confirmation
  const handleCompleteAppointment = (id) => {
    if (window.confirm('Are you sure you want to mark this appointment as completed?')) {
      completeAppointment(id)
    }
  }

  return (
    <div className='w-full max-w-7xl mx-auto px-4 py-6'>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className='text-2xl font-bold text-gray-800 mb-4 sm:mb-0'>Appointments</h1>
        
        {/* Filter tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
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
                  <img src={item.userData.image} className='w-10 h-10 rounded-full object-cover border' alt={item.userData.name} /> 
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
                <p className="font-medium text-gray-800">{currency}{item.amount}</p>
                
                {item.cancelled ? (
                  <p className='text-red-500 text-sm font-medium'>Cancelled</p>
                ) : item.isCompleted ? (
                  <p className='text-green-600 text-sm font-medium'>Completed</p>
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    <button 
                      onClick={() => handleCompleteAppointment(item._id)}
                      className="p-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      title="Mark as completed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleCancelAppointment(item._id)}
                      className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      title="Cancel appointment"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
                    <img src={item.userData.image} className='w-12 h-12 rounded-full object-cover border' alt={item.userData.name} /> 
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
                    <p className="font-medium">{item.payment ? 'Online' : 'CASH'} - {currency}{item.amount}</p>
                  </div>
                </div>
                
                {!item.cancelled && !item.isCompleted && (
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {isAppointmentTimeNow(item.slotDate, item.slotTime) ? 'Join' : 'Join'}
                      </button>
                    )}
                    <button 
                      onClick={() => handleCompleteAppointment(item._id)}
                      className="flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Complete
                    </button>
                    <button 
                      onClick={() => handleCancelAppointment(item._id)}
                      className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default DoctorAppointments