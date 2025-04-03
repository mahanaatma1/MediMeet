import React, { useEffect, useState, useCallback } from 'react'
import { assets } from '../../assets/assets'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AllAppointments = () => {
  const { aToken, appointments, cancelAppointment, getAllAppointments } = useContext(AdminContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [localAppointments, setLocalAppointments] = useState([])
  const [dataFetched, setDataFetched] = useState(false)

  // Memoize the fetchData function to avoid unnecessary re-renders
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await getAllAppointments()
      setIsLoading(false)
      setDataFetched(true)
    } catch (err) {
      console.error("Error fetching appointments:", err)
      setError("Failed to load appointments. Please try again.")
      setIsLoading(false)
    }
  }, [getAllAppointments])

  // Initial data loading
  useEffect(() => {
    if (aToken && !dataFetched) {
      fetchData()
    }
  }, [aToken, fetchData, dataFetched])

  // Store appointments in local state to prevent fluctuation
  useEffect(() => {
    if (Array.isArray(appointments) && appointments.length > 0) {
      setLocalAppointments(appointments)
    }
  }, [appointments])

  // Handle appointment cancellation with confirmation
  const handleCancelAppointment = (id) => {
    if (isLoading) return; // Prevent action while loading
    
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      setIsLoading(true)
      cancelAppointment(id)
        .then(() => {
          // Update local state instead of fetching all data again
          setLocalAppointments(prev => 
            prev.map(app => 
              app._id === id ? { ...app, cancelled: true } : app
            )
          )
          setIsLoading(false)
        })
        .catch(err => {
          console.error("Error cancelling appointment:", err)
          setError("Failed to cancel appointment. Please try again.")
          setIsLoading(false)
        })
    }
  }

  // Use local appointments for filtering to prevent fluctuation
  const appointmentsToUse = dataFetched && localAppointments.length > 0 ? localAppointments : appointments;

  // Filter appointments based on search term and status
  const filteredAppointments = Array.isArray(appointmentsToUse) ? appointmentsToUse.filter(item => {
    if (!item || !item.userData || !item.docData) return false;
    
    const matchesSearch = 
      (item.userData.name && item.userData.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.docData.name && item.docData.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'cancelled') return matchesSearch && item.cancelled;
    if (statusFilter === 'completed') return matchesSearch && item.isCompleted;
    if (statusFilter === 'pending') return matchesSearch && !item.cancelled && !item.isCompleted;
    
    return matchesSearch;
  }) : [];

  // Get status badge based on appointment status
  const getStatusBadge = (appointment) => {
    if (!appointment) return null;
    
    if (appointment.cancelled) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Cancelled</span>
    } else if (appointment.isCompleted) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>
    } else if (appointment.payment) {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Confirmed</span>
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
    }
  }

  // Calculate stats safely
  const getStats = () => {
    const appts = dataFetched && localAppointments.length > 0 ? localAppointments : appointments;
    
    if (!Array.isArray(appts)) {
      return { total: 0, pending: 0, completed: 0, cancelled: 0 };
    }
    
    return {
      total: appts.length,
      pending: appts.filter(a => a && !a.cancelled && !a.isCompleted).length,
      completed: appts.filter(a => a && a.isCompleted).length,
      cancelled: appts.filter(a => a && a.cancelled).length
    };
  }

  const stats = getStats();

  // Loading state - only show on initial load, not during data updates
  if (isLoading && !dataFetched) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">Loading appointments...</p>
      </div>
    )
  }

  // Error state
  if (error && !dataFetched) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col justify-center items-center min-h-[60vh]">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-md text-center">
          <p className="font-medium mb-2">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // Empty state - only if we've fetched data and it's empty
  if (dataFetched && (!Array.isArray(appointmentsToUse) || appointmentsToUse.length === 0)) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <h1 className='text-2xl font-bold text-gray-800 mb-6'>All Appointments</h1>
        <div className="bg-white border rounded-xl shadow-sm p-8 text-center">
          <img 
            src={assets.empty_icon || "https://cdn-icons-png.flaticon.com/512/7486/7486754.png"} 
            alt="No appointments" 
            className="w-24 h-24 mx-auto mb-4 opacity-50"
          />
          <h2 className="text-xl font-medium text-gray-700 mb-2">No Appointments Found</h2>
          <p className="text-gray-500">There are no appointments in the system yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full max-w-7xl mx-auto px-4 py-6'>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className='text-2xl font-bold text-gray-800'>All Appointments</h1>
        <div className="flex flex-col sm:flex-row gap-3 mt-3 md:mt-0 w-full sm:w-auto">
          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search patient or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-blue-600">{stats.pending || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{stats.cancelled || 0}</p>
        </div>
      </div>

      {/* Appointments table/list */}
      <div className='bg-white border rounded-xl shadow-sm overflow-hidden'>
        {/* Table header - visible only on larger screens */}
        <div className='hidden lg:grid grid-cols-[0.5fr_2.5fr_1fr_2fr_2.5fr_1fr_1fr] py-4 px-6 border-b bg-gray-50'>
          <p className="font-medium text-gray-600">#</p>
          <p className="font-medium text-gray-600">Patient</p>
          <p className="font-medium text-gray-600">Age</p>
          <p className="font-medium text-gray-600">Date & Time</p>
          <p className="font-medium text-gray-600">Doctor</p>
          <p className="font-medium text-gray-600">Fees</p>
          <p className="font-medium text-gray-600">Status/Action</p>
        </div>
        
        {/* Responsive list */}
        <div className="max-h-[65vh] overflow-y-auto">
          {filteredAppointments.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No appointments found matching your criteria
            </div>
          ) : (
            filteredAppointments.map((item, index) => {
              // Skip rendering if item is invalid
              if (!item || !item.userData || !item.docData) return null;
              
              return (
                <div key={item._id || index} className='border-b last:border-b-0 hover:bg-gray-50 transition-colors'>
                  {/* Large screen view - table row */}
                  <div className='hidden lg:grid lg:grid-cols-[0.5fr_2.5fr_1fr_2fr_2.5fr_1fr_1fr] items-center py-4 px-6'>
                    <p className='text-gray-500'>{index+1}</p>
                    <div className='flex items-center gap-3'>
                      {item.userData && item.userData.image ? (
                        <img src={item.userData.image} className='w-10 h-10 rounded-full object-cover border border-gray-200' alt="" />
                      ) : (
                        <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center'>
                          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{item.userData ? item.userData.name : 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{item.userData && item.userData.phone ? item.userData.phone : 'N/A'}</p>
                      </div>
                    </div>
                    <p className='text-gray-600'>{item.userData && item.userData.dob && calculateAge(item.userData.dob) ? calculateAge(item.userData.dob) : 'N/A'}</p>
                    <div>
                      <p className="font-medium text-gray-800">{slotDateFormat(item.slotDate)}</p>
                      <p className="text-sm text-gray-500">{item.slotTime}</p>
                    </div>
                    <div className='flex items-center gap-3'>
                      {item.docData && item.docData.image ? (
                        <img src={item.docData.image} className='w-10 h-10 rounded-full object-cover border border-gray-200' alt="" />
                      ) : (
                        <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center'>
                          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{item.docData ? item.docData.name : 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{item.docData && item.docData.specialization ? item.docData.specialization : 'N/A'}</p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-800">{currency}{item.amount ? item.amount : '0'}</p>
                    <div>
                      {item.cancelled || item.isCompleted ? (
                        getStatusBadge(item)
                      ) : (
                        <button 
                          onClick={() => handleCancelAppointment(item._id)} 
                          className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          title="Cancel appointment"
                          disabled={isLoading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Mobile view - card style */}
                  <div className='lg:hidden p-4 space-y-4'>
                    {/* Patient Info */}
                    <div className="flex items-center gap-3">
                      {item.userData && item.userData.image ? (
                        <img src={item.userData.image} className='w-12 h-12 rounded-full object-cover border border-gray-200' alt="" />
                      ) : (
                        <div className='w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center'>
                          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.userData ? item.userData.name : 'Unknown'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Age: {item.userData && item.userData.dob && calculateAge(item.userData.dob) ? calculateAge(item.userData.dob) : 'N/A'}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{item.userData && item.userData.phone ? item.userData.phone : 'N/A'}</span>
                        </div>
                      </div>
                      {getStatusBadge(item)}
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600">{slotDateFormat(item.slotDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">{item.slotTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">{currency}{item.amount ? item.amount : '0'}</span>
                      </div>
                    </div>

                    {/* Doctor Info */}
                    <div className="flex items-center gap-3">
                      {item.docData && item.docData.image ? (
                        <img src={item.docData.image} className='w-12 h-12 rounded-full object-cover border border-gray-200' alt="" />
                      ) : (
                        <div className='w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center'>
                          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.docData ? item.docData.name : 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{item.docData && item.docData.specialization ? item.docData.specialization : 'N/A'}</p>
                      </div>
                      {!item.cancelled && !item.isCompleted && (
                        <button 
                          onClick={() => handleCancelAppointment(item._id)} 
                          className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors flex items-center gap-1"
                          disabled={isLoading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default AllAppointments