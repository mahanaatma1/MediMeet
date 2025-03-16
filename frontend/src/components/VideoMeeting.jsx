import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const VideoMeeting = ({ appointmentId, isDoctor, backendUrl, token, onEndMeeting }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [room, setRoom] = useState(null);
  const [localTracks, setLocalTracks] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteParticipant, setRemoteParticipant] = useState(null);
  const [remoteVideoTracks, setRemoteVideoTracks] = useState([]);
  const [remoteAudioTracks, setRemoteAudioTracks] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [networkQuality, setNetworkQuality] = useState(null);
  
  // Refs for video elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const navigate = useNavigate();
  
  // Initialize meeting
  useEffect(() => {
    if (appointmentId && token) {
      checkCameraPermissions().then(() => {
        joinMeeting();
      }).catch(error => {
        console.error("Camera permission error:", error);
        setError("Camera access is required for video consultation. Please allow camera access and try again.");
        setLoading(false);
      });
    }
    
    // Cleanup function to disconnect from room when component unmounts
    return () => {
      if (room) {
        room.disconnect();
      }
      if (localTracks.length) {
        localTracks.forEach(track => track.stop());
      }
    };
  }, [appointmentId, token]);
  
  // Check and request camera permissions
  const checkCameraPermissions = async () => {
    try {
      console.log("Checking camera permissions...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Camera permission granted");
      
      // Stop the tracks immediately, we just needed to check permissions
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("Error getting camera permission:", error);
      toast.error("Camera access is required for video consultation. Please allow camera access.");
      throw error;
    }
  };
  
  // Join the meeting
  const joinMeeting = async () => {
    try {
      setLoading(true);
      console.log("Starting join meeting process with appointmentId:", appointmentId, "isDoctor:", isDoctor);
      
      // Reset states
      setIsMuted(false);
      setIsVideoOff(false);
      setRemoteParticipant(null);
      setRemoteVideoTracks([]);
      setRemoteAudioTracks([]);
      setRoom(null);
      
      // Get identity based on role
      const identity = isDoctor ? `doctor-${appointmentId}` : `patient-${appointmentId}`;
      console.log("Using identity:", identity);
      
      // Get token from backend
      console.log("Requesting token from backend");
      const { data } = await axios.post(
        `${backendUrl}/api/meeting/join`,
        { appointmentId, identity },
        { headers: { token } }
      );
      
      if (!data.success) {
        console.error("Failed to get token:", data.message);
        setError(data.message);
        toast.error(data.message);
        setLoading(false);
        return;
      }
      
      console.log("Successfully got token");
      
      try {
        // Import Twilio Video dynamically
        console.log("Importing Twilio Video...");
        const Video = await import('twilio-video');
        console.log("Twilio Video imported successfully");
        
        // Create local video and audio tracks
        console.log("Creating local tracks...");
        const localTracks = await Video.createLocalTracks({
          audio: true,
          video: { 
            width: 640,
            height: 480,
            frameRate: 24
          }
        });
        
        setLocalTracks(localTracks);
        
        // Attach local video track to video element
        const videoTrack = localTracks.find(track => track.kind === 'video');
        if (videoTrack) {
          console.log("Found local video track, attaching to video element");
          if (localVideoRef.current) {
            console.log("Local video ref exists, attaching track");
            videoTrack.attach(localVideoRef.current);
          } else {
            console.error("Local video ref does not exist yet");
          }
        } else {
          console.error("No local video track found");
        }
        
        // Connect to the room
        console.log("Connecting to room:", data.roomName);
        const roomOptions = {
          name: data.roomName,
          tracks: localTracks,
          networkQuality: {
            local: 1,
            remote: 1
          },
          dominantSpeaker: true,
          maxAudioBitrate: 16000,
          preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
          automaticSubscription: true
        };
        
        const roomObj = await Video.connect(data.token, roomOptions);
        console.log("Connected to room:", roomObj.name);
        
        setRoom(roomObj);
        setConnectionStatus('connected');
        
        // Set up event listeners for the room
        setupRoomEventListeners(roomObj);
        
        // Handle existing participants
        if (roomObj.participants.size > 0) {
          roomObj.participants.forEach(participant => {
            handleParticipantConnected(participant);
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error connecting to room:", error);
        setError("Failed to connect to the meeting room. Please try again.");
        toast.error("Failed to connect to the meeting room. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error joining meeting:", error);
      setError("Failed to join the meeting. Please try again.");
      toast.error("Failed to join the meeting. Please try again.");
      setLoading(false);
    }
  };
  
  // Set up room event listeners
  const setupRoomEventListeners = (roomObj) => {
    // When a participant connects
    roomObj.on('participantConnected', participant => {
      console.log(`Participant connected: ${participant.identity}`);
      toast.success(`${participant.identity.includes('doctor') ? 'Doctor' : 'Patient'} has joined the meeting`);
      handleParticipantConnected(participant);
    });
    
    // When a participant disconnects
    roomObj.on('participantDisconnected', participant => {
      console.log(`Participant disconnected: ${participant.identity}`);
      toast.info(`${participant.identity.includes('doctor') ? 'Doctor' : 'Patient'} has left the meeting`);
      handleParticipantDisconnected(participant);
    });
    
    // When the room is disconnected
    roomObj.on('disconnected', (room, error) => {
      console.log('Disconnected from room:', room.name);
      if (error) {
        console.error('Disconnection error:', error);
      }
      handleRoomDisconnected(room, error);
    });
    
    // Network quality changes
    roomObj.on('networkQualityLevelChanged', (networkQuality) => {
      console.log('Local network quality changed:', networkQuality);
      setNetworkQuality(networkQuality);
    });
    
    // Reconnecting
    roomObj.on('reconnecting', (error) => {
      console.log('Reconnecting to room due to:', error);
      setConnectionStatus('reconnecting');
      toast.warning('Connection issues detected. Attempting to reconnect...');
    });
    
    // Reconnected
    roomObj.on('reconnected', () => {
      console.log('Reconnected to room');
      setConnectionStatus('connected');
      toast.success('Successfully reconnected to the meeting');
    });
  };
  
  // Handle when a participant connects
  const handleParticipantConnected = (participant) => {
    setRemoteParticipant(participant);
    
    // Handle participant's existing tracks
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        handleTrackSubscribed(publication.track, participant);
      }
    });
    
    // Handle participant's future tracks
    participant.on('trackSubscribed', track => {
      handleTrackSubscribed(track, participant);
    });
    
    // Handle track unsubscribed
    participant.on('trackUnsubscribed', track => {
      handleTrackUnsubscribed(track, participant);
    });
    
    // Network quality for remote participant
    participant.on('networkQualityLevelChanged', (networkQuality) => {
      console.log(`Remote participant ${participant.identity} network quality:`, networkQuality);
    });
  };
  
  // Handle when a participant disconnects
  const handleParticipantDisconnected = (participant) => {
    setRemoteParticipant(null);
    setRemoteVideoTracks([]);
    setRemoteAudioTracks([]);
  };
  
  // Handle when a track is subscribed
  const handleTrackSubscribed = (track, participant) => {
    console.log(`Track subscribed: ${track.kind} from ${participant.identity}`);
    
    if (track.kind === 'video') {
      setRemoteVideoTracks(prevTracks => [...prevTracks, track]);
      if (remoteVideoRef.current) {
        track.attach(remoteVideoRef.current);
      }
    } else if (track.kind === 'audio') {
      setRemoteAudioTracks(prevTracks => [...prevTracks, track]);
      // Audio tracks are automatically attached to audio elements
      track.attach();
    }
  };
  
  // Handle when a track is unsubscribed
  const handleTrackUnsubscribed = (track, participant) => {
    console.log(`Track unsubscribed: ${track.kind} from ${participant.identity}`);
    
    if (track.kind === 'video') {
      setRemoteVideoTracks(prevTracks => prevTracks.filter(t => t !== track));
    } else if (track.kind === 'audio') {
      setRemoteAudioTracks(prevTracks => prevTracks.filter(t => t !== track));
    }
    
    track.detach();
  };
  
  // Handle room disconnection
  const handleRoomDisconnected = (room, error) => {
    setConnectionStatus('disconnected');
    setRoom(null);
    
    if (error) {
      // Check for duplicate identity error
      if (error.message && error.message.includes('duplicate identity')) {
        setError("You're already connected to this meeting from another device or browser tab. Please close other sessions before rejoining.");
        toast.error("You're already connected to this meeting from another device or browser tab.");
      } else {
        setError(`Disconnected from the meeting: ${error.message}`);
        toast.error(`Disconnected from the meeting: ${error.message}`);
      }
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (localTracks.length > 0) {
      const audioTrack = localTracks.find(track => track.kind === 'audio');
      if (audioTrack) {
        if (isMuted) {
          audioTrack.enable();
          setIsMuted(false);
        } else {
          audioTrack.disable();
          setIsMuted(true);
        }
      }
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localTracks.length > 0) {
      const videoTrack = localTracks.find(track => track.kind === 'video');
      if (videoTrack) {
        if (isVideoOff) {
          videoTrack.enable();
          setIsVideoOff(false);
        } else {
          videoTrack.disable();
          setIsVideoOff(true);
        }
      }
    }
  };
  
  // End meeting
  const endMeeting = async () => {
    try {
      // Disconnect from room
      if (room) {
        room.disconnect();
      }
      
      // Stop local tracks
      if (localTracks.length) {
        localTracks.forEach(track => track.stop());
      }
      
      // Call onEndMeeting callback
      if (onEndMeeting) {
        onEndMeeting();
      }
    } catch (error) {
      console.error("Error ending meeting:", error);
      toast.error("Failed to end the meeting properly. Please try again.");
      
      // Still disconnect and stop tracks
      if (room) {
        room.disconnect();
      }
      if (localTracks.length) {
        localTracks.forEach(track => track.stop());
      }
      if (onEndMeeting) {
        onEndMeeting();
      }
    }
  };
  
  // Retry connection
  const retryConnection = () => {
    joinMeeting();
  };
  
  // Add an effect to ensure video track is attached when the ref is available
  useEffect(() => {
    if (localVideoRef.current && localTracks.length > 0 && !loading) {
      const videoTrack = localTracks.find(track => track.kind === 'video');
      if (videoTrack) {
        console.log("Attaching local video track in useEffect");
        videoTrack.attach(localVideoRef.current);
      }
    }
  }, [localVideoRef.current, localTracks, loading]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50 rounded-lg p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Setting up your video consultation...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50 rounded-lg p-8">
        <div className="text-red-500 text-xl mb-4">⚠️ Connection Error</div>
        <p className="text-gray-700 mb-6">{error}</p>
        {error.includes("already connected") ? (
          <div className="text-gray-600 mb-4 text-center">
            <p className="mb-2">To fix this issue:</p>
            <ul className="list-disc text-left pl-8">
              <li>Close any other tabs or devices where you might be connected to this meeting</li>
              <li>Wait about 30 seconds for the previous session to time out</li>
              <li>Then try connecting again</li>
            </ul>
          </div>
        ) : null}
        <button 
          onClick={retryConnection}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden shadow-md">
      {/* Video container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Local video */}
        <div className="relative bg-black rounded-lg overflow-hidden h-[300px]">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
              <div className="text-center">
                <div className="text-5xl mb-2">👤</div>
                <p>Your camera is turned off</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-sm">
            You {isDoctor ? '(Doctor)' : '(Patient)'}
          </div>
          {/* Debug info - will help troubleshoot video issues */}
          <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {localTracks.length > 0 ? 
              `Tracks: ${localTracks.length} (${localTracks.map(t => t.kind).join(', ')})` : 
              'No local tracks'}
          </div>
        </div>
        
        {/* Remote video */}
        <div className="relative bg-black rounded-lg overflow-hidden h-[300px]">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          {!remoteParticipant && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
              <div className="text-center">
                <div className="text-5xl mb-2">⏳</div>
                <p>Waiting for {isDoctor ? 'patient' : 'doctor'} to join...</p>
              </div>
            </div>
          )}
          {remoteParticipant && remoteVideoTracks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
              <div className="text-center">
                <div className="text-5xl mb-2">👤</div>
                <p>{isDoctor ? 'Patient' : 'Doctor'} camera is turned off</p>
              </div>
            </div>
          )}
          {remoteParticipant && (
            <div className="absolute bottom-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-sm">
              {isDoctor ? 'Patient' : 'Doctor'}
            </div>
          )}
        </div>
      </div>
      
      {/* Meeting info */}
      <div className="p-4 bg-white border-t border-gray-200">
        <h3 className="font-medium text-gray-800">Meeting Information</h3>
        <p className="text-sm text-gray-600">
          {isDoctor ? 'You are the doctor in this consultation.' : 'You are the patient in this consultation.'}
        </p>
        <p className="text-sm text-gray-600">
          Appointment ID: {appointmentId}
        </p>
        {isDoctor && (
          <p className="text-sm text-gray-600 mt-2">
            <strong>Note:</strong> As the doctor, when you end the meeting, the appointment will be marked as completed.
          </p>
        )}
      </div>
      
      {/* Controls - moved from fixed position to after meeting info */}
      <div className="bg-white py-6 px-4 border-t border-gray-200">
        {/* Mobile-friendly controls with flex-wrap for small screens */}
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center items-center gap-4 sm:gap-6">
          <button 
            onClick={toggleMute}
            className={`p-3 sm:p-4 rounded-full ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-800'} shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeDasharray="2 2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`p-3 sm:p-4 rounded-full ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-800'} shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeDasharray="2 2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          
          {/* Connection status indicator - smaller on mobile */}
          <div 
            className={`px-2 sm:px-3 py-1 sm:py-2 rounded-full flex items-center ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 
              connectionStatus === 'reconnecting' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}
            title="Connection status"
          >
            <div className={`w-2 h-2 rounded-full mr-1 sm:mr-2 ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}></div>
            <span className="text-xs font-medium">
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'reconnecting' ? 'Reconnecting...' : 
               'Disconnected'}
            </span>
          </div>
          
          <button 
            onClick={retryConnection}
            className="p-3 sm:p-4 rounded-full bg-blue-500 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12"
            title="Refresh connection"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button 
            onClick={endMeeting}
            className="p-3 sm:p-4 rounded-full bg-red-600 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14"
            title="End meeting"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
        
        {/* Connection quality indicator */}
        {networkQuality !== null && (
          <div className="flex justify-center mt-2">
            <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-700 flex items-center">
              <span className="mr-2">Signal:</span>
              <div className="flex space-x-1">
                <div className={`w-1 h-3 rounded-sm ${networkQuality >= 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`w-1 h-4 rounded-sm ${networkQuality >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`w-1 h-5 rounded-sm ${networkQuality >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`w-1 h-6 rounded-sm ${networkQuality >= 4 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`w-1 h-7 rounded-sm ${networkQuality >= 5 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoMeeting; 