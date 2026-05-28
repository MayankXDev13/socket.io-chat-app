import { useRef, useEffect } from 'react';
import type { Message } from '@repo/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import MessageBubble from './MessageBubble';
import { MessageSquare, Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isGroup: boolean;
  currentUserId: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  typingUsers: string[];
  isLoading: boolean;
}

export default function MessageList({ messages, isGroup, currentUserId, hasNextPage, isFetchingNextPage, onLoadMore, typingUsers, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLength = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevLength.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLength.current = messages.length;
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <MessageSquare className="h-12 w-12 opacity-30" />
        <p className="text-lg font-medium">No messages yet</p>
        <p className="text-sm">Say hello! 👋</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-3">
        {hasNextPage && (
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Load older messages
            </Button>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUserId}
            showSender={isGroup}
          />
        ))}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm animate-fade-in">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" style={{ animation: 'typing-dot 1.4s infinite 0s' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" style={{ animation: 'typing-dot 1.4s infinite 0.2s' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" style={{ animation: 'typing-dot 1.4s infinite 0.4s' }} />
            </div>
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
