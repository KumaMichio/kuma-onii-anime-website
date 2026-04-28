'use client';

import { useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import VideoPlayer from '@/components/VideoPlayer';
import { sourceAPI, api } from '@/lib/api';

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

  const filmDetailQuery = useQuery({
    queryKey: ['film', filmSlug],
    queryFn: () => sourceAPI.getFilmDetail(filmSlug).then((r) => r.data),
    enabled: !!filmSlug,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const movie = filmDetailQuery.data?.movie;
  const episodeItems: any[] = Array.isArray(movie?.episodes) ? movie.episodes?.[0]?.items ?? [] : [];

  const episode = useMemo(() => {
    const match = episodeItems.find((it: any) => parseEpisodeNumber(it?.name) === episodeNumber);
    return match ? {
      episodeNumber,
      label: String(match?.name ?? episodeNumber),
      embedUrl: match?.embed as string | undefined,
      videoUrl: match?.m3u8 as string | undefined,
    } : null;
  }, [episodeItems, episodeNumber]);

  const currentIdx = episodeItems.findIndex((it: any) => parseEpisodeNumber(it?.name) === episodeNumber);
  const nextEpisodeItem = episodeItems[currentIdx + 1] ?? null;
  const nextEpNumber = nextEpisodeItem ? parseEpisodeNumber(nextEpisodeItem?.name) : null;

  const goToNextEpisode = useCallback(() => {
    if (nextEpNumber) router.push(`/watch/${filmSlug}?ep=${nextEpNumber}`);
  }, [nextEpNumber, filmSlug, router]);

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

  if (!movie || (!episode?.embedUrl && !episode?.videoUrl)) {
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
      <div className="w-full relative" style={{ background: '#000' }}>
        {/* Back button + title bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
          pointerEvents: 'none',
        }}>
          <button
            type="button"
            onClick={() => router.push(`/anime/${filmSlug}`)}
            style={{
              pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(6px)', color: '#ccc', padding: '6px 12px',
              borderRadius: 4, fontSize: 13, cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
          <span style={{ pointerEvents: 'none', fontSize: 13, color: '#fff', fontWeight: 600 }}>
            {movie.name}
            <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.55)', marginLeft: 8 }}>
              — Tập {episodeNumber}
            </span>
          </span>
        </div>

        {episode.embedUrl ? (
          <iframe
            key={episode.embedUrl}
            src={episode.embedUrl}
            style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          />
        ) : (
          <VideoPlayer
            src={`${api.defaults.baseURL}/source/stream/proxy?url=${encodeURIComponent(episode.videoUrl!)}`}
            title={movie.name}
            episodeLabel={`Tập ${episodeNumber}`}
            onBack={() => router.push(`/anime/${filmSlug}`)}
            onNextEpisode={nextEpNumber ? goToNextEpisode : undefined}
          />
        )}
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
