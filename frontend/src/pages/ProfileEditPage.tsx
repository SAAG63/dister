import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { updateProfile, uploadAvatar } from '../api/users';

export default function ProfileEditPage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch {
      setError('Ошибка загрузки аватарки');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const updated = await updateProfile(user.id, { username, email: email || undefined, avatarUrl: avatarUrl || undefined });
      updateUser(updated);
      navigate('/profile/me');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-bg border-b-3 border-border px-5 py-4 flex items-center gap-3">
        <Link
          to="/profile/me"
          className="p-1.5 border-2 border-border hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display font-extrabold text-lg text-text-primary">
          Редактировать профиль
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-6">
        <div className="flex items-center gap-5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full border-3 border-border shadow-[3px_3px_0_0] shadow-border object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent border-3 border-border shadow-[3px_3px_0_0] shadow-border flex items-center justify-center text-2xl font-extrabold text-border uppercase font-display">
              {username.charAt(0) || '?'}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border-2 border-border text-sm font-bold text-text-secondary hover:bg-surface-elevated transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Загрузка...' : 'Загрузить аватарку'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border-2 border-danger text-danger text-sm font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
            Имя пользователя
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-surface border-3 border-border px-4 py-2.5 text-sm text-text-primary outline-none focus:shadow-[3px_3px_0_0] focus:shadow-accent transition-shadow"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface border-3 border-border px-4 py-2.5 text-sm text-text-primary outline-none focus:shadow-[3px_3px_0_0] focus:shadow-accent transition-shadow"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-hover border-3 border-border shadow-[4px_4px_0_0] shadow-border hover:shadow-[2px_2px_0_0] hover:translate-x-[2px] hover:translate-y-[2px] font-bold text-sm text-border transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  );
}
