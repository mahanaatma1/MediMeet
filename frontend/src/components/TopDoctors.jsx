import { useContext, useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const TopDoctors = () => {
    const navigate = useNavigate()
    const { doctors } = useContext(AppContext)
    const [isMobile, setIsMobile] = useState(false)
    const sliderRef = useRef(null)

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
        <div className={`flex flex-col items-center gap-3 ${isMobile ? 'my-4' : 'my-16'} text-[#262626] md:mx-10`}>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-medium`}>Top Doctors to Book</h1>
            <p className='sm:w-1/3 text-center text-sm mb-2'>Simply browse through our extensive list of trusted doctors.</p>
            
            {isMobile ? (
                // Mobile horizontal slider
                <div className="w-full px-4 mt-2">
                    <div 
                        ref={sliderRef}
                        className="flex overflow-x-auto gap-3 pb-3 no-scrollbar snap-x snap-mandatory"
                        style={{ 
                            WebkitOverflowScrolling: 'touch',
                            overflowX: 'auto'
                        }}
                    >
                        {doctors.slice(0, 10).map((item, index) => (
                            <div 
                                key={index}
                                className="snap-start min-w-[250px] flex-shrink-0"
                                onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }}
                            >
                                <div className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-5px] transition-all duration-300 shadow-sm'>
                                    <img className='bg-[#EAEFFF] w-full h-40 object-cover' src={item.image} alt={item.name} />
                                    <div className='p-3'>
                                        <div className={`flex items-center gap-2 text-xs text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
                                            <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p>
                                            <p>{item.available ? 'Available' : "Not Available"}</p>
                                        </div>
                                        <p className='text-[#262626] text-base font-medium mt-1'>{item.name}</p>
                                        <p className='text-[#5C5C5C] text-xs'>{item.speciality}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Desktop grid layout - keep original
                <div className='w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0'>
                    {doctors.slice(0, 10).map((item, index) => (
                        <div onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500' key={index}>
                            <img className='bg-[#EAEFFF]' src={item.image} alt="" />
                            <div className='p-4'>
                                <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
                                    <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p><p>{item.available ? 'Available' : "Not Available"}</p>
                                </div>
                                <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
                                <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <button 
                onClick={() => { navigate('/doctors'); scrollTo(0, 0) }} 
                className={`bg-[#EAEFFF] text-gray-600 ${isMobile ? 'px-10 py-2 mt-2 mb-2 text-sm' : 'px-12 py-3 mt-10'} rounded-full hover:bg-[#d0dbff] transition-colors`}
            >
                {isMobile ? 'View All Doctors' : 'more'}
            </button>
        </div>
    )
}

export default TopDoctors