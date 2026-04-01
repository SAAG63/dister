import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Settings, Calendar, Users } from 'lucide-react';
import { users, posts, followers, following } from '../mocks/data';
import { useAuthStore } from '../store/auth';
import PostCard from '../components/PostCard';
import UserCard from '../components/UserCard';

type Tab = 'posts' | 'followers' | 'following';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  const isMe = id === 'me' || id === currentUser?.id;
  const user = isMe ? currentUser : users.find((u) => u.id === id);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">Пользователь не найден</p>
      </div>
    );
  }

  const userPosts = posts.filter((p) => p.author.id === user.id);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'posts', label: 'Посты', count: userPosts.length },
    { key: 'followers', label: 'Подписчики', count: followers.length },
    { key: 'following', label: 'Подписки', count: following.length },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="border-b border-border">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-br from-accent/20 via-surface to-surface-elevated" />

        <div className="px-5 pb-5">
          {/* Avatar + actions */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-full bg-surface border-4 border-bg flex items-center justify-center text-2xl font-bold text-accent uppercase font-display">
              {user.username.charAt(0)}
            </div>
            {isMe ? (
              <Link
                to="/profile/edit"
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
              >
                <Settings className="w-4 h-4" />
                Редактировать
              </Link>
            ) : (
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isFollowing
                    ? 'border border-border text-text-secondary hover:border-danger hover:text-danger'
                    : 'bg-accent text-bg hover:bg-accent-hover'
                }`}
              >
                {isFollowing ? 'Отписаться' : 'Подписаться'}
              </button>
            )}
          </div>

          {/* Info */}
          <h2 className="font-display font-bold text-xl text-text-primary">
            {user.username}
          </h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(user.createdAt).toLocaleDateString('ru-RU', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {followers.length} подписчиков
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
                activeTab === key
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {label} <span className="text-xs opacity-60">({count})</span>
              {activeTab === key && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'posts' &&
          userPosts.map((post) => <PostCard key={post.id} post={post} />)}

        {activeTab === 'followers' && (
          <div className="p-3">
            {followers.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="p-3">
            {following.map((u) => (
              <UserCard key={u.id} user={u} isFollowing />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
