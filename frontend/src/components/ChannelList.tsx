import { Link } from 'react-router-dom';
import { Hash, Users } from 'lucide-react';
import type { Channel } from '../mocks/data';

interface ChannelListProps {
  channels: Channel[];
}

export default function ChannelList({ channels }: ChannelListProps) {
  return (
    <div className="space-y-1">
      {channels.map((channel) => (
        <Link
          key={channel.id}
          to={`/channels/${channel.id}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-elevated/70 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center group-hover:border-accent/30 transition-colors">
            <Hash className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">{channel.name}</p>
            <p className="text-xs text-text-muted truncate">{channel.description}</p>
          </div>
          <div className="flex items-center gap-1 text-text-muted text-xs">
            <Users className="w-3.5 h-3.5" />
            <span>{channel.memberCount}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
