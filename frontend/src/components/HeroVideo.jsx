import { useState, useEffect, useRef } from 'react';

const HeroVideo = () => {
  const [showFallback, setShowFallback] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = () => setShowFallback(true);
    video.addEventListener('error', handleError);

    // Попытка автоплея
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => setShowFallback(true));
    }

    return () => video.removeEventListener('error', handleError);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {!showFallback ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          poster="/video-poster.svg"
          playsInline
          autoPlay
          muted
          loop
          preload="metadata"
        >
          <source src="/background.webm" type="video/webm" />
          <source src="/background.mp4" type="video/mp4" />
        </video>
      ) : (
        <img
          src="/video-poster.svg"
          alt="Hero background"
          className="w-full h-full object-cover"
          loading="eager"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
    </div>
  );
};

export default HeroVideo;
