import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { videoUtils } from '../utils/videoUtils';
import AnimatedGradientBackground from './AnimatedGradientBackground';

const VideoBackground = ({ onVideoLoad }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef(null);

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
    const networkCondition = videoUtils.getNetworkCondition();
    if (networkCondition === 'data-saver' || networkCondition === 'slow') {
      return false;
    }

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        if (battery.level < 0.2 && !battery.charging) {
          return false;
        }
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }

    return true;
  }, []);

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
    setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState < 2) {
        setVideoError(true);
      }
    }, 3000);
  }, []);

  useEffect(() => {
    const checkConditions = async () => {
      const shouldLoad = await checkVideoLoadConditions();
      setShouldLoadVideo(shouldLoad);
    };
    
    checkConditions();
  }, [checkVideoLoadConditions]);

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !shouldLoadVideo || videoError) {
      return;
    }

    try {
      if (video.readyState === 0) {
        video.load();
      }
      await video.play();
      setAutoplayBlocked(false);
    } catch (error) {
      const message = error?.message || '';
      const blocked =
        error?.name === 'NotAllowedError' ||
        message.includes('The play() request was interrupted') ||
        message.includes('was blocked') ||
        message.includes('without user interaction');

      if (blocked) {
        console.warn('Autoplay prevented, user interaction required:', error);
        setAutoplayBlocked(true);
      } else {
        console.error('Video playback error:', error);
        setVideoError(true);
      }
    }
  }, [shouldLoadVideo, videoError]);

  useEffect(() => {
    if (!shouldLoadVideo || videoError || autoplayBlocked) {
      return;
    }

    attemptPlay();
  }, [attemptPlay, autoplayBlocked, shouldLoadVideo, videoError, videoLoaded]);

  const handleManualPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    try {
      await video.play();
      setAutoplayBlocked(false);
      setVideoError(false);
      setVideoLoaded(true);
    } catch (error) {
      console.error('Manual playback failed:', error);
    }
  }, []);

  const videoSources = useMemo(
    () => videoUtils.getOptimalVideoSource(isMobile),
    [isMobile]
  );

  const hasSources = videoSources.length > 0;
  const shouldRenderVideo = shouldLoadVideo && !videoError && hasSources;
  const showFallback = !shouldRenderVideo || !videoLoaded || autoplayBlocked;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0b0f17]">
      {shouldRenderVideo && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          poster="/video-poster.svg"
          onLoadedData={handleVideoLoad}
          onPlaying={() => setAutoplayBlocked(false)}
          onError={handleVideoError}
          onStalled={handleVideoStalled}
          onSuspend={handleVideoStalled}
          onAbort={handleVideoError}
          style={{
            transform: 'scale(1.05)',
            objectPosition: 'center center',
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded && !autoplayBlocked ? 'opacity-80' : 'opacity-0'
          }`}
        >
          {videoSources.map((source, index) => (
            <source key={index} src={source.src} type={source.type} />
          ))}
          
          Your browser does not support the video tag.
        </video>
      )}

      <AnimatedGradientBackground visible={showFallback} className="z-0" />

      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/70 via-[#0b0f17]/50 to-[#0b0f17]/70 pointer-events-none z-10" />
      
      {autoplayBlocked && shouldRenderVideo && (
        <div className="absolute bottom-6 right-6 z-20 px-4">
          <button
            type="button"
            onClick={handleManualPlay}
            className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            Воспроизвести видео
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoBackground;
