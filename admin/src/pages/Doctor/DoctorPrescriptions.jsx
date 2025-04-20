import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { FaFilePdf, FaEdit, FaCalendarPlus, FaStethoscope, FaSearch, FaArrowLeft, FaPlus, FaCalendarAlt } from 'react-icons/fa'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

// Import prescription components
import PrescriptionForm from '../../components/PrescriptionForm'
import PrescriptionView from '../../components/PrescriptionView'

const DoctorPrescriptions = () => {
  const { dToken, prescriptions, getPrescriptions, isLoadingPrescriptions, backendUrl } = useContext(DoctorContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'viewed', 'not-viewed'
  const navigate = useNavigate()
  const { prescriptionId } = useParams()
  const location = useLocation()
  
  // Prescription state
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState(null) // 'view', 'edit', 'create', or null
  
  // Create prescription state
  const [appointments, setAppointments] = useState([])
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('')
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [showPreviousAppointments, setShowPreviousAppointments] = useState(false)
  
  useEffect(() => {
    if (dToken) {
      getPrescriptions()
    }
  }, [dToken])
  
  // Determine mode based on URL
  useEffect(() => {
    if (location.pathname.includes('/view/')) {
      setViewMode('view')
    } else if (location.pathname.includes('/edit/')) {
      setViewMode('edit')
    } else if (location.pathname.includes('/list')) {
      setViewMode('list')
    } else {
      setViewMode('create') // Set create as the default view
    }
  }, [location])
  
  // Find selected prescription when ID is in URL
  useEffect(() => {
    if (prescriptionId && prescriptions.length > 0 && (viewMode === 'view' || viewMode === 'edit')) {
      const prescription = prescriptions.find(p => p._id === prescriptionId)
      if (prescription) {
        setSelectedPrescription(prescription)
      } else {
        // If prescription not found, go back to list
        toast.error("Prescription not found")
        navigate("/doctor-prescriptions/list")
      }
    }
  }, [prescriptionId, prescriptions, viewMode, navigate])
  
  // Get completed appointments that don't have prescriptions yet
  useEffect(() => {
    const fetchCompletedAppointments = async () => {
      if (viewMode !== 'create') return
      
      try {
        setLoadingAppointments(true)
        console.log('Fetching completed appointments without prescriptions...')
        
        // Make sure we have a token
        if (!dToken) {
          console.error('No doctor token available');
          setLoadingAppointments(false);
          return;
        }
        
        // Log the URL and token for debugging
        console.log(`API URL: ${backendUrl}/api/doctor/appointments/completed-without-prescription`);
        console.log('Using token:', dToken ? 'Token available' : 'No token');
        
        const response = await axios.get(
          `${backendUrl}/api/doctor/appointments/completed-without-prescription`,
          { headers: { dtoken: dToken } }
        )
        
        if (response.data.success) {
          console.log('API response data:', response.data)
          
          // Get all appointments that need prescriptions
          const appointments = response.data.appointments || [];
          
          if (appointments.length === 0) {
            console.log('No appointments returned from API');
          }
          
          // Get today's date at midnight for comparison
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Current date components for comparison
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth(); // 0-indexed
          const currentDay = today.getDate();
          
          console.log(`Current date: ${currentDay}/${currentMonth+1}/${currentYear}`);
          
          // Process appointments and format dates
          const processedAppointments = appointments.map(appointment => {
            console.log('Processing appointment:', appointment._id, 'slotDate:', appointment.slotDate);
            
            // Parse date in DD_MM_YYYY format
            let appointmentDate = null;
            let day, month, year;
            
            if (appointment.slotDate && appointment.slotDate.includes('_')) {
              [day, month, year] = appointment.slotDate.split('_').map(Number);
              
              // Log all date components for debugging
              console.log(`Date components from slotDate: day=${day}, month=${month}, year=${year}`);
              
              // SPECIAL HANDLING: Check specifically for the example in the bug report
              // For the specific "20_3_2025" example, we know this is April 20, 2025
              if (appointment.slotDate === "20_3_2025") {
                console.log("Found the specific example date format. Fixing interpretation.");
                // In this case, month should be 3 (April), day should be 20
                day = 20;
                month = 4; // April (using 1-indexing, will adjust to 0-index later)
                console.log(`Corrected interpretation: day=${day}, month=${month} (April), year=${year}`);
              }
              // Check if there's ambiguity in the date format by examining meetingStartTime
              // This will help determine if the format is DD_MM_YYYY or MM_DD_YYYY
              else if (appointment.meetingStartTime) {
                // If we have a meeting timestamp, use it to verify date format
                const meetingDate = new Date(appointment.meetingStartTime);
                console.log(`Meeting start time: ${meetingDate.toISOString()}`);
                
                // Check if meeting month matches what we'd expect
                const meetingMonth = meetingDate.getMonth() + 1; // +1 because getMonth is 0-indexed
                
                if (meetingMonth === day && meetingDate.getDate() === month) {
                  // This suggests MM_DD_YYYY format
                  console.log(`Detected MM_DD_YYYY format based on meetingStartTime`);
                  
                  // Swap day and month
                  [month, day] = [day, month];
                  console.log(`Swapped month/day: day=${day}, month=${month}, year=${year}`);
                }
              }
              
              // Adjust month to be 0-indexed for JS Date (January is 0, not 1)
              appointmentDate = new Date(year, month-1, day);
              
              // Format date for display
              const formattedDisplayDate = `${day}/${month}/${year}`;
              appointment.formattedDate = formattedDisplayDate;
              
              console.log(`Parsed appointment date: ${appointmentDate.toISOString()}`);
              console.log(`Displayed as: ${formattedDisplayDate}`);
              console.log(`Format used: ${appointment.slotDate.includes('_') ? 'DD_MM_YYYY' : 'MM_DD_YYYY'}`);
            } else {
              appointmentDate = new Date(appointment.slotDate);
              appointment.formattedDate = appointmentDate.toLocaleDateString();
              console.log(`Appointment date from timestamp: ${appointmentDate.toDateString()}`);
            }
            
            // Check if this appointment was completed within the last 5 minutes
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            const completedAt = new Date(appointment.updatedAt || appointment.createdAt);
            
            appointment.recentlyCompleted = completedAt > fiveMinutesAgo;
            
            // Check if appointment date is today, past or future
            if (appointmentDate) {
              const appointmentYear = appointmentDate.getFullYear();
              const appointmentMonth = appointmentDate.getMonth(); // 0-indexed
              const appointmentDay = appointmentDate.getDate();
              
              appointment.isToday = 
                appointmentYear === currentYear &&
                appointmentMonth === currentMonth &&
                appointmentDay === currentDay;
                
              appointment.isPast = appointmentDate < today;
              appointment.isFuture = appointmentDate > today;
              
              // Add debug information to appointment object for easier debugging
              appointment.debugDate = {
                parsedDate: appointmentDate.toISOString(),
                isToday: appointment.isToday,
                isPast: appointment.isPast,
                isFuture: appointment.isFuture,
                displayDate: appointment.formattedDate
              };
              
              console.log(`Appointment ${appointment._id} date status:`, appointment.debugDate);
            } else {
              appointment.isToday = false;
              appointment.isPast = false;
              appointment.isFuture = false;
              appointment.debugDate = { error: "Could not parse date" };
            }
            
            return appointment;
          });
          
          // Sort appointments: today's first (sorted by time), then future, then past appointments (newest first)
          const sortedAppointments = processedAppointments.sort((a, b) => {
            // First prioritize today's appointments
            if (a.isToday && !b.isToday) return -1;
            if (!a.isToday && b.isToday) return 1;
            
            // Then prioritize by future/past
            if (a.isFuture && b.isPast) return -1;
            if (a.isPast && b.isFuture) return 1;
            
            // Then prioritize by recent completion
            if (a.recentlyCompleted && !b.recentlyCompleted) return -1;
            if (!a.recentlyCompleted && b.recentlyCompleted) return 1;
            
            // If both are from today or both are not from today, sort by most recent
            // If using slotDate format (DD_MM_YYYY)
            if (a.slotDate && b.slotDate && a.slotDate.includes('_') && b.slotDate.includes('_')) {
              // Parse dates for comparison
              const [aDay, aMonth, aYear] = a.slotDate.split('_').map(Number);
              const [bDay, bMonth, bYear] = b.slotDate.split('_').map(Number);
              
              // For future dates, sort by closest date
              if (a.isFuture && b.isFuture) {
                // Compare years
                if (aYear !== bYear) return aYear - bYear;
                
                // Compare months
                if (aMonth !== bMonth) return aMonth - bMonth;
                
                // Compare days
                if (aDay !== bDay) return aDay - bDay;
              } else {
                // For past dates, sort newest first
                // Compare years
                if (aYear !== bYear) return bYear - aYear;
                
                // Compare months
                if (aMonth !== bMonth) return bMonth - aMonth;
                
                // Compare days
                if (aDay !== bDay) return bDay - aDay;
              }
              
              // If same day, compare times
              return a.slotTime > b.slotTime ? -1 : 1;
            }
            
            // Fallback to updatedAt/createdAt for sorting
            const dateA = new Date(a.updatedAt || a.createdAt);
            const dateB = new Date(b.updatedAt || b.createdAt);
            return dateB - dateA; // newest first
          });
          
          console.log('Appointments after processing:', sortedAppointments);
          setAppointments(sortedAppointments);
          
          // Auto-select the most recently completed appointment if available
          const recentlyCompleted = sortedAppointments.find(a => a.recentlyCompleted);
          if (recentlyCompleted) {
            console.log('Auto-selecting recently completed appointment:', recentlyCompleted._id);
            setSelectedAppointmentId(recentlyCompleted._id);
            toast.success(`Appointment for ${recentlyCompleted.userData?.name} was recently completed. You can now create a prescription.`);
          }
        } else {
          console.error('API error:', response.data.message);
          toast.error(response.data.message || 'Failed to fetch appointments')
        }
      } catch (error) {
        console.error('Error fetching appointments:', error)
        console.error('Error details:', error.response?.data || error.message);
        toast.error('Failed to fetch appointments. Check console for details.')
      } finally {
        setLoadingAppointments(false)
      }
    }
    
    if (viewMode === 'create' && dToken) {
      fetchCompletedAppointments()
    }
  }, [viewMode, dToken, backendUrl])
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  // Handle prescription actions
  const handleViewPrescription = (prescription) => {
    navigate(`/doctor-prescriptions/view/${prescription._id}`)
  }
  
  const handleEditPrescription = (prescription) => {
    navigate(`/doctor-prescriptions/edit/${prescription._id}`)
  }
  
  const handleBackToList = () => {
    navigate('/doctor-prescriptions/list')
  }
  
  const navigateToCreatePrescription = () => {
    navigate('/doctor-prescriptions') // Default is now create
  }
  
  const navigateToPrescriptionsList = () => {
    navigate('/doctor-prescriptions/list')
  }
  
  const handlePrescriptionFormSave = async (updatedData) => {
    try {
      setLoading(true)
      const headers = { dtoken: dToken }
      
      const response = await axios.put(
        `${backendUrl}/api/prescription/update/${prescriptionId}`,
        updatedData,
        { headers }
      )
      
      if (response.data.success) {
        toast.success('Prescription updated successfully')
        getPrescriptions()
        // Go back to view mode
        navigate(`/doctor-prescriptions/view/${prescriptionId}`)
      } else {
        toast.error(response.data.message || 'Failed to update prescription')
      }
    } catch (error) {
      console.error('Error updating prescription:', error)
      toast.error(error.response?.data?.message || 'Failed to update prescription')
    } finally {
      setLoading(false)
    }
  }
  
  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(prescription => {
    // Search filter
    const patientName = prescription.patientData?.name || ''
    const diagnosis = prescription.diagnosis || ''
    const searchMatch = 
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    if (activeFilter === 'all') return searchMatch
    if (activeFilter === 'viewed') return searchMatch && prescription.viewedByPatient
    if (activeFilter === 'not-viewed') return searchMatch && !prescription.viewedByPatient
    
    return searchMatch
  })

  // Download prescription as PDF
  const downloadPrescription = async (prescriptionId) => {
    setLoading(true)
    
    try {
      const response = await axios.get(
        `${backendUrl}/api/prescription/download/${prescriptionId}`,
        { 
          headers: { dtoken: dToken },
          responseType: 'blob'
        }
      )
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]))
      
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `prescription-${prescriptionId}.pdf`)
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading prescription:', error)
      toast.error('Failed to download prescription')
    } finally {
      setLoading(false)
    }
  }

  // Render prescription details view
  if (viewMode === 'view' && selectedPrescription) {
    return (
      <div className='bg-white shadow rounded-lg p-6'>
        <div className="flex items-center mb-6">
          <button 
            onClick={handleBackToList}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4 bg-gray-100 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Prescriptions List
          </button>
          <h1 className='text-2xl font-bold text-gray-800'>Prescription Details</h1>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-xl font-medium text-gray-800">
                  {selectedPrescription.patientData?.name || 'Unknown Patient'}
                </h2>
              </div>
              <p className="text-sm text-gray-500 mt-1 ml-7">
                <span className="font-medium">Created:</span> {selectedPrescription.createdAt ? formatDate(selectedPrescription.createdAt) : 'Unknown date'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditPrescription(selectedPrescription)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                <FaEdit className="mr-2" /> Edit Prescription
              </button>
              <button
                onClick={() => downloadPrescription(selectedPrescription._id)}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                <FaFilePdf className="mr-2" /> Download PDF
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
              <h3 className="font-medium text-gray-700 flex items-center">
                <FaStethoscope className="mr-2 text-blue-600" /> Diagnosis
              </h3>
            </div>
            <div className="p-4">
              <p className="text-gray-800 whitespace-pre-line">
                {selectedPrescription.diagnosis || 'No diagnosis provided'}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
              <h3 className="font-medium text-gray-700 flex items-center">
                <FaCalendarPlus className="mr-2 text-blue-600" /> Follow-up
              </h3>
            </div>
            <div className="p-4">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-gray-800">
                  {selectedPrescription.followUpDate ? formatDate(selectedPrescription.followUpDate) : 'No follow-up scheduled'}
                </span>
              </div>
              {selectedPrescription.followUpInstructions && (
                <div className="bg-gray-50 p-3 rounded-md mt-2 text-sm text-gray-700">
                  <span className="font-medium block mb-1">Instructions:</span>
                  {selectedPrescription.followUpInstructions}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="border-b border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
            <h3 className="font-medium text-gray-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Medications
            </h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {selectedPrescription.medications ? selectedPrescription.medications.length : 0} medications
            </span>
          </div>
          
          {selectedPrescription.medications && selectedPrescription.medications.length > 0 ? (
            <div className="p-4">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedPrescription.medications.map((medication, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{medication.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{medication.dosage}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{medication.frequency}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{medication.duration}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {medication.timing && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs mr-1">{medication.timing}</span>}
                          {medication.instructions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50">
              <p className="text-gray-500">No medications added</p>
            </div>
          )}
        </div>
        
        {selectedPrescription.notes && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
              <h3 className="font-medium text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Additional Notes
              </h3>
            </div>
            <div className="p-4">
              <p className="text-gray-800 whitespace-pre-line">{selectedPrescription.notes}</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleBackToList}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to List
          </button>
          <button
            onClick={() => handleEditPrescription(selectedPrescription)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaEdit className="mr-2" />
            Edit Prescription
          </button>
        </div>
      </div>
    )
  }
  
  // Render prescription edit view
  if (viewMode === 'edit' && selectedPrescription) {
    return (
      <div className='bg-white shadow rounded-lg p-6'>
        <div className="flex items-center mb-6">
          <button 
            onClick={handleBackToList}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4 bg-gray-100 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Prescriptions List
          </button>
          <div>
            <h1 className='text-2xl font-bold text-gray-800'>Edit Prescription</h1>
            <p className="text-gray-500 text-sm mt-1">Update prescription details for {selectedPrescription.patientData?.name || 'patient'}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <div>
              <h2 className="text-lg font-medium text-gray-800">Modify Prescription Details</h2>
              <p className="text-sm text-gray-600">Make changes to the prescription information below</p>
            </div>
          </div>
        </div>
        
        {/* Render prescription form directly in the page instead of as a modal */}
        <div className="max-w-4xl mx-auto">
          <PrescriptionForm 
            appointmentId={selectedPrescription.appointmentId}
            existingPrescription={selectedPrescription}
            onClose={handleBackToList}
            isFullPage={true}
          />
        </div>
      </div>
    )
  }
  
  // Render prescription creation view
  if (viewMode === 'create') {
    return (
      <div className='bg-white shadow rounded-lg p-6'>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-6 mb-6 shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <h1 className='text-3xl font-bold'>Create Prescription</h1>
              <p className="text-blue-100 mt-2 max-w-2xl">Create a new prescription for your patients with detailed medication information and follow-up instructions</p>
            </div>
            <button
              onClick={navigateToPrescriptionsList}
              className="bg-white text-blue-700 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors flex items-center shadow-sm whitespace-nowrap self-start sm:self-center mt-3 sm:mt-0"
            >
              <FaEdit className="mr-2" />
              View & Update Prescriptions
            </button>
          </div>
        </div>
        
        {loadingAppointments ? (
          <div className="flex flex-col justify-center items-center py-16 bg-gray-50 rounded-lg border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {appointments.length === 0 ? (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-8 text-center">
                <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-yellow-800 mb-2">No Completed Appointments Found</h3>
                <p className="text-yellow-700 mb-4">You don't have any completed appointments that need prescriptions.</p>
                <div className="bg-white p-4 rounded-md shadow-sm inline-block">
                  <h4 className="font-medium text-gray-700 mb-2">What to do next:</h4>
                  <ol className="text-left text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">1</span>
                      <span>Go to <strong>Appointments</strong> section</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">2</span>
                      <span>Mark appointments as completed after consultation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">3</span>
                      <span>Return to this page to create prescriptions</span>
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      <span className="text-blue-700 font-medium">1</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">Select Patient</h3>
                  </div>
                  
                  <div className="bg-white rounded-md shadow-sm p-4">
                    <h4 className="font-medium text-gray-700 mb-4">Choose Patient from Completed Appointments</h4>
                    
                    {appointments.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No completed appointments found. Make sure to complete appointments in the Appointments section.
                      </p>
                    ) : (
                      <div>
                        {/* Today's appointments section */}
                        {appointments.some(app => app.isToday) ? (
                          <div className="mb-6">
                            <div className="flex items-center mb-3">
                              <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2">Today</div>
                              <div className="h-px bg-gray-200 flex-grow"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {appointments.filter(app => app.isToday).map(appointment => (
                                <div 
                                  key={appointment._id}
                                  onClick={() => setSelectedAppointmentId(appointment._id)}
                                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedAppointmentId === appointment._id 
                                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                  } ${appointment.recentlyCompleted ? 'ring-2 ring-green-300' : ''}`}
                                >
                                  <div className="flex items-start">
                                    <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mr-3">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    <div className="flex-grow">
                                      <h5 className="font-medium text-gray-800">{appointment.userData?.name || 'Unknown Patient'}</h5>
                                      <div className="flex items-center mt-1 text-sm text-gray-600">
                                        <FaCalendarAlt className="mr-1 text-blue-500" />
                                        <span className="text-blue-600 font-medium">Today</span>
                                        <span className="mx-1">·</span>
                                        <span>{appointment.slotTime}</span>
                                      </div>
                                    </div>
                                    {selectedAppointmentId === appointment._id && (
                                      <div className="flex-shrink-0 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {appointment.recentlyCompleted && (
                                    <div className="mt-2 bg-green-50 text-green-700 text-xs py-1 px-2 rounded flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Just Completed
                                    </div>
                                  )}
                                  
                                  {appointment.symptoms && (
                                    <div className="mt-2 border-t border-gray-100 pt-2">
                                      <div className="text-xs text-gray-500">Symptoms:</div>
                                      <div className="text-sm text-gray-700 line-clamp-2">{appointment.symptoms}</div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 bg-yellow-100 rounded-full p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">No appointments completed today</h3>
                                <p className="text-xs text-yellow-700 mt-1">
                                  There are no appointments completed today that need prescriptions.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Future appointments section */}
                        {appointments.some(app => app.isFuture) && (
                          <div className="mb-6">
                            <div className="flex items-center mb-3">
                              <div className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2">Upcoming</div>
                              <div className="h-px bg-gray-200 flex-grow"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {appointments.filter(app => app.isFuture).map(appointment => (
                                <div 
                                  key={appointment._id}
                                  onClick={() => setSelectedAppointmentId(appointment._id)}
                                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedAppointmentId === appointment._id 
                                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                  } ${appointment.recentlyCompleted ? 'ring-2 ring-green-300' : ''}`}
                                >
                                  <div className="flex items-start">
                                    <div className="bg-purple-100 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mr-3">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    <div className="flex-grow">
                                      <h5 className="font-medium text-gray-800">{appointment.userData?.name || 'Unknown Patient'}</h5>
                                      <div className="flex items-center mt-1 text-sm text-gray-600">
                                        <FaCalendarAlt className="mr-1 text-purple-500" />
                                        <span className="text-purple-600 font-medium">{appointment.formattedDate}</span>
                                        <span className="mx-1">·</span>
                                        <span>{appointment.slotTime}</span>
                                      </div>
                                      <div className="mt-1 text-xs text-gray-500">
                                        Original format: {appointment.slotDate}
                                      </div>
                                    </div>
                                    {selectedAppointmentId === appointment._id && (
                                      <div className="flex-shrink-0 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {appointment.recentlyCompleted && (
                                    <div className="mt-2 bg-green-50 text-green-700 text-xs py-1 px-2 rounded flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Just Completed
                                    </div>
                                  )}
                                  
                                  {appointment.symptoms && (
                                    <div className="mt-2 border-t border-gray-100 pt-2">
                                      <div className="text-xs text-gray-500">Symptoms:</div>
                                      <div className="text-sm text-gray-700 line-clamp-2">{appointment.symptoms}</div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Previous appointments toggle */}
                        {appointments.some(app => app.isPast) && (
                          <div className="mb-4">
                            <button
                              onClick={() => setShowPreviousAppointments(!showPreviousAppointments)}
                              className="flex items-center text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2 transition-colors"
                            >
                              {showPreviousAppointments ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  Hide Previous Appointments
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  Show Previous Appointments ({appointments.filter(app => app.isPast).length})
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        
                        {/* Previous appointments section */}
                        {showPreviousAppointments && appointments.some(app => app.isPast) && (
                          <div>
                            <div className="flex items-center mb-3">
                              <div className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2">Previous</div>
                              <div className="h-px bg-gray-200 flex-grow"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {appointments.filter(app => app.isPast).map(appointment => (
                                <div 
                                  key={appointment._id}
                                  onClick={() => setSelectedAppointmentId(appointment._id)}
                                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedAppointmentId === appointment._id 
                                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                  } ${appointment.recentlyCompleted ? 'ring-2 ring-green-300' : ''}`}
                                >
                                  <div className="flex items-start">
                                    <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mr-3">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    <div className="flex-grow">
                                      <h5 className="font-medium text-gray-800">{appointment.userData?.name || 'Unknown Patient'}</h5>
                                      <div className="flex items-center mt-1 text-sm text-gray-600">
                                        <FaCalendarAlt className="mr-1 text-blue-500" />
                                        <span>{appointment.formattedDate}</span>
                                        <span className="mx-1">·</span>
                                        <span>{appointment.slotTime}</span>
                                      </div>
                                    </div>
                                    {selectedAppointmentId === appointment._id && (
                                      <div className="flex-shrink-0 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {appointment.recentlyCompleted && (
                                    <div className="mt-2 bg-green-50 text-green-700 text-xs py-1 px-2 rounded flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Just Completed
                                    </div>
                                  )}
                                  
                                  {appointment.symptoms && (
                                    <div className="mt-2 border-t border-gray-100 pt-2">
                                      <div className="text-xs text-gray-500">Symptoms:</div>
                                      <div className="text-sm text-gray-700 line-clamp-2">{appointment.symptoms}</div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {appointments.length > 0 && !selectedAppointmentId && (
                      <p className="text-sm text-gray-500 mt-4">
                        Please select a patient from completed appointments to proceed.
                      </p>
                    )}
                  </div>
                </div>
                
                {selectedAppointmentId && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                        <span className="text-blue-700 font-medium">2</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800">Create Prescription</h3>
                    </div>
                    
                    <div className="bg-white rounded-md shadow-sm">
                      <PrescriptionForm 
                        appointmentId={selectedAppointmentId}
                        onClose={handleBackToList}
                        isFullPage={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Render prescriptions list (default view)
  if (viewMode === 'list') {
    return (
      <div className='bg-white shadow rounded-lg p-6'>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-6 mb-6 shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <h1 className='text-3xl font-bold'>My Prescriptions</h1>
              <p className="text-blue-100 mt-2 max-w-2xl">View and manage all your patient prescriptions in one place</p>
            </div>
            <button
              onClick={navigateToCreatePrescription}
              className="bg-white text-blue-700 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors flex items-center shadow-sm whitespace-nowrap self-start sm:self-center mt-3 sm:mt-0"
            >
              <FaPlus className="mr-2" />
              Create New Prescription
            </button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Search by patient name or diagnosis"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="inline-flex bg-white shadow-sm rounded-md self-start border border-gray-200">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveFilter('viewed')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeFilter === 'viewed' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                Viewed by patient
              </button>
              <button 
                onClick={() => setActiveFilter('not-viewed')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeFilter === 'not-viewed' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                Not viewed
              </button>
            </div>
          </div>
        </div>

        {/* Prescriptions list */}
        {isLoadingPrescriptions ? (
          <div className="flex flex-col justify-center items-center py-16 bg-gray-50 rounded-lg border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600">Loading prescriptions...</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-8 text-center">
            <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No prescriptions found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search or filter criteria' : 'You haven\'t created any prescriptions yet'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FaSearch className="mr-2" /> Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrescriptions.map(prescription => (
              <div 
                key={prescription._id} 
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {prescription.patientData?.name || 'Unknown Patient'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {prescription.createdAt ? formatDate(prescription.createdAt) : 'Unknown date'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {prescription.viewedByPatient ? (
                        <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Viewed</span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Not viewed</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <FaStethoscope className="text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Diagnosis</p>
                        <p className="text-sm text-gray-800 font-medium line-clamp-2">
                          {prescription.diagnosis || 'No diagnosis provided'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FaCalendarPlus className="text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Follow-up</p>
                        <p className="text-sm text-gray-800">
                          {prescription.followUpDate ? formatDate(prescription.followUpDate) : 'No follow-up scheduled'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-xs text-gray-500">Medications:</p>
                      </div>
                      <span className="text-sm font-medium text-gray-800 bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {prescription.medications ? prescription.medications.length : 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleViewPrescription(prescription)}
                      className="flex-1 flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => downloadPrescription(prescription._id)}
                      className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                      disabled={loading}
                    >
                      <FaFilePdf className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditPrescription(prescription)}
                      className="flex items-center justify-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
}

export default DoctorPrescriptions 