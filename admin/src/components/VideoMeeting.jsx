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
        
        // Create local video and audio tracks with explicit device IDs
        console.log("Creating local tracks...");
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("Available devices:", devices);
        
        const localTracks = await Video.createLocalTracks({
          audio: { 
            noiseSuppression: true,
            echoCancellation: true 
          },
          video: videoConstraints
        });
        console.log("Local tracks created:", localTracks);
        
        setLocalTracks(localTracks);
        
        // Enhanced ICE servers configuration for better NAT traversal
        const iceServers = [
          { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
          { urls: 'turn:global.turn.twilio.com:3478?transport=udp', username: 'token', credential: data.token },
          { urls: 'turn:global.turn.twilio.com:3478?transport=tcp', username: 'token', credential: data.token },
          { urls: 'turn:global.turn.twilio.com:443?transport=tcp', username: 'token', credential: data.token }
        ];
        
        // Connect to the room with optimized settings
        console.log("Connecting to room:", data.roomName);
        const room = await Video.connect(data.token, {
          name: data.roomName,
          tracks: localTracks,
          networkQuality: {
            local: 3, // Increase from 1 to 3 for better quality monitoring
            remote: 3  // Increase from 1 to 3 for better quality monitoring
          },
          bandwidthProfile: bandwidthProfileOptions,
          preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
          maxAudioBitrate: 16000, // Optimize audio bitrate
          dominantSpeaker: true,
          automaticSubscription: true, // Ensure this is true for automatic track subscription
          // Add these options for better connection in hosted environments
          enableDscp: true, // Enable QoS packet marking
          maxVideoBitrate: 2500000, // 2.5 Mbps max for video
          iceTransportPolicy: 'all', // Allow all ICE candidates
          iceServers: iceServers, // Use enhanced ICE servers configuration
          // Add these options for better connection reliability
          reconnectionAttempts: 5,
          reconnectionBackOff: 1.1,
          enableIceRestart: true,
          // Add these options for better media handling
          preferredAudioCodecs: [{ codec: 'opus' }],
          maxAudioBitrate: 24000,
          audioAcquisitionOptimization: 'voice'
        });
        console.log("Connected to room:", room);
        
        // Log the ICE connection state
        const pc = room._signaling._peerConnectionManager._peerConnections.values().next().value;
        if (pc) {
          console.log(`Initial ICE connection state: ${pc.iceConnectionState}`);
          
          // Add event listener for ICE connection state changes
          pc.addEventListener('iceconnectionstatechange', () => {
            console.log(`ICE connection state changed to: ${pc.iceConnectionState}`);
            
            // If the connection fails, try to restart ICE
            if (pc.iceConnectionState === 'failed') {
              console.log("ICE connection failed, attempting to restart");
              try {
                pc.restartIce();
                console.log("ICE restart initiated");
              } catch (error) {
                console.error("Error restarting ICE:", error);
              }
            }
          });
        }
        
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
          
          // Force recovery of all tracks after reconnection
          setTimeout(() => {
            room.participants.forEach(participant => {
              forceRemoteVideoRecovery(participant);
              forceRemoteAudioRecovery(participant);
            });
          }, 2000);
        });
        
        // Add a listener for track publication
        room.localParticipant.on('trackPublished', publication => {
          console.log(`Local track ${publication.trackName} was successfully published`);
        });
        
        // Add a listener for track publication failed
        room.localParticipant.on('trackPublicationFailed', (error, track) => {
          console.error(`Local track ${track.kind} publication failed:`, error);
          // Try to republish the track
          setTimeout(async () => {
            try {
              console.log(`Attempting to republish ${track.kind} track`);
              await room.localParticipant.publishTrack(track);
              console.log(`Successfully republished ${track.kind} track`);
            } catch (err) {
              console.error(`Failed to republish ${track.kind} track:`, err);
            }
          }, 3000);
        });
        
        setLoading(false);
        
        // Force a check for all participants after a delay
        setTimeout(() => {
          room.participants.forEach(participant => {
            forceRemoteVideoRecovery(participant);
            forceRemoteAudioRecovery(participant);
          });
        }, 5000);
        
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
      
      // Force subscription to all tracks
      if (!publication.isSubscribed && publication.track) {
        console.log(`Force subscribing to track: ${publication.trackName}`);
        handleTrackSubscribed(publication.track, participant);
      }
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
      // Try to recover from subscription failure
      setTimeout(() => {
        console.log(`Attempting to recover from subscription failure for ${track.kind}`);
        if (track.kind === 'video') {
          forceRemoteVideoRecovery(participant);
        } else if (track.kind === 'audio') {
          forceRemoteAudioRecovery(participant);
        }
      }, 2000);
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
      handleTrackUnsubscribed(track);
      
      // Try to resubscribe after a short delay
      setTimeout(() => {
        console.log(`Attempting to resubscribe to ${track.kind} track from ${participant.identity}`);
        if (track.kind === 'video') {
          forceRemoteVideoRecovery(participant);
        } else if (track.kind === 'audio') {
          forceRemoteAudioRecovery(participant);
        }
      }, 2000);
    });
    
    // Force initial recovery attempt for all participants
    setTimeout(() => {
      forceRemoteVideoRecovery(participant);
      forceRemoteAudioRecovery(participant);
    }, 3000);
  };
  
  // Handle when a participant disconnects
  const handleParticipantDisconnected = (participant) => {
    console.log("Participant disconnected, removing from state:", participant.identity);
    setParticipants(prevParticipants => 
      prevParticipants.filter(p => p !== participant)
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
        
        // Apply different constraints based on screen size
        if (window.innerWidth < 768) {
          // On mobile, use lower resolution
          track.mediaStreamTrack.applyConstraints({
            width: { ideal: 320, max: 640 },
            height: { ideal: 240, max: 480 },
            frameRate: { ideal: 15, max: 24 }
          }).catch(e => console.error('Failed to apply constraints:', e));
        } else {
          // On larger screens, use higher resolution
          track.mediaStreamTrack.applyConstraints({
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 24, max: 30 }
          }).catch(e => console.error('Failed to apply constraints:', e));
        }
        
        // Ensure video is visible
        element.style.display = 'block';
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
      
      // For larger screens, use a more direct approach
      if (window.innerWidth >= 768) {
        console.log("Using direct approach for larger screens");
        
        try {
          // First try to find existing element
          const remoteContainer = document.querySelector('.remote-video-container');
          if (!remoteContainer) {
            console.error("Could not find remote container");
            return;
          }
          
          // Remove any existing video elements to avoid duplicates
          const existingVideos = remoteContainer.querySelectorAll('video');
          existingVideos.forEach(video => {
            try {
              // Only remove videos that aren't attached to this track
              const attachedElements = track.detachElements();
              const isAttached = Array.from(attachedElements).some(el => el === video);
              if (!isAttached) {
                video.remove();
              }
            } catch (e) {
              console.error("Error removing existing video:", e);
            }
          });
          
          // Create a new video element
          const videoElement = document.createElement('video');
          videoElement.id = 'remote-video';
          videoElement.autoPlay = true;
          videoElement.playsInline = true;
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'cover';
          videoElement.style.position = 'absolute';
          videoElement.style.top = '0';
          videoElement.style.left = '0';
          videoElement.style.zIndex = '1';
          videoElement.style.display = 'block';
          
          // Append to container
          remoteContainer.appendChild(videoElement);
          
          // Detach track from any existing elements
          track.detach().forEach(el => el.remove());
          
          // Attach to our new element
          track.attach(videoElement);
          
          // Update ref
          remoteVideoRef.current = videoElement;
          
          console.log("Successfully attached remote video track for large screen");
          return;
        } catch (error) {
          console.error("Error with direct approach for large screen:", error);
          // Fall back to the regular approach
        }
      }
      
      // Function to attach video track with retry and multiple fallbacks
      const attachVideoTrack = (retryCount = 0) => {
        // Try ref-based attachment first
        if (remoteVideoRef.current) {
          console.log("remoteVideoRef is available, attaching video track");
          if (optimizeTrackAttachment(track, remoteVideoRef.current)) {
            console.log("Remote video track attached successfully via ref");
            return true;
          }
        }
        
        // Try direct DOM query by ID
        try {
          const remoteVideo = document.getElementById('remote-video');
          if (remoteVideo) {
            console.log("Found remote-video by ID, attaching track");
            
            // For large screens, ensure proper sizing
            if (window.innerWidth >= 768) {
              remoteVideo.style.width = '100%';
              remoteVideo.style.height = '100%';
              remoteVideo.style.objectFit = 'cover';
            }
            
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
          const remoteContainer = document.querySelector('.remote-video-container');
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
            
            // For large screens, ensure proper sizing
            if (window.innerWidth >= 768) {
              videoElement.style.width = '100%';
              videoElement.style.height = '100%';
              videoElement.style.objectFit = 'cover';
            }
            
            if (optimizeTrackAttachment(track, videoElement)) {
              console.log("Remote video track attached successfully via container query");
              
              // Update the ref if possible
              remoteVideoRef.current = videoElement;
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
        if (remoteAudioRef.current) {
          console.log("remoteAudioRef is available, attaching audio track");
          if (optimizeTrackAttachment(track, remoteAudioRef.current)) {
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
          const remoteContainer = document.querySelector('.remote-video-container');
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
              remoteAudioRef.current = audioElement;
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
  
  // Add a function to force track publication
  const forceTrackPublication = async () => {
    if (!room || !room.localParticipant) return;
    
    console.log("Forcing track publication for local participant");
    
    // Get all local tracks
    const tracks = Array.from(room.localParticipant.tracks.values());
    
    // Check if any tracks are not published
    const unpublishedTracks = tracks.filter(publication => !publication.isTrackEnabled);
    
    if (unpublishedTracks.length > 0) {
      console.log(`Found ${unpublishedTracks.length} unpublished tracks, attempting to republish`);
      
      for (const publication of unpublishedTracks) {
        try {
          // Unpublish and republish the track
          console.log(`Republishing track: ${publication.trackName}`);
          await room.localParticipant.unpublishTrack(publication.track);
          await room.localParticipant.publishTrack(publication.track);
          console.log(`Successfully republished track: ${publication.trackName}`);
        } catch (error) {
          console.error(`Error republishing track ${publication.trackName}:`, error);
        }
      }
    } else {
      console.log("All local tracks are published");
      
      // Force republish all tracks anyway to ensure they're properly published
      for (const publication of tracks) {
        try {
          const track = publication.track;
          if (track) {
            console.log(`Force republishing track: ${publication.trackName}`);
            await room.localParticipant.unpublishTrack(track);
            await room.localParticipant.publishTrack(track);
            console.log(`Successfully force republished track: ${publication.trackName}`);
          }
        } catch (error) {
          console.error(`Error force republishing track ${publication.trackName}:`, error);
        }
      }
    }
  };

  // Add a function to check and fix network issues
  const checkAndFixNetworkIssues = async () => {
    if (!room) return;
    
    console.log("Checking network status");
    
    // Check if we have any participants
    if (room.participants.size === 0) {
      console.log("No remote participants found, skipping network check");
      return;
    }
    
    // Check if we have any remote tracks
    let hasRemoteTracks = false;
    room.participants.forEach(participant => {
      participant.tracks.forEach(publication => {
        if (publication.isSubscribed) {
          hasRemoteTracks = true;
        }
      });
    });
    
    if (!hasRemoteTracks) {
      console.log("No remote tracks found, attempting to fix");
      
      // Force track publication
      await forceTrackPublication();
      
      // Force recovery for all participants
      room.participants.forEach(participant => {
        forceRemoteVideoRecovery(participant);
        forceRemoteAudioRecovery(participant);
      });
      
      // Check ICE connection
      checkAndFixIceConnection();
    } else {
      console.log("Remote tracks found, network appears to be working");
    }
  };

  // Add a periodic check for network issues
  useEffect(() => {
    if (room) {
      console.log("Setting up periodic network check");
      
      const checkInterval = setInterval(() => {
        checkAndFixNetworkIssues();
      }, 15000); // Check every 15 seconds
      
      return () => clearInterval(checkInterval);
    }
  }, [room]);

  // Add a more aggressive approach to ensure video elements are visible
  const ensureVideoElementsExist = () => {
    console.log("Ensuring video elements exist and are visible");
    
    // Check for local video container
    const localContainer = document.querySelector('.local-video-container');
    if (!localContainer) {
      console.error("Local video container not found");
      return;
    }
    
    // Check for remote video container
    const remoteContainer = document.querySelector('.remote-video-container');
    if (!remoteContainer) {
      console.error("Remote video container not found");
      return;
    }
    
    // Ensure local video element exists
    let localVideo = document.getElementById('local-video');
    if (!localVideo) {
      console.log("Creating local video element");
      localVideo = document.createElement('video');
      localVideo.id = 'local-video';
      localVideo.autoPlay = true;
      localVideo.playsInline = true;
      localVideo.muted = true;
      localVideo.className = "w-full h-full object-cover absolute inset-0";
      localVideo.style.width = '100%';
      localVideo.style.height = '100%';
      localVideo.style.objectFit = 'cover';
      localVideo.style.position = 'absolute';
      localVideo.style.top = '0';
      localVideo.style.left = '0';
      localVideo.style.zIndex = '1';
      localVideo.style.display = 'block';
      localContainer.appendChild(localVideo);
      videoRef.current = localVideo;
      
      // Attach local video track if available
      if (localTracks.length > 0) {
        const videoTrack = localTracks.find(track => track.kind === 'video');
        if (videoTrack) {
          console.log("Attaching local video track to newly created element");
          try {
            videoTrack.detach().forEach(el => el.remove());
            videoTrack.attach(localVideo);
          } catch (error) {
            console.error("Error attaching local video track:", error);
          }
        }
      }
    }
    
    // Ensure remote video element exists
    let remoteVideo = document.getElementById('remote-video');
    if (!remoteVideo) {
      console.log("Creating remote video element");
      remoteVideo = document.createElement('video');
      remoteVideo.id = 'remote-video';
      remoteVideo.autoPlay = true;
      remoteVideo.playsInline = true;
      remoteVideo.className = "w-full h-full object-cover absolute inset-0";
      remoteVideo.style.width = '100%';
      remoteVideo.style.height = '100%';
      remoteVideo.style.objectFit = 'cover';
      remoteVideo.style.position = 'absolute';
      remoteVideo.style.top = '0';
      remoteVideo.style.left = '0';
      remoteVideo.style.zIndex = '1';
      remoteVideo.style.display = 'block';
      remoteContainer.appendChild(remoteVideo);
      remoteVideoRef.current = remoteVideo;
    }
    
    // Ensure remote audio element exists
    let remoteAudio = document.getElementById('remote-audio');
    if (!remoteAudio) {
      console.log("Creating remote audio element");
      remoteAudio = document.createElement('audio');
      remoteAudio.id = 'remote-audio';
      remoteAudio.autoPlay = true;
      remoteContainer.appendChild(remoteAudio);
      remoteAudioRef.current = remoteAudio;
    }
    
    // Attach remote tracks if available
    if (room && room.participants.size > 0) {
      room.participants.forEach(participant => {
        participant.tracks.forEach(publication => {
          if (publication.isSubscribed && publication.track) {
            const track = publication.track;
            if (track.kind === 'video' && remoteVideo) {
              console.log(`Attaching remote video track from ${participant.identity} to newly created element`);
              try {
                track.detach().forEach(el => el.remove());
                track.attach(remoteVideo);
              } catch (error) {
                console.error("Error attaching remote video track:", error);
              }
            } else if (track.kind === 'audio' && remoteAudio) {
              console.log(`Attaching remote audio track from ${participant.identity} to newly created element`);
              try {
                track.detach().forEach(el => el.remove());
                track.attach(remoteAudio);
              } catch (error) {
                console.error("Error attaching remote audio track:", error);
              }
            }
          }
        });
      });
    }
  };

  // Add a useEffect to ensure video elements exist
  useEffect(() => {
    if (componentMounted) {
      console.log("Setting up periodic check for video elements");
      
      // Initial check
      ensureVideoElementsExist();
      
      // Set up interval to periodically check
      const checkInterval = setInterval(() => {
        ensureVideoElementsExist();
      }, 3000); // Check every 3 seconds
      
      return () => clearInterval(checkInterval);
    }
  }, [componentMounted, localTracks, room]);

  // Function to force remote video recovery
  const forceRemoteVideoRecovery = (participant) => {
    console.log(`Forcing remote video recovery for ${participant.identity}`);
    
    participant.tracks.forEach(publication => {
      if (publication.trackName.includes('video')) {
        if (publication.isSubscribed && publication.track) {
          console.log(`Found subscribed video track from ${participant.identity}, re-attaching`);
          const track = publication.track;
          
          // For larger screens, use a more direct approach
          if (window.innerWidth >= 768) {
            console.log("Using direct approach for larger screens in recovery");
            
            try {
              // First try to find existing element
              const remoteContainer = document.querySelector('.remote-video-container');
              if (!remoteContainer) {
                console.error("Could not find remote container");
                return;
              }
              
              // Create a new video element
              const videoElement = document.createElement('video');
              videoElement.id = 'remote-video';
              videoElement.autoPlay = true;
              videoElement.playsInline = true;
              videoElement.style.width = '100%';
              videoElement.style.height = '100%';
              videoElement.style.objectFit = 'cover';
              videoElement.style.position = 'absolute';
              videoElement.style.top = '0';
              videoElement.style.left = '0';
              videoElement.style.zIndex = '1';
              videoElement.style.display = 'block';
              
              // Remove any existing video elements
              const existingVideos = remoteContainer.querySelectorAll('video');
              existingVideos.forEach(video => video.remove());
              
              // Append to container
              remoteContainer.appendChild(videoElement);
              
              // Detach track from any existing elements
              track.detach().forEach(el => el.remove());
              
              // Attach to our new element
              track.attach(videoElement);
              
              // Update ref
              remoteVideoRef.current = videoElement;
              
              console.log("Successfully attached remote video track in recovery");
            } catch (error) {
              console.error("Error with direct approach for recovery:", error);
            }
          } else {
            // For mobile screens
            try {
              const remoteVideo = document.getElementById('remote-video');
              if (remoteVideo) {
                track.detach().forEach(el => el.remove());
                track.attach(remoteVideo);
                console.log("Successfully re-attached remote video track on mobile");
              } else {
                console.error("Could not find remote video element for recovery");
              }
            } catch (error) {
              console.error("Error re-attaching remote video track:", error);
            }
          }
        } else {
          console.log(`Video track from ${participant.identity} is not subscribed, cannot recover`);
        }
      });
    });
  };

  // Function to force remote audio recovery
  const forceRemoteAudioRecovery = (participant) => {
    console.log(`Forcing remote audio recovery for ${participant.identity}`);
    
    participant.tracks.forEach(publication => {
      if (publication.trackName.includes('audio')) {
        if (publication.isSubscribed && publication.track) {
          console.log(`Found subscribed audio track from ${participant.identity}, re-attaching`);
          const track = publication.track;
          
          try {
            const remoteAudio = document.getElementById('remote-audio');
            if (remoteAudio) {
              track.detach().forEach(el => el.remove());
              track.attach(remoteAudio);
              console.log("Successfully re-attached remote audio track");
            } else {
              // Create new audio element if not found
              const remoteContainer = document.querySelector('.remote-video-container');
              if (remoteContainer) {
                const audioElement = document.createElement('audio');
                audioElement.id = 'remote-audio';
                audioElement.autoPlay = true;
                
                // Remove any existing audio elements
                const existingAudios = remoteContainer.querySelectorAll('audio');
                existingAudios.forEach(audio => audio.remove());
                
                remoteContainer.appendChild(audioElement);
                track.attach(audioElement);
                remoteAudioRef.current = audioElement;
                console.log("Created and attached to new audio element");
              }
            }
          } catch (error) {
            console.error("Error re-attaching remote audio track:", error);
          }
        } else {
          console.log(`Audio track from ${participant.identity} is not subscribed, cannot recover`);
        }
      }
    });
  };

  // Add a more aggressive periodic check for remote tracks
  useEffect(() => {
    if (participants.length > 0 && room) {
      console.log("Setting up aggressive periodic check for remote tracks");
      
      const checkInterval = setInterval(() => {
        console.log("Running aggressive check for remote tracks");
        
        participants.forEach(participant => {
          forceRemoteVideoRecovery(participant);
          forceRemoteAudioRecovery(participant);
        });
        
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(checkInterval);
    }
  }, [participants, room]);

  // Add a function to check and fix ICE connection issues
  const checkAndFixIceConnection = () => {
    if (!room) return;
    
    console.log("Checking ICE connection status");
    
    // Check the state of the Peer Connection
    const pc = room._signaling._peerConnectionManager._peerConnections.values().next().value;
    if (pc) {
      const iceConnectionState = pc.iceConnectionState;
      console.log(`Current ICE connection state: ${iceConnectionState}`);
      
      // If the connection is in a problematic state, try to fix it
      if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected') {
        console.log("ICE connection is in a problematic state, attempting to fix");
        
        // Try to restart ICE
        try {
          pc.restartIce();
          console.log("ICE restart initiated");
        } catch (error) {
          console.error("Error restarting ICE:", error);
        }
        
        // Force reconnection after a short delay if still in a bad state
        setTimeout(() => {
          if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
            console.log("ICE connection still problematic, forcing reconnection");
            
            // Disconnect and reconnect to the room
            if (room) {
              const roomName = room.name;
              const token = room.localParticipant._signaling._token;
              
              console.log("Disconnecting from room to force reconnection");
              room.disconnect();
              
              // Reconnect after a short delay
              setTimeout(async () => {
                try {
                  console.log("Attempting to reconnect to room");
                  const Video = await import('twilio-video');
                  const newRoom = await Video.connect(token, {
                    name: roomName,
                    tracks: localTracks,
                    networkQuality: { local: 3, remote: 3 },
                    enableDscp: true,
                    iceTransportPolicy: 'all',
                    iceServers: [
                      { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
                      { urls: 'turn:global.turn.twilio.com:3478?transport=udp', username: 'token', credential: token },
                      { urls: 'turn:global.turn.twilio.com:3478?transport=tcp', username: 'token', credential: token },
                      { urls: 'turn:global.turn.twilio.com:443?transport=tcp', username: 'token', credential: token }
                    ]
                  });
                  
                  setRoom(newRoom);
                  console.log("Successfully reconnected to room");
                  
                  // Re-handle participants
                  newRoom.participants.forEach(participant => {
                    handleParticipantConnected(participant);
                  });
                } catch (error) {
                  console.error("Error reconnecting to room:", error);
                  setError("Connection lost. Please try rejoining the meeting.");
                  toast.error("Connection lost. Please try rejoining the meeting.");
                }
              }, 2000);
            }
          }
        }, 5000);
      }
    }
  };

  // Add a periodic check for ICE connection issues
  useEffect(() => {
    if (room) {
      console.log("Setting up periodic ICE connection check");
      
      const checkInterval = setInterval(() => {
        checkAndFixIceConnection();
      }, 10000); // Check every 10 seconds
      
      return () => clearInterval(checkInterval);
    }
  }, [room]);

  // Add a function to force reconnection if no remote tracks are received
  const forceReconnectionIfNeeded = () => {
    if (!room || !room.localParticipant) return;
    
    console.log("Checking if reconnection is needed");
    
    // Check if we have any participants
    if (room.participants.size === 0) {
      console.log("No remote participants found, skipping reconnection check");
      return;
    }
    
    // Check if we have any remote tracks
    let hasRemoteTracks = false;
    room.participants.forEach(participant => {
      participant.tracks.forEach(publication => {
        if (publication.isSubscribed) {
          hasRemoteTracks = true;
        }
      });
    });
    
    if (!hasRemoteTracks) {
      console.log("No remote tracks found after 30 seconds, forcing reconnection");
      
      // Disconnect and reconnect to the room
      const roomName = room.name;
      const token = room.localParticipant._signaling._token;
      
      console.log("Disconnecting from room to force reconnection");
      room.disconnect();
      
      // Reconnect after a short delay
      setTimeout(async () => {
        try {
          console.log("Attempting to reconnect to room");
          const Video = await import('twilio-video');
          const newRoom = await Video.connect(token, {
            name: roomName,
            tracks: localTracks,
            networkQuality: { local: 3, remote: 3 },
            enableDscp: true,
            iceTransportPolicy: 'all',
            iceServers: [
              { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
              { urls: 'turn:global.turn.twilio.com:3478?transport=udp', username: 'token', credential: token },
              { urls: 'turn:global.turn.twilio.com:3478?transport=tcp', username: 'token', credential: token },
              { urls: 'turn:global.turn.twilio.com:443?transport=tcp', username: 'token', credential: token }
            ],
            reconnectionAttempts: 5,
            enableIceRestart: true
          });
          
          setRoom(newRoom);
          console.log("Successfully reconnected to room");
          
          // Re-handle participants
          newRoom.participants.forEach(participant => {
            handleParticipantConnected(participant);
          });
          
          // Force recovery after reconnection
          setTimeout(() => {
            newRoom.participants.forEach(participant => {
              forceRemoteVideoRecovery(participant);
              forceRemoteAudioRecovery(participant);
            });
          }, 2000);
        } catch (error) {
          console.error("Error reconnecting to room:", error);
          setError("Connection lost. Please try rejoining the meeting.");
          toast.error("Connection lost. Please try rejoining the meeting.");
        }
      }, 2000);
    } else {
      console.log("Remote tracks found, reconnection not needed");
    }
  };

  // Add a one-time check for reconnection after 30 seconds
  useEffect(() => {
    if (room && room.participants.size > 0) {
      console.log("Setting up one-time reconnection check after 30 seconds");
      
      const timeoutId = setTimeout(() => {
        forceReconnectionIfNeeded();
      }, 30000); // Check after 30 seconds
      
      return () => clearTimeout(timeoutId);
    }
  }, [room]);
  
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