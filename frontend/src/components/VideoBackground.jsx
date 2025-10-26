import React from 'react';

const VideoBackground = () => {
  return (
    <>
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0b0f17]">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/background.webm" type="video/webm" />



        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/50 via-[#0b0f17]/30 to-[#0b0f17]/50" />
      </div>
    </>
  );
};

export default VideoBackground;
