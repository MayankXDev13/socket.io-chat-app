import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers } from '@/hooks/useUsers';
import { Search } from 'lucide-react';

interface UserSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: string) => void;
}

export default function UserSearch({ open, onOpenChange, onSelectUser }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const { users, isLoading } = useUsers(query);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
          <DialogDescription>Search for a user by username to start a direct message.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" autoFocus />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          {!isLoading && users.length === 0 && query.length >= 2 && (
            <p className="text-center text-muted-foreground text-sm py-4">No users found</p>
          )}
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => { onSelectUser(user.id); onOpenChange(false); setQuery(''); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white text-sm font-semibold">
                  {user.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
