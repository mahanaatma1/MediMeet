import React from 'react'

const DoctorSkeleton = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-card animate-pulse">
      {/* Image placeholder */}
      <div className="bg-gray-200 w-full aspect-square"></div>
      
      {/* Content placeholder */}
      <div className="p-4">
        {/* Status badge */}
        <div className="flex justify-end">
          <div className="w-20 h-5 bg-gray-200 rounded-full"></div>
        </div>
        
        {/* Doctor name */}
        <div className="w-3/4 h-4 bg-gray-200 rounded mt-3"></div>
        
        {/* Speciality */}
        <div className="w-1/2 h-3 bg-gray-200 rounded mt-2"></div>
        
        {/* Rating */}
        <div className="flex items-center mt-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3 h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="w-8 h-3 bg-gray-200 rounded ml-2"></div>
        </div>
        
        {/* Experience and fees */}
        <div className="flex justify-between mt-3">
          <div className="w-16 h-3 bg-gray-200 rounded"></div>
          <div className="w-10 h-4 bg-gray-200 rounded"></div>
        </div>
        
        {/* Button */}
        <div className="w-full h-8 bg-gray-200 rounded-md mt-3"></div>
      </div>
    </div>
  )
}

export const DoctorSkeletonGrid = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, index) => (
        <DoctorSkeleton key={index} />
      ))}
    </div>
  )
}

export const DoctorSkeletonRow = ({ count = 4 }) => {
  return (
    <div className="flex space-x-4 pb-2 overflow-x-auto">
      {[...Array(count)].map((_, index) => (
        <div className="w-[180px] flex-shrink-0" key={index}>
          <DoctorSkeleton />
        </div>
      ))}
    </div>
  )
}

export default DoctorSkeleton 