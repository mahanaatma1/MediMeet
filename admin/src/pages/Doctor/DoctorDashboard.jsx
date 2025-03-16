import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'

const DoctorDashboard = () => {
  const { dToken, dashData, getDashData } = useContext(DoctorContext)
  const { slotDateFormat, currency } = useContext(AppContext)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (dToken) {
      setIsLoading(true)
      getDashData().finally(() => {
        setIsLoading(false)
      })
    }
  }, [dToken])

  // Update current time more frequently for accurate time checks
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second
    
    return () => clearInterval(timer);
  }, []);

  // Function to navigate to appointments page
  const goToAppointments = () => {
    navigate('/doctor-appointments');
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
          <>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Note about managing appointments */}
            <div className='p-4 bg-gray-50 border-t text-center'>
              <p className='text-sm text-gray-600'>
                To manage appointments (join meetings, mark as completed, or cancel), please visit the{' '}
                <button 
                  onClick={() => navigate('/doctor-appointments')}
                  className='text-primary hover:text-primary-dark font-medium transition-colors'
                >
                  Appointments page
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DoctorDashboard