'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/movies', label: 'Phim lẻ' },
  { href: '/shows', label: 'Phim bộ' },
  { href: '/favorites', label: 'Danh sách' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    router.push('/');
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchInput.trim()) {
      router.replace(`/?keyword=${encodeURIComponent(searchInput.trim())}&page=1`);
      setSearchOpen(false);
      setSearchInput('');
    }
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'background 0.4s, backdrop-filter 0.4s, border-bottom 0.4s',
        background: scrolled
          ? 'rgba(11,11,11,0.98)'
          : 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(6px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
      }}
    >
      {/* ── Main row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 64,
        padding: '0 clamp(16px, 4vw, 40px)',
        gap: 24,
      }}>

        {/* Logo */}
        <Link
          href="/"
          style={{
            flexShrink: 0,
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#E50914',
            textDecoration: 'none',
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          KUMA<span style={{ color: '#fff' }}>ONII</span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="hide-on-mobile">
          {NAV_LINKS.map((link) => (
            (!link.href.includes('favorites') || user) && (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '6px 12px',
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 4,
                  color: isActive(link.href) ? '#fff' : 'rgba(229,229,229,0.65)',
                  background: isActive(link.href) ? 'rgba(255,255,255,0.08)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'color 0.15s, background 0.15s',
                }}
              >
                {link.label}
              </Link>
            )
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {searchOpen ? (
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
              <input
                autoFocus
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm phim..."
                style={{
                  width: 'clamp(140px, 25vw, 260px)',
                  padding: '6px 12px',
                  fontSize: 13,
                  color: '#fff',
                  background: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRight: 'none',
                  borderRadius: '4px 0 0 4px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onBlur={() => { if (!searchInput) setSearchOpen(false); }}
              />
              <button
                type="submit"
                style={{
                  padding: '6px 10px',
                  background: '#E50914',
                  border: '1px solid #E50914',
                  borderRadius: '0 4px 4px 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              style={{
                padding: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(229,229,229,0.8)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: 1,
                  transition: 'opacity 0.15s',
                }}
                onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.8')}
                onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 4,
                  background: '#E50914',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900, color: '#fff',
                  flexShrink: 0,
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <svg
                  width="11" height="11"
                  fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}
                  style={{
                    transition: 'transform 0.2s',
                    transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    display: 'none',
                  }}
                  className="show-on-desktop"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0 }} onClick={() => setMenuOpen(false)} />
                  <div style={{
                    position: 'absolute', right: 0, marginTop: 12, width: 224,
                    background: 'rgba(20,20,20,0.98)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                    zIndex: 10,
                  }}>
                    {/* User info */}
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 4,
                        background: '#E50914',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0,
                      }}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
                        <div style={{ fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                      </div>
                    </div>

                    {[
                      { href: '/profiles', label: 'Quản lý hồ sơ', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                      { href: '/profile',  label: 'Tài khoản',      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                      { href: '/favorites', label: 'Yêu thích',     icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                    ].map(({ href, label, icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px',
                          fontSize: 13, color: '#e5e5e5',
                          textDecoration: 'none',
                          transition: 'background 0.12s',
                        }}
                        onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)')}
                        onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = 'transparent')}
                      >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                        </svg>
                        {label}
                      </Link>
                    ))}

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px',
                          fontSize: 13, color: '#808080',
                          background: 'none', border: 'none', cursor: 'pointer',
                          transition: 'background 0.12s',
                        }}
                        onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)')}
                        onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                      >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              style={{
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                background: '#E50914',
                borderRadius: 4,
                textDecoration: 'none',
                transition: 'opacity 0.15s',
                lineHeight: 1,
              }}
              onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.85')}
              onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}
            >
              Đăng nhập
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            style={{
              padding: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              display: 'none',
            }}
            className="show-on-mobile"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {mobileMenuOpen && (
        <div style={{
          background: 'rgba(11,11,11,0.98)',
          padding: '0 16px 12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {NAV_LINKS.map((link) => (
            (!link.href.includes('favorites') || user) && (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 0',
                  fontSize: 14,
                  fontWeight: 500,
                  color: isActive(link.href) ? '#E50914' : '#b3b3b3',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            )
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .hide-on-mobile { display: none !important; }
          .show-on-mobile { display: flex !important; }
        }
        @media (min-width: 768px) {
          .show-on-mobile { display: none !important; }
          .hide-on-mobile { display: flex !important; }
          .show-on-desktop { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
