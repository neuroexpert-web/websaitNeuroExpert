import React, { useState, useEffect, useRef, useCallback } from 'react';
import { videoUtils } from '../utils/videoUtils';

const VideoBackground = ({ onVideoLoad }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef(null);
  const observerRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if we should load video based on connection and device
  const checkVideoLoadConditions = useCallback(async () => {
    // Check network conditions
    const networkCondition = videoUtils.getNetworkCondition();
    if (networkCondition === 'data-saver' || networkCondition === 'slow') {
      return false;
    }

    // Check for low power mode (iOS)
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        if (battery.level < 0.2 && !battery.charging) {
          return false;
        }
      } catch (error) {
        // Battery API might be denied, continue with video
        console.warn('Battery API not available:', error);
      }
    }

    return true;
  }, []);

  // Handle video loading states
  const handleVideoLoad = useCallback(() => {
    setVideoLoaded(true);
    setVideoError(false);
    if (onVideoLoad) {
      onVideoLoad();
    }
  }, [onVideoLoad]);

  const handleVideoError = useCallback((e) => {
    console.error('Video loading error:', e);
    setVideoError(true);
    setVideoLoaded(false);
  }, []);

  const handleVideoStalled = useCallback(() => {
    console.warn('Video playback stalled');
    // Give it a moment to recover before showing error
    setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState < 2) {
        setVideoError(true);
      }
    }, 3000);
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    const videoElement = videoRef.current;
    if (videoElement) {
      observerRef.current.observe(videoElement);
    }

    return () => {
      if (observerRef.current && videoElement) {
        observerRef.current.unobserve(videoElement);
      }
    };
  }, []);

  // Check video load conditions on mount
  useEffect(() => {
    const checkConditions = async () => {
      const shouldLoad = await checkVideoLoadConditions();
      setShouldLoadVideo(shouldLoad);
    };
    
    checkConditions();
  }, [checkVideoLoadConditions]);

  // Attempt to play video when ready
  useEffect(() => {
    if (videoRef.current && isIntersecting && shouldLoadVideo && !videoError) {
      const video = videoRef.current;
      
      const attemptPlay = async () => {
        try {
          // Start loading the video
          if (video.readyState === 0) {
            video.load();
          }
          
          // Try to play
          await video.play();
        } catch (error) {
          console.warn('Autoplay prevented, showing fallback:', error);
          setVideoError(true);
        }
      };

      // Wait a bit for the video to be ready
      const timer = setTimeout(attemptPlay, 100);
      return () => clearTimeout(timer);
    }
  }, [isIntersecting, shouldLoadVideo, videoError]);

  // Fallback gradient background
  const renderFallback = () => (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0b0f17]">
      {/* Premium animated gradient background - agency quality */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#1a1f2e] to-[#0b0f17]" />
      
      {/* Animated gradient layer 1 - Cyan */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 30% 40%, rgba(125, 211, 252, 0.25) 0%, transparent 60%)',
          animation: 'float1 18s ease-in-out infinite'
        }}
      />
      
      {/* Animated gradient layer 2 - Purple */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          background: 'radial-gradient(ellipse at 70% 70%, rgba(118, 75, 162, 0.3) 0%, transparent 55%)',
          animation: 'float2 20s ease-in-out infinite'
        }}
      />
      
      {/* Animated gradient layer 3 - Blue accent */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
          animation: 'float3 22s ease-in-out infinite'
        }}
      />
      
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }}
      />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-[#0b0f17]/50 opacity-60" />
      
      {/* CSS animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { 
            transform: translate(0%, 0%) scale(1);
            opacity: 0.3;
          }
          33% { 
            transform: translate(-15%, 15%) scale(1.15);
            opacity: 0.35;
          }
          66% { 
            transform: translate(10%, -10%) scale(0.95);
            opacity: 0.25;
          }
        }
        
        @keyframes float2 {
          0%, 100% { 
            transform: translate(0%, 0%) scale(1);
            opacity: 0.25;
          }
          33% { 
            transform: translate(12%, -12%) scale(1.1);
            opacity: 0.3;
          }
          66% { 
            transform: translate(-8%, 8%) scale(0.9);
            opacity: 0.2;
          }
        }
        
        @keyframes float3 {
          0%, 100% { 
            transform: translate(0%, 0%) scale(1) rotate(0deg);
            opacity: 0.2;
          }
          50% { 
            transform: translate(-5%, 5%) scale(1.2) rotate(5deg);
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  );

  // Don't render video if conditions aren't met
  if (!shouldLoadVideo || videoError) {
    return renderFallback();
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0b0f17]">
      {/* Video element with proper attributes */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        poster="/video-poster.svg"
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        onStalled={handleVideoStalled}
        onSuspend={handleVideoStalled}
        onAbort={handleVideoError}
        style={{
          transform: 'scale(1.05)',
          objectPosition: 'center center',
          opacity: videoLoaded ? 0.8 : 0
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          videoLoaded ? 'opacity-80' : 'opacity-0'
        }`}
      >
        {/* Optimized video sources based on browser support and device */}
        {videoUtils.getOptimalVideoSource(isMobile).map((source, index) => (
          <source key={index} src={source.src} type={source.type} />
        ))}
        
        {/* Fallback message */}
        Your browser does not support the video tag.
      </video>

      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/70 via-[#0b0f17]/50 to-[#0b0f17]/70" />
      
      {/* Fallback overlay while video loads or if it fails */}
      {!videoLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#1a1f2e] to-[#0b0f17] transition-opacity duration-500" />
      )}
    </div>
  );
};

export default VideoBackground;
