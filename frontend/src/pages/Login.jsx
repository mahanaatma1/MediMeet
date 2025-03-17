import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

const Login = () => {
  const [state, setState] = useState('Sign Up')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerification, setShowVerification] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetStep, setResetStep] = useState(1) // 1: email, 2: code, 3: new password

  const navigate = useNavigate()
  const location = useLocation()
  const { backendUrl, token, setToken } = useContext(AppContext)

  // Get redirect URL from state or default to home
  const redirectTo = location.state?.from || '/'

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    if (!email) {
      setEmailError('Email is required')
      return false
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError('Password is required')
      return false
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return false
    }

    setPasswordError('')
    return true
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential)
      const { name, email, picture } = decoded

      const { data } = await axios.post(backendUrl + '/api/user/google-auth', {
        name,
        email,
        image: picture
      })

      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        toast.success('Logged in successfully!')
        navigate(redirectTo)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Google auth error:', error)
      toast.error(error.response?.data?.message || 'An error occurred')
    }
  }

  const handleVerificationSubmit = async (e) => {
    e.preventDefault()
    if (!verificationCode.trim()) {
      toast.error('Please enter verification code')
      return
    }

    try {
      console.log('Sending verification request:', {
        email,
        code: verificationCode
      })

      const { data } = await axios.post(backendUrl + '/api/user/verify', {
        email,
        code: verificationCode.trim()
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Verification response:', data)

      if (data.success) {
        toast.success('Email verified successfully!')
        if (data.token) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
          navigate(redirectTo)
        } else {
          toast.error('No token received from server')
        }
      } else {
        toast.error(data.message || 'Invalid verification code')
      }
    } catch (error) {
      console.error('Verification error:', error.response || error)
      toast.error(
        error.response?.data?.message || 
        error.message || 
        'Verification failed. Please try again.'
      )
    }
  }

  const startResendTimer = () => {
    setResendTimer(60)
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const resendVerificationCode = async () => {
    if (isResending || resendTimer > 0) return
    setIsResending(true)

    try {
      const { data } = await axios.post(backendUrl + '/api/user/resend-verification', {
        email
      })

      if (data.success) {
        toast.success('Verification code resent!')
        startResendTimer()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    // Validate email and password
    const isEmailValid = validateEmail(email)
    const isPasswordValid = state === 'Sign Up' ? validatePassword(password) : true

    if (!isEmailValid || (state === 'Sign Up' && !isPasswordValid)) {
      return
    }

    try {
      if (state === 'Sign Up') {
        const { data } = await axios.post(backendUrl + '/api/user/register', {
          name,
          email,
          password
        })

        if (data.success) {
          setShowVerification(true)
          toast.success('Verification code sent to your email!')
          startResendTimer()
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(backendUrl + '/api/user/login', {
          email,
          password
        })

        if (data.success) {
          if (!data.isVerified) {
            setShowVerification(true)
            toast.info('Please verify your email first')
            startResendTimer()
            return
          }
          localStorage.setItem('token', data.token)
          setToken(data.token)
          toast.success('Logged in successfully!')
          navigate(redirectTo)
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      console.error('Login/Signup error:', error)
      toast.error(error.response?.data?.message || 'An error occurred')
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    
    if (resetStep === 1) {
      // Step 1: Request password reset code
      if (!resetEmail || !validateEmail(resetEmail)) {
        toast.error('Please enter a valid email address')
        return
      }
      
      try {
        const { data } = await axios.post(backendUrl + '/api/user/forgot-password', {
          email: resetEmail
        })
        
        if (data.success) {
          toast.success('Reset code sent to your email!')
          setResetStep(2)
          startResendTimer()
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to send reset code')
      }
    } else if (resetStep === 2) {
      // Step 2: Verify reset code
      if (!resetCode.trim()) {
        toast.error('Please enter the reset code')
        return
      }
      
      try {
        const { data } = await axios.post(backendUrl + '/api/user/verify-reset-code', {
          email: resetEmail,
          code: resetCode.trim()
        })
        
        if (data.success) {
          toast.success('Code verified successfully!')
          setResetStep(3)
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Invalid reset code')
      }
    } else if (resetStep === 3) {
      // Step 3: Set new password
      if (!validatePassword(newPassword)) {
        return
      }
      
      try {
        const { data } = await axios.post(backendUrl + '/api/user/reset-password', {
          email: resetEmail,
          code: resetCode,
          newPassword
        })
        
        if (data.success) {
          toast.success('Password reset successfully!')
          setShowForgotPassword(false)
          setState('Login')
          setResetStep(1)
          setResetEmail('')
          setResetCode('')
          setNewPassword('')
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reset password')
      }
    }
  }

  useEffect(() => {
    if (token) {
      navigate(redirectTo)
    }
  }, [token, navigate, redirectTo])

  if (showForgotPassword) {
    return (
      <div className='min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8 bg-white p-6 sm:p-10 rounded-2xl shadow-xl transition-all duration-300'>
          <div className="text-center">
            <h2 className='mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900'>
              {resetStep === 1 ? 'Forgot Password' : 
               resetStep === 2 ? 'Verify Reset Code' : 'Create New Password'}
            </h2>
            <p className='mt-2 text-sm text-gray-600'>
              {resetStep === 1 ? 'Enter your email to receive a reset code' : 
               resetStep === 2 ? `We've sent a reset code to ${resetEmail}` : 
               'Create a new secure password'}
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className='mt-8 space-y-4'>
            {resetStep === 1 && (
              <div>
                <label htmlFor="resetEmail" className='block text-sm font-medium text-gray-700'>
                  Email address
                </label>
                <div className='mt-1'>
                  <input
                    id="resetEmail"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className='appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition duration-150'
                  />
                </div>
              </div>
            )}

            {resetStep === 2 && (
              <div>
                <label htmlFor="resetCode" className='block text-sm font-medium text-gray-700'>
                  Reset Code
                </label>
                <div className='mt-1'>
                  <input
                    id="resetCode"
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className='appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition duration-150'
                    maxLength={6}
                  />
                </div>
              </div>
            )}

            {resetStep === 3 && (
              <div>
                <label htmlFor="newPassword" className='block text-sm font-medium text-gray-700'>
                  New Password
                </label>
                <div className='mt-1 relative'>
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      validatePassword(e.target.value)
                    }}
                    placeholder="Create a strong password"
                    className={`appearance-none block w-full px-3 py-3 border ${
                      passwordError ? 'border-red-500 pr-20' : 'border-gray-300 pr-10'
                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition duration-150`}
                  />
                  {passwordError && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-red-500 cursor-help group">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-red-100 text-red-600 text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        {passwordError}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150'
              >
                {resetStep === 1 ? 'Send Reset Code' : 
                 resetStep === 2 ? 'Verify Code' : 'Reset Password'}
              </button>
            </div>

            {resetStep === 2 && (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={() => handleForgotPassword({ preventDefault: () => {}, target: {} })}
                  disabled={resendTimer > 0}
                  className={`text-sm text-primary hover:text-primary/80 transition-colors ${
                    resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {resendTimer > 0 
                    ? `Resend available in ${resendTimer}s` 
                    : 'Resend reset code'}
                </button>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false)
                  setResetStep(1)
                  setResetEmail('')
                  setResetCode('')
                  setNewPassword('')
                }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (showVerification) {
    return (
      <div className='min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8 bg-white p-6 sm:p-10 rounded-2xl shadow-xl transition-all duration-300'>
          <div className="text-center">
            <h2 className='mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900'>
              Verify your email
            </h2>
            <p className='mt-2 text-sm text-gray-600'>
              We've sent a verification code to {email}
            </p>
          </div>

          <form onSubmit={handleVerificationSubmit} className='mt-8 space-y-4'>
            <div>
              <label htmlFor="code" className='block text-sm font-medium text-gray-700'>
                Verification Code
              </label>
              <div className='mt-1'>
                <input
                  id="code"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className='appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition duration-150'
                  maxLength={6}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150'
              >
                Verify Email
              </button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={resendVerificationCode}
                disabled={resendTimer > 0}
                className={`text-sm text-primary hover:text-primary/80 transition-colors ${
                  resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {resendTimer > 0 
                  ? `Resend available in ${resendTimer}s` 
                  : 'Resend verification code'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowVerification(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to {state}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8 bg-white p-6 sm:p-10 rounded-2xl shadow-xl transition-all duration-300'>
        {/* Header Section */}
        <div className="text-center">
          <h2 className='mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900'>
            {state === 'Sign Up' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            {state === 'Sign Up' 
              ? 'Sign up to book your appointments' 
              : 'Please login to your account'}
          </p>
        </div>

        {/* Google Login Button */}
        <div className='flex justify-center w-full overflow-hidden'>
          <div className='w-full max-w-[320px]'>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google login failed')}
              useOneTap
              type="standard"
              theme="outline"
              size="large"
              text={state === 'Sign Up' ? 'signup_with' : 'signin_with'}
              shape="rectangular"
              width="100%"
            />
          </div>
        </div>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-200'></div>
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-4 bg-white text-gray-500'>or continue with email</span>
          </div>
        </div>

        <form onSubmit={onSubmitHandler} className='mt-8 space-y-4 sm:space-y-6'>
          {state === 'Sign Up' && (
            <div>
              <label htmlFor="name" className='block text-sm font-medium text-gray-700'>
                Full Name
              </label>
              <div className='mt-1'>
                <input
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  className='appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition duration-150'
                  type="text"
                  required
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className='block text-sm font-medium text-gray-700'>
              Email address
            </label>
            <div className='mt-1 relative'>
              <input
                id="email"
                onChange={(e) => {
                  setEmail(e.target.value)
                  validateEmail(e.target.value)
                }}
                value={email}
                className={`appearance-none block w-full px-3 py-3 border ${
                  emailError ? 'border-red-500 pr-10' : 'border-gray-300'
                } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition duration-150`}
                type="email"
                required
                placeholder="you@example.com"
              />
              {emailError && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 cursor-help group">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-red-100 text-red-600 text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {emailError}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="password" className='block text-sm font-medium text-gray-700'>
                Password
              </label>
              {state === 'Login' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true)
                    setResetEmail(email)
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className='mt-1 relative'>
              <input
                id="password"
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (state === 'Sign Up') {
                    validatePassword(e.target.value)
                  }
                }}
                value={password}
                className={`appearance-none block w-full px-3 py-3 border ${
                  passwordError ? 'border-red-500 pr-20' : 'border-gray-300 pr-10'
                } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition duration-150`}
                type={showPassword ? "text" : "password"}
                required
                placeholder={state === 'Sign Up' ? 'Create a strong password' : 'Enter your password'}
              />
              {passwordError && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-red-500 cursor-help group">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-red-100 text-red-600 text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {passwordError}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150'
            >
              {state === 'Sign Up' ? 'Create account' : 'Sign in'}
            </button>
          </div>

          <div className="text-sm text-center">
            {state === 'Sign Up' ? (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setState('Login')}
                  className='font-medium text-primary hover:text-primary/80 transition-colors'
                >
                  Sign in instead
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setState('Sign Up')}
                  className='font-medium text-primary hover:text-primary/80 transition-colors'
                >
                  Sign up now
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login