'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  onProgress?: (progress: number) => void;
  initialProgress?: number;
  showFullscreenButton?: boolean;
}

export default function VideoPlayer({
  src,
  onProgress,
  initialProgress = 0,
  showFullscreenButton = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    const anyVideo = video as any;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (anyVideo.webkitRequestFullscreen) {
      anyVideo.webkitRequestFullscreen();
    } else if (anyVideo.msRequestFullscreen) {
      anyVideo.msRequestFullscreen();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Khởi tạo HLS
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      // Khôi phục progress
      if (initialProgress > 0) {
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = video.duration * initialProgress;
        });
      }

      // Track progress
      const handleTimeUpdate = () => {
        if (video.duration) {
          const progress = video.currentTime / video.duration;
          onProgress?.(progress);
        }
      };
      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        hls.destroy();
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
    }
  }, [src, initialProgress, onProgress]);

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-auto"
        controls
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {showFullscreenButton && (
        <button
          type="button"
          onClick={handleFullscreen}
          className="absolute top-3 right-3 px-3 py-1 text-xs bg-gray-900/70 hover:bg-gray-900 rounded text-white"
        >
          Fullscreen
        </button>
      )}
    </div>
  );
}

