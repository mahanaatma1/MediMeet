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

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
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
                            <div className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    {/* Doctor Image */}
                                    <div className="sm:w-36 flex-shrink-0">
                                        <img 
                                            className="w-full h-36 object-cover rounded-lg bg-blue-50" 
                                            src={item.docData.image} 
                                            alt={item.docData.name} 
                                        />
                                    </div>
                                    
                                    {/* Doctor & Appointment Info */}
                                    <div className="flex-1">
                                        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                            <h2 className="text-lg font-semibold text-gray-800">{item.docData.name}</h2>
                                            {getStatusBadge(item)}
                                        </div>
                                        
                                        <p className="text-sm text-gray-600 mb-2">{item.docData.speciality}</p>
                                        
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
                                            </div>
                                            
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-700 mb-1">Address</h3>
                                                <p className="text-sm text-gray-600">{item.docData.address.line1}</p>
                                                <p className="text-sm text-gray-600">{item.docData.address.line2}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="border-t px-4 sm:px-6 py-4 bg-gray-50 flex flex-wrap gap-3 justify-end">
                                {/* Payment options */}
                                {!item.cancelled && !item.payment && !item.isCompleted && (
                                    <>
                                        {paymentId === item._id ? (
                                            <div className="flex flex-wrap gap-3">
                                                <button 
                                                    onClick={() => appointmentStripe(item._id)} 
                                                    className="flex items-center justify-center px-4 py-2 border rounded-md bg-white hover:bg-gray-50 transition-colors"
                                                >
                                                    <img className="h-6" src={assets.stripe_logo} alt="Pay with Stripe" />
                                                </button>
                                                <button 
                                                    onClick={() => appointmentRazorpay(item._id)} 
                                                    className="flex items-center justify-center px-4 py-2 border rounded-md bg-white hover:bg-gray-50 transition-colors"
                                                >
                                                    <img className="h-6" src={assets.razorpay_logo} alt="Pay with Razorpay" />
                                                </button>
                                                <button 
                                                    onClick={() => setPaymentId(null)} 
                                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
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
                                
                                {/* Join meeting button */}
                                {item.payment && !item.isCompleted && !item.cancelled && (
                                    <button 
                                        onClick={() => navigate(`/meeting/${item._id}`)} 
                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Join Meeting
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
                    ))}
                </div>
            )}
        </div>
    )
}

export default MyAppointments