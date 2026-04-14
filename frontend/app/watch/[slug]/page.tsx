'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Cookies from 'js-cookie';

import VideoPlayer from '@/components/VideoPlayer';
import AnimeCard from '@/components/AnimeCard';
import { sourceAPI, userMediaAPI } from '@/lib/api';

function parseEpisodeNumber(raw: any, fallback = 1): number {
  const n = Number(String(raw ?? '').match(/(\d+)/)?.[1] ?? NaN);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const filmSlug = params.slug as string;

  const episodeNumber = useMemo(() => parseEpisodeNumber(searchParams.get('ep') ?? 1, 1), [searchParams]);
  const token = Cookies.get('token');

  const filmDetailQuery = useQuery({
    queryKey: ['film', filmSlug],
    queryFn: () => sourceAPI.getFilmDetail(filmSlug).then((r) => r.data),
    enabled: !!filmSlug,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const progressQuery = useQuery({
    queryKey: ['watch', 'progress', filmSlug, episodeNumber],
    queryFn: () => userMediaAPI.getProgress({ filmSlug, episodeNumber }).then((r) => r.data),
    enabled: !!token && !!filmSlug && !!episodeNumber,
    retry: 0,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { filmSlug: string; episodeNumber: number; progress: number }) =>
      userMediaAPI.updateProgress(payload).then((r) => r.data),
  });

  const [initialProgress, setInitialProgress] = useState(0);
  useEffect(() => {
    if (progressQuery.data?.progress !== undefined) setInitialProgress(progressQuery.data.progress);
  }, [progressQuery.data?.progress]);

  const lastSavedAtRef = useRef(0);
  const lastSavedProgressRef = useRef(0);

  const onProgress = (p: number) => {
    const progress = Math.max(0, Math.min(1, p));
    if (!token) return;
    const now = Date.now();
    const delta = Math.abs(progress - lastSavedProgressRef.current);
    if (now - lastSavedAtRef.current < 5000 && delta < 0.02) return;
    lastSavedAtRef.current = now;
    lastSavedProgressRef.current = progress;
    updateMutation.mutate({ filmSlug, episodeNumber, progress });
  };

  const movie = filmDetailQuery.data?.movie;
  const episodeItems: any[] = Array.isArray(movie?.episodes) ? movie.episodes?.[0]?.items ?? [] : [];

  const episode = useMemo(() => {
    const match = episodeItems.find((it: any) => parseEpisodeNumber(it?.name) === episodeNumber);
    return match ? {
      episodeNumber,
      label: String(match?.name ?? episodeNumber),
      videoUrl: match?.m3u8 as string,
    } : null;
  }, [episodeItems, episodeNumber]);

  // Find prev/next episode
  const currentIdx = episodeItems.findIndex((it: any) => parseEpisodeNumber(it?.name) === episodeNumber);
  const nextEpisodeItem = episodeItems[currentIdx + 1] ?? null;
  const nextEpNumber = nextEpisodeItem ? parseEpisodeNumber(nextEpisodeItem?.name) : null;

  function goToNextEpisode() {
    if (nextEpNumber) router.push(`/watch/${filmSlug}?ep=${nextEpNumber}`);
  }

  if (filmDetailQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: '#E50914', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: '#808080' }}>Đang tải phim...</p>
        </div>
      </div>
    );
  }

  if (!movie || !episode?.videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <p className="text-white font-semibold mb-3">Không tìm thấy tập phim</p>
          <button
            type="button"
            className="text-sm underline hover:text-white transition-colors"
            style={{ color: '#808080' }}
            onClick={() => router.push(`/anime/${filmSlug}`)}
          >
            Về trang phim
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>

      {/* ── VIDEO PLAYER — full width ── */}
      <div className="w-full" style={{ background: '#000' }}>
        <VideoPlayer
          src={episode.videoUrl}
          initialProgress={initialProgress}
          onProgress={onProgress}
          title={movie.name}
          episodeLabel={`Tập ${episodeNumber}`}
          onBack={() => router.push(`/anime/${filmSlug}`)}
          onNextEpisode={nextEpNumber ? goToNextEpisode : undefined}
        />
      </div>

      {/* ── EPISODE INFO + LIST ── */}
      <div className="px-6 md:px-12 py-8">

        {/* Current episode info */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black text-white">{movie.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#808080' }}>Tập {episodeNumber}</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-white transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            onClick={() => router.push(`/anime/${filmSlug}`)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Chi tiết phim
          </button>
        </div>

        {/* Next episode CTA */}
        {nextEpNumber && (
          <div
            className="flex items-center justify-between px-5 py-4 rounded-lg mb-6 cursor-pointer transition-all hover:opacity-90"
            style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)' }}
            onClick={goToNextEpisode}
          >
            <div>
              <div className="text-xs font-medium mb-0.5" style={{ color: '#E50914' }}>Tiếp theo</div>
              <div className="text-sm font-bold text-white">Tập {nextEpNumber}</div>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: '#E50914' }}
            >
              <svg className="w-4 h-4 text-white translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Episode list */}
        {episodeItems.length > 1 && (
          <>
            <h3 className="text-base font-bold text-white mb-4">
              Danh sách tập
              <span className="ml-2 text-sm font-normal" style={{ color: '#808080' }}>({episodeItems.length} tập)</span>
            </h3>
            <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-2 mb-10">
              {episodeItems.map((it: any) => {
                const n = parseEpisodeNumber(it?.name);
                const isActive = n === episodeNumber;
                return (
                  <button
                    key={it?.slug ?? n}
                    type="button"
                    className="py-2.5 text-center rounded text-sm font-semibold transition-all"
                    style={{
                      background: isActive ? '#E50914' : 'rgba(255,255,255,0.07)',
                      color: isActive ? '#fff' : '#808080',
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#808080';
                      }
                    }}
                    onClick={() => router.push(`/watch/${filmSlug}?ep=${n}`)}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
