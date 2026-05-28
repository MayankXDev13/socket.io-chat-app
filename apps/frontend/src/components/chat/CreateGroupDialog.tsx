import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUsers } from '@/hooks/useUsers';
import { X, Search, Loader2 } from 'lucide-react';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
  isCreating?: boolean;
}

export default function CreateGroupDialog({ open, onOpenChange, onCreateGroup, isCreating }: CreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ id: string; username: string }[]>([]);
  const { users, isLoading } = useUsers(query);

  const addMember = (user: { id: string; username: string }) => {
    if (!selected.find((s) => s.id === user.id)) {
      setSelected([...selected, user]);
    }
    setQuery('');
  };

  const removeMember = (id: string) => setSelected(selected.filter((s) => s.id !== id));

  const handleCreate = () => {
    if (name.trim() && selected.length > 0) {
      onCreateGroup(name.trim(), selected.map((s) => s.id));
      setName('');
      setSelected([]);
      setQuery('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a group</DialogTitle>
          <DialogDescription>Give your group a name and add members.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input id="group-name" placeholder="e.g., Project Team" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((m) => (
                <Badge key={m.id} variant="secondary" className="gap-1">
                  {m.username}
                  <button onClick={() => removeMember(m.id)}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Add members</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            {query.length >= 2 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {isLoading && <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>}
                {users.filter((u) => !selected.find((s) => s.id === u.id)).map((user) => (
                  <button key={user.id} onClick={() => addMember(user)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors text-left text-sm">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">{user.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {user.username}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || isCreating}>
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
