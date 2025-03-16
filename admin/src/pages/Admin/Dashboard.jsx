import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const { aToken, getDashData, dashData } = useContext(AdminContext)
  const { slotDateFormat, currency } = useContext(AppContext)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (aToken) {
      setIsLoading(true)
      getDashData().finally(() => {
        setIsLoading(false)
      })
    }
  }, [aToken])

  // Get status badge based on appointment status
  const getStatusBadge = (appointment) => {
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

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return dashData && (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Doctors Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <img className="w-10 h-10" src={assets.doctor_icon} alt="Doctors" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{dashData.doctors}</p>
              <p className="text-sm text-gray-600">Total Doctors</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1"></div>
          <div className="px-6 py-2 bg-white flex justify-between items-center">
            <span className="text-xs text-gray-500">Active Doctors</span>
            <span className="text-xs font-medium text-blue-600">{dashData.doctors}</span>
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
          <div className="px-6 py-2 bg-white flex justify-between items-center">
            <span className="text-xs text-gray-500">Completed</span>
            <span className="text-xs font-medium text-green-600">{dashData.completedAppointments || 0}</span>
          </div>
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
          <div className="px-6 py-2 bg-white flex justify-between items-center">
            <span className="text-xs text-gray-500">New This Month</span>
            <span className="text-xs font-medium text-purple-600">{dashData.newPatients || 0}</span>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 flex items-center">
            <div className="bg-amber-100 p-3 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{currency}{dashData.totalRevenue || 0}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-500 to-yellow-600 h-1"></div>
          <div className="px-6 py-2 bg-white flex justify-between items-center">
            <span className="text-xs text-gray-500">Admin Share (20%)</span>
            <span className="text-xs font-medium text-amber-600">{currency}{dashData.adminRevenue || 0}</span>
          </div>
        </div>
      </div>

      {/* Latest Bookings */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <img src={assets.list_icon} alt="" className="w-5 h-5" />
            <h2 className="font-semibold text-gray-800">Latest Appointments</h2>
          </div>
          <button 
            onClick={() => navigate('/all-appointments')}
            className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
          >
            View All
          </button>
        </div>

        {dashData.latestAppointments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No appointments found
          </div>
        ) : (
          <div className="divide-y">
            {dashData.latestAppointments.slice(0, 5).map((item, index) => (
              <div className="p-4 sm:px-6 hover:bg-gray-50 transition-colors" key={index}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Doctor Info */}
                  <div className="flex items-center flex-1 gap-3">
                    <img 
                      className="w-12 h-12 rounded-full object-cover border" 
                      src={item.docData.image} 
                      alt={item.docData.name} 
                    />
                    <div>
                      <p className="font-medium text-gray-800">{item.docData.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {slotDateFormat(item.slotDate)}, {item.slotTime}
                        </span>
                        {getStatusBadge(item)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Patient Info */}
                  <div className="flex items-center gap-3">
                    <img 
                      className="w-10 h-10 rounded-full object-cover border" 
                      src={item.userData.image} 
                      alt={item.userData.name} 
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{item.userData.name}</p>
                      <p className="text-xs text-gray-500">Patient</p>
                    </div>
                  </div>
                  
                  {/* Payment Info & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-800">{currency}{item.amount}</p>
                      <p className="text-xs text-gray-500">{item.payment ? 'Paid Online' : 'Cash Payment'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 italic">
          To cancel or manage appointments, please visit the <button onClick={() => navigate('/all-appointments')} className="text-primary hover:underline">Appointments</button> page.
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Revenue Overview */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-800">Revenue Overview</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">{currency}{dashData.totalRevenue || 0}</p>
                <div className="mt-2 text-xs text-gray-500">From all appointments</div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Admin Revenue</p>
                <p className="text-2xl font-bold text-gray-800">{currency}{dashData.adminRevenue || 0}</p>
                <div className="mt-2 text-xs text-gray-500">20% of total revenue</div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Doctors' Share</p>
                <p className="text-2xl font-bold text-gray-800">{currency}{(dashData.totalRevenue - dashData.adminRevenue) || 0}</p>
                <div className="mt-2 text-xs text-gray-500">80% of total revenue</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Revenue per Doctor</p>
                <p className="text-2xl font-bold text-gray-800">
                  {currency}{dashData.doctors > 0 ? Math.round((dashData.totalRevenue - dashData.adminRevenue) / dashData.doctors) : 0}
                </p>
                <div className="mt-2 text-xs text-gray-500">Average per doctor</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-800">System Health</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-700">Active Users</p>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Last 30 Days</span>
                </div>
                <p className="text-lg font-semibold text-gray-800 mt-2">{dashData.activeUsers || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Out of {dashData.patients} total patients</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-700">Server Status</p>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Online</span>
                </div>
                <p className="text-lg font-semibold text-gray-800 mt-2">{dashData.serverUptime}% Uptime</p>
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1 flex justify-between">
                    <span>System Load</span>
                    <span>{dashData.systemLoad}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        dashData.systemLoad < 30 ? 'bg-green-500' : 
                        dashData.systemLoad < 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${dashData.systemLoad}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-700">Appointment Status</p>
                </div>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-gray-800">{dashData.completedAppointments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Pending</span>
                    <span className="text-sm font-medium text-gray-800">{dashData.pendingAppointments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Total</span>
                    <span className="text-sm font-medium text-gray-800">{dashData.appointments || 0}</span>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-700">User Distribution</p>
                </div>
                <div className="mt-3">
                  <div className="flex items-center mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(dashData.patients / (dashData.patients + dashData.doctors)) * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{dashData.patients || 0} Patients</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${(dashData.doctors / (dashData.patients + dashData.doctors)) * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{dashData.doctors || 0} Doctors</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard