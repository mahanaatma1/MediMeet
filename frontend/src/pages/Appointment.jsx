import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'

const Appointment = () => {

    const { docId } = useParams()
    const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext)
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const [docInfo, setDocInfo] = useState(false)
    const [docSlots, setDocSlots] = useState([])
    const [slotIndex, setSlotIndex] = useState(0)
    const [slotTime, setSlotTime] = useState('')

    const navigate = useNavigate()

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getAvailableSolts = async () => {

        setDocSlots([])

        // getting current date
        let today = new Date()

        for (let i = 0; i < 7; i++) {

            // getting date with index 
            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)

            // Set start time to 10 AM
            let startTime = new Date(currentDate)
            startTime.setHours(10, 0, 0, 0)
            
            // For today, if current time is past 10 AM, adjust start time
            if (i === 0 && today.getHours() >= 10) {
                // Find the next available slot time
                const currentMinutes = today.getHours() * 60 + today.getMinutes()
                const minutesSince10AM = currentMinutes - 10 * 60
                const slotSize = 45 + 15 // 45 min appointment + 15 min break
                const slotsToSkip = Math.ceil(minutesSince10AM / slotSize)
                
                // Calculate the next available slot time
                startTime = new Date(currentDate)
                startTime.setHours(10, 0, 0, 0)
                startTime.setMinutes(slotsToSkip * slotSize)
                
                // If it's past all slots for today, skip this day
                if (startTime.getHours() >= 18) {
                    continue
                }
            }

            let timeSlots = [];

            // Create 8 slots from 10 AM to 6 PM (45 min slots with 15 min breaks)
            // Slot times: 10:00-10:45, 11:00-11:45, 12:00-12:45, 1:00-1:45, 2:00-2:45, 3:00-3:45, 4:00-4:45, 5:00-5:45
            for (let slot = 0; slot < 8; slot++) {
                // Calculate slot time: each slot starts on the hour or at :00
                let slotTime = new Date(startTime)
                slotTime.setMinutes(slot * 60) // Each slot is 1 hour apart (45 min + 15 min break)
                
                // Format the time display
                let formattedTime = slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                let day = currentDate.getDate()
                let month = currentDate.getMonth() + 1
                let year = currentDate.getFullYear()

                const slotDate = day + "_" + month + "_" + year
                const slotTimeStr = formattedTime

                const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTimeStr) ? false : true

                if (isSlotAvailable) {
                    // Add slot to array
                    timeSlots.push({
                        datetime: new Date(slotTime),
                        time: formattedTime,
                        // Add end time display
                        endTime: new Date(slotTime.getTime() + 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    })
                }
            }

            setDocSlots(prev => ([...prev, timeSlots]))
        }
    }

    const bookAppointment = async () => {

        if (!token) {
            toast.warning('Login to book appointment')
            return navigate('/login')
        }

        const date = docSlots[slotIndex][0].datetime

        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()

        const slotDate = day + "_" + month + "_" + year

        try {
            const { data } = await axios.post(
                backendUrl + '/api/user/book-appointment', 
                { docId, slotDate, slotTime }, 
                { headers: { token } }
            )
            
            if (data.success) {
                toast.success(data.message)
                getDoctosData()
                navigate('/my-appointments')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (doctors.length > 0) {
            fetchDocInfo()
        }
    }, [doctors, docId])

    useEffect(() => {
        if (docInfo) {
            getAvailableSolts()
        }
    }, [docInfo])

    return docInfo ? (
        <div>
            {/* ---------- Doctor Details ----------- */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <div>
                    <img className='bg-primary-500 w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
                </div>

                <div className='flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
                    {/* ----- Doc Info : name, degree, experience ----- */}
                    <div className="flex justify-between items-start">
                        <div>
                            <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>{docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" /></p>
                            <div className='flex items-center gap-2 mt-1 text-gray-600'>
                                <p>{docInfo.degree} - {docInfo.speciality}</p>
                                <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1 text-warning-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium text-lg">{docInfo.averageRating ? docInfo.averageRating.toFixed(1) : '0.0'}</span>
                        </div>
                    </div>

                    {/* ----- Doc About ----- */}
                    <div>
                        <p className='flex items-center gap-1 text-sm font-medium text-[#262626] mt-3'>About <img className='w-3' src={assets.info_icon} alt="" /></p>
                        <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{docInfo.about}</p>
                    </div>

                    <p className='text-gray-600 font-medium mt-4'>Appointment fee: <span className='text-gray-800'>{currencySymbol}{docInfo.fees}</span> </p>
                </div>
            </div>

            {/* Booking slots */}
            <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]'>
                <p>Booking slots</p>
                <div className='flex gap-3 items-center w-full overflow-x-auto no-scrollbar mt-4'>
                    {docSlots.length && docSlots.map((item, index) => (
                        <div onClick={() => setSlotIndex(index)} key={index} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary-500 text-white' : 'border border-[#DDDDDD]'}`}>
                            <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                            <p>{item[0] && item[0].datetime.getDate()}</p>
                        </div>
                    ))}
                </div>

                <div className='flex items-center gap-3 w-full overflow-x-auto no-scrollbar mt-4'>
                    {docSlots.length && docSlots[slotIndex].map((item, index) => (
                        <p onClick={() => setSlotTime(item.time)} key={index} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary-500 text-white' : 'text-[#949494] border border-[#B4B4B4]'}`}>
                            {item.time.toLowerCase()} - {item.endTime.toLowerCase()}
                        </p>
                    ))}
                </div>

                <button onClick={bookAppointment} className='bg-primary-500 text-white text-sm font-light px-20 py-3 rounded-full my-6'>Book an appointment</button>
            </div>

            {/* Listing Related Doctors */}
            <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
        </div>
    ) : null
}

export default Appointment