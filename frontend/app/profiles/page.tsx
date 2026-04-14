'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const AVATAR_COLORS = ['#E50914', '#0080ff', '#00b894', '#fd79a8', '#a29bfe', '#fdcb6e'];
const AVATAR_ICONS = ['🦊', '🐉', '🌸', '⚔️', '🌙', '🎌'];

interface Profile {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export default function ProfilesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [profiles] = useState<Profile[]>(() => {
    const base: Profile[] = user
      ? [{ id: 'main', name: user.username, color: '#E50914', icon: user.username.charAt(0).toUpperCase() }]
      : [];
    return [
      ...base,
      { id: 'p2', name: 'Anime Fan', color: '#0080ff', icon: '🎌' },
      { id: 'p3', name: 'Guest', color: '#00b894', icon: '🌸' },
    ];
  });

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[1]);
  const [selectedIcon, setSelectedIcon] = useState(AVATAR_ICONS[1]);

  function handleSelectProfile(p: Profile) {
    // In a real app this would switch profile context
    router.push('/');
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#141414' }}
    >
      {/* Logo */}
      <Link href="/" className="absolute top-6 left-8 text-2xl font-black tracking-tighter" style={{ color: '#E50914' }}>
        KUMA<span className="text-white">ONII</span>
      </Link>

      {!adding ? (
        <>
          <h1 className="text-4xl font-black text-white mb-12 tracking-tight">
            Ai đang xem?
          </h1>

          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className="group flex flex-col items-center gap-3 transition-all"
                onClick={() => handleSelectProfile(p)}
              >
                {/* Avatar */}
                <div
                  className="w-28 h-28 rounded-lg flex items-center justify-center text-4xl font-black text-white transition-all duration-200 group-hover:ring-4 group-hover:ring-white group-hover:scale-105 shadow-lg"
                  style={{ background: p.color }}
                >
                  {p.icon}
                </div>
                <span className="text-sm text-[#808080] group-hover:text-white transition-colors font-medium">
                  {p.name}
                </span>
              </button>
            ))}

            {/* Add profile */}
            <button
              type="button"
              className="group flex flex-col items-center gap-3"
              onClick={() => setAdding(true)}
            >
              <div
                className="w-28 h-28 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:ring-4 group-hover:ring-white group-hover:scale-105"
                style={{ border: '2px dashed #404040' }}
              >
                <svg className="w-12 h-12 text-[#404040] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm text-[#808080] group-hover:text-white transition-colors font-medium">
                Thêm hồ sơ
              </span>
            </button>
          </div>

          <button
            type="button"
            className="px-8 py-2.5 text-sm font-semibold border transition-all hover:bg-white hover:text-black"
            style={{ borderColor: '#808080', color: '#808080' }}
          >
            Quản lý hồ sơ
          </button>
        </>
      ) : (
        /* ── ADD PROFILE FORM ── */
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-black text-white mb-8">Thêm hồ sơ</h1>

          {/* Preview avatar */}
          <div className="flex justify-center mb-8">
            <div
              className="w-28 h-28 rounded-lg flex items-center justify-center text-4xl shadow-lg"
              style={{ background: selectedColor }}
            >
              {selectedIcon}
            </div>
          </div>

          {/* Color picker */}
          <div className="mb-5">
            <p className="text-xs text-[#808080] mb-2 font-medium uppercase tracking-wider">Màu sắc</p>
            <div className="flex gap-3">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    background: c,
                    ring: selectedColor === c ? '2px solid white' : 'none',
                    outline: selectedColor === c ? '2px solid white' : 'none',
                    outlineOffset: 2,
                  }}
                  onClick={() => setSelectedColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div className="mb-6">
            <p className="text-xs text-[#808080] mb-2 font-medium uppercase tracking-wider">Biểu tượng</p>
            <div className="flex gap-3">
              {AVATAR_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className="w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all"
                  style={{
                    background: selectedIcon === icon ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    outline: selectedIcon === icon ? '2px solid white' : 'none',
                    outlineOffset: 1,
                  }}
                  onClick={() => setSelectedIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div className="mb-7">
            <input
              type="text"
              placeholder="Tên hồ sơ"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-4 rounded text-white text-sm outline-none"
              style={{ background: '#333' }}
              maxLength={20}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={!newName.trim()}
              className="flex-1 py-3 font-bold text-sm text-white rounded transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: '#E50914' }}
              onClick={() => { setAdding(false); router.push('/'); }}
            >
              Tiếp tục
            </button>
            <button
              type="button"
              className="flex-1 py-3 font-bold text-sm rounded transition-all hover:bg-white/10"
              style={{ border: '1px solid #404040', color: '#808080' }}
              onClick={() => { setAdding(false); setNewName(''); }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
