import type { Room } from '@repo/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronLeft, MoreVertical, Users } from 'lucide-react';

interface RoomHeaderProps {
  room: Room;
  currentUserId: string;
  typingUsers: string[];
  onBack: () => void;
  onViewMembers: () => void;
  onAddMember: () => void;
}

function getRoomName(room: Room, currentUserId: string) {
  if (room.isGroup) return room.name || 'Group';
  const other = room.members?.find((m) => m.userId !== currentUserId);
  return other?.username || 'Chat';
}

export default function RoomHeader({ room, currentUserId, typingUsers, onBack, onViewMembers, onAddMember }: RoomHeaderProps) {
  const name = getRoomName(room, currentUserId);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 glass">
      <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={onBack}>
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white text-sm font-semibold">
          {room.isGroup ? <Users className="h-4 w-4" /> : name[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-sm truncate">{name}</h2>
        {typingUsers.length > 0 ? (
          <p className="text-xs text-primary animate-fade-in">{typingUsers.join(', ')} typing...</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{room.memberCount} members</Badge>
          </p>
        )}
      </div>

      {room.isGroup && room.createdBy === currentUserId && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewMembers}>View Members</DropdownMenuItem>
            <DropdownMenuItem onClick={onAddMember}>Add Member</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
