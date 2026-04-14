'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.register(email, username, password);
      const { access_token, user } = response.data;
      login(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        access_token,
      );
      router.push('/');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#141414' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: '#E50914' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: '#E50914' }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black tracking-tighter" style={{ color: '#E50914' }}>
            KUMA<span className="text-white">ONII</span>
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-10 py-10 rounded-md"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <h2 className="text-2xl font-bold text-white mb-7">Tạo tài khoản</h2>

          {error && (
            <div
              className="text-sm rounded px-4 py-3 mb-5"
              style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.5)', color: '#ff6b6b' }}
            >
              {error}
            </div>
          )}

          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 rounded text-white text-sm outline-none transition-all focus:ring-1 focus:ring-white/30"
              style={{ background: '#333', border: '1px solid transparent' }}
              required
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Tên người dùng (tối thiểu 3 ký tự)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-4 rounded text-white text-sm outline-none transition-all focus:ring-1 focus:ring-white/30"
              style={{ background: '#333', border: '1px solid transparent' }}
              required
              minLength={3}
            />
          </div>

          <div className="mb-7">
            <input
              type="password"
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 rounded text-white text-sm outline-none transition-all focus:ring-1 focus:ring-white/30"
              style={{ background: '#333', border: '1px solid transparent' }}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ background: '#E50914' }}
          >
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>

          <p className="text-center mt-6 text-sm" style={{ color: '#808080' }}>
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-semibold text-white hover:underline transition-colors">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
