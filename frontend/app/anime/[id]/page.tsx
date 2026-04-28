'use client';

import { useRef } from 'react';
import { useAnime } from '@/hooks/useAnime';
import { useMutation, useQuery } from '@tanstack/react-query';
import { sourceAPI, userMediaAPI } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import AnimeCard from '@/components/AnimeCard';

export default function AnimeDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const filmSlug = params.id as string;
  const recRowRef = useRef<HTMLDivElement>(null);

  const { data: filmDetail, isLoading } = useAnime(filmSlug);

  const favoriteStatusQuery = useQuery({
    queryKey: ['favorite', filmSlug],
    queryFn: () => userMediaAPI.getFavoriteStatus(filmSlug).then(r => r.data),
    enabled: !!user && !!filmSlug,
    retry: 0,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: () => userMediaAPI.toggleFavorite(filmSlug).then(r => r.data),
    onSuccess: (data) => {
      favoriteStatusQuery.refetch();
      showToast(data.favorited ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích', data.favorited ? 'success' : 'info');
    },
  });

  /* Recommendations — similar genre (must be before early returns) */
  const firstGenreSlug = (() => {
    const cat = filmDetail?.movie?.category ?? {};
    for (const key of Object.keys(cat)) {
      const group = cat[key]?.group;
      const list  = cat[key]?.list;
      if (/thể loại/i.test(String(group?.name ?? '')) && Array.isArray(list) && list.length > 0) {
        return String(list[0]?.id ?? '');
      }
    }
    return '';
  })();

  const recsQuery = useQuery({
    queryKey: ['recs', firstGenreSlug],
    queryFn: () => sourceAPI.getFilmsTheLoai(firstGenreSlug, 1).then(r => r.data),
    enabled: !!firstGenreSlug,
    staleTime: 10 * 60 * 1000,
  });

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div style={{ background: 'var(--c-bg)', minHeight: '100vh' }}>
        <div className="skeleton" style={{ height: '55vh', width: '100%' }} />
        <div className="site-container" style={{ paddingTop: 32 }}>
          <div className="skeleton" style={{ height: 36, width: '40%', borderRadius: 4, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 16, width: '80%', borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 4 }} />
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!filmDetail?.movie) {
    return (
      <div style={{ background: 'var(--c-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--c-text-muted)', marginBottom: 16 }}>Phim không tồn tại.</p>
          <button type="button" className="btn-secondary" onClick={() => router.push('/')}>Về trang chủ</button>
        </div>
      </div>
    );
  }

  const movie        = filmDetail.movie;
  const backdropUrl  = movie.thumb_url || movie.poster_url;
  const posterUrl    = movie.poster_url || movie.thumb_url;

  const episodesServers = Array.isArray(movie?.episodes) ? movie.episodes : [];
  const firstServer     = episodesServers[0];
  const episodeItems    = Array.isArray(firstServer?.items) ? firstServer.items : [];

  const defaultEpNumber = (() => {
    const s = String(movie?.current_episode ?? '');
    const m = s.match(/(\d+)/);
    if (!m) return 1;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

  /* Category chips */
  const categoryChips = (() => {
    const category = movie?.category ?? {};
    const chips: Array<{ typeParam: 'theLoai' | 'quocGia' | 'nam'; slug: string; name: string }> = [];
    for (const key of Object.keys(category)) {
      const group     = category[key]?.group;
      const list      = category[key]?.list;
      const groupName = String(group?.name ?? '');
      let typeParam: 'theLoai' | 'quocGia' | 'nam' | null = null;
      if (/thể loại/i.test(groupName))                         typeParam = 'theLoai';
      else if (/quốc gia/i.test(groupName))                    typeParam = 'quocGia';
      else if (/đến/i.test(groupName) || /năm/i.test(groupName)) typeParam = 'nam';
      if (!typeParam || !Array.isArray(list)) continue;
      for (const it of list) chips.push({ typeParam, slug: String(it?.id ?? ''), name: String(it?.name ?? '') });
    }
    return chips;
  })();

  /* Parsed episode list */
  const episodes = episodeItems
    .map((it: any) => ({
      episodeNumber: (() => {
        const n = Number(String(it?.name ?? '').match(/(\d+)/)?.[1] ?? NaN);
        return Number.isFinite(n) ? (n as number) : null;
      })(),
      slug: String(it?.slug ?? ''),
      label: String(it?.name ?? ''),
    }))
    .filter((x: any) => x.episodeNumber !== null);

  const isFavorited = favoriteStatusQuery.data?.favorited ?? false;

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: 'var(--c-bg)', minHeight: '100vh' }}>

      {/* ── HERO BACKDROP — 55vh, capped ── */}
      <div className="hero" style={{ height: '55vh', maxHeight: 560 }}>
        {backdropUrl && (
          <img src={backdropUrl} alt={movie.name} className="hero__bg" />
        )}
        {/* Dual-layer gradient */}
        <div className="hero__overlay" />

        {/* Bottom bleed */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(to top, var(--c-bg), transparent)', zIndex: 2, pointerEvents: 'none' }} />

        {/* Back button — z-index 5, above everything */}
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: 80, left: 'max(16px, calc((100vw - 1280px)/2 + 48px))',
            zIndex: 10, display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)', color: '#b3b3b3', padding: '8px 14px',
            borderRadius: 4, fontSize: 13, cursor: 'pointer',
          }}
          onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.color = '#fff'}
          onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.color = '#b3b3b3'}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>
      </div>

      {/* ── CONTENT — max-width 1280px, centered ── */}
      <div className="site-container" style={{ paddingTop: 8, paddingBottom: 64 }}>

        {/* Two-column layout: poster | info */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>

          {/* Poster — 160px fixed, floats up above hero line */}
          {posterUrl && (
            <div style={{
              flexShrink: 0,
              width: 160,
              marginTop: -80,           /* pull up to overlap hero bottom */
              position: 'relative',
              zIndex: 5,
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'none',          /* hidden on mobile */
            }}
            className="md-poster"
            >
              <img src={posterUrl} alt={movie.name} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          {/* Info panel */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 16 }}>

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 900, color: '#fff', margin: '0 0 4px', lineHeight: 1.15 }}>
              {movie.name}
            </h1>
            {movie.original_name && movie.original_name !== movie.name && (
              <p style={{ fontSize: 13, color: 'var(--c-text-muted)', margin: '0 0 14px' }}>{movie.original_name}</p>
            )}

            {/* Meta badges — always visible, below title, not overlapping anything */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {movie.quality && (
                <span style={{ padding: '3px 10px', fontSize: 11, fontWeight: 700, border: '1px solid #E50914', color: '#E50914', borderRadius: 3 }}>
                  {movie.quality}
                </span>
              )}
              {movie.current_episode && (
                <span style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 3 }}>
                  {movie.current_episode}
                </span>
              )}
              {movie.language && (
                <span style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 3 }}>
                  {movie.language}
                </span>
              )}
            </div>

            {/* Description */}
            {movie.description && (
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--c-text-sub)', marginBottom: 24, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {movie.description}
              </p>
            )}

            {/* CTA buttons — z-index 10, always above images */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, position: 'relative', zIndex: 10 }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => router.push(`/watch/${movie.slug}?ep=${defaultEpNumber}`)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z" /></svg>
                Xem ngay
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={() => toggleFavoriteMutation.mutate()}
                  disabled={toggleFavoriteMutation.isPending}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '11px 22px', borderRadius: 4, border: isFavorited ? '1px solid #E50914' : '1px solid rgba(255,255,255,0.2)',
                    background: isFavorited ? 'rgba(229,9,20,0.15)' : 'rgba(255,255,255,0.08)',
                    color: isFavorited ? '#E50914' : '#fff',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer', zIndex: 10,
                  }}
                >
                  {isFavorited ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#E50914">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                  {isFavorited ? 'Đã yêu thích' : 'Yêu thích'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => router.push('/login')}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Đăng nhập để yêu thích
                </button>
              )}
            </div>

            {/* Category chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categoryChips.slice(0, 20).map((chip, idx) => (
                <button
                  key={`${chip.typeParam}:${chip.slug}:${idx}`}
                  type="button"
                  onClick={() => { const p = new URLSearchParams(); p.set('page', '1'); p.set(chip.typeParam, chip.slug); router.push(`/?${p.toString()}`); }}
                  style={{
                    padding: '5px 14px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--c-text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E50914'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E50914'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  {chip.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '40px 0' }} />

        {/* ── EPISODE LIST ── */}
        {episodes.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
              Danh sách tập
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--c-text-muted)', marginLeft: 8 }}>({episodes.length} tập)</span>
            </h3>

            {/* Episode buttons — CSS grid, auto-fill so they never overflow */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
              gap: 8,
            }}>
              {episodes.map((ep: any) => {
                const isActive = ep.episodeNumber === defaultEpNumber;
                return (
                  <button
                    key={ep.episodeNumber}
                    type="button"
                    onClick={() => router.push(`/watch/${movie.slug}?ep=${ep.episodeNumber}`)}
                    style={{
                      padding: '10px 4px', textAlign: 'center', borderRadius: 4,
                      background: isActive ? '#E50914' : 'rgba(255,255,255,0.07)',
                      color: isActive ? '#fff' : '#b3b3b3',
                      fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                    }}
                    onMouseOver={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; } }}
                    onMouseOut={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#b3b3b3'; } }}
                  >
                    {ep.episodeNumber}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RECOMMENDATIONS ── */}
        {(recsQuery.data?.items?.length ?? 0) > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Phim tương tự</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => recRowRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" onClick={() => recRowRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>

            {/* Horizontal carousel — cards fixed 160px, images always clipped */}
            <div ref={recRowRef} className="nf-row">
              {(recsQuery.data?.items ?? [])
                .filter((f: any) => f.slug !== movie.slug)
                .slice(0, 16)
                .map((film: any) => (
                  <div key={film.slug} className="nf-row-card">
                    <AnimeCard anime={{ id: film.slug, title: film.name, poster: film.poster_url }} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Inline style to show poster on md+ */}
      <style>{`.md-poster { display: none !important; } @media(min-width:768px){ .md-poster { display: block !important; } }`}</style>
    </div>
  );
}
