import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'

const DoctorDashboard = () => {
  const { dToken, dashData, getDashData, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, currency } = useContext(AppContext)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (dToken) {
      setIsLoading(true)
      getDashData().finally(() => {
        setIsLoading(false)
      })
    }
  }, [dToken])

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

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return dashData && (
    <div className='w-full max-w-7xl mx-auto px-4 py-6'>
      <h1 className='text-2xl font-bold text-gray-800 mb-6'>Dashboard</h1>
      
      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
        {/* Earnings Card */}
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm overflow-hidden'>
          <div className='p-6 flex items-center'>
            <div className='bg-blue-100 p-3 rounded-lg mr-4'>
              <img className='w-10 h-10' src={assets.earning_icon} alt="Earnings" />
            </div>
            <div>
              <p className='text-2xl font-bold text-gray-800'>{currency} {dashData.earnings}</p>
              <p className='text-sm text-gray-600'>Total Earnings</p>
            </div>
          </div>
          <div className='bg-gradient-to-r from-blue-500 to-indigo-600 h-1'></div>
          <div className='px-6 py-2 bg-white flex justify-between items-center'>
            <span className='text-xs text-gray-500'>Doctor's Share (80%)</span>
            <span className='text-xs font-medium text-blue-600'>of total fees</span>
          </div>
        </div>
        
        {/* Appointments Card */}
        <div className='bg-gradient-to-r from-green-50 to-teal-50 rounded-xl shadow-sm overflow-hidden'>
          <div className='p-6 flex items-center'>
            <div className='bg-green-100 p-3 rounded-lg mr-4'>
              <img className='w-10 h-10' src={assets.appointments_icon} alt="Appointments" />
            </div>
            <div>
              <p className='text-2xl font-bold text-gray-800'>{dashData.appointments}</p>
              <p className='text-sm text-gray-600'>Total Appointments</p>
            </div>
          </div>
          <div className='bg-gradient-to-r from-green-500 to-teal-600 h-1'></div>
        </div>
        
        {/* Patients Card */}
        <div className='bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm overflow-hidden'>
          <div className='p-6 flex items-center'>
            <div className='bg-purple-100 p-3 rounded-lg mr-4'>
              <img className='w-10 h-10' src={assets.patients_icon} alt="Patients" />
            </div>
            <div>
              <p className='text-2xl font-bold text-gray-800'>{dashData.patients}</p>
              <p className='text-sm text-gray-600'>Total Patients</p>
            </div>
          </div>
          <div className='bg-gradient-to-r from-purple-500 to-pink-600 h-1'></div>
        </div>
      </div>

      {/* Revenue Info Card */}
      <div className='bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-8'>
        <div className='flex items-center justify-between px-6 py-4 border-b'>
          <h2 className='font-semibold text-gray-800'>Revenue Information</h2>
        </div>
        <div className='p-6'>
          <div className='flex flex-col md:flex-row gap-6'>
            <div className='flex-1 bg-blue-50 p-4 rounded-lg'>
              <p className='text-sm text-gray-600 mb-1'>Your Earnings</p>
              <p className='text-2xl font-bold text-gray-800'>{currency} {dashData.earnings}</p>
              <div className='mt-2 text-xs text-gray-500'>80% of appointment fees</div>
            </div>
            
            <div className='flex-1 bg-gray-50 p-4 rounded-lg'>
              <p className='text-sm text-gray-600 mb-1'>Total Appointment Fees</p>
              <p className='text-2xl font-bold text-gray-800'>{currency} {Math.round(dashData.earnings / 0.8)}</p>
              <div className='mt-2 text-xs text-gray-500'>100% of collected fees</div>
            </div>
            
            <div className='flex-1 bg-amber-50 p-4 rounded-lg'>
              <p className='text-sm text-gray-600 mb-1'>Platform Fee</p>
              <p className='text-2xl font-bold text-gray-800'>{currency} {Math.round(dashData.earnings / 0.8 * 0.2)}</p>
              <div className='mt-2 text-xs text-gray-500'>20% of appointment fees</div>
            </div>
          </div>
          <div className='mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-600'>
            <p><span className='font-medium'>Note:</span> MediMeet operates on a revenue-sharing model where doctors receive 80% of the appointment fees, while 20% goes to the platform as a service fee.</p>
          </div>
        </div>
      </div>

      {/* Latest Bookings */}
      <div className='bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200'>
        <div className='flex items-center justify-between px-6 py-4 border-b'>
          <div className='flex items-center gap-2'>
            <img src={assets.list_icon} alt="" className='w-5 h-5' />
            <h2 className='font-semibold text-gray-800'>Latest Appointments</h2>
          </div>
          <button 
            onClick={() => navigate('/doctor-appointments')}
            className='text-sm text-primary hover:text-primary-dark font-medium transition-colors'
          >
            View All
          </button>
        </div>

        {dashData.latestAppointments.length === 0 ? (
          <div className='p-6 text-center text-gray-500'>
            No appointments found
          </div>
        ) : (
          <div className='divide-y'>
            {dashData.latestAppointments.slice(0, 5).map((item, index) => (
              <div className='p-4 sm:px-6 hover:bg-gray-50 transition-colors' key={index}>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                  {/* Patient Info */}
                  <div className='flex items-center flex-1 gap-3'>
                    <img 
                      className='w-12 h-12 rounded-full object-cover border' 
                      src={item.userData.image} 
                      alt={item.userData.name} 
                    />
                    <div>
                      <p className='font-medium text-gray-800'>{item.userData.name}</p>
                      <div className='flex items-center gap-2 mt-1'>
                        <span className='text-xs text-gray-500'>
                          {slotDateFormat(item.slotDate)}, {item.slotTime}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                          item.cancelled ? 'bg-red-100 text-red-800' : 
                          item.isCompleted ? 'bg-green-100 text-green-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Upcoming'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Info */}
                  <div className='flex items-center gap-2 sm:gap-4'>
                    <div className='text-right'>
                      <p className='font-medium text-gray-800'>{currency}{item.amount}</p>
                      <p className='text-xs text-gray-500'>{item.payment ? 'Paid Online' : 'Cash Payment'}</p>
                    </div>
                    
                    {/* Actions */}
                    {!item.cancelled && !item.isCompleted && (
                      <div className='flex space-x-2'>
                        {item.payment && (
                          <button 
                            onClick={() => navigate(`/doctor-meeting/${item._id}`)}
                            className='p-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors'
                            title="Start Meeting"
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorDashboard