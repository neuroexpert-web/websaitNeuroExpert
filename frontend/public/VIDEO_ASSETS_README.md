# Video Assets for Hero Background

## Required Files

To optimize the hero video background, you need to add the following files to the `/public` directory:

### 1. MP4 Video (H.264)
- **Path**: `/public/background.mp4` or `/public/videos/hero-bg.mp4`
- **Max Size**: 2MB
- **Resolution**: 1280x720
- **Codec**: H.264
- **Frame Rate**: 30fps
- **Bitrate**: ~2000kbps

### 2. WebM Video (VP9) - Optional but recommended
- **Path**: `/public/background.webm` or `/public/videos/hero-bg.webm`
- **Max Size**: 1.5MB
- **Resolution**: 1280x720
- **Codec**: VP9
- **Frame Rate**: 30fps
- **Bitrate**: ~1500kbps

### 3. Poster Image (JPEG)
- **Path**: `/public/hero-poster.jpg` or `/public/images/hero-poster.jpg`
- **Max Size**: 100KB
- **Resolution**: 1280x720
- **Quality**: 75%

## Current Fallback

The current implementation uses:
- **Video**: `/background.webm` (6MB - already exists)
- **Poster**: `/video-poster.svg` (already exists)

## Optimization Tips

### Using FFmpeg to optimize videos:

```bash
# Create optimized MP4
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset fast -vf scale=1280:720 -an background.mp4

# Create optimized WebM
ffmpeg -i input.mp4 -vcodec libvpx-vp9 -crf 30 -b:v 0 -vf scale=1280:720 -an background.webm

# Create poster image
ffmpeg -i input.mp4 -ss 00:00:01 -vframes 1 -vf scale=1280:720 -q:v 2 hero-poster.jpg
```

### Online Tools:
- **Cloudinary**: Automatic video optimization
- **HandBrake**: Desktop video encoder
- **Online Video Converter**: https://www.online-convert.com/

## Implementation Notes

The `HeroVideo.jsx` component automatically:
1. Attempts to load WebM first (smaller file size)
2. Falls back to MP4 if WebM not supported
3. Shows the poster image if video fails to load
4. Displays a gradient background as final fallback

No additional code changes needed - just add the optimized video files!
