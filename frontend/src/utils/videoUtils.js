// Video utility functions for optimized video loading
export const videoUtils = {
  // Check if browser supports WebM
  supportsWebM: () => {
    const video = document.createElement('video');
    return video.canPlayType('video/webm; codecs="vp8, vorbis"') !== '';
  },

  // Check if browser supports MP4 (H.264)
  supportsMP4: () => {
    const video = document.createElement('video');
    return video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';
  },

  // Get optimal video source based on browser support and device
  getOptimalVideoSource: (isMobile) => {
    const sources = [];
    
    if (videoUtils.supportsWebM()) {
      sources.push({
        src: '/background.webm',
        type: 'video/webm'
      });
    }
    
    if (videoUtils.supportsMP4()) {
      if (isMobile) {
        // For mobile, use a smaller/optimized version if available
        sources.push({
          src: 'https://res.cloudinary.com/dpxuancbn/video/upload/f_auto,q_auto,w_720,h_405/000e54de.mp4',
          type: 'video/mp4'
        });
      } else {
        // For desktop, use higher quality
        sources.push({
          src: 'https://res.cloudinary.com/dpxuancbn/video/upload/f_auto,q_auto,w_1280,h_720/000e54de.mp4',
          type: 'video/mp4'
        });
      }
    }
    
    return sources;
  },

  // Check if device is likely to have autoplay restrictions
  hasAutoplayRestrictions: () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    
    return isMobile;
  },

  // Check network conditions
  getNetworkCondition: () => {
    if (!navigator.connection) return 'unknown';
    
    const { effectiveType, saveData } = navigator.connection;
    
    if (saveData) return 'data-saver';
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
    if (effectiveType === '3g') return 'medium';
    if (effectiveType === '4g') return 'fast';
    
    return 'unknown';
  }
};