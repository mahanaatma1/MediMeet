import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'

const Doctors = () => {
  const { speciality } = useParams()
  const [filterDoc, setFilterDoc] = useState([])
  const navigate = useNavigate()
  const { doctors } = useContext(AppContext)

  const applyFilter = () => {
    let filtered = [...doctors]

    // Apply speciality filter
    if (speciality) {
      filtered = filtered.filter(doc => doc.speciality === speciality)
    }

    setFilterDoc(filtered)
  }

  // Reset all filters
  const resetFilters = () => {
    if (speciality) {
      navigate('/doctors')
    }
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality])

  return (
    <div className="pb-10">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Find Doctors</h1>
      </div>
      
      <p className='text-gray-600 mb-4'>Browse through the doctors specialist.</p>
      
      <div className='flex flex-col sm:flex-row items-start gap-5'>
        <div className="w-full sm:w-64 bg-white p-4 rounded border">
          <h3 className="font-medium text-gray-800 mb-3">Speciality</h3>
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => navigate('/doctors')} 
              className={`text-left px-3 py-2 border border-gray-300 rounded text-sm transition-all ${!speciality ? 'bg-[#E2E5FF] text-black' : ''}`}
            >
              All
            </button>
            <button 
              onClick={() => speciality === 'General physician' ? navigate('/doctors') : navigate('/doctors/General physician')} 
              className={`text-left px-3 py-2 border border-gray-300 rounded text-sm transition-all ${speciality === 'General physician' ? 'bg-[#E2E5FF] text-black' : ''}`}
            >
              General physician
            </button>
            <button 
              onClick={() => speciality === 'Gynecologist' ? navigate('/doctors') : navigate('/doctors/Gynecologist')} 
              className={`text-left px-3 py-2 border border-gray-300 rounded text-sm transition-all ${speciality === 'Gynecologist' ? 'bg-[#E2E5FF] text-black' : ''}`}
            >
              Gynecologist
            </button>
            <button 
              onClick={() => speciality === 'Dermatologist' ? navigate('/doctors') : navigate('/doctors/Dermatologist')} 
              className={`text-left px-3 py-2 border border-gray-300 rounded text-sm transition-all ${speciality === 'Dermatologist' ? 'bg-[#E2E5FF] text-black' : ''}`}
            >
              Dermatologist
            </button>
            <button 
              onClick={() => speciality === 'Pediatricians' ? navigate('/doctors') : navigate('/doctors/Pediatricians')} 
              className={`text-left px-3 py-2 border border-gray-300 rounded text-sm transition-all ${speciality === 'Pediatricians' ? 'bg-[#E2E5FF] text-black' : ''}`}
            >
              Pediatricians
            </button>
            <button 
              onClick={() => speciality === 'Neurologist' ? navigate('/doctors') : navigate('/doctors/Neurologist')} 
              className={`text-left px-3 py-2 border border-gray-300 rounded text-sm transition-all ${speciality === 'Neurologist' ? 'bg-[#E2E5FF] text-black' : ''}`}
            >
              Neurologist
            </button>
            <button 
              onClick={() => speciality === 'Gastroenterologist' ? navigate('/doctors') : navigate('/doctors/Gastroenterologist')} 
              className={`text-left px-3 py-2 border border-gray-300 rounded text-sm transition-all ${speciality === 'Gastroenterologist' ? 'bg-[#E2E5FF] text-black' : ''}`}
            >
              Gastroenterologist
            </button>
          </div>
        </div>
        
        <div className='w-full'>
          {filterDoc.length === 0 ? (
            <div className="text-center py-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No doctors found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search query</p>
              <button 
                onClick={resetFilters} 
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">Showing {filterDoc.length} doctors</p>
              
              {/* Mobile view - horizontal scrollable */}
              <div className="sm:hidden overflow-x-auto pb-4">
                <div className="flex space-x-3" style={{ minWidth: 'min-content' }}>
                  {filterDoc.map((item, index) => (
                    <div 
                      onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} 
                      className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-5px] transition-all duration-300 shadow-sm flex-shrink-0' 
                      style={{ width: '150px' }}
                      key={index}
                    >
                      <div className="bg-[#EAEFFF]">
                        <img className='w-full aspect-square object-cover' src={item.image} alt={item.name} />
                      </div>
                      <div className='p-2'>
                        <div className={`flex items-center gap-1 text-xs text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
                          <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p>
                          <p>{item.available ? 'Available' : "Not Available"}</p>
                        </div>
                        <p className='text-[#262626] text-xs font-medium mt-1 line-clamp-1'>{item.name}</p>
                        <p className='text-[#5C5C5C] text-xs line-clamp-1'>{item.speciality}</p>
                        {item.experience && (
                          <p className='text-[#5C5C5C] text-xs mt-1'>Exp: {item.experience} yrs</p>
                        )}
                        {item.fees && (
                          <p className='text-primary font-medium text-xs mt-1'>₹{item.fees}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop view - grid layout */}
              <div className='hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
                {filterDoc.map((item, index) => (
                  <div 
                    onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} 
                    className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-5px] transition-all duration-300 shadow-sm flex flex-col' 
                    key={`desktop-${index}`}
                  >
                    <div className="bg-[#EAEFFF] h-auto">
                      <img className='w-full aspect-square object-cover' src={item.image} alt={item.name} />
                    </div>
                    <div className='p-2 flex-1'>
                      <div className={`flex items-center gap-1 text-xs text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
                        <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p>
                        <p>{item.available ? 'Available' : "Not Available"}</p>
                      </div>
                      <p className='text-[#262626] text-xs font-medium mt-1 line-clamp-1'>{item.name}</p>
                      <p className='text-[#5C5C5C] text-xs line-clamp-1'>{item.speciality}</p>
                      {item.experience && (
                        <p className='text-[#5C5C5C] text-xs mt-1'>Exp: {item.experience} yrs</p>
                      )}
                      {item.fees && (
                        <p className='text-primary font-medium text-xs mt-1'>₹{item.fees}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Doctors