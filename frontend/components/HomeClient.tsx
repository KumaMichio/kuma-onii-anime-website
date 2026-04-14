'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import Link from 'next/link';

import AnimeCard from '@/components/AnimeCard';
import { sourceAPI, userMediaAPI } from '@/lib/api';

const GENRES = [
  { slug: 'hanh-dong', name: 'Hành Động' },
  { slug: 'tinh-cam', name: 'Tình Cảm' },
  { slug: 'hai-huoc', name: 'Hài Hước' },
  { slug: 'kinh-di', name: 'Kinh Dị' },
  { slug: 'co-trang', name: 'Cổ Trang' },
  { slug: 'vien-tuong', name: 'Viễn Tưởng' },
  { slug: 'tam-ly', name: 'Tâm Lý' },
  { slug: 'hoat-hinh', name: 'Hoạt Hình' },
  { slug: 'chien-tranh', name: 'Chiến Tranh' },
  { slug: 'bi-an', name: 'Bí Ẩn' },
  { slug: 'gia-dinh', name: 'Gia Đình' },
  { slug: 'vo-thuat', name: 'Võ Thuật' },
];

const COUNTRIES = [
  { slug: 'trung-quoc', name: 'Trung Quốc' },
  { slug: 'han-quoc', name: 'Hàn Quốc' },
  { slug: 'nhat-ban', name: 'Nhật Bản' },
  { slug: 'viet-nam', name: 'Việt Nam' },
  { slug: 'au-my', name: 'Âu Mỹ' },
  { slug: 'hong-kong', name: 'Hồng Kông' },
  { slug: 'thai-lan', name: 'Thái Lan' },
  { slug: 'dai-loan', name: 'Đài Loan' },
];

const YEARS = ['2025', '2024', '2023', '2022', '2021', '2020'];

type FilterTab = 'genre' | 'country' | 'year';

/* ─────────────────────────────────────────
   Horizontal carousel row component
   ───────────────────────────────────────── */
function NfRow({ title, viewAllHref, children }: {
  title: string;
  viewAllHref?: string;
  children: React.ReactNode;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 'left' | 'right') {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({
      left: dir === 'right' ? rowRef.current.clientWidth * 0.75 : -rowRef.current.clientWidth * 0.75,
      behavior: 'smooth',
    });
  }

  return (
    <section className="section">
      {/* Row header */}
      <div className="site-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {viewAllHref && (
              <Link
                href={viewAllHref}
                style={{ fontSize: 13, fontWeight: 600, color: '#E50914', textDecoration: 'none' }}
              >
                Xem tất cả
              </Link>
            )}
            <button
              type="button"
              onClick={() => scroll('left')}
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable row — full width so edge-to-edge scroll, padded inside */}
      <div
        ref={rowRef}
        className="nf-row"
        style={{ paddingLeft: 'max(16px, calc((100vw - 1280px) / 2 + 48px))', paddingRight: 16 }}
      >
        {children}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   Skeleton card
   ───────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="nf-row-card" style={{ flexShrink: 0 }}>
      <div className="skeleton" style={{ aspectRatio: '2/3', width: '100%', borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 12, marginTop: 8, width: '70%', borderRadius: 4 }} />
    </div>
  );
}

/* ─────────────────────────────────────────
   Grid skeleton
   ───────────────────────────────────────── */
