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
      <div className="lg:hidden overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-min">
          {/* Earnings Card */}
          <div className="flex-shrink-0 w-[280px] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <img className="w-10 h-10" src={assets.earning_icon} alt="Earnings" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{currency} {dashData.earnings}</p>
                <p className="text-sm text-gray-600">Total Earnings</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1"></div>
            <div className="px-6 py-2 bg-white flex justify-between items-center">
              <span className="text-xs text-gray-500">Doctor's Share (80%)</span>
              <span className="text-xs font-medium text-blue-600">of total fees</span>
            </div>
          </div>
          
          {/* Appointments Card */}
          <div className="flex-shrink-0 w-[280px] bg-gradient-to-r from-green-50 to-teal-50 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 flex items-center">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <img className="w-10 h-10" src={assets.appointments_icon} alt="Appointments" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{dashData.appointments}</p>
                <p className="text-sm text-gray-600">Total Appointments</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-teal-600 h-1"></div>
          </div>
          
          {/* Patients Card */}
          <div className="flex-shrink-0 w-[280px] bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <img className="w-10 h-10" src={assets.patients_icon} alt="Patients" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{dashData.patients}</p>
                <p className="text-sm text-gray-600">Total Patients</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-1"></div>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:grid lg:grid-cols-3 gap-4 mb-8">
        {/* Earnings Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <img className="w-10 h-10" src={assets.earning_icon} alt="Earnings" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{currency} {dashData.earnings}</p>
              <p className="text-sm text-gray-600">Total Earnings</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1"></div>
          <div className="px-6 py-2 bg-white flex justify-between items-center">
            <span className="text-xs text-gray-500">Doctor's Share (80%)</span>
            <span className="text-xs font-medium text-blue-600">of total fees</span>
          </div>
        </div>
        
        {/* Appointments Card */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 flex items-center">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <img className="w-10 h-10" src={assets.appointments_icon} alt="Appointments" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{dashData.appointments}</p>
              <p className="text-sm text-gray-600">Total Appointments</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-teal-600 h-1"></div>
        </div>
        
        {/* Patients Card */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <img className="w-10 h-10" src={assets.patients_icon} alt="Patients" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{dashData.patients}</p>
              <p className="text-sm text-gray-600">Total Patients</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-1"></div>
        </div>
      </div>

      {/* Revenue Info Card */}
      <div className='bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-8'>
        <div className='flex items-center justify-between px-6 py-4 border-b'>
          <h2 className='font-semibold text-gray-800'>Revenue Information</h2>
        </div>
        <div className='p-6'>
          {/* Mobile View */}
          <div className="lg:hidden overflow-x-auto pb-4">
            <div className="flex space-x-4 min-w-min">
              <div className="flex-shrink-0 w-[280px] bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Your Earnings</p>
                <p className="text-2xl font-bold text-gray-800">{currency} {dashData.earnings}</p>
                <div className="mt-2 text-xs text-gray-500">80% of appointment fees</div>
              </div>
              
              <div className="flex-shrink-0 w-[280px] bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Appointment Fees</p>
                <p className="text-2xl font-bold text-gray-800">{currency} {Math.round(dashData.earnings / 0.8)}</p>
                <div className="mt-2 text-xs text-gray-500">100% of collected fees</div>
              </div>
              
              <div className="flex-shrink-0 w-[280px] bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Platform Fee</p>
                <p className="text-2xl font-bold text-gray-800">{currency} {Math.round(dashData.earnings / 0.8 * 0.2)}</p>
                <div className="mt-2 text-xs text-gray-500">20% of appointment fees</div>
              </div>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden lg:flex lg:flex-row gap-6">
            <div className="flex-1 bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Your Earnings</p>
              <p className="text-2xl font-bold text-gray-800">{currency} {dashData.earnings}</p>
              <div className="mt-2 text-xs text-gray-500">80% of appointment fees</div>
            </div>
            
            <div className="flex-1 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Appointment Fees</p>
              <p className="text-2xl font-bold text-gray-800">{currency} {Math.round(dashData.earnings / 0.8)}</p>
              <div className="mt-2 text-xs text-gray-500">100% of collected fees</div>
            </div>
            
            <div className="flex-1 bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Platform Fee</p>
              <p className="text-2xl font-bold text-gray-800">{currency} {Math.round(dashData.earnings / 0.8 * 0.2)}</p>
              <div className="mt-2 text-xs text-gray-500">20% of appointment fees</div>
            </div>
          </div>

          <div className='mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-600'>
            <p><span className='font-medium'>Note:</span> MediMeet operates on a revenue-sharing model where doctors receive 80% of the appointment fees, while 20% goes to the platform as a service fee.</p>
          </div>
        </div>
      </div>

      {/* Latest Bookings */}
      <div className='bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200'>
        <div className='flex items-center justify-between px-4 sm:px-6 py-4 border-b'>
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
                  {/* Mobile View */}
                  <div className="lg:hidden space-y-4">
                    {/* Patient Info */}
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <img 
                          className='w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm' 
                          src={item.userData.image} 
                          alt={item.userData.name} 
                        />
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          item.cancelled ? 'bg-red-500' : 
                          item.isCompleted ? 'bg-green-500' : 
                          'bg-blue-500'
                        }`}></span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{item.userData.name}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                            item.cancelled ? 'bg-red-100 text-red-800' : 
                            item.isCompleted ? 'bg-green-100 text-green-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Upcoming'}
                          </span>
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {slotDateFormat(item.slotDate)}
                          </span>
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {item.slotTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Payment Amount</p>
                          <p className="text-xl font-semibold text-gray-900">{currency}{item.amount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Payment Method</p>
                          <div className="inline-flex items-center mt-1">
                            <svg className={`w-4 h-4 mr-1 ${item.payment ? 'text-green-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {item.payment ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              )}
                            </svg>
                            <span className="text-sm font-medium text-gray-900">
                              Online Payment
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button 
                        onClick={() => navigate('/doctor-appointments')}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                      {!item.cancelled && !item.isCompleted && (
                        <button 
                          onClick={() => navigate('/doctor-appointments')}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Join Meeting
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden lg:flex lg:flex-row lg:items-center gap-4">
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