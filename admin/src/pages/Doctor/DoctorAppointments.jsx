import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const DoctorAppointments = () => {
  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all') // 'all', 'upcoming', 'completed', 'cancelled'
  
  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])
  
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
                </div>
                <p className="font-medium text-gray-800">{currency}{item.amount}</p>
                
                {item.cancelled ? (
                  <p className='text-red-500 text-sm font-medium'>Cancelled</p>
                ) : item.isCompleted ? (
                  <p className='text-green-600 text-sm font-medium'>Completed</p>
                ) : (
                  <div className='flex space-x-2'>
                    {item.payment && (
                      <button 
                        onClick={() => navigate(`/doctor-meeting/${item._id}`)}
                        className='px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary-dark transition-colors flex items-center'
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Start
                      </button>
                    )}
                    <button 
                      onClick={() => handleCompleteAppointment(item._id)} 
                      className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      title="Mark as completed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleCancelAppointment(item._id)} 
                      className="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
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
              <div className="p-4 border-b">
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
                  </div>
                  <div>
                    <p className="text-gray-500">Payment</p>
                    <p className="font-medium">{item.payment ? 'Online' : 'CASH'} - {currency}{item.amount}</p>
                  </div>
                </div>
              </div>
              
              {!item.cancelled && !item.isCompleted && (
                <div className="flex border-t divide-x">
                  {item.payment && (
                    <button 
                      onClick={() => navigate(`/doctor-meeting/${item._id}`)}
                      className='flex-1 py-3 bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors flex items-center justify-center'
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Start Meeting
                    </button>
                  )}
                  <button 
                    onClick={() => handleCompleteAppointment(item._id)} 
                    className="flex-1 py-3 text-green-700 text-sm font-medium hover:bg-green-50 transition-colors flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Complete
                  </button>
                  <button 
                    onClick={() => handleCancelAppointment(item._id)} 
                    className="flex-1 py-3 text-red-700 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default DoctorAppointments