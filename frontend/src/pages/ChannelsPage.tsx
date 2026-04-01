import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { channels as mockChannels } from '../mocks/data';
import type { Channel } from '../mocks/data';
import ChannelList from '../components/ChannelList';

export default function ChannelsPage() {
  const [channels] = useState<Channel[]>(mockChannels);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCreate(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-bg/80 border-b border-border px-5 py-4 flex items-center justify-between">
        <h1 className="font-display font-bold text-lg text-text-primary">Каналы</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-bg text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Создать
        </button>
      </div>

      {showCreate && (
        <div className="p-5 border-b border-border bg-surface/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-text-primary">Новый канал</h3>
            <button
              onClick={() => setShowCreate(false)}
              className="p-1 rounded text-text-muted hover:text-text-primary"
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
              className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 transition-colors"
              required
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание"
              className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-accent hover:bg-accent-hover text-bg text-sm font-semibold rounded-lg transition-colors"
            >
              Создать канал
            </button>
          </form>
        </div>
      )}

      <div className="p-3">
        <ChannelList channels={channels} />
      </div>
    </div>
  );
}
