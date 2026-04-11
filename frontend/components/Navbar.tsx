'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    router.push('/');
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-white tracking-tight hover:text-blue-400 transition-colors">
          Kuma Onii
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-6 text-sm text-gray-300">
          <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
          {user && (
            <Link href="/favorites" className="hover:text-white transition-colors">Yêu thích</Link>
          )}
        </div>

        {/* Auth area */}
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-24 truncate">{user.username}</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <div className="text-xs text-gray-400">Đã đăng nhập với</div>
                      <div className="text-sm font-medium text-white truncate">{user.email}</div>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Hồ sơ của tôi
                    </Link>
                    <Link
                      href="/favorites"
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors sm:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      Yêu thích
                    </Link>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-gray-300 hover:text-white transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
