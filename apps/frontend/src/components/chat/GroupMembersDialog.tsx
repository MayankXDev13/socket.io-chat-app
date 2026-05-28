import type { Room } from '@repo/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserMinus, UserPlus } from 'lucide-react';

interface GroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room;
  currentUserId: string;
  onRemoveMember: (userId: string) => void;
  onAddMember: () => void;
}

export default function GroupMembersDialog({ open, onOpenChange, room, currentUserId, onRemoveMember, onAddMember }: GroupMembersDialogProps) {
  const isCreator = room.createdBy === currentUserId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Group Members</DialogTitle>
          <DialogDescription>{room.members?.length || 0} members in {room.name}</DialogDescription>
        </DialogHeader>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {room.members?.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white text-sm font-semibold">
                  {member.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{member.username}</span>
                  {member.userId === room.createdBy && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Creator</Badge>}
                </div>
              </div>
              {isCreator && member.userId !== currentUserId && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRemoveMember(member.userId)}>
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {isCreator && (
          <Button variant="outline" onClick={onAddMember} className="w-full">
            <UserPlus className="h-4 w-4 mr-2" /> Add Member
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
