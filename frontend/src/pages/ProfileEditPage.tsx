import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export default function ProfileEditPage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ username, email });
    navigate('/profile/me');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-bg/80 border-b border-border px-5 py-4 flex items-center gap-3">
        <Link
          to="/profile/me"
          className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display font-bold text-lg text-text-primary">
          Редактировать профиль
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-2xl font-bold text-accent uppercase font-display">
            {username.charAt(0) || '?'}
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
          >
            <Upload className="w-4 h-4" />
            Загрузить аватарку
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Имя пользователя
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-hover text-bg font-semibold text-sm rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          Сохранить
        </button>
      </form>
    </div>
  );
}
