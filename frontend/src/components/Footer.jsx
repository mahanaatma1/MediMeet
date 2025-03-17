import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const Footer = () => {
  const [isMobile, setIsMobile] = useState(false)

  // Check if the screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkIfMobile()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  return (
    <div className='md:mx-10'>
      <div className={`flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 ${isMobile ? 'mt-8' : 'mt-40'} text-sm`}>

        <div>
          <img className='mb-5 w-40' src={assets.logo} alt="" />
          <p className='w-full md:w-2/3 text-gray-600 leading-6'>Easily find and book appointments with trusted doctors. Manage your profile, view available slots, and stay updated on your appointments—all through a simple and secure interface. Your health matters, and booking an appointment has never been easier.</p>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>COMPANY</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li><Link to="/" className="hover:text-blue-500 transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-blue-500 transition-colors">About us</Link></li>
            <li>Delivery</li>
            <li><Link to="/privacy-policy" className="hover:text-blue-500 transition-colors">Privacy policy</Link></li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>+91-7549334598</li>
            <li>medimeet.in@gmail.com</li>
          </ul>
        </div>

      </div>

      <div>
        <hr />
        <p className='py-5 text-sm text-center'>Copyright 2024 @ MediMeet.com - All Right Reserved.</p>
      </div>

    </div>
  )
}

export default Footer