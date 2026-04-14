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
      router.push(`/?keyword=${encodeURIComponent(searchInput.trim())}&page=1`);
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
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? 'rgba(11,11,11,0.98)'
          : 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(6px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
      }}
    >
      <div className="px-4 md:px-10 h-16 flex items-center gap-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex-shrink-0 text-xl font-black tracking-tighter select-none"
          style={{ color: '#E50914' }}
        >
          KUMA<span className="text-white">ONII</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            (!link.href.includes('favorites') || user) && (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm font-medium rounded transition-colors"
                style={{
                  color: isActive(link.href) ? '#fff' : 'rgba(229,229,229,0.7)',
                  background: isActive(link.href) ? 'rgba(255,255,255,0.08)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            )
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="flex items-center">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                autoFocus
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm phim..."
                className="w-48 md:w-64 px-3 py-1.5 text-sm text-white outline-none rounded-l"
                style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)', borderRight: 'none' }}
                onBlur={() => { if (!searchInput) setSearchOpen(false); }}
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-r transition-colors"
                style={{ background: '#E50914', border: '1px solid #E50914' }}
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="p-2 text-[#e5e5e5] hover:text-white transition-colors"
              onClick={() => setSearchOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-sm font-black text-white"
                  style={{ background: '#E50914' }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <svg
                  className={`hidden md:block w-3 h-3 text-white transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div
                    className="absolute right-0 mt-3 w-56 shadow-2xl overflow-hidden rounded"
                    style={{ background: 'rgba(20,20,20,0.98)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                        style={{ background: '#E50914' }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{user.username}</div>
                        <div className="text-xs truncate" style={{ color: '#808080' }}>{user.email}</div>
                      </div>
                    </div>

                    <Link
                      href="/profiles"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                      style={{ color: '#e5e5e5' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Quản lý hồ sơ
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                      style={{ color: '#e5e5e5' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Tài khoản
                    </Link>
                    <Link
                      href="/favorites"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                      style={{ color: '#e5e5e5' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Danh sách yêu thích
                    </Link>

                    <div className="border-t border-white/10">
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                        style={{ color: '#808080' }}
                        onClick={handleLogout}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
              className="px-4 py-2 text-sm font-bold text-white rounded transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#E50914' }}
            >
              Đăng nhập
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden px-4 pb-4"
          style={{ background: 'rgba(11,11,11,0.98)' }}
        >
          {NAV_LINKS.map((link) => (
            (!link.href.includes('favorites') || user) && (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2.5 text-sm font-medium border-b border-white/5 transition-colors"
                style={{ color: isActive(link.href) ? '#E50914' : '#b3b3b3' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            )
          ))}
        </div>
      )}
    </nav>
  );
}
