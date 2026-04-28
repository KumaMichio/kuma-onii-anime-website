'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  title?: string;
  episodeLabel?: string;
  onNextEpisode?: () => void;
  onBack?: () => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoPlayer({
  src,
  title,
  episodeLabel,
  onNextEpisode,
  onBack,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showNextEp, setShowNextEp] = useState(false);

  // Stable ref for onNextEpisode — prevents HLS effect from re-running on prop change
  const onNextEpisodeRef = useRef(onNextEpisode);
  useEffect(() => { onNextEpisodeRef.current = onNextEpisode; });

  // Show / auto-hide controls
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!isDragging) setControlsVisible(false);
    }, 3500);
  }, [isDragging]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {}); // ignore interruption errors
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    v.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
    v.muted = val === 0;
  };

  const seek = (fraction: number) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = v.duration * fraction;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(fraction);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const skipSeconds = (s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + s));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only handle if focused on player
      if (e.target !== document.body && !(containerRef.current?.contains(e.target as Node))) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': e.preventDefault(); skipSeconds(10); break;
        case 'ArrowLeft': e.preventDefault(); skipSeconds(-10); break;
        case 'ArrowUp': e.preventDefault(); { const v2 = videoRef.current; if (v2) { v2.volume = Math.min(1, v2.volume + 0.1); setVolume(v2.volume); } break; }
        case 'ArrowDown': e.preventDefault(); { const v3 = videoRef.current; if (v3) { v3.volume = Math.max(0, v3.volume - 0.1); setVolume(v3.volume); } break; }
        case 'KeyF': e.preventDefault(); toggleFullscreen(); break;
        case 'KeyM': e.preventDefault(); toggleMute(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // HLS + video events setup — only re-runs when src changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) {
        if (video.duration - video.currentTime < 30 && onNextEpisodeRef.current) {
          setShowNextEp(true);
        }
      }
    };
    const onDurationChange = () => setDuration(video.duration);
    const onBufferUpdate = () => {
      if (video.buffered.length > 0 && video.duration) {
        setBuffered(video.buffered.end(video.buffered.length - 1) / video.duration);
      }
    };
    const onVolumeChange = () => { setVolume(video.volume); setIsMuted(video.muted); };
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('progress', onBufferUpdate);
    video.addEventListener('volumechange', onVolumeChange);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('progress', onBufferUpdate);
      video.removeEventListener('volumechange', onVolumeChange);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [src]);

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden select-none"
      style={{ aspectRatio: '16/9', cursor: controlsVisible ? 'default' : 'none' }}
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onMouseLeave={() => !isDragging && setControlsVisible(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* ── CENTER PLAY/PAUSE INDICATOR ── */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-white translate-x-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* ── CONTROLS OVERLAY ── */}
      <div
        className="absolute inset-0 flex flex-col justify-between pointer-events-none transition-opacity duration-300"
        style={{ opacity: controlsVisible ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div
          className="px-4 pt-3 pb-8 pointer-events-auto"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}
        >
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
                onClick={onBack}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại
              </button>
            )}
            {title && (
              <div className="flex-1 text-sm text-white font-semibold">
                {title}
                {episodeLabel && <span className="text-white/60 font-normal ml-2">— {episodeLabel}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Bottom controls */}
        <div
          className="px-4 pb-4 pt-12 pointer-events-auto"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div
            ref={progressBarRef}
            className="relative h-1 rounded-full mb-3 cursor-pointer group/prog"
            style={{ background: 'rgba(255,255,255,0.25)' }}
            onClick={handleProgressClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseMove={(e) => {
              if (isDragging) {
                const bar = progressBarRef.current;
                if (!bar) return;
                const rect = bar.getBoundingClientRect();
                const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                seek(fraction);
              }
            }}
          >
            {/* Buffered */}
            <div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ width: `${buffered * 100}%`, background: 'rgba(255,255,255,0.3)' }}
            />
            {/* Played */}
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all"
              style={{ width: `${progress * 100}%`, background: '#E50914' }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover/prog:opacity-100 transition-opacity"
              style={{ left: `calc(${progress * 100}% - 7px)` }}
            />
          </div>

          {/* Buttons row */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              type="button"
              className="text-white hover:text-white/80 transition-colors"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip back 10s */}
            <button
              type="button"
              className="text-white hover:text-white/80 transition-colors"
              onClick={() => skipSeconds(-10)}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
            </button>

            {/* Skip forward 10s */}
            <button
              type="button"
              className="text-white hover:text-white/80 transition-colors"
              onClick={() => skipSeconds(10)}
            >
              <svg className="w-5 h-5 scale-x-[-1]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button type="button" className="text-white hover:text-white/80 transition-colors" onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-200 accent-white h-1 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Time */}
            <span className="text-xs text-white/70 ml-1 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Fullscreen */}
            <button
              type="button"
              className="text-white hover:text-white/80 transition-colors"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── NEXT EPISODE CARD ── */}
      {showNextEp && onNextEpisode && (
        <div className="absolute bottom-24 right-4 z-20">
          <div
            className="px-4 py-3 rounded-lg text-sm text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-100 shadow-xl"
            style={{ background: '#E50914', minWidth: 180 }}
            onClick={(e) => { e.stopPropagation(); onNextEpisode(); }}
          >
            <div className="text-xs text-white/70 mb-0.5">Tiếp theo</div>
            Tập tiếp theo →
          </div>
        </div>
      )}
    </div>
  );
}
