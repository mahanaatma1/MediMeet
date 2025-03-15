import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const VideoMeeting = ({ appointmentId, isDoctor, backendUrl, dtoken, onEndMeeting }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [componentMounted, setComponentMounted] = useState(false);
  
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const navigate = useNavigate();

  // Join the meeting
  const joinMeeting = async () => {
    try {
      setLoading(true);
      console.log("Starting join meeting process with appointmentId:", appointmentId, "isDoctor:", isDoctor);
      
      // Reset states
      setIsMuted(false);
      setIsVideoOff(false);
      setParticipants([]);
      setRoom(null);
      
      // Get identity based on role
      const identity = isDoctor ? `doctor-${appointmentId}` : `patient-${appointmentId}`;
      console.log("Using identity:", identity);
      
      // Get token from backend
      console.log("Requesting token from backend with headers:", { dtoken });
      const { data } = await axios.post(
        `${backendUrl}/api/meeting/join`,
        { appointmentId, identity },
        { headers: { dtoken } }
      );
      
      if (!data.success) {
        console.error("Failed to get token:", data.message);
        setError(data.message);
        toast.error(data.message);
        setLoading(false);
        return;
      }
      
      console.log("Successfully got token:", data.token);
      
      try {
        // Import Twilio Video dynamically
        console.log("Importing Twilio Video...");
        const Video = await import('twilio-video');
        console.log("Twilio Video imported successfully");
        
        // Create local video and audio tracks with explicit device IDs
        console.log("Creating local tracks...");
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("Available devices:", devices);
        
        const localTracks = await Video.createLocalTracks({
          audio: true,
          video: { width: 640, height: 480 }
        });
        console.log("Local tracks created:", localTracks);
        
        setLocalTracks(localTracks);
        
        // Connect to the room
        console.log("Connecting to room:", data.roomName);
        const room = await Video.connect(data.token, {
          name: data.roomName,
          tracks: localTracks,
          networkQuality: {
            local: 1,
            remote: 1
          }
        });
        console.log("Connected to room:", room);
        
        setRoom(room);
        
        // Handle participants already in the room
        console.log("Existing participants:", Array.from(room.participants.values()));
        room.participants.forEach(participant => {
          console.log("Processing existing participant:", participant.identity);
          handleParticipantConnected(participant);
        });
        
        // Handle new participants joining
        room.on('participantConnected', participant => {
          console.log("New participant connected:", participant.identity);
          handleParticipantConnected(participant);
        });
        
        // Handle participants leaving
        room.on('participantDisconnected', participant => {
          console.log("Participant disconnected:", participant.identity);
          handleParticipantDisconnected(participant);
        });
        
        // Handle when you are disconnected
        room.on('disconnected', handleRoomDisconnected);
        
        setLoading(false);
      } catch (videoError) {
        console.error('Error with Twilio Video:', videoError);
        setError('Failed to initialize video. Please check your camera and microphone permissions.');
        toast.error('Failed to initialize video. Please check your camera and microphone permissions.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      setError('Failed to join meeting. Please try again.');
      toast.error('Failed to join meeting. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle when a new participant connects
  const handleParticipantConnected = (participant) => {
    console.log("Handling new participant:", participant.identity);
    setParticipants(prevParticipants => [...prevParticipants, participant]);
    
    // Handle participant's existing tracks
    participant.tracks.forEach(publication => {
      console.log("Checking publication:", publication);
      if (publication.isSubscribed) {
        console.log("Track is already subscribed:", publication.track.kind);
        handleTrackSubscribed(publication.track, participant);
      }
    });
    
    // Handle participant's new tracks
    participant.on('trackSubscribed', (track) => {
      console.log("New track subscribed:", track.kind);
      handleTrackSubscribed(track, participant);
    });
    
    // Handle track unsubscriptions
    participant.on('trackUnsubscribed', (track) => {
      console.log("Track unsubscribed:", track.kind);
      handleTrackUnsubscribed(track);
    });
  };
  
  // Handle when a participant disconnects
  const handleParticipantDisconnected = (participant) => {
    console.log("Participant disconnected, removing from state:", participant.identity);
    setParticipants(prevParticipants => 
      prevParticipants.filter(p => p !== participant)
    );
  };
  
  // Handle when a track is subscribed
  const handleTrackSubscribed = (track, participant) => {
    console.log("Attaching track:", track.kind, "from participant:", participant.identity);
    
    if (track.kind === 'video') {
      if (remoteVideoRef.current) {
        console.log("Attaching remote video to DOM element");
        track.attach(remoteVideoRef.current);
      } else {
        console.warn("Remote video ref not available, creating dynamic element");
        const element = track.attach();
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.objectFit = 'cover';
        
        // Find the container and append the element
        const container = document.querySelector('.remote-video-container');
        if (container) {
          console.log("Found remote video container, appending element");
          container.appendChild(element);
        } else {
          console.warn("Remote video container not found, appending to body");
          document.body.appendChild(element);
        }
      }
    } else if (track.kind === 'audio') {
      if (remoteAudioRef.current) {
        console.log("Attaching remote audio to DOM element");
        track.attach(remoteAudioRef.current);
      } else {
        console.warn("Remote audio ref not available, creating dynamic element");
        const element = track.attach();
        document.body.appendChild(element);
      }
    } else {
      console.log("Creating and attaching to new DOM element for unknown track type");
      const element = track.attach();
      document.body.appendChild(element);
    }
  };
  
  // Handle when a track is unsubscribed
  const handleTrackUnsubscribed = (track) => {
    console.log("Detaching track:", track.kind);
    track.detach().forEach(element => element.remove());
  };
  
  // Handle when the room is disconnected
  const handleRoomDisconnected = (room, error) => {
    console.log("Room disconnected:", error || "No error");
    if (error) {
      console.error("Room disconnected with error:", error);
    }
    setParticipants([]);
    setRoom(null);
  };
  
  // Toggle mute
  const toggleMute = () => {
    console.log("Toggling mute. Current state:", isMuted, "Local tracks:", localTracks);
    if (localTracks.length > 0) {
      const audioTrack = localTracks.find(track => track.kind === 'audio');
      if (audioTrack) {
        console.log("Found audio track, toggling...");
        if (isMuted) {
          console.log("Enabling audio track");
          audioTrack.enable();
        } else {
          console.log("Disabling audio track");
          audioTrack.disable();
        }
        setIsMuted(!isMuted);
        console.log("Mute state updated to:", !isMuted);
      } else {
        console.error("No audio track found in localTracks");
      }
    } else {
      console.error("No local tracks available");
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    console.log("Toggling video. Current state:", isVideoOff, "Local tracks:", localTracks);
    if (localTracks.length > 0) {
      const videoTrack = localTracks.find(track => track.kind === 'video');
      if (videoTrack) {
        console.log("Found video track, toggling...");
        if (isVideoOff) {
          console.log("Enabling video track");
          videoTrack.enable();
        } else {
          console.log("Disabling video track");
          videoTrack.disable();
        }
        setIsVideoOff(!isVideoOff);
        console.log("Video state updated to:", !isVideoOff);
      } else {
        console.error("No video track found in localTracks");
      }
    } else {
      console.error("No local tracks available");
    }
  };
  
  // End the meeting (for doctor only)
  const endMeeting = async () => {
    if (isDoctor) {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/meeting/end`,
          { appointmentId },
          { headers: { dtoken } }
        );
        
        if (data.success) {
          toast.success('Meeting ended successfully');
          if (onEndMeeting) onEndMeeting();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        console.error('Error ending meeting:', error);
        toast.error('Failed to end meeting');
      }
    }
    
    // Disconnect from the room
    if (room) {
      room.disconnect();
    }
    
    // Stop local tracks
    if (localTracks.length > 0) {
      localTracks.forEach(track => track.stop());
    }
    
    // Navigate back
    navigate(-1);
  };
  
  // Join the meeting when component mounts
  useEffect(() => {
    console.log("VideoMeeting component mounted, setting componentMounted to true");
    setComponentMounted(true);
    
    // Cleanup function
    return () => {
      console.log("VideoMeeting component unmounting, cleaning up...");
      if (room) {
        room.disconnect();
      }
      if (localTracks.length > 0) {
        localTracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  // Delay joining the meeting to ensure DOM elements are rendered
  useEffect(() => {
    if (componentMounted) {
      console.log("Component mounted, waiting for DOM to render before joining meeting");
      // Wait for the DOM to render
      const timer = setTimeout(() => {
        console.log("DOM should be rendered now, joining meeting");
        joinMeeting();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [componentMounted, appointmentId]);
  
  // Ensure video elements are properly initialized
  useEffect(() => {
    if (!componentMounted) return;
    
    console.log("Checking video elements initialization");
    if (videoRef.current) {
      console.log("Local video element is initialized");
    } else {
      console.warn("Local video element is NOT initialized");
    }
    
    if (remoteVideoRef.current) {
      console.log("Remote video element is initialized");
    } else {
      console.warn("Remote video element is NOT initialized");
    }
    
    if (remoteAudioRef.current) {
      console.log("Remote audio element is initialized");
    } else {
      console.warn("Remote audio element is NOT initialized");
    }
  }, [componentMounted]);
  
  // Ensure local video track is attached whenever it changes
  useEffect(() => {
    if (!componentMounted || localTracks.length === 0) return;
    
    const videoTrack = localTracks.find(track => track.kind === 'video');
    if (videoTrack) {
      console.log("Video track changed, re-attaching to DOM from useEffect");
      
      // Function to attach video track with retry
      const attachVideoTrack = () => {
        if (videoRef.current) {
          console.log("videoRef is available in useEffect, attaching video track");
          try {
            videoTrack.detach().forEach(element => element.remove());
            videoTrack.attach(videoRef.current);
            
            // Double-check if the video element has the track
            if (!videoRef.current.srcObject) {
              console.log("Creating new MediaStream for video element in useEffect");
              const mediaStream = new MediaStream([videoTrack.mediaStreamTrack]);
              videoRef.current.srcObject = mediaStream;
            }
          } catch (error) {
            console.error("Error re-attaching local video track in useEffect:", error);
          }
        } else {
          console.log("videoRef is not available in useEffect yet, will retry in 500ms");
          setTimeout(attachVideoTrack, 500);
        }
      };
      
      // Start the attachment process
      attachVideoTrack();
    }
  }, [localTracks, componentMounted]);
  
  // Create a direct DOM manipulation approach for attaching video
  useEffect(() => {
    if (!componentMounted || localTracks.length === 0) return;
    
    const videoTrack = localTracks.find(track => track.kind === 'video');
    if (videoTrack) {
      console.log("Attempting to attach video track using direct DOM manipulation");
      
      // Try to find the video element directly in the DOM
      const localVideoContainer = document.querySelector('.local-video-container');
      if (localVideoContainer) {
        const videoElement = localVideoContainer.querySelector('video');
        if (videoElement) {
          console.log("Found video element in DOM, attaching track");
          try {
            videoTrack.detach().forEach(element => element.remove());
            videoTrack.attach(videoElement);
            console.log("Successfully attached video track to DOM element");
          } catch (error) {
            console.error("Error attaching video track to DOM element:", error);
          }
        } else {
          console.warn("Could not find video element in local-video-container");
        }
      } else {
        console.warn("Could not find local-video-container");
      }
    }
  }, [localTracks, componentMounted]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Joining meeting...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[80vh] bg-gray-100 rounded-lg overflow-hidden">
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Video Consultation</h2>
        <div className="flex gap-2">
          <button 
            onClick={endMeeting} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {isDoctor ? 'End Meeting' : 'Leave'}
          </button>
        </div>
      </div>
      
      {/* Video layout - responsive for mobile */}
      <div className="flex flex-col md:flex-row flex-1 p-2 md:p-4 gap-2 md:gap-4 relative">
        {/* Main video area - remote participant */}
        <div className="flex-1 bg-black rounded-lg overflow-hidden relative min-h-[300px] md:min-h-[400px] remote-video-container">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
            className="w-full h-full object-cover absolute inset-0"
          />
          <audio ref={remoteAudioRef} autoPlay />
          {participants.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Waiting for other participant to join...
            </div>
          )}
        </div>
        
        {/* Self view - local participant */}
        <div className="h-[150px] md:h-auto md:w-1/4 bg-black rounded-lg overflow-hidden relative min-h-[150px] min-w-[200px] local-video-container">
          <video 
            ref={videoRef} 
            id="local-video"
            autoPlay 
            playsInline
            muted 
            className="w-full h-full object-cover absolute inset-0"
          />
          {!localTracks.some(track => track.kind === 'video') && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Camera not available
            </div>
          )}
        </div>
      </div>
      
      {/* Controls - fixed at bottom */}
      <div className="bg-gray-200 p-2 md:p-4 flex flex-wrap justify-center gap-2 md:gap-4 sticky bottom-0 left-0 right-0 z-50 shadow-lg border-t border-gray-300">
        {/* Mute/Unmute button */}
        <button 
          onClick={toggleMute}
          className={`p-3 rounded-full ${isMuted ? 'bg-red-500 text-white' : 'bg-white'} hover:bg-gray-100 flex items-center justify-center shadow-md`}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
          <span className="ml-2 hidden md:inline">{isMuted ? "Unmute" : "Mute"}</span>
        </button>
        
        {/* Video on/off button */}
        <button 
          onClick={toggleVideo}
          className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white'} hover:bg-gray-100 flex items-center justify-center shadow-md`}
          aria-label={isVideoOff ? "Turn Video On" : "Turn Video Off"}
        >
          {isVideoOff ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          <span className="ml-2 hidden md:inline">{isVideoOff ? "Turn Video On" : "Turn Video Off"}</span>
        </button>
        
        {/* End call button */}
        <button 
          onClick={endMeeting}
          className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 flex items-center justify-center shadow-md"
          aria-label="End Call"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
          <span className="ml-2 hidden md:inline">End Call</span>
        </button>
        
        {/* Status indicators */}
        <div className="ml-2 flex items-center text-sm flex-wrap justify-center w-full md:w-auto mt-2 md:mt-0">
          <div className={`flex items-center mr-4 px-2 py-1 rounded-full ${isMuted ? 'bg-red-100' : 'bg-green-100'}`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}></span>
            <span className="font-medium">{isMuted ? 'Muted' : 'Unmuted'}</span>
          </div>
          
          <div className={`flex items-center px-2 py-1 rounded-full ${isVideoOff ? 'bg-red-100' : 'bg-green-100'}`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isVideoOff ? 'bg-red-500' : 'bg-green-500'}`}></span>
            <span className="font-medium">{isVideoOff ? 'Video Off' : 'Video On'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoMeeting; 