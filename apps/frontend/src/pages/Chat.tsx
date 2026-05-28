import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRooms } from '@/hooks/useRooms';
import { useMessages } from '@/hooks/useMessages';
import { useSocket } from '@/hooks/useSocket';
import Sidebar from '@/components/layout/Sidebar';
import RoomHeader from '@/components/chat/RoomHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import UserSearch from '@/components/chat/UserSearch';
import CreateGroupDialog from '@/components/chat/CreateGroupDialog';
import GroupMembersDialog from '@/components/chat/GroupMembersDialog';
import { MessageSquare, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Chat() {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rooms, isLoading: roomsLoading, createRoom, addMember, removeMember } = useRooms();
  const { messages, fetchNextPage, hasNextPage, isFetchingNextPage, sendMessage, isLoading: messagesLoading } = useMessages(roomId);
  const { socket } = useSocket();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const currentRoom = rooms.find((r) => r.id === roomId);

  // Socket room join/leave
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('join_room', roomId);
    return () => { socket.emit('leave_room', roomId); };
  }, [socket, roomId]);

  // Typing events
  useEffect(() => {
    if (!socket) return;
    const onTyping = (data: { roomId: string; userId: string; username: string }) => {
      if (data.roomId === roomId && data.userId !== user?.id) {
        setTypingUsers((prev) => prev.includes(data.username) ? prev : [...prev, data.username]);
      }
    };
    const onStopTyping = (data: { roomId: string; userId: string }) => {
      if (data.roomId === roomId) {
        setTypingUsers((prev) => prev.filter((u) => u !== data.userId));
        // Also remove by username since we stored username
        setTypingUsers((prev) => {
          const member = currentRoom?.members?.find((m) => m.userId === data.userId);
          return member ? prev.filter((u) => u !== member.username) : prev;
        });
      }
    };

    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);
    return () => { socket.off('user_typing', onTyping); socket.off('user_stop_typing', onStopTyping); };
  }, [socket, roomId, user?.id, currentRoom]);

  // Clear typing on room change
  useEffect(() => { setTypingUsers([]); }, [roomId]);

  const handleSelectRoom = useCallback((id: string) => {
    navigate(`/chat/${id}`);
    setSidebarOpen(false);
  }, [navigate]);

  const handleNewChat = useCallback(async (userId: string) => {
    const room = await createRoom.mutateAsync({ memberIds: [userId], isGroup: false });
    navigate(`/chat/${room.id}`);
  }, [createRoom, navigate]);

  const handleCreateGroup = useCallback(async (name: string, memberIds: string[]) => {
    const room = await createRoom.mutateAsync({ name, memberIds, isGroup: true });
    setCreateGroupOpen(false);
    navigate(`/chat/${room.id}`);
  }, [createRoom, navigate]);

  const handleTyping = useCallback(() => { socket?.emit('typing', roomId!); }, [socket, roomId]);
  const handleStopTyping = useCallback(() => { socket?.emit('stop_typing', roomId!); }, [socket, roomId]);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost" size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed md:relative z-40 h-full w-80 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar
          rooms={rooms}
          activeRoomId={roomId}
          onSelectRoom={handleSelectRoom}
          onNewChat={() => setUserSearchOpen(true)}
          onCreateGroup={() => setCreateGroupOpen(true)}
          currentUserId={user?.id || ''}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {roomId && currentRoom ? (
          <>
            <RoomHeader
              room={currentRoom}
              currentUserId={user?.id || ''}
              typingUsers={typingUsers}
              onBack={() => navigate('/chat')}
              onViewMembers={() => setMembersOpen(true)}
              onAddMember={() => setAddMemberOpen(true)}
            />
            <MessageList
              messages={messages}
              isGroup={currentRoom.isGroup}
              currentUserId={user?.id || ''}
              hasNextPage={hasNextPage ?? false}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={() => fetchNextPage()}
              typingUsers={typingUsers}
              isLoading={messagesLoading}
            />
            <MessageInput
              onSend={sendMessage}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
              disabled={false}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-primary/50" />
            </div>
            <h2 className="text-2xl font-bold gradient-text">Welcome to ChatVault</h2>
            <p className="text-sm">Select a conversation or start a new one</p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <UserSearch open={userSearchOpen} onOpenChange={setUserSearchOpen} onSelectUser={handleNewChat} />
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onCreateGroup={handleCreateGroup}
        isCreating={createRoom.isPending}
      />
      {currentRoom && (
        <>
          <GroupMembersDialog
            open={membersOpen}
            onOpenChange={setMembersOpen}
            room={currentRoom}
            currentUserId={user?.id || ''}
            onRemoveMember={(userId) => removeMember.mutate({ roomId: currentRoom.id, userId })}
            onAddMember={() => { setMembersOpen(false); setAddMemberOpen(true); }}
          />
          <UserSearch
            open={addMemberOpen}
            onOpenChange={setAddMemberOpen}
            onSelectUser={(userId) => addMember.mutate({ roomId: currentRoom.id, userId })}
          />
        </>
      )}
    </div>
  );
}
