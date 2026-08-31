import { useState, useEffect } from 'react';
import { X, Clock, MessageSquare, AlertCircle, CheckCircle2, User as UserIcon, Loader2, Save } from 'lucide-react';
import { createPortal } from 'react-dom';
import { updateTicket, supabase } from '@/lib/supabase';
import { useUsers } from '@/lib/useUsers';
import type { Ticket, TicketStatus, PriorityLevel } from '@/lib/types';
import { STATUS_ORDER, PRIORITY_ORDER } from '@/lib/types';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TicketDetailModal({ ticket, isOpen, onClose, onSuccess }: TicketDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { users } = useUsers();
  const technicians = users.filter(u => u.role === 'Technician' || u.role === 'Admin');

  const [status, setStatus] = useState<TicketStatus>('Open');
  const [priority, setPriority] = useState<PriorityLevel>('P3 - Medium');
  const [assigneeId, setAssigneeId] = useState<string>('');

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.ticket_status);
      setPriority(ticket.priority_level);
      setAssigneeId(ticket.assignee_id || '');
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const updates: Partial<Ticket> = {
        ticket_status: status,
        priority_level: priority,
        assignee_id: assigneeId || null,
      };

      if (status === 'Resolved' || status === 'Closed') {
        if (!ticket.finished_at) {
          updates.finished_at = new Date().toISOString();
        }
      } else {
        updates.finished_at = null; // Reopening
      }

      await updateTicket(ticket.id, updates);

      // Trigger Fonnte WhatsApp notification if status changes to Resolved
      if (status === 'Resolved' && ticket.ticket_status !== 'Resolved') {
        const contactNumber = ticket.reporter?.contact_number;
        if (contactNumber) {
          const message = `Halo *${ticket.reporter?.full_name || 'User'}*,\n\nTiket Anda dengan nomor *${ticket.ticket_number}* (${ticket.issue_title}) telah diselesaikan oleh tim IT kami. Silakan cek sistem untuk detail penyelesaiannya.\n\nTerima kasih,\nIT Support`;
          // Fire and forget so we don't block the UI too long
          supabase.functions.invoke('send-wa', {
            body: { target: contactNumber, message }
          }).catch(console.error);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update ticket');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col items-end sm:items-center sm:justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal / Slide-over */}
      <div className="liquid-panel shadow-xl w-full sm:rounded-xl max-w-2xl relative z-10 flex flex-col h-full sm:h-auto sm:max-h-[90vh] ml-auto sm:ml-0 overflow-hidden animate-in slide-in-from-right sm:slide-in-from-bottom-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ticket.ticket_number}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ticket.issue_title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 ">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="liquid-card p-5 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{ticket.issue_description}</p>
              </div>

              <div className="liquid-card p-5 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Requester Info</h3>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                     {ticket.reporter?.full_name?.charAt(0) || 'U'}
                   </div>
                   <div>
                     <p className="font-medium text-gray-900 dark:text-white">{ticket.reporter?.full_name || 'Unknown User'}</p>
                     <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.reporter?.email}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="liquid-card p-5 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Properties</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Status</label>
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TicketStatus)}
                      className="w-full px-3 py-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Priority</label>
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                      className="w-full px-3 py-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {PRIORITY_ORDER.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Category</label>
                    <div className="text-sm text-gray-900 dark:text-white">{ticket.issue_category} - {ticket.issue_subcategory}</div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Assignee</label>
                    <select 
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full px-3 py-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.id}>{tech.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Created At</label>
                    <div className="text-sm text-gray-900 dark:text-white">{new Date(ticket.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 shrink-0 flex items-center justify-end gap-3 bg-transparent sm:rounded-b-xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={loading || (status === ticket.ticket_status && priority === ticket.priority_level && assigneeId === (ticket.assignee_id || ''))}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


