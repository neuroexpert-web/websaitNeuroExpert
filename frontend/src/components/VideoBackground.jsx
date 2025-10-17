import React from 'react';

const VideoBackground = () => {
  return (
    <>
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://customer-assets.emergentagent.com/job_smartweb-wizard/artifacts/ylv5f259_%D0%B2%D0%B8%D0%B4%D0%B5%D0%BE%20%D1%84%D0%BE%D0%BD%20%D0%BE%D1%81%D1%82%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D1%85%20%D0%B1%D0%BB%D0%BE%D0%BA%D0%BE%D0%B2%20.mp4" type="video/mp4" />
        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-[#0b0f17]/40" />
      </div>
    </>
  );
};

export default VideoBackground;
