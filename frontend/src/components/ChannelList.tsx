import { Link } from 'react-router-dom';
import { Hash, Lock, Users } from 'lucide-react';
import type { Channel } from '../types';

interface ChannelListProps {
  channels: (Channel & { role?: string })[];
}

export default function ChannelList({ channels }: ChannelListProps) {
  return (
    <div className="space-y-3">
      {channels.map((channel) => (
        <Link
          key={channel.id}
          to={`/channels/${channel.id}`}
          className={`flex items-center gap-3 p-4 border-3 border-border shadow-[4px_4px_0_0] shadow-border hover:shadow-[2px_2px_0_0] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group ${
            channel.isPublic ? 'bg-surface' : 'bg-gray-100'
          }`}
        >
          <div className={`w-10 h-10 border-2 border-border flex items-center justify-center ${
            channel.isPublic ? 'bg-secondary' : 'bg-gray-400'
          }`}>
            {channel.isPublic ? (
              <Hash className="w-5 h-5 text-white" />
            ) : (
              <Lock className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary">{channel.name}</p>
            <p className="text-xs text-text-muted truncate">{channel.description}</p>
          </div>
          <div className="flex items-center gap-1 text-text-muted text-xs font-semibold border-2 border-border px-2 py-1 bg-surface-elevated">
            <Users className="w-3.5 h-3.5" />
            <span>{channel.memberCount}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
