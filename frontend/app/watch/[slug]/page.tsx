'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import VideoPlayer from '@/components/VideoPlayer';
import { sourceAPI, api } from '@/lib/api';

function parseEpisodeNumber(raw: any, fallback = 1): number {
  const n = Number(String(raw ?? '').match(/(\d+)/)?.[1] ?? NaN);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/* ── Shared style tokens ── */
const S = {
  bg:        '#0a0a0a',
  surface:   'rgba(255,255,255,0.05)',
  border:    'rgba(255,255,255,0.08)',
  muted:     '#666',
  red:       '#E50914',
  redDim:    'rgba(229,9,20,0.15)',
  redBorder: 'rgba(229,9,20,0.3)',
};

export default function WatchPage() {
  const router      = useRouter();
  const params      = useParams();
  const searchParams = useSearchParams();
  const filmSlug    = params.slug as string;

  const episodeNumber = useMemo(
    () => parseEpisodeNumber(searchParams.get('ep') ?? 1, 1),
    [searchParams],
  );

  const filmDetailQuery = useQuery({
    queryKey: ['film', filmSlug],
    queryFn:  () => sourceAPI.getFilmDetail(filmSlug).then((r) => r.data),
    enabled:  !!filmSlug,
    retry:    2,
    staleTime: 5 * 60 * 1000,
  });

  const movie        = filmDetailQuery.data?.movie;
  const episodeItems: any[] = Array.isArray(movie?.episodes)
    ? movie.episodes?.[0]?.items ?? []
    : [];

  const episode = useMemo(() => {
    const match = episodeItems.find(
      (it: any) => parseEpisodeNumber(it?.name) === episodeNumber,
    );
    return match
      ? {
          episodeNumber,
          label:    String(match?.name ?? episodeNumber),
          embedUrl: match?.embed as string | undefined,
          videoUrl: match?.m3u8  as string | undefined,
        }
      : null;
  }, [episodeItems, episodeNumber]);

  const currentIdx      = episodeItems.findIndex((it: any) => parseEpisodeNumber(it?.name) === episodeNumber);
  const nextEpisodeItem = episodeItems[currentIdx + 1] ?? null;
  const nextEpNumber    = nextEpisodeItem ? parseEpisodeNumber(nextEpisodeItem?.name) : null;

  const [isEdge, setIsEdge] = useState(false);
  useEffect(() => { setIsEdge(/Edg\//.test(navigator.userAgent)); }, []);

  const goToNextEpisode = useCallback(() => {
    if (nextEpNumber) router.push(`/watch/${filmSlug}?ep=${nextEpNumber}`);
  }, [nextEpNumber, filmSlug, router]);

  /* ── Loading ── */
  if (filmDetailQuery.isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `2px solid ${S.red}`, borderTopColor: 'transparent',
            margin: '0 auto 12px',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: 13, color: S.muted }}>Đang tải phim...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Not found ── */
  if (!movie || (!episode?.embedUrl && !episode?.videoUrl)) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#fff', fontWeight: 700, marginBottom: 12 }}>Không tìm thấy tập phim</p>
          <button
            type="button"
            onClick={() => router.push(`/anime/${filmSlug}`)}
            style={{ fontSize: 13, color: S.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Về trang phim
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg }}>

      {/* ── Edge warning banner ── */}
      {isEdge && (
        <div style={{
          background: 'rgba(229,9,20,0.1)', borderBottom: `1px solid ${S.redBorder}`,
          padding: '10px 20px', display: 'flex', alignItems: 'flex-start', gap: 10,
          fontSize: 13, color: '#ffaaaa',
        }}>
          <svg width="15" height="15" style={{ flexShrink: 0, marginTop: 1 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>Microsoft Edge</strong> có thể chặn video do Tracking Prevention.
            Hãy vào <strong>edge://settings/privacy</strong> → đặt thành <strong>Basic</strong>,
            hoặc dùng <strong>Chrome / Firefox</strong>.
          </span>
        </div>
      )}

      {/* ── VIDEO — full width, black bg ── */}
      <div style={{ width: '100%', background: '#000', position: 'relative' }}>

        {/* Back + title overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          pointerEvents: 'none',
        }}>
          <button
            type="button"
            onClick={() => router.push(`/anime/${filmSlug}`)}
            style={{
              pointerEvents: 'auto',
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(6px)',
              borderRadius: 4, cursor: 'pointer',
              color: '#bbb', fontSize: 12,
            }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            {movie.name}
            <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>· Tập {episodeNumber}</span>
          </span>
        </div>

        {episode.embedUrl ? (
          <iframe
            key={episode.embedUrl}
            src={episode.embedUrl}
            style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write; web-share"
            referrerPolicy="no-referrer-when-downgrade"
            scrolling="no"
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

      {/* Browser hint */}
      {!isEdge && (
        <div style={{
          padding: '7px 16px',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: '#3a3a3a',
        }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Nếu video không phát, hãy thử Chrome / Firefox và tắt Ad Blocker.
        </div>
      )}

      {/* ── CONTENT — max-width container ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(16px, 3vw, 32px) clamp(12px, 4vw, 32px)' }}>

        {/* Film title + episode + detail link */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(15px, 2.5vw, 20px)', fontWeight: 900, color: '#fff', margin: 0 }}>
              {movie.name}
            </h2>
            <p style={{ fontSize: 13, color: S.muted, marginTop: 4 }}>Tập {episodeNumber}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/anime/${filmSlug}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: 6, cursor: 'pointer',
              color: '#ccc', fontSize: 13, fontWeight: 500,
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Chi tiết phim
          </button>
        </div>

        {/* ── Next episode CTA ── */}
        {nextEpNumber && (
          <button
            type="button"
            onClick={goToNextEpisode}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              background: S.redDim,
              border: `1px solid ${S.redBorder}`,
              borderRadius: 8, cursor: 'pointer',
              marginBottom: 24,
              transition: 'opacity 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: S.red, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tiếp theo
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Tập {nextEpNumber}</div>
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: S.red,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 2 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}

        {/* ── Episode list ── */}
        {episodeItems.length > 1 && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Danh sách tập</h3>
              <span style={{
                fontSize: 11, fontWeight: 600, color: S.muted,
                background: S.surface, border: `1px solid ${S.border}`,
                borderRadius: 10, padding: '2px 8px',
              }}>
                {episodeItems.length} tập
              </span>
            </div>

            {/* Grid — auto-fill 48px columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
              gap: 6,
            }}>
              {episodeItems.map((it: any) => {
                const n        = parseEpisodeNumber(it?.name);
                const isActive = n === episodeNumber;
                return (
                  <button
                    key={it?.slug ?? n}
                    type="button"
                    onClick={() => router.push(`/watch/${filmSlug}?ep=${n}`)}
                    style={{
                      padding: '9px 4px',
                      textAlign: 'center',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isActive ? `1px solid ${S.red}` : `1px solid ${S.border}`,
                      background: isActive ? S.red : S.surface,
                      color: isActive ? '#fff' : S.muted,
                      transition: 'background 0.12s, color 0.12s, border-color 0.12s',
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = S.surface;
                        (e.currentTarget as HTMLButtonElement).style.color = S.muted;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = S.border;
                      }
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
