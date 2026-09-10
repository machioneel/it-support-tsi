import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Paperclip, Star, AlertTriangle } from 'lucide-react';
import { updateTicket } from '@/features/tickets/api';
import { supabase } from '@/services/supabase';
import { useUsers } from '@/hooks/useUsers';
import { resolutionMinutes } from '@/features/tickets/lib/resolution';
import { formatDuration } from '@/lib/format';
import { isoToDateTimeInput, dateTimeInputToISO } from '@/lib/dates';
import type { Ticket, TicketStatus, PriorityLevel } from '@/types';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_ORDER: TicketStatus[] = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
const PRIORITY_ORDER: PriorityLevel[] = ['P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'];

const isDone = (s: TicketStatus) => s === 'Resolved' || s === 'Closed';

export default function TicketDetailModal({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}: TicketDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { users } = useUsers();
  // Tidak disaring per role: tabel `users` sudah hanya berisi staf IT sejak
  // pemisahan users/employees, jadi menyaringnya lagi hanya berisiko
  // mengosongkan daftar kalau ada role baru yang belum terdaftar di sini.
  const assignableUsers = users;

  const [status, setStatus] = useState<TicketStatus>('Open');
  const [priority, setPriority] = useState<PriorityLevel>('P3 - Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [pendingReason, setPendingReason] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [solution, setSolution] = useState('');
  const [finishedAt, setFinishedAt] = useState('');

  useEffect(() => {
    if (!ticket) return;
    setStatus(ticket.ticket_status);
    setPriority(ticket.priority_level);
    setAssigneeId(ticket.assignee_id || '');
    setPendingReason(ticket.pending_reason ?? '');
    setRootCause(ticket.root_cause ?? '');
    setSolution(ticket.solution_applied ?? '');
    setFinishedAt(isoToDateTimeInput(ticket.finished_at));
    setError(null);
  }, [ticket]);

  // Moving to a finished state without a recorded time defaults to now, but the
  // field stays editable so a ticket closed last week can be logged honestly.
  useEffect(() => {
    if (isDone(status) && !finishedAt) {
      setFinishedAt(isoToDateTimeInput(new Date().toISOString()));
    }
  }, [status, finishedAt]);

  if (!isOpen || !ticket) return null;

  const finishedIso = isDone(status) ? dateTimeInputToISO(finishedAt) : null;
  const duration = finishedIso ? resolutionMinutes(ticket.created_at, finishedIso) : null;
  const finishedTooEarly = Boolean(finishedIso) && duration === null;

  const dirty =
    status !== ticket.ticket_status ||
    priority !== ticket.priority_level ||
    assigneeId !== (ticket.assignee_id || '') ||
    pendingReason !== (ticket.pending_reason ?? '') ||
    rootCause !== (ticket.root_cause ?? '') ||
    solution !== (ticket.solution_applied ?? '') ||
    finishedAt !== isoToDateTimeInput(ticket.finished_at);

  const handleSave = async () => {
    if (finishedTooEarly) {
      setError('Tanggal selesai lebih awal daripada tanggal tiket dibuat.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updates: Partial<Ticket> = {
        ticket_status: status,
        priority_level: priority,
        assignee_id: assigneeId || null,
        // Setiap kolom siklus hidup dikosongkan lagi kalau statusnya berpindah
        // keluar — supaya tiket yang dibuka ulang tidak menyimpan solusi lama
        // yang sudah tidak berlaku.
        pending_reason: status === 'Pending' ? pendingReason.trim() || null : null,
        root_cause: isDone(status) ? rootCause.trim() || null : null,
        solution_applied: isDone(status) ? solution.trim() || null : null,
        finished_at: finishedIso,
        resolution_duration_minutes: duration,
      };

      await updateTicket(ticket.id, updates);

      // Trigger Fonnte WhatsApp notification if status changes to Resolved
      if (status === 'Resolved' && ticket.ticket_status !== 'Resolved') {
        const contactNumber = ticket.reporter?.contact_number;
        if (contactNumber) {
          const message = `Halo *${ticket.reporter?.full_name || 'User'}*,\n\nTiket Anda dengan nomor *${ticket.ticket_number}* (${ticket.issue_title}) telah diselesaikan oleh tim IT kami. Silakan cek sistem untuk detail penyelesaiannya.\n\nTerima kasih,\nIT Support`;
          // Fire and forget so we don't block the UI too long
          supabase.functions.invoke('send-wa', {
            body: { target: contactNumber, message },
          }).catch(console.error);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan perubahan tiket');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col items-end sm:items-center sm:justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="liquid-panel shadow-xl w-full sm:rounded-xl max-w-3xl relative z-10 flex flex-col h-full sm:h-auto sm:max-h-[90vh] ml-auto sm:ml-0 overflow-hidden animate-in slide-in-from-right sm:slide-in-from-bottom-4">

        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50 shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ticket.ticket_number}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{ticket.issue_title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">

              <Card title="Deskripsi">
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {ticket.issue_description}
                </p>
                {ticket.attachment_url && (
                  <a
                    href={ticket.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Paperclip className="w-4 h-4" />
                    Lihat lampiran
                  </a>
                )}
              </Card>

              <Card title="Pelapor">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                    {ticket.reporter?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {ticket.reporter?.full_name || 'Tidak diketahui'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {ticket.reporter?.email ?? '—'}
                    </p>
                  </div>
                </div>
              </Card>

              {status === 'Pending' && (
                <Card title="Alasan tertunda">
                  <textarea
                    rows={2}
                    value={pendingReason}
                    onChange={(e) => setPendingReason(e.target.value)}
                    placeholder="mis. menunggu konfirmasi vendor"
                    className={textareaClass}
                  />
                  <p className={hintClass}>
                    Menjelaskan kenapa tiket berhenti — akan dikosongkan otomatis
                    ketika statusnya berpindah lagi.
                  </p>
                </Card>
              )}

              {isDone(status) && (
                <Card title="Penyelesaian">
                  <label className={labelClass}>Akar masalah</label>
                  <textarea
                    rows={2}
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="mis. password kedaluwarsa dan akun terkunci"
                    className={textareaClass}
                  />
                  <label className={`${labelClass} mt-3`}>Solusi yang diterapkan</label>
                  <textarea
                    rows={2}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="mis. reset password lewat admin console, akun dibuka"
                    className={textareaClass}
                  />
                </Card>
              )}

              {(ticket.satisfaction_rating || ticket.employee_feedback) && (
                <Card title="Penilaian pelapor">
                  {ticket.satisfaction_rating && (
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (ticket.satisfaction_rating ?? 0)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                        {ticket.satisfaction_rating}/5
                      </span>
                    </div>
                  )}
                  {ticket.employee_feedback && (
                    <p className="text-sm text-gray-700 dark:text-gray-200 italic">
                      “{ticket.employee_feedback}”
                    </p>
                  )}
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card title="Properti">
                <div className="space-y-4">
                  <Field label="Status">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TicketStatus)}
                      className={selectClass}
                    >
                      {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>

                  <Field label="Prioritas">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                      className={selectClass}
                    >
                      {PRIORITY_ORDER.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>

                  <Field label="Ditangani oleh">
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Belum ditugaskan</option>
                      {assignableUsers.map((user) => (
                        <option key={user.id} value={user.id}>{user.full_name}</option>
                      ))}
                    </select>
                  </Field>

                  <ReadOnly label="Kategori">
                    {ticket.issue_category} — {ticket.issue_subcategory}
                  </ReadOnly>

                  <ReadOnly label="Dilaporkan via">{ticket.reported_via}</ReadOnly>

                  <ReadOnly label="Dibuat">
                    {new Date(ticket.created_at).toLocaleString('id-ID')}
                  </ReadOnly>

                  {isDone(status) && (
                    <>
                      <Field label="Tanggal selesai">
                        <input
                          type="datetime-local"
                          value={finishedAt}
                          onChange={(e) => setFinishedAt(e.target.value)}
                          className={selectClass}
                        />
                      </Field>

                      {finishedTooEarly ? (
                        <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>Lebih awal daripada tanggal dibuat.</span>
                        </div>
                      ) : (
                        <ReadOnly label="Lama penyelesaian">
                          {duration === null ? '—' : formatDuration(duration)}
                        </ReadOnly>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !dirty || finishedTooEarly}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Helpers

const selectClass =
  'w-full px-3 py-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

const textareaClass =
  'w-full px-3 py-2 bg-white/60 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y';

const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5';
const hintClass = 'text-xs text-gray-500 dark:text-gray-400 mt-1.5';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="liquid-card p-5 rounded-xl">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function ReadOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="text-sm text-gray-900 dark:text-white">{children}</div>
    </div>
  );
}
