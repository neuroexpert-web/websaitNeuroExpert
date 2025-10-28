import React, { useState } from 'react';

const GlobalVideoBackground = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

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

  // Handle video loading error
  const handleVideoError = (e) => {
    console.error('Video loading error:', e);
    setVideoError(true);
  };

  if (!shouldLoadVideo() || videoError) {
    // Premium animated gradient background - agency quality
    return (
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0">
        {/* Base dark gradient */}
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
  }

  return (
    <>
      {/* Optimized Cloudinary Video Background */}
      <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#0b0f17] z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoLoaded(true)}
          onError={handleVideoError}
          style={{
            transform: 'scale(1.05)',
            objectPosition: 'center center'
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-80' : 'opacity-0'
          }`}
        >
          {/* Cloudinary optimized video - automatically chooses best format and quality */}
          <source src="https://res.cloudinary.com/dpxuancbn/video/upload/f_auto,q_auto,w_1280,h_720/000e54de.mp4" type="video/mp4" />
          <source src="https://res.cloudinary.com/dpxuancbn/video/upload/f_auto,q_auto,w_1280,h_720/000e54de.webm" type="video/webm" />
        </video>

        {/* Enhanced overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/70 via-[#0b0f17]/50 to-[#0b0f17]/70" />
      </div>
    </>
  );
};

export default GlobalVideoBackground;
