import type { Ticket } from '@/lib/types';
import {
  priorityClasses,
  statusClasses,
  statusDotClasses,
  timeAgo,
  priorityShort,
} from '@/lib/utils';
import { Paperclip, MessageSquare } from 'lucide-react';

interface Props {
  ticket: Ticket;
  companyName?: string;
  reporterName?: string;
  onClick: () => void;
  compact?: boolean;
}

export default function TicketCard({
  ticket,
  companyName,
  reporterName,
  onClick,
  compact = false,
}: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono text-slate-400">
          {ticket.ticket_number}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${priorityClasses[ticket.priority_level]}`}
        >
          {priorityShort(ticket.priority_level)}
        </span>
      </div>

      <h3 className="text-sm font-medium text-slate-800 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
        {ticket.issue_title}
      </h3>

      {!compact && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
          {ticket.issue_description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${statusClasses[ticket.ticket_status]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusDotClasses[ticket.ticket_status]}`} />
          {ticket.ticket_status}
        </span>
        <span className="text-xs text-slate-400">{ticket.issue_category}</span>
      </div>

      {!compact && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {reporterName && <span>{reporterName}</span>}
            {ticket.attachment_url && (
              <Paperclip className="w-3 h-3" />
            )}
          </div>
          <span className="text-xs text-slate-400">{timeAgo(ticket.created_at)}</span>
        </div>
      )}

      {companyName && compact && (
        <p className="text-xs text-slate-400 mt-2 truncate">{companyName}</p>
      )}
    </button>
  );
}
