import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Flame,
  Hash,
  User,
  LogOut,
  Rss,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';

const navItems = [
  { to: '/feed', icon: Rss, label: 'Лента' },
  { to: '/channels', icon: Hash, label: 'Каналы' },
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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <Flame className="w-5 h-5 text-bg" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-text-primary">
              SocialHub
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-accent-subtle text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-sm font-semibold text-accent uppercase">
              {user?.username?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.username ?? 'Guest'}
              </p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-surface-elevated transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
