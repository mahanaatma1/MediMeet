import { useContext, useEffect, useState, useRef, useCallback } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'
import { DoctorSkeletonGrid, DoctorSkeletonRow } from '../components/DoctorSkeleton'
import { FaStar, FaRegStar, FaStarHalfAlt, FaSearch, FaFilter, FaChevronDown, FaArrowLeft, FaTimes, FaUserMd, FaCalendarAlt, FaCommentDots, FaCommentMedical } from 'react-icons/fa'
import { MdLocationOn, MdAttachMoney } from 'react-icons/md'
import { Link } from 'react-router-dom'

const Doctors = () => {
  const { speciality } = useParams()
  const [filterDoc, setFilterDoc] = useState([])
  const [displayedDoctors, setDisplayedDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [availabilityFilter, setAvailabilityFilter] = useState('all') // 'all', 'available', 'unavailable'
  const [sortBy, setSortBy] = useState('relevance') // 'relevance', 'rating', 'experience'
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const navigate = useNavigate()
  const { doctors, getDoctosData, currencySymbol } = useContext(AppContext)
  const filterRef = useRef(null)
  const searchTimerRef = useRef(null)

  const applyFilter = () => {
    let filtered = [...doctors]

    // Apply speciality filter from URL parameter
    if (speciality) {
      filtered = filtered.filter(doc => doc.speciality === speciality)
    }

    setFilterDoc(filtered)
    applyLocalFilters(filtered)
    setLoading(false)
  }

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Clear any existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
    
    // Set a new timer to update the debounced value after 300ms
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
  }
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [])
  
  // Apply local filters whenever they change (using debounced search)
  useEffect(() => {
    if (!loading) {
      applyLocalFilters(filterDoc)
    }
  }, [debouncedSearch, availabilityFilter, sortBy])
  
  // Update searchQuery from URL params on initial load if needed
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const searchParam = params.get('search')
    if (searchParam) {
      setSearchQuery(searchParam)
      setDebouncedSearch(searchParam)
    }
  }, [])

  // Update URL with search query for shareable links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    
    if (debouncedSearch) {
      params.set('search', debouncedSearch)
    } else {
      params.delete('search')
    }
    
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '')
    window.history.replaceState({}, '', newUrl)
  }, [debouncedSearch])

  // Re-implement applyLocalFilters to use debouncedSearch
  const applyLocalFilters = useCallback((baseDoctors) => {
    let results = [...baseDoctors]
    
    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      results = results.filter(doc => 
        doc.name.toLowerCase().includes(query) || 
        doc.speciality.toLowerCase().includes(query)
      )
    }
    
    // Apply availability filter
    if (availabilityFilter !== 'all') {
      results = results.filter(doc => 
        availabilityFilter === 'available' ? doc.available : !doc.available
      )
    }
    
    // Apply sorting
    if (sortBy === 'rating') {
      results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    } else if (sortBy === 'experience') {
      results.sort((a, b) => {
        const expA = a.experience ? parseInt(a.experience.replace(/\D/g, '')) : 0
        const expB = b.experience ? parseInt(b.experience.replace(/\D/g, '')) : 0
        return expB - expA
      })
    }
    
    setDisplayedDoctors(results)
  }, [debouncedSearch, availabilityFilter, sortBy])

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setDebouncedSearch('')
    setAvailabilityFilter('all')
    setSortBy('relevance')
    
    // Clear search param from URL
    const params = new URLSearchParams(window.location.search)
    params.delete('search')
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '')
    window.history.replaceState({}, '', newUrl)
    
    if (speciality) {
      navigate('/doctors')
    } else {
      applyLocalFilters(filterDoc)
    }
  }

  useEffect(() => {
    // Close filter drawer when clicking outside
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowMobileFilters(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setLoading(true)
    // If no doctors are loaded, fetch them
    if (doctors.length === 0) {
      getDoctosData().then(() => {
        applyFilter()
      })
    } else {
      applyFilter()
    }
  }, [doctors, speciality])

  // Update the renderStars function to remove review count references
  const renderStars = (rating) => {
    const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
    
    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={`w-4 h-4 ${
                        star <= roundedRating
                            ? 'text-yellow-400'
                            : star - 0.5 === roundedRating
                            ? 'text-yellow-300'
                            : 'text-gray-300'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                </svg>
            ))}
            <span className="text-gray-600 text-sm ml-1">
                {rating ? rating.toFixed(1) : '0.0'}
            </span>
        </div>
    );
  };

  // Update the getReviewLabel function to remove references to review count
  const getReviewLabel = (rating) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4) return "Very Good";
    if (rating >= 3) return "Good";
    if (rating >= 2) return "Fair";
    if (rating > 0) return "Poor";
    return "New Doctor";
  };

  // Doctor card component for reuse
  const DoctorCard = ({ item, isMobile = false }) => {
    return (
      <div 
        onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} 
        className={`border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-5px] transition-all duration-300 shadow-sm ${isMobile ? 'flex-shrink-0 min-w-[250px]' : ''}`}
      >
        <img className='bg-[#EAEFFF] w-full aspect-square object-cover' src={item.image} alt={item.name} />
        <div className='p-4'>
          <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
            <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p>
            <p>{item.available ? 'Available' : "Not Available"}</p>
          </div>
          <p className='text-[#262626] text-lg font-medium mt-1'>{item.name}</p>
          <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
          
          {/* Only show fee if it exists */}
          {item.fees && (
            <p className='text-gray-600 text-sm mt-2'>
              Fee: <span className='font-medium text-primary'>₹{item.fees}</span>
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-10">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Find Doctors</h1>
      </div>
      
      <p className='text-gray-600 mb-4'>Browse through the doctors specialist.</p>
      
      {/* Mobile search bar and filter button - only visible on mobile */}
      <div className="sm:hidden mb-4">
        <div className="relative flex items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search doctors or specialities"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FaTimes className="text-gray-400" />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowMobileFilters(true)}
            className="ml-2 p-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <FaFilter className="text-gray-500" />
            <span className="ml-1">Filter</span>
          </button>
        </div>
        
        {/* Mobile filters drawer */}
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${showMobileFilters ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div ref={filterRef} className={`absolute right-0 top-0 bottom-0 w-4/5 max-w-sm bg-white shadow-xl transform transition-transform ${showMobileFilters ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="text-gray-500">
                <FaTimes />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Speciality</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => navigate('/doctors')} 
                    className={`text-center px-2 py-2 border rounded-md text-sm transition-all ${!speciality ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => speciality === 'General physician' ? navigate('/doctors') : navigate('/doctors/General physician')} 
                    className={`text-center px-2 py-2 border rounded-md text-sm transition-all ${speciality === 'General physician' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    General physician
                  </button>
                  <button 
                    onClick={() => speciality === 'Gynecologist' ? navigate('/doctors') : navigate('/doctors/Gynecologist')} 
                    className={`text-center px-2 py-2 border rounded-md text-sm transition-all ${speciality === 'Gynecologist' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Gynecologist
                  </button>
                  <button 
                    onClick={() => speciality === 'Dermatologist' ? navigate('/doctors') : navigate('/doctors/Dermatologist')} 
                    className={`text-center px-2 py-2 border rounded-md text-sm transition-all ${speciality === 'Dermatologist' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Dermatologist
                  </button>
                  <button 
                    onClick={() => speciality === 'Pediatricians' ? navigate('/doctors') : navigate('/doctors/Pediatricians')} 
                    className={`text-center px-2 py-2 border rounded-md text-sm transition-all ${speciality === 'Pediatricians' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Pediatricians
                  </button>
                  <button 
                    onClick={() => speciality === 'Neurologist' ? navigate('/doctors') : navigate('/doctors/Neurologist')} 
                    className={`text-center px-2 py-2 border rounded-md text-sm transition-all ${speciality === 'Neurologist' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Neurologist
                  </button>
                  <button 
                    onClick={() => speciality === 'Gastroenterologist' ? navigate('/doctors') : navigate('/doctors/Gastroenterologist')} 
                    className={`text-center px-2 py-2 border rounded-md text-sm transition-all ${speciality === 'Gastroenterologist' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Gastroenterologist
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Availability</h4>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setAvailabilityFilter('all')} 
                    className={`flex-1 text-center px-3 py-2 border rounded-md text-sm transition-all ${availabilityFilter === 'all' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setAvailabilityFilter('available')} 
                    className={`flex-1 text-center px-3 py-2 border rounded-md text-sm transition-all ${availabilityFilter === 'available' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Available
                  </button>
                  <button 
                    onClick={() => setAvailabilityFilter('unavailable')} 
                    className={`flex-1 text-center px-3 py-2 border rounded-md text-sm transition-all ${availabilityFilter === 'unavailable' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Unavailable
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Sort By</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSortBy('relevance')} 
                    className={`text-center px-3 py-2 border rounded-md text-sm transition-all ${sortBy === 'relevance' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Relevance
                  </button>
                  <button 
                    onClick={() => setSortBy('rating')} 
                    className={`text-center px-3 py-2 border rounded-md text-sm transition-all ${sortBy === 'rating' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Highest Rated
                  </button>
                  <button 
                    onClick={() => setSortBy('experience')} 
                    className={`text-center px-3 py-2 border rounded-md text-sm transition-all ${sortBy === 'experience' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Most Experienced
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => {
                    resetFilters();
                    setShowMobileFilters(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Reset
                </button>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className='flex flex-col sm:flex-row items-start gap-5'>
        <div className="hidden sm:block w-full sm:w-64 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-medium text-gray-800 mb-3">Speciality</h3>
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => navigate('/doctors')} 
              className={`text-left px-3 py-2 border rounded-md text-sm transition-all ${!speciality ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              All
            </button>
            <button 
              onClick={() => speciality === 'General physician' ? navigate('/doctors') : navigate('/doctors/General physician')} 
              className={`text-left px-3 py-2 border rounded-md text-sm transition-all ${speciality === 'General physician' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              General physician
            </button>
            <button 
              onClick={() => speciality === 'Gynecologist' ? navigate('/doctors') : navigate('/doctors/Gynecologist')} 
              className={`text-left px-3 py-2 border rounded-md text-sm transition-all ${speciality === 'Gynecologist' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              Gynecologist
            </button>
            <button 
              onClick={() => speciality === 'Dermatologist' ? navigate('/doctors') : navigate('/doctors/Dermatologist')} 
              className={`text-left px-3 py-2 border rounded-md text-sm transition-all ${speciality === 'Dermatologist' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              Dermatologist
            </button>
            <button 
              onClick={() => speciality === 'Pediatricians' ? navigate('/doctors') : navigate('/doctors/Pediatricians')} 
              className={`text-left px-3 py-2 border rounded-md text-sm transition-all ${speciality === 'Pediatricians' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              Pediatricians
            </button>
            <button 
              onClick={() => speciality === 'Neurologist' ? navigate('/doctors') : navigate('/doctors/Neurologist')} 
              className={`text-left px-3 py-2 border rounded-md text-sm transition-all ${speciality === 'Neurologist' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              Neurologist
            </button>
            <button 
              onClick={() => speciality === 'Gastroenterologist' ? navigate('/doctors') : navigate('/doctors/Gastroenterologist')} 
              className={`text-left px-3 py-2 border rounded-md text-sm transition-all ${speciality === 'Gastroenterologist' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              Gastroenterologist
            </button>
          </div>
        </div>
        
        <div className='w-full'>
          {loading ? (
            <>
              {/* Loading skeletons */}
              <p className="text-sm text-gray-500 mb-4">Loading doctors...</p>
              <div className="sm:hidden">
                <DoctorSkeletonRow count={4} />
              </div>
              <div className="hidden sm:block">
                <DoctorSkeletonGrid count={8} />
              </div>
            </>
          ) : displayedDoctors.length === 0 ? (
            <div className="text-center py-10 bg-secondary-50 rounded-lg p-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No doctors found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search query</p>
              <button 
                onClick={resetFilters} 
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <FaUserMd className="text-primary-500 mr-2" />
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{displayedDoctors.length}</span> doctors
                    {speciality && <span className="ml-1">in <span className="font-medium text-primary-600">{speciality}</span></span>}
                  </p>
                </div>
                {searchQuery && (
                  <p className="text-sm font-medium flex items-center">
                    <FaSearch className="text-gray-400 mr-1" size={12} />
                    <span className="text-primary-600">"{searchQuery}"</span>
                    <button onClick={() => setSearchQuery('')} className="ml-2 text-gray-500">
                      <FaTimes size={12} />
                    </button>
                  </p>
                )}
              </div>
              
              {/* Mobile view - horizontal scrollable */}
              <div className="sm:hidden overflow-x-auto pb-4 no-scrollbar">
                <div className="flex gap-3 pb-2 px-1" style={{ 
                  WebkitOverflowScrolling: 'touch',
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory'
                }}>
                  {displayedDoctors.map((item, index) => (
                    <div key={index} className="snap-start" style={{ minWidth: '250px', flexShrink: 0 }}>
                      <DoctorCard item={item} isMobile={true} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop view - grid layout */}
              <div className='hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {displayedDoctors.map((item, index) => (
                  <DoctorCard key={`desktop-${index}`} item={item} />
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