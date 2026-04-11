import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Hash, Users, LogOut, X, Settings, ChevronUp, UserPlus } from 'lucide-react';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { useAuthStore } from '../store/auth';
import { getChannel, joinChannel, leaveChannel, getMembers, updateChannel, setMemberRole, kickMember, inviteMember } from '../api/channels';
import { getAllUsers } from '../api/users';
import { getMessages, sendMessage } from '../api/messages';

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Message {
  id: string;
  author: { id: string; username: string; avatarUrl: string | null; createdAt: string };
  content: string;
  createdAt: string;
  reactions: Reaction[];
}

interface Channel {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  memberCount: number;
  isMember: boolean;
  role: string | null;
  owner: { id: string; username: string };
}

interface Member {
  channelId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; username: string; avatarUrl: string | null; createdAt: string };
}

export default function ChannelChatPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [msgCursor, setMsgCursor] = useState<string | null>(null);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteResults, setInviteResults] = useState<{ id: string; username: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([getChannel(id), getMessages(id)])
      .then(([ch, msgsRes]) => {
        setChannel(ch);
        setMsgs(msgsRes.data.reverse());
        setMsgCursor(msgsRes.nextCursor);
        setHasMoreMsgs(msgsRes.hasMore);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleLoadOlder = async () => {
    if (!id || !msgCursor) return;
    const res = await getMessages(id, msgCursor);
    setMsgs((prev) => [...res.data.reverse(), ...prev]);
    setMsgCursor(res.nextCursor);
    setHasMoreMsgs(res.hasMore);
  };

  const handleShowMembers = async () => {
    if (!id) return;
    if (!showMembers) {
      const res = await getMembers(id);
      setMembers(res.data);
    }
    setShowMembers(!showMembers);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted font-bold">Загрузка...</p>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted font-bold">Канал не найден</p>
      </div>
    );
  }

  const isOwner = channel.role === 'OWNER';
  const isMod = channel.role === 'MODERATOR';
  const canEdit = isOwner || isMod;

  const handleSend = async (content: string) => {
    if (!user || !id) return;
    try {
      const newMsg = await sendMessage(id, content);
      setMsgs((prev) => [...prev, newMsg]);
    } catch {}
  };

  const handleToggleJoin = async () => {
    if (!id) return;
    if (channel.isMember) {
      await leaveChannel(id);
      setChannel({ ...channel, isMember: false, role: null, memberCount: channel.memberCount - 1 });
    } else {
      await joinChannel(id);
      setChannel({ ...channel, isMember: true, role: 'MEMBER', memberCount: channel.memberCount + 1 });
    }
  };

  const handleEditChannel = async () => {
    if (!id) return;
    await updateChannel(id, { name: editName, description: editDesc });
    setChannel({ ...channel, name: editName, description: editDesc });
    setShowEdit(false);
  };

  const openEdit = () => {
    setEditName(channel.name);
    setEditDesc(channel.description || '');
    setShowEdit(true);
  };

  const handleRoleChange = async (targetUserId: string, newRole: 'MODERATOR' | 'MEMBER') => {
    if (!id) return;
    await setMemberRole(id, targetUserId, newRole);
    setMembers(members.map((m) =>
      m.userId === targetUserId ? { ...m, role: newRole } : m,
    ));
  };

  const handleKick = async (targetUserId: string) => {
    if (!id) return;
    await kickMember(id, targetUserId);
    const refreshed = await getMembers(id);
    setMembers(refreshed.data);
    setChannel({ ...channel, memberCount: channel.memberCount - 1 });
  };

  const inviteDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleInviteSearch = (query: string) => {
    setInviteSearch(query);
    if (inviteDebounceRef.current) clearTimeout(inviteDebounceRef.current);
    if (query.length < 2) { setInviteResults([]); return; }
    inviteDebounceRef.current = setTimeout(async () => {
      const res = await getAllUsers(undefined, 10, query);
      const memberIds = new Set(members.map((m) => m.userId));
      setInviteResults(res.data.filter((u: any) => !memberIds.has(u.id)));
    }, 300);
  };

  const handleInvite = async (targetUserId: string) => {
    if (!id) return;
    await inviteMember(id, targetUserId);
    setInviteResults(inviteResults.filter((u) => u.id !== targetUserId));
    const refreshed = await getMembers(id);
    setMembers(refreshed.data);
    setChannel({ ...channel, memberCount: channel.memberCount + 1 });
  };

  const handleDeleteMsg = (msgId: string) => {
    setMsgs((prev) => prev.filter((m) => m.id !== msgId));
  };

  const roleLabel = (role: string) => {
    if (role === 'OWNER') return 'Владелец';
    if (role === 'MODERATOR') return 'Модератор';
    return '';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b-3 border-border bg-surface px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/channels"
            className="p-1.5 border-2 border-border hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-8 h-8 bg-secondary border-2 border-border flex items-center justify-center">
            <Hash className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base text-text-primary">
              {channel.name}
            </h1>
            <p className="text-xs text-text-muted">{channel.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              onClick={openEdit}
              className="flex items-center gap-1 text-xs font-semibold text-text-muted border-2 border-border px-2 py-1 bg-surface-elevated hover:bg-accent transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleShowMembers}
            className="flex items-center gap-1 text-xs font-semibold text-text-muted border-2 border-border px-2 py-1 bg-surface-elevated hover:bg-accent transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            {channel.memberCount}
          </button>
          <button
            onClick={handleToggleJoin}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all border-2 border-border ${
              channel.isMember
                ? 'bg-surface text-text-secondary hover:bg-danger hover:text-white'
                : 'bg-accent shadow-[2px_2px_0_0] shadow-border hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
            }`}
          >
            {channel.isMember ? (
              <>
                <LogOut className="w-3.5 h-3.5" />
                Выйти
              </>
            ) : (
              'Вступить'
            )}
          </button>
        </div>
      </div>

      {showEdit && (
        <div className="border-b-3 border-border bg-surface-elevated p-4 space-y-3">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full bg-surface border-2 border-border px-3 py-2 text-sm outline-none focus:shadow-[2px_2px_0_0] focus:shadow-accent"
            placeholder="Название"
          />
          <input
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full bg-surface border-2 border-border px-3 py-2 text-sm outline-none focus:shadow-[2px_2px_0_0] focus:shadow-accent"
            placeholder="Описание"
          />
          <div className="flex gap-2">
            <button onClick={handleEditChannel} className="px-4 py-1.5 bg-accent border-2 border-border text-xs font-bold hover:bg-accent-hover transition-colors">
              Сохранить
            </button>
            <button onClick={() => setShowEdit(false)} className="px-4 py-1.5 bg-surface border-2 border-border text-xs font-bold text-text-muted hover:bg-surface-elevated transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          {hasMoreMsgs && (
            <button onClick={handleLoadOlder} className="mx-auto my-2 px-4 py-1.5 text-xs font-bold text-text-muted border-2 border-border bg-surface hover:bg-surface-elevated transition-colors flex items-center gap-1">
              <ChevronUp className="w-3.5 h-3.5" />
              Загрузить ранние
            </button>
          )}
          <MessageList messages={msgs} channelId={id!} userRole={channel.role} onDeleted={handleDeleteMsg} />
          {channel.isMember && <MessageInput onSend={handleSend} />}
        </div>

        {showMembers && (
          <div className="w-64 shrink-0 border-l-3 border-border bg-surface overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b-2 border-border">
              <h3 className="text-sm font-bold text-text-primary">Участники</h3>
              <div className="flex items-center gap-1">
                {(isOwner || isMod) && (
                  <button
                    onClick={() => setShowInvite(!showInvite)}
                    className="text-text-muted hover:text-secondary transition-colors"
                    title="Добавить участника"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setShowMembers(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {showInvite && (
              <div className="p-2 border-b-2 border-border">
                <input
                  type="text"
                  value={inviteSearch}
                  onChange={(e) => handleInviteSearch(e.target.value)}
                  placeholder="Поиск по имени..."
                  className="w-full bg-surface border-2 border-border px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none"
                />
                {inviteResults.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2 hover:bg-surface-elevated">
                    <span className="text-xs font-semibold text-text-primary">{u.username}</span>
                    <button
                      onClick={() => handleInvite(u.id)}
                      className="text-[10px] font-bold px-2 py-0.5 bg-secondary text-white border border-border hover:bg-secondary-hover transition-colors"
                    >
                      Добавить
                    </button>
                  </div>
                ))}
              </div>
            )}
            {members.map((m) => (
              <div key={m.userId} className="flex items-center gap-2 p-3 hover:bg-surface-elevated transition-colors">
                <Link to={`/profile/${m.userId}`} className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-accent border-2 border-border flex items-center justify-center text-xs font-bold text-border uppercase">
                    {m.user.username.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{m.user.username}</p>
                    {roleLabel(m.role) && (
                      <p className="text-[10px] text-secondary font-semibold">{roleLabel(m.role)}</p>
                    )}
                  </div>
                </Link>
                {isOwner && m.role !== 'OWNER' && m.userId !== user?.id && (
                  <div className="flex items-center gap-1">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.userId, e.target.value as 'MODERATOR' | 'MEMBER')}
                      className="text-[10px] bg-surface border border-border px-1 py-0.5 outline-none"
                    >
                      <option value="MEMBER">Участник</option>
                      <option value="MODERATOR">Модератор</option>
                    </select>
                    <button
                      onClick={() => handleKick(m.userId)}
                      className="text-text-muted hover:text-danger transition-colors"
                      title="Исключить"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
