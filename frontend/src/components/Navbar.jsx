import { useContext, useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { token, setToken, user } = useContext(AppContext);

  // Track scroll for navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setShowMenu(false);
  }, [location]);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
  };

  const handleCreateAccount = () => {
    if (token && user) {
      navigate('/my-profile');
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-[10%] ${scrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 py-4'} transition-all duration-300`}>
      <div className='flex items-center justify-between'>
        <img onClick={() => navigate('/')} className='w-44 cursor-pointer' src={assets.logo} alt="MediMeet Logo" />
        
        <ul className='md:flex items-center gap-6 font-medium hidden'>
          <NavLink to='/' className={({isActive}) => 
            `relative py-2 px-1 text-sm tracking-wide transition-colors duration-300 ${isActive ? 'text-primary-600' : 'text-gray-700 hover:text-primary-500'}`
          }>
            {({isActive}) => (
              <>
                HOME
                {isActive && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-full"></span>}
              </>
            )}
          </NavLink>
          
          <NavLink to='/doctors' className={({isActive}) => 
            `relative py-2 px-1 text-sm tracking-wide transition-colors duration-300 ${isActive ? 'text-primary-600' : 'text-gray-700 hover:text-primary-500'}`
          }>
            {({isActive}) => (
              <>
                ALL DOCTORS
                {isActive && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-full"></span>}
              </>
            )}
          </NavLink>
          
          <NavLink to='/about' className={({isActive}) => 
            `relative py-2 px-1 text-sm tracking-wide transition-colors duration-300 ${isActive ? 'text-primary-600' : 'text-gray-700 hover:text-primary-500'}`
          }>
            {({isActive}) => (
              <>
                ABOUT
                {isActive && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-full"></span>}
              </>
            )}
          </NavLink>
          
          <NavLink to='/contact' className={({isActive}) => 
            `relative py-2 px-1 text-sm tracking-wide transition-colors duration-300 ${isActive ? 'text-primary-600' : 'text-gray-700 hover:text-primary-500'}`
          }>
            {({isActive}) => (
              <>
                CONTACT
                {isActive && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-full"></span>}
              </>
            )}
          </NavLink>
          
          <NavLink to='/careers' className={({isActive}) => 
            `relative py-2 px-1 text-sm tracking-wide transition-colors duration-300 ${isActive ? 'text-primary-600' : 'text-gray-700 hover:text-primary-500'}`
          }>
            {({isActive}) => (
              <>
                CAREERS
                {isActive && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-full"></span>}
              </>
            )}
          </NavLink>
        </ul>

        <div className='flex items-center gap-4'>
          {token && user ? (
            <>
              {/* User avatar - navigates to profile on mobile, shows dropdown on desktop */}
              <div className='flex items-center gap-2 cursor-pointer group relative'>
                <div 
                  className="h-9 w-9 rounded-full border-2 border-primary-200 overflow-hidden"
                  onClick={() => window.innerWidth < 768 ? navigate('/my-profile') : null}
                >
                  <img className='w-full h-full object-cover' src={user.image} alt={user.name} />
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-600 md:block hidden">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                
                {/* Dropdown menu - desktop only */}
                <div className='invisible group-hover:md:visible opacity-0 group-hover:md:opacity-100 absolute top-full right-0 pt-2 text-base font-medium z-20 transition-all duration-200 hidden md:block'>
                  <div className='min-w-48 bg-white rounded-lg shadow-dropdown border border-gray-100 flex flex-col overflow-hidden'>
                    <p onClick={() => navigate('/my-profile')} className='px-4 py-3 hover:bg-primary-50 text-sm transition-colors cursor-pointer'>My Profile</p>
                    <p onClick={() => navigate('/my-appointments')} className='px-4 py-3 hover:bg-primary-50 text-sm transition-colors cursor-pointer'>My Appointments</p>
                    <p onClick={() => navigate('/my-prescriptions')} className='px-4 py-3 hover:bg-primary-50 text-sm transition-colors cursor-pointer'>My Prescriptions</p>
                    <p onClick={() => navigate('/my-applications')} className='px-4 py-3 hover:bg-primary-50 text-sm transition-colors cursor-pointer'>My Job Applications</p>
                    <p onClick={logout} className='px-4 py-3 hover:bg-danger-500 hover:text-white text-sm transition-colors cursor-pointer'>Logout</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button 
              onClick={handleCreateAccount} 
              className='bg-primary-500 text-white px-5 py-2 rounded-full text-sm font-medium hidden md:block hover:bg-primary-600 transition-colors shadow-sm'
            >
              Create account
            </button>
          )}
          
          <button 
            onClick={() => setShowMenu(true)} 
            className='md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100'
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>

        {/* ---- Mobile Menu ---- */}
        <div 
          className={`md:hidden fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${showMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setShowMenu(false)}
        >
          <div 
            className={`absolute top-0 right-0 bottom-0 w-3/4 max-w-xs bg-white shadow-xl transition-transform duration-300 ease-in-out ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between p-5 border-b'>
              <img src={assets.logo} className='w-36' alt="MediMeet Logo" />
              <button 
                onClick={() => setShowMenu(false)}
                className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100'
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <ul className='flex flex-col py-4'>
              <NavLink to='/' className={({isActive}) => 
                `px-5 py-3 text-base font-medium ${isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-700'}`
              }>
                HOME
              </NavLink>
              <NavLink to='/doctors' className={({isActive}) => 
                `px-5 py-3 text-base font-medium ${isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-700'}`
              }>
                ALL DOCTORS
              </NavLink>
              <NavLink to='/about' className={({isActive}) => 
                `px-5 py-3 text-base font-medium ${isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-700'}`
              }>
                ABOUT
              </NavLink>
              <NavLink to='/contact' className={({isActive}) => 
                `px-5 py-3 text-base font-medium ${isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-700'}`
              }>
                CONTACT
              </NavLink>
              <NavLink to='/careers' className={({isActive}) => 
                `px-5 py-3 text-base font-medium ${isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-700'}`
              }>
                CAREERS
              </NavLink>
              
              {token && user ? (
                <>
                  <div className="border-t my-2"></div>
                  <NavLink to='/my-profile' className={({isActive}) => 
                    `px-5 py-3 text-base font-medium ${isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-700'}`
                  }>
                    MY PROFILE
                  </NavLink>
                  <NavLink to='/my-appointments' className={({isActive}) => 
                    `px-5 py-3 text-base font-medium ${isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-700'}`
                  }>
                    MY APPOINTMENTS
                  </NavLink>
                  <NavLink to='/my-prescriptions' className={({isActive}) => 
                    `px-5 py-3 text-base font-medium ${isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-700'}`
                  }>
                    MY PRESCRIPTIONS
                  </NavLink>
                  <NavLink to='/my-applications' className={({isActive}) => 
                    `px-5 py-3 text-base font-medium ${isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-700'}`
                  }>
                    MY JOB APPLICATIONS
                  </NavLink>
                  <div 
                    onClick={logout}
                    className="px-5 py-3 text-base font-medium text-danger-600 cursor-pointer hover:bg-danger-50"
                  >
                    LOGOUT
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    navigate('/login');
                  }}
                  className="mt-4 mx-5 py-2 bg-primary-500 text-white rounded-md text-base font-medium"
                >
                  SIGN IN / SIGN UP
                </button>
              )}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;