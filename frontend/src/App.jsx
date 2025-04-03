import Navbar from './components/Navbar'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import Appointment from './pages/Appointment'
import MyAppointments from './pages/MyAppointments'
import MyProfile from './pages/MyProfile'
import Footer from './components/Footer'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import Verify from './pages/Verify'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Careers from './pages/Careers'
import MyApplications from './components/MyApplications'
import MeetingRoom from './pages/MeetingRoom'

const App = () => {
  return (
    <>
      <ToastContainer />
      <Toaster position="top-center" />
      <Navbar />
      <div className='pt-[80px] sm:pt-[90px] mx-4 sm:mx-[10%]'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/doctors' element={<Doctors />} />
          <Route path='/doctors/:speciality' element={<Doctors />} />
          <Route path='/login' element={<Login />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/appointment/:docId' element={<Appointment />} />
          <Route path='/my-appointments' element={<MyAppointments />} />
          <Route path='/my-profile' element={<MyProfile />} />
          <Route path='/verify' element={<Verify />} />
          <Route path='/privacy-policy' element={<PrivacyPolicy />} />
          <Route path='/careers' element={<Careers />} />
          <Route path='/my-applications' element={<MyApplications />} />
          <Route path='/meeting/:appointmentId' element={<MeetingRoom />} />
        </Routes>
        <Footer />
      </div>
    </>
  )
}

export default App