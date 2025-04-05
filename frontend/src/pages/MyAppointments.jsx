import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyAppointments = () => {
    const { backendUrl, token, getDoctosData } = useContext(AppContext)
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all') // 'all', 'upcoming', 'completed', 'cancelled'
    const [paymentId, setPaymentId] = useState(null)
    const [currentTime, setCurrentTime] = useState(new Date())

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    // Function to convert slot date and time to Date object
    const getAppointmentDateTime = (slotDate, slotTime) => {
        try {
            // Validate inputs
            if (!slotDate || !slotTime) {
                console.error(`Patient: Missing slotDate or slotTime: ${slotDate} ${slotTime}`);
                return new Date(); // Return current date as fallback
            }
            
            const dateParts = slotDate.split('_');
            
            // Validate format
            if (dateParts.length !== 3) {
                console.error(`Patient: Invalid date format: ${slotDate}`);
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
                    console.error(`Patient: Invalid time format: ${slotTime}`);
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
                    console.error(`Patient: Invalid time format: ${slotTime}`);
                    return new Date(); // Return current date as fallback
                }
                
                [hours, minutes] = timeParts.map(Number);
            }
            
            // Validate numeric values
            if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
                console.error(`Patient: Non-numeric values in date or time: ${slotDate} ${slotTime}`);
                return new Date(); // Return current date as fallback
            }
            
            // IMPORTANT: In our system, the month is already 0-indexed in the database
            // so we don't need to subtract 1 from the month value
            const appointmentDate = new Date(year, month, day, hours, minutes);
            
            // Check if date is valid
            if (isNaN(appointmentDate.getTime())) {
                console.error(`Patient: Invalid date created for ${slotDate} ${slotTime}`);
                return new Date(); // Return current date as fallback
            }
            
            return appointmentDate;
        } catch (error) {
            console.error(`Patient: Error parsing date ${slotDate} ${slotTime}:`, error);
            return new Date(); // Return current date as fallback
        }
    }

    // Function to check if appointment time is now (only from exact time to 30 minutes after)
    const isAppointmentTimeNow = (slotDate, slotTime) => {
        try {
            // Validate inputs
            if (!slotDate || !slotTime) {
                console.error(`Patient: Missing slotDate or slotTime: ${slotDate} ${slotTime}`);
                return false;
            }
            
            // Parse the appointment date and time
            const dateParts = slotDate.split('_');
            if (dateParts.length !== 3) {
                console.error(`Patient: Invalid date format: ${slotDate}`);
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
                console.error(`Patient: Invalid appointment time for ${slotDate} ${slotTime}`);
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
            console.error(`Patient: Error checking appointment time:`, error);
            return false;
        }
    }

    // Function to calculate time remaining until appointment
    const getTimeRemaining = (slotDate, slotTime) => {
        try {
            // Validate inputs
            if (!slotDate || !slotTime) {
                console.error(`Patient: Missing slotDate or slotTime: ${slotDate} ${slotTime}`);
                return "Soon";
            }
            
            // Parse the appointment date and time
            const dateParts = slotDate.split('_');
            if (dateParts.length !== 3) {
                console.error(`Patient: Invalid date format: ${slotDate}`);
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
                console.error(`Patient: Invalid appointment time for ${slotDate} ${slotTime}`);
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
                console.error(`Patient: NaN detected in time components for ${slotDate} ${slotTime}`);
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
            console.error(`Patient: Error calculating time remaining:`, error);
            return "Soon";
        }
    }

    // Getting User Appointments Data Using API
    const getUserAppointments = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get(backendUrl + '/api/user/appointments', { 
                headers: { token } 
            })
            setAppointments(data.appointments.reverse())
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Function to cancel appointment Using API
    const cancelAppointment = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) {
            return
        }
        
        try {
            const { data } = await axios.post(
                backendUrl + '/api/user/cancel-appointment', 
                { appointmentId }, 
                { headers: { token } }
            )

            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
                getDoctosData()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Appointment Payment',
            description: "Appointment Payment",
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                console.log(response)
                try {
                    const { data } = await axios.post(
                        backendUrl + "/api/user/verifyRazorpay", 
                        response, 
                        { headers: { token } }
                    );
                    if (data.success) {
                        toast.success("Payment successful!")
                        setPaymentId(null)
                        getUserAppointments()
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error.message)
                }
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    // Function to make payment using razorpay
    const appointmentRazorpay = async (appointmentId) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/user/payment-razorpay', 
                { appointmentId }, 
                { headers: { token } }
            )
            if (data.success) {
                initPay(data.order)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to make payment using stripe
    const appointmentStripe = async (appointmentId) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/user/payment-stripe', 
                { appointmentId }, 
                { headers: { token } }
            )
            if (data.success) {
                const { session_url } = data
                window.location.replace(session_url)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Update current time more frequently for accurate countdown
    useEffect(() => {
        // Update every second for more accurate countdown
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second
        
        return () => clearInterval(timer);
    }, []);

    // Filter appointments based on active tab
    const filteredAppointments = appointments.filter(appointment => {
        if (activeTab === 'all') return true
        if (activeTab === 'upcoming') return !appointment.cancelled && !appointment.isCompleted
        if (activeTab === 'completed') return appointment.isCompleted
        if (activeTab === 'cancelled') return appointment.cancelled
        return true
    })

    useEffect(() => {
        if (token) {
            getUserAppointments()
        }
    }, [token])

    // Get status badge based on appointment status
    const getStatusBadge = (appointment) => {
        if (appointment.cancelled) {
            return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Cancelled</span>
        } else if (appointment.isCompleted) {
            return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>
        } else if (appointment.payment) {
            return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Confirmed</span>
        } else {
            return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending Payment</span>
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">My Appointments</h1>
                <div className="flex justify-center items-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">My Appointments</h1>
            
            {/* Filter tabs */}
            <div className="flex overflow-x-auto pb-2 mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'all' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        All Appointments
                    </button>
                    <button 
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'upcoming' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Upcoming
                    </button>
                    <button 
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'completed' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Completed
                    </button>
                    <button 
                        onClick={() => setActiveTab('cancelled')}
                        className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'cancelled' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Cancelled
                    </button>
                </div>
            </div>
            
            {filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                    <div className="text-gray-500 mb-4">No appointments found</div>
                    <button 
                        onClick={() => navigate('/doctors')}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                        Book an Appointment
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredAppointments.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <img 
                                            src={item.docData.image || assets.doctor_icon} 
                                            alt={item.docData.name} 
                                            className="w-16 h-16 rounded-full object-cover border border-gray-200"
                                        />
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {item.docData.name.startsWith("Dr.") ? item.docData.name : `Dr. ${item.docData.name}`}
                                            </h3>
                                            <p className="text-gray-600">{item.docData.speciality}</p>
                                            <div className="flex items-center mt-1">
                                                {getStatusBadge(item)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700 mb-1">Appointment Details</h3>
                                            <div className="flex items-center text-sm text-gray-600 mb-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {slotDateFormat(item.slotDate)}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {item.slotTime}
                                            </div>
                                            
                                            {/* Countdown timer for upcoming appointments */}
                                            {item.payment && !item.isCompleted && !item.cancelled && (
                                                <div className="mt-2 bg-gray-50 p-2 rounded-md border border-gray-200" key={currentTime.getTime()}>
                                                    <div className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Appointment in:</p>
                                                            <p className={`text-sm font-medium ${
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
                                            <h3 className="text-sm font-medium text-gray-700 mb-1">Address</h3>
                                            <p className="text-sm text-gray-600">{item.docData.address.line1}</p>
                                            <p className="text-sm text-gray-600">{item.docData.address.line2}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-3 mt-6">
                                    {/* Payment section */}
                                    {!item.payment && !item.cancelled && (
                                        <>
                                            {paymentId === item._id ? (
                                                <div className="flex flex-wrap gap-3">
                                                    <button 
                                                        onClick={() => appointmentRazorpay(item._id)} 
                                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                                                    >
                                                        Pay with Razorpay
                                                    </button>
                                                    <button 
                                                        onClick={() => appointmentStripe(item._id)} 
                                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                                                    >
                                                        Pay with Stripe
                                                    </button>
                                                    <button 
                                                        onClick={() => setPaymentId(null)} 
                                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setPaymentId(item._id)} 
                                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                                                >
                                                    Pay Now
                                                </button>
                                            )}
                                        </>
                                    )}
                                    
                                    {/* Join meeting button - only active at appointment time */}
                                    {item.payment && !item.isCompleted && !item.cancelled && (
                                        <button 
                                            key={`meeting-btn-${currentTime.getTime()}`}
                                            onClick={() => navigate(`/meeting/${item._id}`)} 
                                            className={`px-4 py-2 rounded-md flex items-center transition-colors ${
                                                isAppointmentTimeNow(item.slotDate, item.slotTime)
                                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            }`}
                                            disabled={!isAppointmentTimeNow(item.slotDate, item.slotTime)}
                                            title={
                                                isAppointmentTimeNow(item.slotDate, item.slotTime)
                                                    ? 'Join meeting now'
                                                    : `Meeting will be available at the scheduled time`
                                            }
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            {isAppointmentTimeNow(item.slotDate, item.slotTime) ? 'Join Meeting' : 'Join Meeting'}
                                        </button>
                                    )}
                                    
                                    {/* Cancel appointment button */}
                                    {!item.cancelled && !item.isCompleted && (
                                        <button 
                                            onClick={() => cancelAppointment(item._id)} 
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                                        >
                                            Cancel Appointment
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MyAppointments