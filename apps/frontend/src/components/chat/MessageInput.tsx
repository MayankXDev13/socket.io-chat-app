import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled: boolean;
}

export default function MessageInput({ onSend, onTyping, onStopTyping, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    onStopTyping();
  }, [value, onSend, onStopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onTyping();
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(onStopTyping, 2000);
  };

  return (
    <div className="p-4 border-t border-border/50">
      <div className="flex items-end gap-2 glass rounded-xl p-2">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-sm px-3 py-2 placeholder:text-muted-foreground disabled:opacity-50 max-h-32"
          style={{ minHeight: '40px' }}
        />
        <Button size="icon" onClick={handleSend} disabled={disabled || !value.trim()} className="shrink-0 rounded-lg">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
