import React, { useState, useEffect } from 'react';

const GlobalVideoBackground = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't load video on very slow connections
  const shouldLoadVideo = () => {
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return false;
      }
    }
    return true;
  };

  if (!shouldLoadVideo()) {
    // Show static gradient for very slow connections
    return (
      <div className="fixed inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-[#0b0f17] via-[#1a1f2e] to-[#0b0f17] z-0" />
    );
  }

  return (
    <>
      {/* Global Fixed Video Background */}
      <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#0b0f17] z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoLoaded(true)}
          style={{
            transform: 'scale(1.05)',
            objectPosition: 'center center'
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Use MP4 for mobile (smaller), WebM for desktop */}
          {isMobile ? (
            <>
              <source src="https://customer-assets.emergentagent.com/job_tech-consult-pro-2/artifacts/tc8zafjv_11.webm" type="video/webm" />
            </>
) : null}}
        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/60 via-[#0b0f17]/40 to-[#0b0f17]/60" />
      </div>
    </>
  );
};

export default GlobalVideoBackground;
