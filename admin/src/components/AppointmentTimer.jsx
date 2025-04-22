import { useState, useEffect } from 'react';

const AppointmentTimer = ({ startTime = null }) => {
  const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes in seconds
  const [isWarning, setIsWarning] = useState(false);
  const [isDanger, setIsDanger] = useState(false);

  useEffect(() => {
    // If a specific start time is provided, calculate remaining time
    if (startTime) {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - start) / 1000);
      const remaining = Math.max(45 * 60 - elapsedSeconds, 0);
      setTimeRemaining(remaining);
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(prev - 1, 0);
        
        // Set visual alerts
        if (newTime <= 300 && newTime > 60) { // Last 5 minutes
          setIsWarning(true);
          setIsDanger(false);
        } else if (newTime <= 60) { // Last minute
          setIsWarning(false);
          setIsDanger(true);
        }

        return newTime;
      });
    }, 1000);

    // Cleanup function
    return () => clearInterval(timer);
  }, [startTime]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${
      isDanger ? 'bg-red-100 text-red-800' : 
      isWarning ? 'bg-yellow-100 text-yellow-800' : 
      'bg-blue-100 text-blue-800'
    }`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" 
          clipRule="evenodd" 
        />
      </svg>
      <div>
        <div className="text-sm font-medium">
          Time Remaining: {formatTime(timeRemaining)}
        </div>
        {isDanger && (
          <div className="text-xs">Appointment ending soon!</div>
        )}
        {isWarning && (
          <div className="text-xs">Less than 5 minutes left</div>
        )}
      </div>
    </div>
  );
};

export default AppointmentTimer; 