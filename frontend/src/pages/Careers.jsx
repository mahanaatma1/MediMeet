import React, { useState, useEffect, useRef, useCallback } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';
import { FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaCalendarAlt, FaEnvelope, FaPhone, FaBriefcase, FaChevronDown, FaChevronUp, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const Careers = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredJob, setHoveredJob] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const navigate = useNavigate();
  const { token } = useAppContext();
  const scrollContainerRef = useRef(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const autoScrollTimerRef = useRef(null);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/jobs`);
        setJobs(response.data.jobs);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load job listings. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleApplyClick = (job) => {
    navigate(`/careers/${job._id || job.id}`);
  };

  // Fallback job listings in case API fails
  const fallbackJobs = [
    {
      id: 1,
      title: 'Registered Nurse',
      department: 'Emergency Department',
      location: 'New Delhi',
      description: 'We are looking for a compassionate Registered Nurse to join our Emergency Department team. The ideal candidate will have experience in emergency care and excellent patient communication skills.',
      requirements: 'BSc in Nursing, 2+ years of experience in emergency care, valid nursing license',
      contactEmail: 'nursing.careers@medimeet.in',
      contactPhone: '+91-7549334598'
    },
    {
      id: 2,
      title: 'Medical Receptionist',
      department: 'Front Desk',
      location: 'New Delhi',
      description: 'Join our front desk team as a Medical Receptionist. You will be the first point of contact for our patients, managing appointments, answering inquiries, and ensuring a smooth patient experience.',
      requirements: 'High school diploma, 1+ year of customer service experience, proficiency in MS Office',
      contactEmail: 'admin.careers@medimeet.in',
      contactPhone: '+91-7549334598'
    },
    {
      id: 3,
      title: 'Ambulance Driver',
      department: 'Emergency Services',
      location: 'New Delhi',
      description: 'We are seeking a reliable Ambulance Driver to transport patients safely and efficiently. The ideal candidate will have excellent driving skills and knowledge of local routes.',
      requirements: 'Valid commercial driver\'s license, clean driving record, basic life support certification',
      contactEmail: 'transport.careers@medimeet.in',
      contactPhone: '+91-7549334598'
    }
  ];

  // Use fallback jobs if API fails or returns empty
  const displayJobs = jobs.length > 0 ? jobs : fallbackJobs;

  const handleScroll = useCallback((direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 350; // slightly more than the card width to account for margin
      
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        if (currentCardIndex > 0) {
          setCurrentCardIndex(prev => prev - 1);
        }
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        if (currentCardIndex < displayJobs.length - 1) {
          setCurrentCardIndex(prev => prev + 1);
        }
      }
    }
  }, [currentCardIndex, displayJobs.length]);

  const handleDotClick = (index) => {
    handleUserInteractionStart();
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 350 * index; // Each card is about 350px including margins
      container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
      setCurrentCardIndex(index);
    }
    handleUserInteractionEnd();
  };

  const toggleExpansion = (jobId, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${jobId}-${section}`]: !prev[`${jobId}-${section}`]
    }));
  };

  // Add a scroll event listener to update the current card index based on scroll position
  useEffect(() => {
    const handleScrollPosition = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const cardWidth = 350; // Card width + spacing
        const newIndex = Math.round(scrollLeft / cardWidth);
        
        if (newIndex !== currentCardIndex && newIndex >= 0 && newIndex < displayJobs.length) {
          setCurrentCardIndex(newIndex);
        }
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScrollPosition);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScrollPosition);
      }
    };
  }, [currentCardIndex, displayJobs.length]);

  // Update current card index if jobs change to ensure it's valid
  useEffect(() => {
    if (currentCardIndex >= displayJobs.length) {
      setCurrentCardIndex(Math.max(0, displayJobs.length - 1));
    }
  }, [displayJobs.length, currentCardIndex]);

  // Start auto-scrolling when component mounts and jobs are loaded
  useEffect(() => {
    if (displayJobs.length <= 1 || isUserInteracting) {
      return;
    }
    
    const startAutoScroll = () => {
      autoScrollTimerRef.current = setInterval(() => {
        if (currentCardIndex < displayJobs.length - 1) {
          handleScroll('right');
        } else {
          // Reset to first card when reached the end
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            setCurrentCardIndex(0);
          }
        }
      }, 5000); // Auto-scroll every 5 seconds
    };
    
    startAutoScroll();
    
    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [displayJobs.length, currentCardIndex, isUserInteracting, handleScroll]);
  
  // Pause auto-scroll during user interaction and resume after
  const handleUserInteractionStart = () => {
    setIsUserInteracting(true);
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }
  };
  
  const handleUserInteractionEnd = () => {
    // Resume auto-scroll after 3 seconds of inactivity
    setTimeout(() => {
      setIsUserInteracting(false);
    }, 3000);
  };
  
  const onTouchStart = (e) => {
    handleUserInteractionStart();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentCardIndex < displayJobs.length - 1) {
      handleScroll('right');
    }
    
    if (isRightSwipe && currentCardIndex > 0) {
      handleScroll('left');
    }
    
    handleUserInteractionEnd();
  };

  return (
    <div className="py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Careers at <span className="text-blue-600">MediMeet</span></h1>
        <p className="text-gray-600 mt-2">Join our team of healthcare professionals making a difference</p>
      </div>

      <div className="flex flex-col md:flex-row mb-10">
        <div className="md:w-1/2 p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Why Work With Us?</h2>
          <p className="text-gray-600 mb-4">
            At MediMeet, we're dedicated to providing exceptional healthcare services to our community. 
            When you join our team, you become part of a supportive environment that values growth, 
            innovation, and compassionate care.
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Competitive compensation and benefits</li>
            <li>Opportunities for professional development</li>
            <li>Work-life balance</li>
            <li>Collaborative and supportive work environment</li>
            <li>State-of-the-art facilities and technology</li>
          </ul>
        </div>
        <div className="md:w-1/2 p-6 flex items-center justify-center">
          <img 
            src={assets.contact_image} 
            alt="Healthcare professionals" 
            className="rounded-lg shadow-md max-w-full h-auto"
          />
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">Current Openings</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {displayJobs.length} {displayJobs.length === 1 ? 'position' : 'positions'} available
            </span>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading job listings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-red-50 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            {/* Mobile view - horizontal scrollable */}
            <div className="md:hidden relative">
              <div 
                className="overflow-x-auto pb-4 no-scrollbar" 
                ref={scrollContainerRef}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div className="flex space-x-4" style={{ minWidth: 'min-content' }}>
                  {displayJobs.map((job) => (
                    <div 
                      key={job._id || job.id} 
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex-shrink-0"
                      style={{ width: '330px' }}
                    >
                      <div className="relative">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{job.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <FaBuilding className="text-blue-500 text-xs" />
                                <span>{job.department}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FaMapMarkerAlt className="text-blue-500 text-xs" />
                                <span>{job.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-gray-700 text-sm mb-1">Description</h4>
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {job.description}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-700 text-sm mb-1">Requirements</h4>
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {job.requirements}
                              </p>
                            </div>

                            {(job.salaryMin || job.salaryMax) && (
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <FaMoneyBillWave className="text-blue-500 text-xs" />
                                <span>
                                  {job.salaryMin && job.salaryMax 
                                    ? `${job.salaryMin} - ${job.salaryMax}`
                                    : job.salaryMin 
                                      ? `Min: ${job.salaryMin}`
                                      : `Up to ${job.salaryMax}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="px-4 py-3 bg-gray-50 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <FaEnvelope className="text-blue-500" />
                                <span className="truncate max-w-[120px]">{job.contactEmail}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleApplyClick(job)}
                              className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors duration-300 flex items-center gap-1.5 text-sm"
                            >
                              <FaBriefcase className="text-xs" />
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {displayJobs.length > 1 && (
                <div className="flex justify-center mt-4">
                  {displayJobs.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={`mx-1 h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                        currentCardIndex === index ? 'bg-blue-600 w-4' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Desktop view - grid layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayJobs.map((job) => (
                <div 
                  key={`desktop-${job._id || job.id}`} 
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1"
                  onMouseEnter={() => setHoveredJob(job._id || job.id)}
                  onMouseLeave={() => setHoveredJob(null)}
                >
                  <div className="relative">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-1">{job.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <FaBuilding className="text-blue-500 text-xs" />
                              <span>{job.department}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaMapMarkerAlt className="text-blue-500 text-xs" />
                              <span>{job.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.employmentType && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {job.employmentType}
                            </span>
                          )}
                          {job.isActive ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              Closed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-gray-700 text-sm mb-1">Description</h4>
                          <p className={`text-gray-600 text-sm ${!expandedSections[`${job._id || job.id}-description`] ? 'line-clamp-2' : ''}`}>
                            {job.description}
                          </p>
                          <button 
                            onClick={() => toggleExpansion(job._id || job.id, 'description')}
                            className="text-blue-600 text-xs font-medium mt-1 flex items-center gap-1 hover:text-blue-700"
                          >
                            {expandedSections[`${job._id || job.id}-description`] ? (
                              <>
                                Show Less <FaChevronUp className="text-xs" />
                              </>
                            ) : (
                              <>
                                View More <FaChevronDown className="text-xs" />
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-700 text-sm mb-1">Requirements</h4>
                          <p className={`text-gray-600 text-sm ${!expandedSections[`${job._id || job.id}-requirements`] ? 'line-clamp-2' : ''}`}>
                            {job.requirements}
                          </p>
                          <button 
                            onClick={() => toggleExpansion(job._id || job.id, 'requirements')}
                            className="text-blue-600 text-xs font-medium mt-1 flex items-center gap-1 hover:text-blue-700"
                          >
                            {expandedSections[`${job._id || job.id}-requirements`] ? (
                              <>
                                Show Less <FaChevronUp className="text-xs" />
                              </>
                            ) : (
                              <>
                                View More <FaChevronDown className="text-xs" />
                              </>
                            )}
                          </button>
                        </div>

                        {(job.salaryMin || job.salaryMax) && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <FaMoneyBillWave className="text-blue-500 text-xs" />
                            <span>
                              {job.salaryMin && job.salaryMax 
                                ? `${job.salaryMin} - ${job.salaryMax}`
                                : job.salaryMin 
                                  ? `Min: ${job.salaryMin}`
                                  : `Up to ${job.salaryMax}`}
                            </span>
                          </div>
                        )}

                        {job.applicationDeadline && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <FaCalendarAlt className="text-blue-500 text-xs" />
                            <span>Apply by: {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <FaEnvelope className="text-blue-500" />
                            <span className="truncate max-w-[120px]">{job.contactEmail}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaPhone className="text-blue-500" />
                            <span>{job.contactPhone}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleApplyClick(job)}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors duration-300 flex items-center gap-1.5 text-sm"
                        >
                          <FaBriefcase className="text-xs" />
                          Apply
                        </button>
                      </div>
                    </div>

                    {/* Quick view overlay */}
                    {hoveredJob === (job._id || job.id) && (
                      <div className="absolute inset-0 bg-black bg-opacity-5 flex items-center justify-center">
                        <button 
                          onClick={() => handleApplyClick(job)}
                          className="bg-white text-blue-600 px-4 py-1.5 rounded-full shadow-lg hover:bg-blue-50 transition-colors duration-300 flex items-center gap-1.5 text-sm"
                        >
                          <FaBriefcase className="text-xs" />
                          Quick Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-left">How to Apply</h2>
        <p className="text-gray-600 text-left mb-6">
          To apply for any of the positions listed above, please click the "Apply Now" button on the job listing
          and fill out the application form. Make sure to include your resume and a cover letter.
        </p>
        <div className="text-left">
          <p className="text-gray-700 font-medium">General Inquiries:</p>
          <p className="text-gray-600">careers@medimeet.in | +91-7549334598</p>
        </div>
      </div>
    </div>
  );
};

export default Careers; 