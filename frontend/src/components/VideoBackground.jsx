import React from 'react';

const VideoBackground = () => {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        objectFit: 'cover',
        zIndex: -1,
      }}
    >
      <source src="/background.webm" type="video/webm" />
    </video>
  );
};

export default VideoBackground;
