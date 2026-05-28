import { useState } from 'react';
import type { Room } from '@repo/shared';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MessageSquare, Users, Plus, LogOut, Search } from 'lucide-react';

interface SidebarProps {
  rooms: Room[];
  activeRoomId?: string;
  onSelectRoom: (roomId: string) => void;
  onNewChat: () => void;
  onCreateGroup: () => void;
  currentUserId: string;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getRoomDisplayName(room: Room, currentUserId: string) {
  if (room.isGroup) return room.name || 'Group';
  const other = room.members?.find((m) => m.userId !== currentUserId);
  return other?.username || 'Chat';
}

export default function Sidebar({ rooms, activeRoomId, onSelectRoom, onNewChat, onCreateGroup, currentUserId }: SidebarProps) {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');

  const filtered = rooms.filter((r) =>
    getRoomDisplayName(r, currentUserId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-col glass-strong rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold gradient-text">ChatVault</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                  {user?.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {/* Search + Actions */}
      <div className="p-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background/50" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onNewChat}>
            <Plus className="mr-1 h-4 w-4" /> New Chat
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onCreateGroup}>
            <Users className="mr-1 h-4 w-4" /> Group
          </Button>
        </div>
      </div>

      <Separator />

      {/* Room List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No conversations yet</p>
          )}
          {filtered.map((room) => {
            const name = getRoomDisplayName(room, currentUserId);
            const isActive = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                  isActive ? 'bg-primary/15 border border-primary/30' : 'hover:bg-secondary/50'
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white font-semibold">
                    {room.isGroup ? <Users className="h-4 w-4" /> : name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{name}</span>
                    {room.lastMessage && (
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatTime(room.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {room.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {room.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
