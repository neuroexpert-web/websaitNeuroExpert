import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AnimatedGradientBackground from './AnimatedGradientBackground';
import { videoUtils } from '../utils/videoUtils';

const GlobalVideoBackground = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(true);
  const videoRef = useRef(null);

  // Determine device type for source selection
  useEffect(() => {
    const detectMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          )
      );
    };

    detectMobile();
    window.addEventListener('resize', detectMobile);

    return () => window.removeEventListener('resize', detectMobile);
  }, []);

  // Skip loading on very slow connections or when data saver is enabled
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const { effectiveType, saveData } = navigator.connection;
      if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
        setShouldLoad(false);
      }
    }
  }, []);

  const videoSources = useMemo(
    () => videoUtils.getOptimalVideoSource(isMobile),
    [isMobile]
  );

  const handleVideoError = useCallback((errorEvent) => {
    console.error('Video loading error:', errorEvent);
    setVideoError(true);
    setVideoLoaded(false);
  }, []);

  const handleVideoStalled = useCallback(() => {
    console.warn('Video playback stalled');
    setTimeout(() => {
      const video = videoRef.current;
      if (video && video.readyState < 2) {
        setVideoError(true);
        setVideoLoaded(false);
      }
    }, 3000);
  }, []);

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !shouldLoad || videoError) {
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
        setAutoplayBlocked(true);
      } else {
        console.error('Video playback error:', error);
        setVideoError(true);
        setVideoLoaded(false);
      }
    }
  }, [shouldLoad, videoError]);

  useEffect(() => {
    if (!shouldLoad || videoError || autoplayBlocked) {
      return;
    }

    attemptPlay();
  }, [attemptPlay, autoplayBlocked, shouldLoad, videoError, videoLoaded]);

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

  const hasSources = videoSources.length > 0;
  const shouldRenderVideo = shouldLoad && !videoError && hasSources;
  const showFallback = !shouldRenderVideo || !videoLoaded || autoplayBlocked;

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden bg-[#0b0f17] z-0"
      aria-hidden="true"
    >
      {shouldRenderVideo && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded && !autoplayBlocked ? 'opacity-80' : 'opacity-0'
          }`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/video-poster.svg"
          crossOrigin="anonymous"
          onLoadedData={() => setVideoLoaded(true)}
          onPlaying={() => setAutoplayBlocked(false)}
          onError={handleVideoError}
          onStalled={handleVideoStalled}
          onSuspend={handleVideoStalled}
          onAbort={handleVideoError}
        >
          {videoSources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
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
            Воспроизвести фон
          </button>
        </div>
      )}
    </div>
  );
};

export default GlobalVideoBackground;
