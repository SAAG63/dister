import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, UserMinus } from 'lucide-react';
import type { User } from '../mocks/data';

interface UserCardProps {
  user: User;
  isFollowing?: boolean;
  showFollow?: boolean;
}

export default function UserCard({ user, isFollowing: initialFollow = false, showFollow = true }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollow);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-elevated/50 transition-colors">
      <Link to={`/profile/${user.id}`} className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-sm font-semibold text-accent uppercase">
          {user.username.charAt(0)}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${user.id}`}
          className="text-sm font-semibold text-text-primary hover:text-accent transition-colors"
        >
          {user.username}
        </Link>
      </div>
      {showFollow && (
        <button
          onClick={() => setIsFollowing(!isFollowing)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            isFollowing
              ? 'border-border text-text-secondary hover:border-danger hover:text-danger'
              : 'border-accent bg-accent-subtle text-accent hover:bg-accent hover:text-bg'
          }`}
        >
          {isFollowing ? (
            <>
              <UserMinus className="w-3.5 h-3.5" />
              Отписаться
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              Подписаться
            </>
          )}
        </button>
      )}
    </div>
  );
}
