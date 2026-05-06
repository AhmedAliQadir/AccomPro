import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { ChatPanel } from './chat-panel';

export function ChatTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50"
      >
        <Bot className="h-6 w-6" />
      </Button>
      <ChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
