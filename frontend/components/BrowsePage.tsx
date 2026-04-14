'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AnimeCard from '@/components/AnimeCard';
import { sourceAPI } from '@/lib/api';

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

interface BrowsePageProps {
  title: string;
  subtitle: string;
  defaultGenre?: string;
  defaultCountry?: string;
  baseRoute: string;
}

/* Shared dropdown component */
function FilterDropdown({ label, active, children }: {
  label: string;
  active?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 4,
          background: active ? '#E50914' : 'rgba(255,255,255,0.08)',
          color: active ? '#fff' : '#b3b3b3',
          border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        {active && <span style={{ fontSize: 11, opacity: 0.8 }}>({active})</span>}
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: 12, minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            display: 'flex', flexWrap: 'wrap', gap: 8,
          }}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

export default function BrowsePage({ title, subtitle, defaultGenre, defaultCountry, baseRoute }: BrowsePageProps) {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const page    = useMemo(() => {
    const raw = searchParams.get('page');
    const n   = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [searchParams]);

  const theLoai = searchParams.get('theLoai') ?? defaultGenre  ?? '';
  const quocGia = searchParams.get('quocGia') ?? defaultCountry ?? '';
  const nam     = searchParams.get('nam')     ?? '';

  const filmsQuery = useQuery({
    queryKey: ['browse', baseRoute, page, theLoai, quocGia, nam],
    queryFn: async () => {
      if (theLoai) return sourceAPI.getFilmsTheLoai(theLoai, page).then(r => r.data);
      if (quocGia) return sourceAPI.getFilmsQuocGia(quocGia, page).then(r => r.data);
      if (nam)     return sourceAPI.getFilmsNamPhatHanh(nam, page).then(r => r.data);
      return sourceAPI.getFilmsUpdated(page).then(r => r.data);
    },
    placeholderData: prev => prev,
    retry: 2,
  });

  const items    = filmsQuery.data?.items ?? [];
  const paginate = filmsQuery.data?.paginate;
  const hasFilter = !!(theLoai || quocGia || nam);

  function apply(type: 'theLoai' | 'quocGia' | 'nam', slug: string) {
    const params = new URLSearchParams();
    params.set('page', '1');
    const current = type === 'theLoai' ? theLoai : type === 'quocGia' ? quocGia : nam;
    if (current !== slug) params.set(type, slug);
    router.push(`${baseRoute}?${params.toString()}`);
  }

  function clearAll() {
    router.push(baseRoute);
  }

  function navigate(delta: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String((paginate?.current_page ?? page) + delta));
    router.push(`${baseRoute}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const activeGenreName   = GENRES.find(g => g.slug === theLoai)?.name;
  const activeCountryName = COUNTRIES.find(c => c.slug === quocGia)?.name;

  return (
    <div style={{ background: 'var(--c-bg)', minHeight: '100vh' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{
        paddingTop: 88,   /* 64px navbar + 24px */
        paddingBottom: 32,
        background: 'linear-gradient(to bottom, rgba(229,9,20,0.06), transparent)',
      }}>
        <div className="site-container">
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
            {title}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--c-text-muted)', margin: 0 }}>{subtitle}</p>
        </div>
      </div>

      {/* ── STICKY FILTER BAR ── */}
      <div className="filter-bar">
        <div className="site-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

            {/* Genre dropdown */}
            <FilterDropdown label="Thể loại" active={activeGenreName}>
              {GENRES.map(g => (
                <button
                  key={g.slug}
                  type="button"
                  onClick={() => apply('theLoai', g.slug)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: 'none',
                    background: theLoai === g.slug ? '#E50914' : 'rgba(255,255,255,0.08)',
                    color: theLoai === g.slug ? '#fff' : '#b3b3b3',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {g.name}
                </button>
              ))}
            </FilterDropdown>

            {/* Country dropdown */}
            <FilterDropdown label="Quốc gia" active={activeCountryName}>
              {COUNTRIES.map(c => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => apply('quocGia', c.slug)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: 'none',
                    background: quocGia === c.slug ? '#E50914' : 'rgba(255,255,255,0.08)',
                    color: quocGia === c.slug ? '#fff' : '#b3b3b3',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.name}
                </button>
              ))}
            </FilterDropdown>

            {/* Year dropdown */}
            <FilterDropdown label="Năm" active={nam || undefined}>
              {YEARS.map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => apply('nam', y)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: 'none',
                    background: nam === y ? '#E50914' : 'rgba(255,255,255,0.08)',
                    color: nam === y ? '#fff' : '#b3b3b3',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {y}
                </button>
              ))}
            </FilterDropdown>

            {hasFilter && (
              <button
                type="button"
                onClick={clearAll}
                style={{
                  padding: '8px 14px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.12)',
                  background: 'none', color: 'var(--c-text-muted)',
                  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Xóa bộ lọc
              </button>
            )}

            {/* Page info — push to right */}
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--c-text-muted)' }}>
              {paginate && `Trang ${paginate.current_page} / ${paginate.total_page}`}
            </div>
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="site-container" style={{ paddingTop: 32, paddingBottom: 64 }}>

        {filmsQuery.isLoading ? (
          <div className="movie-grid">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ aspectRatio: '2/3', width: '100%', borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 11, marginTop: 8, width: '60%', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Không tìm thấy phim nào</p>
            <p style={{ color: 'var(--c-text-muted)', marginBottom: 20 }}>Thử thay đổi bộ lọc</p>
            <button type="button" onClick={clearAll} className="btn-red">Xóa bộ lọc</button>
          </div>
        ) : (
          /* ── THE GRID — symmetric, aligned, never overflows ── */
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
        {!filmsQuery.isLoading && items.length > 0 && (
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
            >← Trang trước</button>

            <div style={{ display: 'flex', gap: 4 }}>
              {/* Show page numbers around current */}
              {Array.from({ length: Math.min(paginate?.total_page ?? 1, 7) }, (_, i) => {
                const cur   = paginate?.current_page ?? page;
                const total = paginate?.total_page ?? 1;
                let pg: number;
                if (total <= 7) {
                  pg = i + 1;
                } else if (cur <= 4) {
                  pg = i + 1;
                } else if (cur >= total - 3) {
                  pg = total - 6 + i;
                } else {
                  pg = cur - 3 + i;
                }
                if (pg < 1 || pg > total) return null;
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set('page', String(pg)); router.push(`${baseRoute}?${p.toString()}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{
                      width: 36, height: 36, borderRadius: 4, border: 'none',
                      background: (paginate?.current_page ?? page) === pg ? '#E50914' : 'rgba(255,255,255,0.08)',
                      color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>

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
            >Trang sau →</button>
          </div>
        )}
      </div>
    </div>
  );
}
