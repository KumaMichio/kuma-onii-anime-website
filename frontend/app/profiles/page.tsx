'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

const AVATAR_COLORS = [
  '#E50914', '#0080ff', '#00b894', '#fd79a8',
  '#a29bfe', '#fdcb6e', '#e17055', '#00cec9',
];

type Section = 'avatar' | 'username' | 'password' | null;

export default function ProfilesPage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const { showToast } = useToast();

  const [editing, setEditing] = useState<Section>(null);
  const [loading, setLoading] = useState(false);

  // Avatar form
  const [selectedColor, setSelectedColor] = useState<string>(
    user?.avatar ?? '#E50914',
  );

  // Username form
  const [newUsername, setNewUsername] = useState(user?.username ?? '');

  // Password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#141414' }}>
        <div className="text-center">
          <p className="mb-4 text-sm" style={{ color: '#808080' }}>Vui lòng đăng nhập để xem hồ sơ</p>
          <Link
            href="/login"
            className="px-6 py-3 font-bold text-white text-sm rounded hover:opacity-90 transition-all"
            style={{ background: '#E50914' }}
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const avatarColor = user.avatar ?? '#E50914';
  const initial = user.username.charAt(0).toUpperCase();

  // ── SAVE AVATAR ─────────────────────────────────────────────────────────────
  async function saveAvatar() {
    setLoading(true);
    try {
      await authAPI.updateProfile({ avatar: selectedColor });
      updateUser({ avatar: selectedColor });
      showToast('Đã cập nhật avatar', 'success');
      setEditing(null);
    } catch (err: any) {
      showToast(err.response?.data?.message ?? 'Cập nhật thất bại', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ── SAVE USERNAME ────────────────────────────────────────────────────────────
  async function saveUsername() {
    if (!newUsername.trim() || newUsername.trim() === user.username) {
      setEditing(null);
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.updateProfile({ username: newUsername.trim() });
      updateUser({ username: res.data.username });
      showToast('Đã cập nhật username', 'success');
      setEditing(null);
    } catch (err: any) {
      showToast(err.response?.data?.message ?? 'Cập nhật thất bại', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ── SAVE PASSWORD ────────────────────────────────────────────────────────────
  async function savePassword() {
    if (newPw !== confirmPw) {
      showToast('Mật khẩu mới không khớp', 'error');
      return;
    }
    if (newPw.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: currentPw, newPassword: newPw });
      showToast('Đổi mật khẩu thành công', 'success');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setEditing(null);
    } catch (err: any) {
      showToast(err.response?.data?.message ?? 'Đổi mật khẩu thất bại', 'error');
    } finally {
      setLoading(false);
    }
  }

  function cancelEdit() {
    setEditing(null);
    setNewUsername(user.username);
    setSelectedColor(user.avatar ?? '#E50914');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  }

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: '#141414' }}>

      {/* ── HEADER ── */}
      <div
        className="px-6 md:px-12 py-8 mb-2"
        style={{ background: 'linear-gradient(to bottom, rgba(229,9,20,0.06), transparent)' }}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-white mb-1">Hồ sơ của tôi</h1>
          <p className="text-sm" style={{ color: '#808080' }}>Quản lý thông tin tài khoản của bạn</p>
        </div>
      </div>

      <div className="px-6 md:px-12 max-w-2xl mx-auto space-y-3">

        {/* ── AVATAR CARD ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="px-6 py-5 flex items-center gap-5">
            {/* Avatar preview */}
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-black text-white flex-shrink-0 transition-all duration-200"
              style={{ background: avatarColor }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">{user.username}</p>
              <p className="text-xs mt-0.5" style={{ color: '#808080' }}>
                {user.role === 'ADMIN' ? (
                  <span className="font-bold" style={{ color: '#E50914' }}>ADMIN</span>
                ) : 'Thành viên'}
              </p>
            </div>
            {editing !== 'avatar' && (
              <button
                type="button"
                onClick={() => { setEditing('avatar'); setSelectedColor(avatarColor); }}
                className="px-4 py-2 text-xs font-semibold rounded transition-all hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#e5e5e5' }}
              >
                Thay đổi
              </button>
            )}
          </div>

          {editing === 'avatar' && (
            <div className="px-6 pb-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mt-5 mb-3" style={{ color: '#808080' }}>
                Chọn màu avatar
              </p>
              {/* Live preview */}
              <div className="flex justify-center mb-5">
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-black text-white shadow-lg transition-all duration-200"
                  style={{ background: selectedColor }}
                >
                  {initial}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mb-5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className="w-10 h-10 rounded-full transition-all duration-150"
                    style={{
                      background: c,
                      outline: selectedColor === c ? '3px solid white' : '3px solid transparent',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={saveAvatar}
                  className="px-5 py-2.5 text-sm font-bold text-white rounded transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#E50914' }}
                >
                  {loading ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-5 py-2.5 text-sm font-semibold rounded transition-all hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', color: '#808080' }}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── USERNAME CARD ────────────────────────────────────────────────────── */}
        <InfoCard
          label="Username"
          value={user.username}
          editable
          editing={editing === 'username'}
          onEdit={() => { setEditing('username'); setNewUsername(user.username); }}
        >
          <div className="px-6 pb-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <label className="block text-xs font-semibold uppercase tracking-wider mt-5 mb-2" style={{ color: '#808080' }}>
              Username mới
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              maxLength={30}
              className="w-full px-4 py-3 rounded text-white text-sm outline-none focus:ring-1 focus:ring-white/20"
              style={{ background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                disabled={loading || !newUsername.trim()}
                onClick={saveUsername}
                className="px-5 py-2.5 text-sm font-bold text-white rounded transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: '#E50914' }}
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-5 py-2.5 text-sm font-semibold rounded transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.12)', color: '#808080' }}
              >
                Hủy
              </button>
            </div>
          </div>
        </InfoCard>

        {/* ── EMAIL CARD ───────────────────────────────────────────────────────── */}
        <InfoCard label="Email" value={user.email} />

        {/* ── PASSWORD CARD ────────────────────────────────────────────────────── */}
        <InfoCard
          label="Mật khẩu"
          value="••••••••••••"
          editable
          editing={editing === 'password'}
          onEdit={() => setEditing('password')}
        >
          <div className="px-6 pb-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="mt-5 space-y-4">
              <PasswordField
                label="Mật khẩu hiện tại"
                value={currentPw}
                onChange={setCurrentPw}
                show={showPw.current}
                onToggleShow={() => setShowPw((s) => ({ ...s, current: !s.current }))}
              />
              <PasswordField
                label="Mật khẩu mới"
                value={newPw}
                onChange={setNewPw}
                show={showPw.new}
                onToggleShow={() => setShowPw((s) => ({ ...s, new: !s.new }))}
              />
              <PasswordField
                label="Xác nhận mật khẩu mới"
                value={confirmPw}
                onChange={setConfirmPw}
                show={showPw.confirm}
                onToggleShow={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                disabled={loading || !currentPw || !newPw || !confirmPw}
                onClick={savePassword}
                className="px-5 py-2.5 text-sm font-bold text-white rounded transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: '#E50914' }}
              >
                {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-5 py-2.5 text-sm font-semibold rounded transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.12)', color: '#808080' }}
              >
                Hủy
              </button>
            </div>
          </div>
        </InfoCard>

        {/* ── DANGER ZONE ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-lg px-6 py-5 flex items-center justify-between"
          style={{ background: '#1a1a1a', border: '1px solid rgba(229,9,20,0.15)' }}
        >
          <div>
            <p className="text-sm font-semibold text-white">Đăng xuất</p>
            <p className="text-xs mt-0.5" style={{ color: '#808080' }}>Thoát khỏi tài khoản trên thiết bị này</p>
          </div>
          <button
            type="button"
            onClick={() => { logout(); router.push('/'); }}
            className="px-4 py-2 text-xs font-semibold rounded transition-all hover:bg-red-900/30"
            style={{ border: '1px solid rgba(229,9,20,0.4)', color: '#E50914' }}
          >
            Đăng xuất
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoCard({
  label,
  value,
  editable = false,
  editing = false,
  onEdit,
  children,
}: {
  label: string;
  value: string;
  editable?: boolean;
  editing?: boolean;
  onEdit?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="px-6 py-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#808080' }}>
            {label}
          </p>
          <p className="text-white text-sm font-medium truncate">{value}</p>
        </div>
        {editable && !editing && (
          <button
            type="button"
            onClick={onEdit}
            className="flex-shrink-0 px-4 py-2 text-xs font-semibold rounded transition-all hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#e5e5e5' }}
          >
            Thay đổi
          </button>
        )}
      </div>
      {editing && children}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#808080' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 pr-11 rounded text-white text-sm outline-none focus:ring-1 focus:ring-white/20"
          style={{ background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: '#808080' }}
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
