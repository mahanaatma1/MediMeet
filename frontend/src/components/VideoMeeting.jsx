import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const VideoMeeting = ({ appointmentId, isDoctor, backendUrl, token, onEndMeeting }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [componentMounted, setComponentMounted] = useState(false);
  const [refsInitialized, setRefsInitialized] = useState(false);
  
  // Use ref callback pattern instead of useRef
  const [videoRef, setVideoRef] = useState(null);
  const [remoteVideoRef, setRemoteVideoRef] = useState(null);
  const [remoteAudioRef, setRemoteAudioRef] = useState(null);
  
  const navigate = useNavigate();

  // Ref callback functions
  const setVideoRefCallback = (element) => {
    console.log("Local video ref callback called with element:", element);
    setVideoRef(element);
    checkAllRefsInitialized(element, remoteVideoRef, remoteAudioRef);
  };
  
  const setRemoteVideoRefCallback = (element) => {
    console.log("Remote video ref callback called with element:", element);
    setRemoteVideoRef(element);
    checkAllRefsInitialized(videoRef, element, remoteAudioRef);
  };
  
  const setRemoteAudioRefCallback = (element) => {
    console.log("Remote audio ref callback called with element:", element);
    setRemoteAudioRef(element);
    checkAllRefsInitialized(videoRef, remoteVideoRef, element);
  };
  
  // Check if all refs are initialized
  const checkAllRefsInitialized = (video, remoteVideo, remoteAudio) => {
    if (video && remoteVideo && remoteAudio) {
      console.log("All refs are initialized!");
      setRefsInitialized(true);
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
      setParticipants([]);
      setRoom(null);
      
      // Get identity based on role
      const identity = isDoctor ? `doctor-${appointmentId}` : `patient-${appointmentId}`;
      console.log("Using identity:", identity);
      
      // Get token from backend
      console.log("Requesting token from backend with headers:", { token });
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
      
      console.log("Successfully got token:", data.token);
      
      try {
        // Import Twilio Video dynamically
        console.log("Importing Twilio Video...");
        const Video = await import('twilio-video');
        console.log("Twilio Video imported successfully");
        
        // Create local video and audio tracks with explicit device IDs and quality constraints
        console.log("Creating local tracks...");
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("Available devices:", devices);
        
        // Set bandwidth profile to optimize for video quality
        const bandwidthProfileOptions = {
          video: {
            mode: 'grid',
            maxTracks: 2,
            dominantSpeakerPriority: 'high',
            renderDimensions: {
              high: { width: 640, height: 480 },
              standard: { width: 320, height: 240 },
              low: { width: 160, height: 120 }
            }
          }
        };
        
        // Set video constraints for better performance
        const videoConstraints = {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 24, max: 30 }
        };
        
        const localTracks = await Video.createLocalTracks({
          audio: { 
            noiseSuppression: true,
            echoCancellation: true 
          },
          video: videoConstraints
        });
        console.log("Local tracks created:", localTracks);
        
        setLocalTracks(localTracks);
        
        // Attach local video track to video element
        const videoTrack = localTracks.find(track => track.kind === 'video');
        if (videoTrack) {
          console.log("Attaching local video track to video element");
          
          // Function to attach video track with retry
          const attachLocalVideoTrack = (retryCount = 0) => {
            if (videoRef) {
              console.log("videoRef is available, attaching local video track");
              try {
                videoTrack.detach().forEach(element => element.remove());
                videoTrack.attach(videoRef);
                console.log("Local video track attached successfully");
              } catch (error) {
                console.error("Error attaching local video track:", error);
              }
            } else if (retryCount < 5) {
              console.log(`videoRef is not available yet, will retry in 500ms (attempt ${retryCount + 1}/5)`);
              setTimeout(() => attachLocalVideoTrack(retryCount + 1), 500);
            } else {
              console.log("videoRef still not available after 5 retries, creating fallback element");
              // Create a fallback video element
              try {
                const localVideoContainer = document.querySelector('.local-video-container');
                if (localVideoContainer) {
                  console.log("Found local-video-container, creating video element");
                  const existingVideo = localVideoContainer.querySelector('video');
                  if (existingVideo) {
                    existingVideo.remove();
                  }
                  
                  const videoElement = document.createElement('video');
                  videoElement.autoPlay = true;
                  videoElement.playsInline = true;
                  videoElement.muted = true;
                  videoElement.className = "w-full h-full object-cover absolute inset-0";
                  
                  localVideoContainer.appendChild(videoElement);
                  videoTrack.attach(videoElement);
                  console.log("Successfully attached to dynamically created video element");
                } else {
                  console.error("Could not find local-video-container for fallback");
                }
              } catch (error) {
                console.error("Error creating fallback video element:", error);
              }
            }
          };
          
          // Start the attachment process
          attachLocalVideoTrack();
        }
        
        // Connect to the room with optimized settings
        console.log("Connecting to room:", data.roomName);
        const room = await Video.connect(data.token, {
          name: data.roomName,
          tracks: localTracks,
          networkQuality: {
            local: 1,
            remote: 1
          },
          bandwidthProfile: bandwidthProfileOptions,
          preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
          maxAudioBitrate: 16000, // Optimize audio bitrate
          dominantSpeaker: true,
          automaticSubscription: true
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
        
        // Handle reconnection events
        room.on('reconnecting', error => {
          console.log('Reconnecting to the room due to network interruption:', error);
          toast.info('Reconnecting to meeting...');
        });
        
        room.on('reconnected', () => {
          console.log('Successfully reconnected to the room');
          toast.success('Reconnected to meeting');
        });
        
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
  
  // Function to clear and prepare remote container
  const prepareRemoteContainer = () => {
    console.log("Preparing remote container for new participant");
    
    try {
      const remoteContainer = document.getElementById('remote-container') || document.querySelector('.remote-video-container');
      if (remoteContainer) {
        // Clear any "waiting" messages
        const messageElements = remoteContainer.querySelectorAll('div:not(.video-element)');
        messageElements.forEach(el => {
          if (el.textContent.includes('Waiting') || el.textContent.includes('Connecting')) {
            console.log("Removing waiting message from remote container");
            el.style.display = 'none';
          }
        });
        
        // Ensure we have video and audio elements
        let videoElement = remoteContainer.querySelector('video');
        if (!videoElement) {
          console.log("Creating video element in remote container during preparation");
          videoElement = document.createElement('video');
          videoElement.id = 'remote-video';
          videoElement.autoPlay = true;
          videoElement.playsInline = true;
          videoElement.className = "w-full h-full object-cover absolute inset-0";
          remoteContainer.appendChild(videoElement);
          setRemoteVideoRef(videoElement);
        }
        
        let audioElement = remoteContainer.querySelector('audio');
        if (!audioElement) {
          console.log("Creating audio element in remote container during preparation");
          audioElement = document.createElement('audio');
          audioElement.id = 'remote-audio';
          audioElement.autoPlay = true;
          remoteContainer.appendChild(audioElement);
          setRemoteAudioRef(audioElement);
        }
        
        console.log("Remote container prepared successfully");
      } else {
        console.error("Could not find remote container for preparation");
      }
    } catch (error) {
      console.error("Error preparing remote container:", error);
    }
  };

  // Handle when a participant connects
  const handleParticipantConnected = (participant) => {
    console.log(`Participant ${participant.identity} connected`);
    
    // Prepare the remote container for this participant
    prepareRemoteContainer();
    
    // Add participant to state
    setParticipants(prevParticipants => {
      // Check if participant is already in the list to avoid duplicates
      if (prevParticipants.some(p => p.identity === participant.identity)) {
        console.log(`Participant ${participant.identity} already in list, not adding again`);
        return prevParticipants;
      }
      console.log(`Adding participant ${participant.identity} to list`);
      return [...prevParticipants, participant];
    });
    
    // Log all tracks from the participant
    console.log(`Participant ${participant.identity} has ${participant.tracks.size} tracks`);
    participant.tracks.forEach(publication => {
      console.log(`Publication track: ${publication.trackName}, isSubscribed: ${publication.isSubscribed}, kind: ${publication.track?.kind || 'unknown'}`);
    });
    
    // Handle participant's existing tracks
    participant.tracks.forEach(publication => {
      console.log(`Checking publication: ${publication.trackName}, isSubscribed: ${publication.isSubscribed}`);
      if (publication.isSubscribed) {
        console.log(`Track ${publication.trackName} is already subscribed, handling it`);
        handleTrackSubscribed(publication.track, participant);
      } else {
        console.log(`Track ${publication.trackName} is not subscribed yet`);
      }
    });
    
    // Handle participant's new tracks
    participant.on('trackSubscribed', track => {
      console.log(`New track ${track.kind} subscribed from ${participant.identity}`);
      handleTrackSubscribed(track, participant);
    });
    
    // Handle track subscription failures
    participant.on('trackSubscriptionFailed', (error, track) => {
      console.error(`Track subscription failed for ${track.kind} from ${participant.identity}:`, error);
    });
    
    // Handle track enabled/disabled events
    participant.on('trackEnabled', track => {
      console.log(`Track ${track.kind} enabled by ${participant.identity}`);
    });
    
    participant.on('trackDisabled', track => {
      console.log(`Track ${track.kind} disabled by ${participant.identity}`);
    });
    
    participant.on('trackUnsubscribed', track => {
      console.log(`Track ${track.kind} unsubscribed from ${participant.identity}`);
      handleTrackUnsubscribed(track, participant);
    });
  };
  
  // Handle when a participant disconnects
  const handleParticipantDisconnected = (participant) => {
    console.log(`Participant ${participant.identity} disconnected`);
    
    setParticipants(prevParticipants => 
      prevParticipants.filter(p => p.identity !== participant.identity)
    );
  };
  
  // Optimize track attachment to reduce glitches
  const optimizeTrackAttachment = (track, element) => {
    try {
      // Check if track is already attached to this element
      const attachedElements = track.detachElements();
      const isAlreadyAttached = Array.from(attachedElements).some(el => el === element);
      
      if (isAlreadyAttached) {
        console.log(`Track ${track.kind} already attached to element, skipping re-attachment`);
        return true;
      }
      
      // Detach from all elements and attach to the specified element
      track.detach().forEach(el => el.remove());
      track.attach(element);
      
      // For video tracks, add optimization settings
      if (track.kind === 'video' && element instanceof HTMLVideoElement) {
        // Set video element properties for better performance
        element.style.objectFit = 'cover';
        
        // Reduce resolution for better performance if needed
        if (window.innerWidth < 768) {
          // On mobile, use lower resolution
          track.mediaStreamTrack.applyConstraints({
            width: { ideal: 320, max: 640 },
            height: { ideal: 240, max: 480 },
            frameRate: { ideal: 15, max: 24 }
          }).catch(e => console.error('Failed to apply constraints:', e));
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error optimizing track attachment:`, error);
      return false;
    }
  };

  // Handle when a track is subscribed with optimizations
  const handleTrackSubscribed = (track, participant) => {
    console.log(`Track ${track.kind} subscribed from ${participant.identity}`);
    
    if (track.kind === 'video') {
      console.log("Attaching remote video track");
      
      // Function to attach video track with retry and multiple fallbacks
      const attachVideoTrack = (retryCount = 0) => {
        // Try ref-based attachment first
        if (remoteVideoRef) {
          console.log("remoteVideoRef is available, attaching video track");
          if (optimizeTrackAttachment(track, remoteVideoRef)) {
            console.log("Remote video track attached successfully via ref");
            return true;
          }
        }
        
        // Try direct DOM query by ID
        try {
          const remoteVideo = document.getElementById('remote-video');
          if (remoteVideo) {
            console.log("Found remote-video by ID, attaching track");
            if (optimizeTrackAttachment(track, remoteVideo)) {
              console.log("Remote video track attached successfully via ID");
              return true;
            }
          }
        } catch (error) {
          console.error("Error attaching to remote-video by ID:", error);
        }
        
        // Try container query
        try {
          const remoteContainer = document.getElementById('remote-container') || document.querySelector('.remote-video-container');
          if (remoteContainer) {
            let videoElement = remoteContainer.querySelector('video');
            if (!videoElement) {
              console.log("Creating new video element in remote container");
              videoElement = document.createElement('video');
              videoElement.id = 'remote-video';
              videoElement.autoPlay = true;
              videoElement.playsInline = true;
              videoElement.className = "w-full h-full object-cover absolute inset-0";
              remoteContainer.appendChild(videoElement);
            }
            
            if (optimizeTrackAttachment(track, videoElement)) {
              console.log("Remote video track attached successfully via container query");
              
              // Update the ref if possible
              setRemoteVideoRef(videoElement);
              return true;
            }
          }
        } catch (error) {
          console.error("Error with container approach:", error);
        }
        
        // If we've tried a few times and still failed, retry after a delay
        if (retryCount < 10) {
          console.log(`Remote video attachment failed, will retry in 500ms (attempt ${retryCount + 1}/10)`);
          setTimeout(() => attachVideoTrack(retryCount + 1), 500);
          return false;
        }
        
        console.error("Failed to attach remote video track after maximum attempts");
        return false;
      };
      
      // Start the attachment process
      attachVideoTrack();
    } else if (track.kind === 'audio') {
      console.log("Attaching remote audio track");
      
      // Function to attach audio track with retry and multiple fallbacks
      const attachAudioTrack = (retryCount = 0) => {
        // Try ref-based attachment first
        if (remoteAudioRef) {
          console.log("remoteAudioRef is available, attaching audio track");
          if (optimizeTrackAttachment(track, remoteAudioRef)) {
            console.log("Remote audio track attached successfully via ref");
            return true;
          }
        }
        
        // Try direct DOM query by ID
        try {
          const remoteAudio = document.getElementById('remote-audio');
          if (remoteAudio) {
            console.log("Found remote-audio by ID, attaching track");
            if (optimizeTrackAttachment(track, remoteAudio)) {
              console.log("Remote audio track attached successfully via ID");
              return true;
            }
          }
        } catch (error) {
          console.error("Error attaching to remote-audio by ID:", error);
        }
        
        // Try container query
        try {
          const remoteContainer = document.getElementById('remote-container') || document.querySelector('.remote-video-container');
          if (remoteContainer) {
            let audioElement = remoteContainer.querySelector('audio');
            if (!audioElement) {
              console.log("Creating new audio element in remote container");
              audioElement = document.createElement('audio');
              audioElement.id = 'remote-audio';
              audioElement.autoPlay = true;
              remoteContainer.appendChild(audioElement);
            }
            
            if (optimizeTrackAttachment(track, audioElement)) {
              console.log("Remote audio track attached successfully via container query");
              
              // Update the ref if possible
              setRemoteAudioRef(audioElement);
              return true;
            }
          }
        } catch (error) {
          console.error("Error with container approach for audio:", error);
        }
        
        // If we've tried a few times and still failed, retry after a delay
        if (retryCount < 10) {
          console.log(`Remote audio attachment failed, will retry in 500ms (attempt ${retryCount + 1}/10)`);
          setTimeout(() => attachAudioTrack(retryCount + 1), 500);
          return false;
        }
        
        console.error("Failed to attach remote audio track after maximum attempts");
        return false;
      };
      
      // Start the attachment process
      attachAudioTrack();
    }
  };
  
  // Handle when a track is unsubscribed
  const handleTrackUnsubscribed = (track, participant) => {
    console.log(`Track ${track.kind} unsubscribed from ${participant.identity}`);
    
    try {
      track.detach().forEach(element => {
        console.log(`Removing detached ${track.kind} element`);
        element.remove();
      });
    } catch (error) {
      console.error(`Error detaching ${track.kind} track:`, error);
    }
  };
  
  // Handle when the room is disconnected
  const handleRoomDisconnected = (room, error) => {
    console.log("Room disconnected", error || '');
    
    // Clean up all participants' tracks
    if (participants.length > 0) {
      participants.forEach(participant => {
        participant.tracks.forEach(publication => {
          if (publication.track) {
            try {
              publication.track.detach().forEach(element => element.remove());
            } catch (error) {
              console.error(`Error detaching track on room disconnect:`, error);
            }
          }
        });
      });
    }
    
    setRoom(null);
    setParticipants([]);
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (localTracks.length === 0) return;
    
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
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localTracks.length === 0) return;
    
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
  };
  
  // End the meeting
  const endMeeting = async () => {
    try {
      // Mark appointment as completed if user is ending the meeting
      if (!isDoctor) {
        console.log("User is ending meeting, marking appointment as completed");
        try {
          const { data } = await axios.post(
            `${backendUrl}/api/user/complete-appointment`,
            { appointmentId, userId: localStorage.getItem('userId') },
            { headers: { token } }
          );
          
          if (data.success) {
            toast.success('Appointment marked as completed');
          } else {
            console.error('Failed to mark appointment as completed:', data.message);
            toast.error('Failed to mark appointment as completed');
          }
        } catch (error) {
          console.error('Error marking appointment as completed:', error);
          toast.error('Failed to mark appointment as completed');
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
      
      if (onEndMeeting) {
        onEndMeeting();
      } else {
        navigate(-1);
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast.error('Error ending meeting');
      navigate(-1);
    }
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
    if (componentMounted && refsInitialized) {
      console.log("Component mounted and refs initialized, joining meeting");
      joinMeeting();
    } else if (componentMounted) {
      console.log("Component mounted but refs not initialized yet, waiting...");
    }
  }, [componentMounted, refsInitialized, appointmentId]);
  
  // Consolidated useEffect for video element initialization and local track attachment
  useEffect(() => {
    if (!componentMounted) return;
    
    console.log("Initializing video elements and attaching local tracks");
    
    // Create video elements
    const createAndInitializeVideoElements = () => {
      // Create local video element
      const localContainer = document.querySelector('.local-video-container');
      if (localContainer) {
        let videoElement = localContainer.querySelector('video');
        if (!videoElement) {
          console.log("Creating video element in local-video-container");
          videoElement = document.createElement('video');
          videoElement.id = 'local-video';
          videoElement.autoPlay = true;
          videoElement.playsInline = true;
          videoElement.muted = true;
          videoElement.className = "w-full h-full object-cover absolute inset-0";
          localContainer.appendChild(videoElement);
          setVideoRef(videoElement);
        }
      }
      
      // Create remote video and audio elements
      const remoteContainer = document.querySelector('.remote-video-container');
      if (remoteContainer) {
        let videoElement = remoteContainer.querySelector('video');
        if (!videoElement) {
          console.log("Creating video element in remote-video-container");
          videoElement = document.createElement('video');
          videoElement.id = 'remote-video';
          videoElement.autoPlay = true;
          videoElement.playsInline = true;
          videoElement.className = "w-full h-full object-cover absolute inset-0";
          remoteContainer.appendChild(videoElement);
          setRemoteVideoRef(videoElement);
        }
        
        let audioElement = remoteContainer.querySelector('audio');
        if (!audioElement) {
          console.log("Creating audio element in remote-video-container");
          audioElement = document.createElement('audio');
          audioElement.id = 'remote-audio';
          audioElement.autoPlay = true;
          remoteContainer.appendChild(audioElement);
          setRemoteAudioRef(audioElement);
        }
      }
      
      // Mark refs as initialized
      if (!refsInitialized) {
        const localVideo = document.getElementById('local-video');
        const remoteVideo = document.getElementById('remote-video');
        const remoteAudio = document.getElementById('remote-audio');
        
        if (localVideo && remoteVideo && remoteAudio) {
          console.log("All video elements created, marking refs as initialized");
          setVideoRef(localVideo);
          setRemoteVideoRef(remoteVideo);
          setRemoteAudioRef(remoteAudio);
          setRefsInitialized(true);
        }
      }
    };
    
    // Initialize video elements
    createAndInitializeVideoElements();
    
    // Attach local tracks if available
    if (localTracks.length > 0) {
      const videoTrack = localTracks.find(track => track.kind === 'video');
      if (videoTrack) {
        console.log("Local tracks available, attaching video track");
        
        // Try to attach to the video element
        const localVideo = document.getElementById('local-video');
        if (localVideo) {
          try {
            optimizeTrackAttachment(videoTrack, localVideo);
            console.log("Successfully attached local video track");
          } catch (error) {
            console.error("Error attaching local video track:", error);
          }
        }
      }
    }
    
    // Check again after a delay to ensure elements are created
    const timeoutId = setTimeout(() => {
      createAndInitializeVideoElements();
      
      // Force refsInitialized if elements exist but state wasn't updated
      const localVideo = document.getElementById('local-video');
      const remoteVideo = document.getElementById('remote-video');
      const remoteAudio = document.getElementById('remote-audio');
      
      if (localVideo && remoteVideo && remoteAudio && !refsInitialized) {
        console.log("Elements exist but refsInitialized is false, forcing update");
        setVideoRef(localVideo);
        setRemoteVideoRef(remoteVideo);
        setRemoteAudioRef(remoteAudio);
        setRefsInitialized(true);
      }
      
      // Re-attach local tracks if available
      if (localTracks.length > 0) {
        const videoTrack = localTracks.find(track => track.kind === 'video');
        if (videoTrack) {
          const localVideo = document.getElementById('local-video');
          if (localVideo) {
            try {
              optimizeTrackAttachment(videoTrack, localVideo);
              console.log("Re-attached local video track after delay");
            } catch (error) {
              console.error("Error re-attaching local video track after delay:", error);
            }
          }
        }
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [componentMounted, localTracks, refsInitialized]);
  
  // Monitor participants and ensure their tracks are properly attached
  useEffect(() => {
    if (participants.length > 0) {
      console.log(`Monitoring ${participants.length} participants for track attachment`);
      
      // Prepare the remote container
      prepareRemoteContainer();
      
      // For each participant, check their tracks and ensure they're attached
      participants.forEach(participant => {
        console.log(`Checking tracks for participant ${participant.identity}`);
        
        participant.tracks.forEach(publication => {
          if (publication.isSubscribed && publication.track) {
            const track = publication.track;
            console.log(`Found subscribed ${track.kind} track from ${participant.identity}, ensuring it's attached`);
            
            if (track.kind === 'video') {
              // Try to find the remote video element
              const remoteVideo = document.getElementById('remote-video');
              if (remoteVideo) {
                try {
                  // Check if this track is already attached to this element
                  const isAttached = Array.from(track.detachElements()).some(el => el === remoteVideo);
                  
                  if (!isAttached) {
                    console.log(`Remote video track not attached to remote-video, attaching now`);
                    track.detach().forEach(element => element.remove());
                    track.attach(remoteVideo);
                  } else {
                    console.log(`Remote video track already attached to remote-video`);
                  }
                } catch (error) {
                  console.error(`Error checking/attaching remote video track:`, error);
                }
              }
            } else if (track.kind === 'audio') {
              // Try to find the remote audio element
              const remoteAudio = document.getElementById('remote-audio');
              if (remoteAudio) {
                try {
                  // Check if this track is already attached to this element
                  const isAttached = Array.from(track.detachElements()).some(el => el === remoteAudio);
                  
                  if (!isAttached) {
                    console.log(`Remote audio track not attached to remote-audio, attaching now`);
                    track.detach().forEach(element => element.remove());
                    track.attach(remoteAudio);
                  } else {
                    console.log(`Remote audio track already attached to remote-audio`);
                  }
                } catch (error) {
                  console.error(`Error checking/attaching remote audio track:`, error);
                }
              }
            }
          }
        });
      });
    }
  }, [participants]);

  // Periodically check for remote tracks that might not be immediately available
  useEffect(() => {
    if (participants.length > 0 && room) {
      console.log("Setting up periodic check for remote tracks");
      
      const checkInterval = setInterval(() => {
        const remoteVideo = document.getElementById('remote-video');
        const remoteAudio = document.getElementById('remote-audio');
        
        // Check if remote video has a track attached
        if (remoteVideo && (!remoteVideo.srcObject || remoteVideo.srcObject.getVideoTracks().length === 0)) {
          console.log("Remote video doesn't have tracks, checking participants");
          
          participants.forEach(participant => {
            participant.tracks.forEach(publication => {
              if (publication.isSubscribed && publication.track && publication.track.kind === 'video') {
                console.log(`Found video track from ${participant.identity}, re-attaching`);
                try {
                  optimizeTrackAttachment(publication.track, remoteVideo);
                  console.log("Re-attached remote video track");
                } catch (error) {
                  console.error("Error re-attaching remote video track:", error);
                }
              }
            });
          });
        }
        
        // Check if remote audio has a track attached
        if (remoteAudio && (!remoteAudio.srcObject || remoteAudio.srcObject.getAudioTracks().length === 0)) {
          console.log("Remote audio doesn't have tracks, checking participants");
          
          participants.forEach(participant => {
            participant.tracks.forEach(publication => {
              if (publication.isSubscribed && publication.track && publication.track.kind === 'audio') {
                console.log(`Found audio track from ${participant.identity}, re-attaching`);
                try {
                  optimizeTrackAttachment(publication.track, remoteAudio);
                  console.log("Re-attached remote audio track");
                } catch (error) {
                  console.error("Error re-attaching remote audio track:", error);
                }
              }
            });
          });
        }
      }, 3000); // Check every 3 seconds instead of 2 to reduce overhead
      
      return () => clearInterval(checkInterval);
    }
  }, [participants, room]);

  // Add a network quality monitor
  useEffect(() => {
    if (room) {
      console.log("Setting up network quality monitor");
      
      const handleNetworkQualityChanged = (participant, networkQuality) => {
        console.log(`Network quality changed for ${participant.identity}:`, networkQuality);
        
        // If network quality is poor (level 1 or 0), reduce video quality
        if (networkQuality.networkQualityLevel <= 1) {
          console.log("Poor network quality detected, reducing video quality");
          
          // Reduce local video quality if we're the one with poor connection
          if (participant === room.localParticipant) {
            const videoTrack = localTracks.find(track => track.kind === 'video');
            if (videoTrack && videoTrack.mediaStreamTrack) {
              videoTrack.mediaStreamTrack.applyConstraints({
                width: { ideal: 320, max: 480 },
                height: { ideal: 240, max: 360 },
                frameRate: { ideal: 15, max: 20 }
              }).catch(e => console.error('Failed to apply constraints:', e));
            }
          }
        }
      };
      
      // Monitor local participant network quality
      room.localParticipant.on('networkQualityChanged', networkQuality => {
        handleNetworkQualityChanged(room.localParticipant, networkQuality);
      });
      
      // Monitor remote participants network quality
      room.participants.forEach(participant => {
        participant.on('networkQualityChanged', networkQuality => {
          handleNetworkQualityChanged(participant, networkQuality);
        });
      });
      
      // Add handler for new participants
      const handleParticipantNetworkQuality = participant => {
        participant.on('networkQualityChanged', networkQuality => {
          handleNetworkQualityChanged(participant, networkQuality);
        });
      };
      
      room.on('participantConnected', handleParticipantNetworkQuality);
      
      return () => {
        room.localParticipant.removeAllListeners('networkQualityChanged');
        room.participants.forEach(participant => {
          participant.removeAllListeners('networkQualityChanged');
        });
        room.removeListener('participantConnected', handleParticipantNetworkQuality);
      };
    }
  }, [room, localTracks]);

  // Force join meeting after a longer timeout if still not joined
  useEffect(() => {
    if (componentMounted && !room) {
      console.log("Component mounted but room not created, setting a timeout to force join meeting");
      
      const timeoutId = setTimeout(() => {
        if (!room) {
          console.log("Room still not created after timeout, forcing join meeting");
          joinMeeting();
        }
      }, 5000); // Wait 5 seconds before forcing join meeting
      
      return () => clearTimeout(timeoutId);
    }
  }, [componentMounted, room]);

  // Detect device capabilities and optimize performance
  useEffect(() => {
    if (componentMounted) {
      console.log("Detecting device capabilities for performance optimization");
      
      // Check if this is a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log("Device detected as:", isMobile ? "mobile" : "desktop");
      
      // Check available memory (only works in Chrome)
      let lowMemoryDevice = false;
      if (navigator.deviceMemory) {
        console.log(`Device memory: ${navigator.deviceMemory}GB`);
        lowMemoryDevice = navigator.deviceMemory < 4;
      }
      
      // Check for hardware concurrency (CPU cores)
      let lowPowerDevice = false;
      if (navigator.hardwareConcurrency) {
        console.log(`CPU cores: ${navigator.hardwareConcurrency}`);
        lowPowerDevice = navigator.hardwareConcurrency < 4;
      }
      
      // Check connection type if available
      let slowConnection = false;
      if (navigator.connection) {
        console.log(`Connection type: ${navigator.connection.effectiveType}`);
        slowConnection = ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType);
      }
      
      // Apply optimizations based on device capabilities
      if (isMobile || lowMemoryDevice || lowPowerDevice || slowConnection) {
        console.log("Applying performance optimizations for limited device");
        
        // Reduce video quality for local tracks
        if (localTracks.length > 0) {
          const videoTrack = localTracks.find(track => track.kind === 'video');
          if (videoTrack && videoTrack.mediaStreamTrack) {
            console.log("Reducing video quality for better performance");
            videoTrack.mediaStreamTrack.applyConstraints({
              width: { ideal: 320, max: 480 },
              height: { ideal: 240, max: 360 },
              frameRate: { ideal: 15, max: 20 }
            }).catch(e => console.error('Failed to apply constraints:', e));
          }
        }
        
        // Add CSS optimizations
        const style = document.createElement('style');
        style.textContent = `
          .remote-video-container video,
          .local-video-container video {
            will-change: transform;
            transform: translateZ(0);
            backface-visibility: hidden;
          }
        `;
        document.head.appendChild(style);
        
        // Reduce animation effects
        document.querySelectorAll('.animate-spin').forEach(el => {
          el.style.animationDuration = '2s'; // Slow down animations
        });
      }
    }
  }, [componentMounted, localTracks]);

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
        <div className="flex-1 bg-black rounded-lg overflow-hidden relative min-h-[300px] md:min-h-[400px] remote-video-container" id="remote-container">
          {/* Video element will be created and attached dynamically */}
          {participants.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div>Waiting for other participant to join...</div>
            </div>
          )}
        </div>
        
        {/* Self view - local participant */}
        <div className="h-[150px] md:h-auto md:w-1/4 bg-black rounded-lg overflow-hidden relative min-h-[150px] min-w-[200px] local-video-container" id="local-container">
          {/* Video element will be created and attached dynamically */}
          {!localTracks.some(track => track.kind === 'video') && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div>Camera not available</div>
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