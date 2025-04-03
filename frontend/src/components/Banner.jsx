import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const Banner = () => {
    const navigate = useNavigate()
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
        <div className={`flex bg-primary-500 rounded-lg px-6 sm:px-10 md:px-14 lg:px-12 ${isMobile ? 'my-8' : 'my-20'} md:mx-10`}>

            {/* ------- Left Side ------- */}
            <div className={`flex-1 ${isMobile ? 'py-6' : 'py-8 sm:py-10 md:py-16 lg:py-24'} lg:pl-5`}>
                <div className='text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold text-white'>
                    <p>Book Appointment</p>
                    <p className='mt-4'>With 100+ Trusted Doctors</p>
                </div>
                <button 
                    onClick={() => { navigate('/login'); scrollTo(0, 0) }} 
                    className={`bg-white text-sm sm:text-base text-[#595959] ${isMobile ? 'px-6 py-2' : 'px-8 py-3'} rounded-full mt-6 hover:scale-105 transition-all`}
                >
                    Create account
                </button>
            </div>

            {/* ------- Right Side ------- */}
            <div className='hidden md:block md:w-1/2 lg:w-[370px] relative'>
                <img className='w-full absolute bottom-0 right-0 max-w-md' src={assets.appointment_img} alt="" />
            </div>
        </div>
    )
}

export default Banner