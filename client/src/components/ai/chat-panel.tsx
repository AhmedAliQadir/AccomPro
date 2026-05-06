import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { ChatMessageBubble } from './chat-message';
import { ChatInput } from './chat-input';
import { useChat } from '@/hooks/use-chat';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
  const { messages, isStreaming, conversationId, sendMessage, loadConversation, clearConversation, stopStreaming } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedConvo, setSelectedConvo] = useState<string>('');

  const { data: convosData } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ['/api/ai/conversations'],
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/ai/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversations'] });
      clearConversation();
      setSelectedConvo('');
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Refresh conversation list when conversationId changes
  useEffect(() => {
    if (conversationId) {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversations'] });
      setSelectedConvo(conversationId);
    }
  }, [conversationId]);

  const handleConvoSelect = (value: string) => {
    if (value === 'new') {
      clearConversation();
      setSelectedConvo('');
    } else {
      setSelectedConvo(value);
      loadConversation(value);
    }
  };

  const conversations = convosData?.conversations || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-base">AI Compliance Assistant</SheetTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedConvo || 'new'} onValueChange={handleConvoSelect}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="New conversation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" /> New conversation
                  </span>
                </SelectItem>
                {conversations.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title || 'Untitled'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {conversationId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => deleteMutation.mutate(conversationId)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="flex flex-col gap-4 p-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12">
                <p className="font-medium mb-2">AccomPro AI Assistant</p>
                <p>Ask questions about your organisation's compliance, staff, incidents, and more.</p>
                <div className="mt-4 space-y-1 text-xs">
                  <p>"Which staff have DBS checks expiring soon?"</p>
                  <p>"Show me overdue compliance audits"</p>
                  <p>"What's our current occupancy rate?"</p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatMessageBubble key={i} message={msg} />
            ))}
          </div>
        </ScrollArea>

        <ChatInput
          onSend={sendMessage}
          onStop={stopStreaming}
          isStreaming={isStreaming}
        />
      </SheetContent>
    </Sheet>
  );
}
