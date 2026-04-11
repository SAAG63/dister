import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(email, password);
      }
      navigate('/feed');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-accent border-3 border-border shadow-[4px_4px_0_0] shadow-border flex items-center justify-center">
            <Flame className="w-7 h-7 text-border" />
          </div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-text-primary">
            SocialHub
          </h1>
        </div>

        <div className="bg-surface border-3 border-border shadow-[6px_6px_0_0] shadow-border p-8">
          <h2 className="font-display font-bold text-xl text-text-primary mb-1">
            {isRegister ? 'Создать аккаунт' : 'Войти'}
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            {isRegister
              ? 'Заполните данные для регистрации'
              : 'Введите данные для входа'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border-2 border-danger text-danger text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface border-3 border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:shadow-[3px_3px_0_0] focus:shadow-accent transition-shadow"
                  placeholder="username"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border-3 border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:shadow-[3px_3px_0_0] focus:shadow-accent transition-shadow"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border-3 border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:shadow-[3px_3px_0_0] focus:shadow-accent transition-shadow"
                placeholder="********"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover border-3 border-border shadow-[4px_4px_0_0] shadow-border hover:shadow-[2px_2px_0_0] hover:translate-x-[2px] hover:translate-y-[2px] text-border font-bold text-sm py-3 transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50"
            >
              {loading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-text-secondary hover:text-secondary font-semibold transition-colors"
            >
              {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
