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
        <div className="site-container" style={{ paddingTop: 40, paddingBottom: 64 }}>
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
            <div className="skeleton" style={{ flexShrink: 0, width: 220, aspectRatio: '2/3', borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 36, width: '55%', borderRadius: 4, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 14, width: '30%', borderRadius: 4, marginBottom: 20 }} />
              <div className="skeleton" style={{ height: 14, width: '100%', borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '90%', borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 4 }} />
            </div>
          </div>
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

  const movie     = filmDetail.movie;
  const posterUrl = movie.poster_url || movie.thumb_url;

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
      <div className="site-container" style={{ paddingTop: 48, paddingBottom: 80 }}>

        {/* ── Back button ── */}
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#999', padding: '7px 14px', borderRadius: 4,
            fontSize: 13, cursor: 'pointer', marginBottom: 40,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.color = '#999'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        {/* ── Main info: poster + details ── */}
        <div style={{ display: 'flex', gap: 'clamp(24px, 4vw, 56px)', alignItems: 'flex-start', marginBottom: 64 }}>

          {/* Poster */}
          {posterUrl && (
            <div style={{
              flexShrink: 0,
              width: 'clamp(180px, 22vw, 300px)',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(0,0,0,0.75)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <img
                src={posterUrl}
                alt={movie.name}
                style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 8 }}>

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 42px)', fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.15 }}>
              {movie.name}
            </h1>
            {movie.original_name && movie.original_name !== movie.name && (
              <p style={{ fontSize: 14, color: '#555', margin: '0 0 20px', fontStyle: 'italic' }}>{movie.original_name}</p>
            )}

            {/* Meta badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {movie.quality && (
                <span style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700, border: '1px solid #E50914', color: '#E50914', borderRadius: 4 }}>
                  {movie.quality}
                </span>
              )}
              {movie.current_episode && (
                <span style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#ddd', borderRadius: 4 }}>
                  {movie.current_episode}
                </span>
              )}
              {movie.language && (
                <span style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#ddd', borderRadius: 4 }}>
                  {movie.language}
                </span>
              )}
              {movie.year && (
                <span style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#ddd', borderRadius: 4 }}>
                  {movie.year}
                </span>
              )}
            </div>

            {/* Description */}
            {movie.description && (
              <p style={{
                fontSize: 15, lineHeight: 1.8, color: '#aaa',
                marginBottom: 32,
                display: '-webkit-box', WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {movie.description}
              </p>
            )}

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => router.push(`/watch/${movie.slug}?ep=${defaultEpNumber}`)}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z" /></svg>
                Xem ngay
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={() => toggleFavoriteMutation.mutate()}
                  disabled={toggleFavoriteMutation.isPending}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '11px 22px', borderRadius: 4, cursor: 'pointer',
                    border: isFavorited ? '1px solid #E50914' : '1px solid rgba(255,255,255,0.15)',
                    background: isFavorited ? 'rgba(229,9,20,0.12)' : 'rgba(255,255,255,0.06)',
                    color: isFavorited ? '#E50914' : '#ccc',
                    fontSize: 15, fontWeight: 600,
                  }}
                >
                  {isFavorited ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#E50914">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                  onClick={() => {
                    const p = new URLSearchParams();
                    p.set('page', '1');
                    p.set(chip.typeParam, chip.slug);
                    router.push(`/?${p.toString()}`);
                  }}
                  style={{
                    padding: '5px 14px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#888', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    transition: 'background 0.12s, color 0.12s, border-color 0.12s',
                  }}
                  onMouseOver={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#E50914'; b.style.color = '#fff'; b.style.borderColor = '#E50914'; }}
                  onMouseOut={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.07)'; b.style.color = '#888'; b.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  {chip.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Episode list ── */}
        {episodes.length > 0 && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 36 }} />
            <div style={{ marginBottom: 56 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
                Danh sách tập
                <span style={{ fontSize: 13, fontWeight: 400, color: '#555', marginLeft: 10 }}>({episodes.length} tập)</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 8 }}>
                {episodes.map((ep: any) => {
                  const isActive = ep.episodeNumber === defaultEpNumber;
                  return (
                    <button
                      key={ep.episodeNumber}
                      type="button"
                      onClick={() => router.push(`/watch/${movie.slug}?ep=${ep.episodeNumber}`)}
                      style={{
                        padding: '11px 4px', textAlign: 'center', borderRadius: 4,
                        background: isActive ? '#E50914' : 'rgba(255,255,255,0.07)',
                        color: isActive ? '#fff' : '#888',
                        fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                        transition: 'background 0.12s, color 0.12s',
                      }}
                      onMouseOver={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; } }}
                      onMouseOut={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; } }}
                    >
                      {ep.episodeNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Recommendations ── */}
        {(recsQuery.data?.items?.length ?? 0) > 0 && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 32 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Phim tương tự</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => recRowRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                    style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button type="button" onClick={() => recRowRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                    style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
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
          </>
        )}
      </div>
    </div>
  );
}
