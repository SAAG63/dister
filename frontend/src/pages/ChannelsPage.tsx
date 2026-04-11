import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import ChannelList from '../components/ChannelList';
import { getChannels, getMyChannels, createChannel } from '../api/channels';

interface Channel {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  owner: { id: string; username: string };
  memberCount: number;
  createdAt: string;
  role?: string;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    Promise.all([getChannels(), getMyChannels()])
      .then(([publicRes, myChannels]) => {
        const publicIds = new Set(publicRes.data.map((c: Channel) => c.id));
        const privateChannels = myChannels.filter((c: Channel) => !publicIds.has(c.id));
        setChannels([...publicRes.data, ...privateChannels]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const channel = await createChannel(name, description, isPublic);
    setChannels([channel, ...channels]);
    setShowCreate(false);
    setName('');
    setDescription('');
    setIsPublic(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted font-bold">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-bg border-b-3 border-border px-5 py-4 flex items-center justify-between">
        <h1 className="font-display font-extrabold text-lg text-text-primary">Каналы</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover border-3 border-border shadow-[3px_3px_0_0] shadow-border hover:shadow-[1px_1px_0_0] hover:translate-x-[2px] hover:translate-y-[2px] text-border text-sm font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          Создать
        </button>
      </div>

      {showCreate && (
        <div className="p-5 border-b-3 border-border bg-surface-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-text-primary">Новый канал</h3>
            <button
              onClick={() => setShowCreate(false)}
              className="p-1 border-2 border-border hover:bg-danger hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название канала"
              className="w-full bg-surface border-3 border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:shadow-[3px_3px_0_0] focus:shadow-accent transition-shadow"
              required
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание"
              className="w-full bg-surface border-3 border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:shadow-[3px_3px_0_0] focus:shadow-accent transition-shadow"
            />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!isPublic}
                onChange={(e) => setIsPublic(!e.target.checked)}
                className="w-4 h-4 accent-secondary"
              />
              <span className="text-sm font-semibold text-text-secondary">Приватный канал</span>
            </label>
            <button
              type="submit"
              className="px-5 py-2 bg-secondary hover:bg-secondary-hover border-3 border-border shadow-[3px_3px_0_0] shadow-border hover:shadow-[1px_1px_0_0] hover:translate-x-[2px] hover:translate-y-[2px] text-white text-sm font-bold transition-all"
            >
              Создать канал
            </button>
          </form>
        </div>
      )}

      <div className="p-4">
        <ChannelList channels={channels} />
      </div>
    </div>
  );
}
