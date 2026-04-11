import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Flame,
  Hash,
  User,
  Users,
  LogOut,
  Rss,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';

const navItems = [
  { to: '/feed', icon: Rss, label: 'Лента' },
  { to: '/channels', icon: Hash, label: 'Каналы' },
  { to: '/users', icon: Users, label: 'Пользователи' },
  { to: '/profile/me', icon: User, label: 'Профиль' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="shrink-0 bg-accent border-b-3 border-border flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-border border-3 border-border shadow-[3px_3px_0_0] shadow-secondary flex items-center justify-center">
            <Flame className="w-5 h-5 text-accent" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-border">
            SocialHub
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-border">{user?.username ?? 'Guest'}</span>
          <div className="w-8 h-8 bg-surface border-2 border-border rounded-full flex items-center justify-center text-sm font-bold text-border uppercase">
            {user?.username?.charAt(0) ?? '?'}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-16 shrink-0 border-r-3 border-border bg-surface flex flex-col items-center py-4 gap-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                `w-11 h-11 flex items-center justify-center border-2 border-border transition-all ${
                  isActive
                    ? 'bg-secondary text-white shadow-[3px_3px_0_0] shadow-border'
                    : 'bg-surface text-text-secondary hover:bg-surface-elevated hover:shadow-[2px_2px_0_0] hover:shadow-border'
                }`
              }
            >
              <Icon className="w-5 h-5" />
            </NavLink>
          ))}

          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className="w-11 h-11 flex items-center justify-center border-2 border-border bg-surface text-text-muted hover:text-danger hover:bg-surface-elevated transition-colors"
              title="Выйти"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
