import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'

const DoctorsList = () => {

  const { doctors, changeAvailability , aToken , getAllDoctors} = useContext(AdminContext)

  useEffect(() => {
    if (aToken) {
        getAllDoctors()
    }
}, [aToken])

  return (
    <div className='m-5 max-h-[90vh] overflow-y-auto custom-scrollbar'>
      <h1 className='text-lg font-medium mb-4'>All Doctors</h1>
      <div className='w-full grid grid-cols-2 sm:flex sm:flex-wrap gap-4 gap-y-6'>
        {doctors.map((item, index) => (
          <div className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer group w-full sm:max-w-56' key={index}>
            <img className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500 w-full aspect-square object-cover' src={item.image} alt="" />
            <div className='p-4'>
              <p className='text-[#262626] text-base sm:text-lg font-medium'>{item.name}</p>
              <p className='text-[#5C5C5C] text-xs sm:text-sm'>{item.speciality}</p>
              <div className='mt-2 flex items-center gap-1 text-xs sm:text-sm'>
                <input onChange={()=>changeAvailability(item._id)} type="checkbox" checked={item.available} />
                <p>Available</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DoctorsList