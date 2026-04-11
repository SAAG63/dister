import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, UserMinus } from 'lucide-react';
import type { User } from '../types';
import { followUser, unfollowUser } from '../api/users';
import { useAuthStore } from '../store/auth';

interface UserCardProps {
  user: User;
  isFollowing?: boolean;
  showFollow?: boolean;
}

export default function UserCard({ user, isFollowing: initialFollow = false, showFollow = true }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollow);
  const [loading, setLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  const isMe = currentUser?.id === user.id;

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.id);
        setIsFollowing(false);
      } else {
        await followUser(user.id);
        setIsFollowing(true);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border-b-2 border-border-light hover:bg-surface-elevated/50 transition-colors">
      <Link to={`/profile/${user.id}`} className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-accent border-2 border-border flex items-center justify-center text-sm font-bold text-border uppercase">
          {user.username.charAt(0)}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${user.id}`}
          className="text-sm font-bold text-text-primary hover:text-secondary transition-colors"
        >
          {user.username}
        </Link>
      </div>
      {showFollow && !isMe && (
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all border-2 border-border ${
            isFollowing
              ? 'bg-surface text-text-secondary hover:bg-danger hover:text-white'
              : 'bg-accent shadow-[2px_2px_0_0] shadow-border hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
          } ${loading ? 'opacity-50' : ''}`}
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
