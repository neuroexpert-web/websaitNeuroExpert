import React, { useState, useEffect, useRef, useCallback } from 'react';
import { videoUtils } from '../utils/videoUtils';

/**
 * Видео фон с ленивой загрузкой, retry при автоплей-блокировке и устойчивой обработкой ошибок.
 *
 * Основные изменения:
 * - Наблюдаем wrapper (containerRef), чтобы IntersectionObserver всегда мог прикрепиться.
 * - Разделяем autoplayBlocked и videoError. Не переводим в videoError при блокировке автоплея.
 * - Обрабатываем AbortError / "removed from document" и делаем повторные попытки.
 * - Повторяем попытку play при первом клике/touchstart и при visibilitychange.
 */
const VideoBackground = ({ onVideoLoad }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false); // реальная ошибка загрузки
  const [autoplayBlocked, setAutoplayBlocked] = useState(false); // автоплей заблокирован
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check video load conditions (network, battery)
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

  useEffect(() => {
    let mounted = true;
    const checkConditions = async () => {
      const shouldLoad = await checkVideoLoadConditions();
      if (mounted) setShouldLoadVideo(shouldLoad);
    };
    checkConditions();
    return () => { mounted = false; };
  }, [checkVideoLoadConditions]);

  // IntersectionObserver: observe wrapper to ensure reliable attachment
  useEffect(() => {
    if (!containerRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

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

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current && containerRef.current) {
        observerRef.current.unobserve(containerRef.current);
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [containerRef.current]); // rerun when ref attaches

  // Play attempt with retry and AbortError handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isIntersecting || !shouldLoadVideo || videoError) return;

    let cancelled = false;
    let retries = 0;
    const maxRetries = 5;

    const attemptPlay = async () => {
      if (cancelled) return;
      try {
        if (video.readyState === 0) {
          video.load();
        }
        await video.play();
        setAutoplayBlocked(false);
      } catch (error) {
        console.warn('Play failed:', error);

        const name = error && error.name;
        const msg = error && error.message ? error.message : '';

        const isAbort = name === 'AbortError' || msg.includes('removed from the document');
        const isNotAllowed = name === 'NotAllowedError' || msg.toLowerCase().includes('play() was prevented') || msg.toLowerCase().includes('not allowed');

        // If element was temporarily removed (AbortError), retry shortly if still in DOM
        if (isAbort && retries < maxRetries && document.contains(video)) {
          retries += 1;
          setTimeout(attemptPlay, 200 + retries * 150);
          return;
        }

        // If autoplay was blocked by browser policy, mark and wait for user interaction or visibility
        if (isNotAllowed || isAbort) {
          console.info('Autoplay likely blocked; will retry on user interaction or visibility change.');
          setAutoplayBlocked(true);
          return;
        }

        // For network/CORS/other fatal errors, treat as real error
        setVideoError(true);
        console.error('Video loading error (fatal):', error);
      }
    };

    const timer = setTimeout(attemptPlay, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isIntersecting, shouldLoadVideo, videoError]);

  // Retry play on visibility change or first user interaction (to recover from autoplay block)
  useEffect(() => {
    if (!autoplayBlocked) return;

    const tryPlay = async () => {
      const v = videoRef.current;
      if (!v) return;
      try {
        await v.play();
        setAutoplayBlocked(false);
      } catch (err) {
        console.debug('Retry play failed:', err);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        tryPlay();
      }
    };

    const onUserInteract = () => {
      tryPlay();
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('click', onUserInteract, { once: true, passive: true });
    document.addEventListener('touchstart', onUserInteract, { once: true, passive: true });

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('click', onUserInteract);
      document.removeEventListener('touchstart', onUserInteract);
    };
  }, [autoplayBlocked]);

  // Handle video load / error / stall events
  const handleVideoLoad = useCallback(() => {
    setVideoLoaded(true);
    setVideoError(false);
    setAutoplayBlocked(false);
    if (onVideoLoad) onVideoLoad();
  }, [onVideoLoad]);

  const handleVideoError = useCallback((e) => {
    console.error('Video loading error (onError):', e);
    setVideoError(true);
  }, []);

  const handleVideoStalled = useCallback(() => {
    console.warn('Video playback stalled');
    setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState < 2) {
        setVideoError(true);
      }
    }, 3000);
  }, []);

  // Fallback rendering when we shouldn't load video or a real error occurred
  const renderFallback = () => (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden bg-[#0b0f17]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17] via-[#0b0f17]/60 to-[#0b0f17]" />
    </div>
  );

  if (!shouldLoadVideo || videoError) {
    return renderFallback();
  }

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden bg-[#0b0f17]">
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
        style={{ transform: 'scale(1.05)', objectPosition: 'center center' }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-80' : 'opacity-0'}`}
      >
        {videoUtils.getOptimalVideoSource(isMobile).map((source, index) => (
          <source key={index} src={source.src} type={source.type} />
        ))}
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/70 via-[#0b0f17]/50 to-[#0b0f17]/70" />

      {!videoLoaded && autoplayBlocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* можно разместить статичный элемент/иконку, но pointer-events-none чтобы не требовать клика */}
        </div>
      )}
    </div>
  );
};

export default VideoBackground;
