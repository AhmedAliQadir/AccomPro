import type { ChatMessage } from '@/hooks/use-chat';
import { Bot, User } from 'lucide-react';

const TOOL_LABELS: Record<string, string> = {
  get_staff_overview: 'Checking staff records',
  get_staff_dbs_status: 'Checking DBS status',
  get_staff_training_status: 'Checking training records',
  get_compliance_audits: 'Reviewing compliance audits',
  get_compliance_dashboard: 'Loading compliance dashboard',
  get_incident_stats: 'Analysing incidents',
  get_incidents: 'Fetching incident details',
  get_tenant_overview: 'Reviewing tenant data',
  get_property_occupancy: 'Checking property occupancy',
  get_document_compliance: 'Checking document compliance',
  get_support_notes_summary: 'Reviewing support sessions',
  get_overdue_items: 'Checking overdue items',
};

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {message.toolActivity && message.toolActivity.length > 0 && !isUser && (
          <div className="flex flex-wrap gap-1">
            {Array.from(new Set(message.toolActivity)).map((tool, i) => (
              <span key={i} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {TOOL_LABELS[tool] || tool}...
              </span>
            ))}
          </div>
        )}

        <div className={`rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}>
          {message.content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            <span className="text-muted-foreground italic text-xs">Thinking...</span>
          )}
        </div>
      </div>
    </div>
  );
}
