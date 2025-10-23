import React, { useState, useEffect } from 'react';

const GlobalVideoBackground = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
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
    // Temporarily disable video due to browser compatibility issues
    // Will use gradient background instead
    return false;
    
    /* Original code:
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return false;
      }
    }
    return true;
    */
  };

  // Handle video loading error
  const handleVideoError = (e) => {
    console.error('Video loading error:', e);
    setVideoError(true);
  };

  if (!shouldLoadVideo() || videoError) {
    // Show static gradient for very slow connections or video errors
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
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
          onError={handleVideoError}
          style={{
            transform: 'scale(1.05)',
            objectPosition: 'center center'
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Optimized video with ASCII filename for better compatibility */}
          <source src="https://customer-assets.emergentagent.com/job_tech-consult-pro-2/artifacts/n4lspsre_AI_Neural_Network_Visualization_Generated.mp4" type="video/mp4" crossOrigin="anonymous" />
        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/60 via-[#0b0f17]/40 to-[#0b0f17]/60" />
      </div>
    </>
  );
};

export default GlobalVideoBackground;
