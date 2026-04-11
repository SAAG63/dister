import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Settings, Calendar, Users } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { getUser, getUserPosts, getFollowers, getFollowing, followUser, unfollowUser } from '../api/users';
import { getBffProfile } from '../api/channels';
import PostCard from '../components/PostCard';
import UserCard from '../components/UserCard';

type Tab = 'posts' | 'followers' | 'following';

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string | null;
  createdAt: string;
  isFollowing: boolean;
  _count: { followers: number; following: number; posts: number };
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isMe = id === 'me' || id === currentUser?.id;
  const profileId = (id === 'me' ? currentUser?.id : id) ?? undefined;

  useEffect(() => {
    if (!profileId) {
      if (id === 'me' && !currentUser) return;
      setLoading(false);
      return;
    }
    setLoading(true);

    getBffProfile(profileId)
      .then((data) => {
        setProfile({
          id: data.id,
          username: data.username,
          email: data.email ?? '',
          avatarUrl: data.avatarUrl,
          createdAt: data.createdAt,
          isFollowing: data.isFollowing,
          _count: data._count,
        });
        setPosts(data.posts?.data ?? []);
        setPostsCursor(data.posts?.nextCursor ?? null);
        setPostsHasMore(data.posts?.hasMore ?? false);
      })
      .catch(() => {
        getUser(profileId).then((data) => setProfile({
          ...data,
          isFollowing: false,
          _count: data._count ?? { followers: 0, following: 0, posts: 0 },
        }));
      })
      .finally(() => setLoading(false));
  }, [profileId, currentUser]);

  useEffect(() => {
    if (!profileId) return;
    if (activeTab === 'posts' && posts.length === 0 && !loading) {
      getUserPosts(profileId).then((res) => {
        setPosts(res.data);
        setPostsCursor(res.nextCursor);
        setPostsHasMore(res.hasMore);
      });
    } else if (activeTab === 'followers') {
      getFollowers(profileId).then((res) => setFollowersList(res.data));
    } else if (activeTab === 'following') {
      getFollowing(profileId).then((res) => setFollowingList(res.data));
    }
  }, [profileId, activeTab]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted font-bold">{loading ? 'Загрузка...' : 'Пользователь не найден'}</p>
      </div>
    );
  }

  const handleFollowToggle = async () => {
    if (!profileId) return;
    if (profile.isFollowing) {
      await unfollowUser(profileId);
      setProfile({ ...profile, isFollowing: false, _count: { ...profile._count, followers: profile._count.followers - 1 } });
    } else {
      await followUser(profileId);
      setProfile({ ...profile, isFollowing: true, _count: { ...profile._count, followers: profile._count.followers + 1 } });
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter((p) => p.id !== postId));
    setProfile({ ...profile, _count: { ...profile._count, posts: profile._count.posts - 1 } });
  };

  const handleLoadMorePosts = async () => {
    if (!profileId || !postsCursor) return;
    const res = await getUserPosts(profileId, postsCursor);
    setPosts((prev) => [...prev, ...res.data]);
    setPostsCursor(res.nextCursor);
    setPostsHasMore(res.hasMore);
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'posts', label: 'Посты', count: profile._count.posts },
    { key: 'followers', label: 'Подписчики', count: profile._count.followers },
    { key: 'following', label: 'Подписки', count: profile._count.following },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-b-3 border-border">
        <div className="h-32 bg-accent" />

        <div className="px-5 pb-5 bg-surface">
          <div className="flex items-end justify-between -mt-10 mb-4">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-20 h-20 rounded-full border-4 border-border object-cover shadow-[3px_3px_0_0] shadow-border" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-surface border-4 border-border flex items-center justify-center text-2xl font-extrabold text-border uppercase font-display shadow-[3px_3px_0_0] shadow-border">
                {profile.username.charAt(0)}
              </div>
            )}
            {isMe ? (
              <Link
                to="/profile/edit"
                className="flex items-center gap-2 px-4 py-2 border-2 border-border text-sm font-bold text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                <Settings className="w-4 h-4" />
                Редактировать
              </Link>
            ) : (
              <button
                onClick={handleFollowToggle}
                className={`px-5 py-2 text-sm font-bold transition-all border-3 border-border ${
                  profile.isFollowing
                    ? 'bg-surface text-text-secondary hover:bg-danger hover:text-white'
                    : 'bg-accent shadow-[3px_3px_0_0] shadow-border hover:shadow-[1px_1px_0_0] hover:translate-x-[2px] hover:translate-y-[2px]'
                }`}
              >
                {profile.isFollowing ? 'Отписаться' : 'Подписаться'}
              </button>
            )}
          </div>

          <h2 className="font-display font-extrabold text-xl text-text-primary">
            {profile.username}
          </h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-text-muted font-semibold">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(profile.createdAt).toLocaleDateString('ru-RU', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {profile._count.followers} подписчиков
            </span>
          </div>
        </div>

        <div className="flex border-t-3 border-border">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-sm font-bold text-center transition-colors relative ${
                activeTab === key
                  ? 'bg-accent text-border'
                  : 'bg-surface text-text-muted hover:bg-surface-elevated'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeTab === 'posts' && (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
            ))}
            {postsHasMore && (
              <button
                onClick={handleLoadMorePosts}
                className="w-full py-3 text-sm font-bold text-text-muted hover:bg-surface-elevated border-b-3 border-border transition-colors"
              >
                Загрузить ещё
              </button>
            )}
          </>
        )}

        {activeTab === 'followers' && (
          <div className="p-3">
            {followersList.map((u: any) => (
              <UserCard key={u.id} user={u} isFollowing={u.isFollowing} />
            ))}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="p-3">
            {followingList.map((u: any) => (
              <UserCard key={u.id} user={u} isFollowing={u.isFollowing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
