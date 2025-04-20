import React, { useContext } from 'react'
import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';
import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Admin/Dashboard';
import AllAppointments from './pages/Admin/AllAppointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import JobManagement from './pages/Admin/JobManagement';
import JobApplications from './pages/Admin/JobApplications';
import AddJob from './pages/Admin/AddJob';
import ViewApplication from './pages/Admin/ViewApplication';
import Login from './pages/Login';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorMeeting from './pages/Doctor/DoctorMeeting';
import DoctorPrescriptions from './pages/Doctor/DoctorPrescriptions';

const App = () => {

  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)

  return dToken || aToken ? (
    <div className='bg-[#F8F9FD]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>
          <Route path='/' element={<></>} />
          <Route path='/admin-dashboard' element={<Dashboard />} />
          <Route path='/all-appointments' element={<AllAppointments />} />
          <Route path='/add-doctor' element={<AddDoctor />} />
          <Route path='/doctor-list' element={<DoctorsList />} />
          <Route path='/job-management' element={<JobManagement />} />
          <Route path='/job-management/add' element={<AddJob />} />
          <Route path='/job-management/edit/:jobId' element={<AddJob />} />
          <Route path='/job-applications' element={<JobApplications />} />
          <Route path='/job-applications/view/:applicationId' element={<ViewApplication />} />
          <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
          <Route path='/doctor-appointments' element={<DoctorAppointments />} />
          <Route path='/doctor-prescriptions' element={<DoctorPrescriptions />} />
          <Route path='/doctor-prescriptions/list' element={<DoctorPrescriptions />} />
          <Route path='/doctor-prescriptions/view/:prescriptionId' element={<DoctorPrescriptions />} />
          <Route path='/doctor-prescriptions/edit/:prescriptionId' element={<DoctorPrescriptions />} />
          <Route path='/doctor-prescriptions/create' element={<DoctorPrescriptions />} />
          <Route path='/doctor-profile' element={<DoctorProfile />} />
          <Route path='/doctor-meeting/:appointmentId' element={<DoctorMeeting />} />
        </Routes>
      </div>
    </div>
  ) : (
    <>
      <ToastContainer />
      <Login />
    </>
  )
}

export default App