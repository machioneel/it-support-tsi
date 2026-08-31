import { useState, useEffect } from 'react';
import type { Ticket, TicketStatus, PriorityLevel, IssueCategory } from '@/lib/types';
import {
  priorityClasses,
  statusClasses,
  formatDate,
  formatDuration,
  priorityShort,
} from '@/lib/utils';
import { X, Save, Building2, User, Tag, Clock, Paperclip, Star } from 'lucide-react';
import { updateTicket } from '@/lib/supabase';

interface Props {
  ticket: Ticket;
  companyName?: string;
  reporterName?: string;
  onClose: () => void;
  onUpdated?: (ticket: Ticket) => void;
}

const STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
const PRIORITIES: PriorityLevel[] = ['P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'];
const CATEGORIES: IssueCategory[] = ['Hardware', 'Software', 'Network', 'Account & Access'];

export default function TicketModal({ ticket, companyName, reporterName, onClose, onUpdated }: Props) {
  const [status, setStatus] = useState<TicketStatus>(ticket.ticket_status);
  const [priority, setPriority] = useState<PriorityLevel>(ticket.priority_level);
  const [category, setCategory] = useState<IssueCategory>(ticket.issue_category);
  const [subcategory, setSubcategory] = useState(ticket.issue_subcategory);
  const [pendingReason, setPendingReason] = useState(ticket.pending_reason ?? '');
  const [rootCause, setRootCause] = useState(ticket.root_cause ?? '');
  const [solution, setSolution] = useState(ticket.solution_applied ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const isResolved = status === 'Resolved' || status === 'Closed';
      const updates: Partial<Ticket> = {
        ticket_status: status,
        priority_level: priority,
        issue_category: category,
        issue_subcategory: subcategory,
        pending_reason: status === 'Pending' ? pendingReason : null,
        root_cause: isResolved ? rootCause : null,
        solution_applied: isResolved ? solution : null,
        finished_at: isResolved && !ticket.finished_at ? new Date().toISOString() : ticket.finished_at,
        resolution_duration_minutes:
          isResolved && !ticket.resolution_duration_minutes
            ? Math.round((Date.now() - new Date(ticket.created_at).getTime()) / 60000)
            : ticket.resolution_duration_minutes,
      };

      const updated = await updateTicket(ticket.id, updates);
      onUpdated?.(updated);
      onClose();
    } catch {
      setError('Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  const isResolvable = status === 'Resolved' || status === 'Closed';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative liquid-panel rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease]">
        {/* Header */}
        <div className="sticky top-0 bg-transparent border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <span className="text-xs font-mono text-slate-400">{ticket.ticket_number}</span>
            <h2 className="text-base font-semibold text-slate-800 mt-0.5">
              {ticket.issue_title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            {companyName && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{companyName}</span>
              </div>
            )}
            {reporterName && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{reporterName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Dilaporkan via {ticket.reported_via}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDate(ticket.created_at)}</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              {ticket.issue_description}
            </p>
          </div>

          {ticket.attachment_url && (
            <a
              href={ticket.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Lihat lampiran
            </a>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Update Tiket
            </h3>

            {/* Status & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                        status === s
                          ? statusClasses[s] + ' ring-2 ring-offset-1 ring-slate-300'
                          : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Prioritas
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                        priority === p
                          ? priorityClasses[p] + ' ring-2 ring-offset-1 ring-slate-300'
                          : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {priorityShort(p)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white dark:bg-gray-800"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Subkategori
                </label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Pending reason */}
            {status === 'Pending' && (
              <div className="mt-4 animate-[fadeIn_0.2s_ease]">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Alasan Pending
                </label>
                <input
                  type="text"
                  value={pendingReason}
                  onChange={(e) => setPendingReason(e.target.value)}
                  placeholder="Jelaskan alasan penundaan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {/* Resolution fields */}
            {isResolvable && (
              <div className="mt-4 space-y-4 animate-[fadeIn_0.2s_ease] border-l-2 border-emerald-100 pl-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Root Cause
                  </label>
                  <textarea
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="Akar masalah yang ditemukan..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Solution Applied
                  </label>
                  <textarea
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Solusi yang diterapkan..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* Existing resolution info */}
            {ticket.finished_at && (
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                <span>Selesai: {formatDate(ticket.finished_at)}</span>
                <span>Durasi: {formatDuration(ticket.resolution_duration_minutes)}</span>
                {ticket.satisfaction_rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    {ticket.satisfaction_rating}/5
                  </span>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-transparent border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium text-slate-500 hover:bg-slate-100 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-full text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}


