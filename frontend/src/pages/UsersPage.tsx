import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import UserCard from '../components/UserCard';
import { getAllUsers } from '../api/users';

interface UserWithFollow {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string | null;
  createdAt: string;
  isFollowing?: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithFollow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchUsers = (query: string) => {
    setLoading(true);
    getAllUsers(undefined, undefined, query)
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers('');
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(value), 300);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-bg border-b-3 border-border px-5 py-4">
        <div className="flex items-center gap-3 bg-surface border-3 border-border px-3 py-2">
          <Search className="w-5 h-5 text-text-muted shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Поиск по имени..."
            className="flex-1 bg-transparent outline-none text-sm font-semibold text-text-primary placeholder:text-text-muted"
          />
        </div>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="p-8 text-center text-text-muted font-semibold">Загрузка...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-text-muted font-semibold">
            {search ? 'Никого не нашли' : 'Пользователей пока нет'}
          </div>
        ) : (
          users.map((u) => (
            <UserCard key={u.id} user={u} isFollowing={u.isFollowing} />
          ))
        )}
      </div>
    </div>
  );
}