function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="movie-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton" style={{ aspectRatio: '2/3', width: '100%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 12, marginTop: 8, width: '65%', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main HomeClient component
   ───────────────────────────────────────── */
export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = useMemo(() => {
    const raw = searchParams.get('page');
    const n = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [searchParams]);

  const keyword  = searchParams.get('keyword')  ?? '';
  const theLoai  = searchParams.get('theLoai')  ?? '';
  const quocGia  = searchParams.get('quocGia')  ?? '';
  const nam      = searchParams.get('nam')      ?? '';

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [filterOpen, setFilterOpen]     = useState(false);
  const [filterTab, setFilterTab]       = useState<FilterTab>('genre');
  const [heroIdx]                       = useState(() => Math.floor(Math.random() * 5));

  const hasActiveFilter = !!(keyword || theLoai || quocGia || nam);

  /* ── Queries ── */
  const filmsQuery = useQuery({
    queryKey: ['films', page, keyword, theLoai, quocGia, nam],
    queryFn: async () => {
      if (keyword.trim()) return sourceAPI.searchFilms(keyword.trim()).then(r => r.data);
      if (theLoai)        return sourceAPI.getFilmsTheLoai(theLoai, page).then(r => r.data);
      if (quocGia)        return sourceAPI.getFilmsQuocGia(quocGia, page).then(r => r.data);
      if (nam)            return sourceAPI.getFilmsNamPhatHanh(nam, page).then(r => r.data);
      return sourceAPI.getFilmsUpdated(page).then(r => r.data);
    },
    placeholderData: prev => prev,
    retry: 2,
  });

  const suggestionsQuery = useQuery({
    queryKey: ['film-suggestions', keywordInput],
    queryFn: () => sourceAPI.searchFilms(keywordInput.trim()).then(r => r.data),
    enabled: keywordInput.trim().length >= 2 && keywordInput.trim() !== keyword.trim(),
    retry: 1,
  });

  const token = Cookies.get('token');

  const continueQuery = useQuery({
    queryKey: ['watch', 'continue'],
    queryFn: () => userMediaAPI.getContinueWatching({ limit: 12 }).then(r => r.data),
    enabled: !!token,
    retry: 0,
  });

  const recsQuery = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => userMediaAPI.getRecommendations(12).then(r => r.data),
    enabled: !!token,
    retry: 0,
    staleTime: 10 * 60 * 1000,
  });

  const items    = filmsQuery.data?.items ?? [];
  const paginate = filmsQuery.data?.paginate;

  // Hero picks the film at heroIdx from the loaded list
  const heroFilm = !hasActiveFilter && items.length > 0 ? items[heroIdx % items.length] : null;

  const activeLabel = (() => {
    if (keyword.trim()) return `Kết quả: "${keyword.trim()}"`;
    if (theLoai)        return GENRES.find(g => g.slug === theLoai)?.name ?? theLoai;
    if (quocGia)        return COUNTRIES.find(c => c.slug === quocGia)?.name ?? quocGia;
    if (nam)            return `Năm ${nam}`;
    return 'Phim mới cập nhật';
  })();

  function applyFilter(type: 'theLoai' | 'quocGia' | 'nam', slug: string) {
    const current = searchParams.get(type);
    const params  = new URLSearchParams();
    params.set('page', '1');
    if (current !== slug) params.set(type, slug);
    router.push(`/?${params.toString()}`);
    setFilterOpen(false);
  }

  function clearFilters() {
    router.push('/');
    setKeywordInput('');
    setFilterOpen(false);
  }

  function navigate(delta: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String((paginate?.current_page ?? page) + delta));
    router.push(`/?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: 'var(--c-bg)', minHeight: '100vh' }}>

      {/* ══ HERO BANNER — 65vh, hard-capped ══ */}
      {!hasActiveFilter && (
        <div className="hero">
          {heroFilm ? (
            <>
              <img
                src={heroFilm.thumb_url || heroFilm.poster_url}
                alt={heroFilm.name}
                className="hero__bg"
              />

              {/* Dual-layer gradient overlay — ensures text & buttons are always readable */}
              <div className="hero__overlay" />

              {/* Content — bottom-left, z-index 2, above everything */}
              <div className="hero__content nf-fade-in">
                <div style={{ maxWidth: 560 }}>
                  {/* Meta badges */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {heroFilm.quality && (
                      <span style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700, border: '1px solid #E50914', color: '#E50914', borderRadius: 3 }}>
                        {heroFilm.quality}
                      </span>
                    )}
                    {heroFilm.current_episode && (
                      <span style={{ padding: '2px 8px', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 3 }}>
                        {heroFilm.current_episode}
                      </span>
                    )}
                  </div>

                  <h1 style={{ fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: '0 0 10px', textShadow: '0 2px 16px rgba(0,0,0,0.7)' }}>
                    {heroFilm.name}
                  </h1>

                  {heroFilm.original_name && heroFilm.original_name !== heroFilm.name && (
                    <p style={{ fontSize: 13, color: '#b3b3b3', margin: '0 0 12px' }}>{heroFilm.original_name}</p>
                  )}

                  {/* Action buttons — always at z-index 10 via .btn-* classes */}
                  <div className="hero__actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => router.push(`/anime/${heroFilm.slug}`)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Xem ngay
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => router.push(`/anime/${heroFilm.slug}`)}
                    >
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Hero skeleton
            <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
          )}

          {/* Bottom bleed fade into page background */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, var(--c-bg), transparent)', zIndex: 2, pointerEvents: 'none' }} />
        </div>
      )}

      {/* Spacer when no hero (filter active) */}
      {hasActiveFilter && <div style={{ height: 80 }} />}

      {/* ══ SEARCH + FILTER BAR ══ */}
      <div className="site-container" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 8, maxWidth: 640 }}>

          {/* Search input */}
          <div style={{ position: 'relative', flex: 1 }}>
            <svg
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-muted)' }}
              width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && keywordInput.trim()) {
                  const p = new URLSearchParams();
                  p.set('keyword', keywordInput.trim());
                  p.set('page', '1');
                  router.push(`/?${p.toString()}`);
                }
              }}
              placeholder="Tìm phim, thể loại, diễn viên..."
              style={{
                width: '100%',
                paddingLeft: 40, paddingRight: 16, paddingTop: 11, paddingBottom: 11,
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
              }}
            />

            {/* Suggestions dropdown */}
            {(suggestionsQuery.data?.items?.length ?? 0) > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 50,
                background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)', overflow: 'hidden',
              }}>
                {suggestionsQuery.data.items.slice(0, 8).map((it: any) => (
                  <button
                    key={it.slug}
                    type="button"
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'none')}
                    onClick={() => {
                      setKeywordInput(it.name);
                      const p = new URLSearchParams();
                      p.set('keyword', it.name);
                      p.set('page', '1');
                      router.push(`/?${p.toString()}`);
                    }}
                  >
                    <img src={it.thumb_url} alt={it.name} style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{it.name}</div>
                      <div style={{ fontSize: 11, color: '#808080' }}>{it.total_episodes ?? '-'} tập</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter button */}
          <button
            type="button"
            onClick={() => setFilterOpen(v => !v)}
            style={{
              padding: '11px 16px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)',
              background: filterOpen ? '#E50914' : '#1a1a1a',
              color: filterOpen ? '#fff' : '#b3b3b3',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
            </svg>
            Bộ lọc
            {hasActiveFilter && !keyword && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
            )}
          </button>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilters}
              style={{
                padding: '11px 14px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)',
                background: '#1a1a1a', color: '#808080', fontSize: 13, cursor: 'pointer',
              }}
            >
              ✕ Xóa
            </button>
          )}
        </div>

        {/* Filter panel */}
        {filterOpen && (
          <div style={{
            marginTop: 8, padding: 20, background: '#141414',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
            maxWidth: 640,
          }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {(['genre', 'country', 'year'] as FilterTab[]).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  style={{
                    padding: '6px 14px', borderRadius: 4, border: 'none',
                    background: filterTab === tab ? '#E50914' : 'rgba(255,255,255,0.07)',
                    color: filterTab === tab ? '#fff' : '#808080',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {tab === 'genre' ? 'Thể loại' : tab === 'country' ? 'Quốc gia' : 'Năm'}
                </button>
              ))}
            </div>

            {/* Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(filterTab === 'genre' ? GENRES : filterTab === 'country' ? COUNTRIES : YEARS.map(y => ({ slug: y, name: y }))).map(item => {
                const slug   = item.slug;
                const active = filterTab === 'genre' ? theLoai === slug : filterTab === 'country' ? quocGia === slug : nam === slug;
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => applyFilter(filterTab === 'genre' ? 'theLoai' : filterTab === 'country' ? 'quocGia' : 'nam', slug)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, border: 'none',
                      background: active ? '#E50914' : 'rgba(255,255,255,0.08)',
                      color: active ? '#fff' : '#b3b3b3',
                      fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ══ CONTINUE WATCHING (logged in, no filter) ══ */}
      {token && !hasActiveFilter && (continueQuery.data ?? []).length > 0 && (
        <NfRow title="Tiếp tục xem">
          {(continueQuery.data ?? []).map((it: any) => (
            <div key={`${it.slug}:${it.episodeNumber}`} className="nf-row-card">
              <AnimeCard
                anime={{ id: it.slug, title: it.title, poster: it.poster_url }}
                progress={it.progress}
                episodeNumber={it.episodeNumber}
              />
            </div>
          ))}
        </NfRow>
      )}

      {/* ══ RECOMMENDATIONS (logged in, no filter) ══ */}
      {token && !hasActiveFilter && (recsQuery.data?.items ?? []).length > 0 && (
        <NfRow title={recsQuery.data?.basis === 'personalized' ? 'Gợi ý cho bạn' : 'Phim nổi bật'}>
          {recsQuery.isLoading
            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
            : (recsQuery.data?.items ?? []).map((film: any) => (
                <div key={film.slug} className="nf-row-card">
                  <AnimeCard anime={{ id: film.slug, title: film.name, poster: film.poster_url }} />
                </div>
              ))}
        </NfRow>
      )}

      {/* ══ GENRE QUICK PILLS (no filter) ══ */}
      {!hasActiveFilter && (
        <div className="site-container" style={{ marginBottom: 32 }}>
          <div className="nf-row" style={{ gap: 8 }}>
            {GENRES.map(g => (
              <button
                key={g.slug}
                type="button"
                onClick={() => applyFilter('theLoai', g.slug)}
                style={{
                  padding: '6px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'none',
                  color: '#b3b3b3', fontSize: 13, cursor: 'pointer',
                }}
                onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#b3b3b3'; }}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══ MAIN GRID ══ */}
      <div className="site-container" style={{ paddingBottom: 64 }}>

        {/* Grid header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="section-title" style={{ margin: 0 }}>{activeLabel}</h2>
          {paginate && (
            <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
              Trang {paginate.current_page} / {paginate.total_page}
            </span>
          )}
        </div>

        {/* Grid or states */}
        {filmsQuery.isLoading ? (
          <GridSkeleton count={12} />
        ) : filmsQuery.isError ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: 'var(--c-text-muted)', marginBottom: 16 }}>Không tải được danh sách phim.</p>
            <button type="button" className="btn-red" onClick={() => filmsQuery.refetch()}>Thử lại</button>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: 'var(--c-text-muted)', marginBottom: 16 }}>Không tìm thấy phim nào.</p>
            <button type="button" onClick={clearFilters} style={{ color: 'var(--c-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 14 }}>
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="movie-grid">
            {items.map((film: any) => (
              <AnimeCard
                key={film.slug}
                anime={{ id: film.slug, title: film.name, poster: film.poster_url }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!filmsQuery.isError && items.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 48 }}>
            <button
              type="button"
              disabled={(paginate?.current_page ?? page) <= 1}
              onClick={() => navigate(-1)}
              style={{
                padding: '10px 24px', borderRadius: 4, border: 'none',
                background: 'rgba(255,255,255,0.08)', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: (paginate?.current_page ?? page) <= 1 ? 0.3 : 1,
              }}
            >
              ← Trang trước
            </button>
            <span style={{ fontSize: 14, color: 'var(--c-text-muted)', padding: '0 12px', minWidth: 80, textAlign: 'center' }}>
              {paginate?.current_page ?? page} / {paginate?.total_page ?? '?'}
            </span>
            <button
              type="button"
              disabled={(paginate?.current_page ?? page) >= (paginate?.total_page ?? page)}
              onClick={() => navigate(1)}
              style={{
                padding: '10px 24px', borderRadius: 4, border: 'none',
                background: 'rgba(255,255,255,0.08)', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: (paginate?.current_page ?? page) >= (paginate?.total_page ?? page) ? 0.3 : 1,
              }}
            >
              Trang sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
