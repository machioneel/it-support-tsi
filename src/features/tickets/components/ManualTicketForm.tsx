import { useState, useEffect } from 'react';
import type { Ticket, TicketStatus, PriorityLevel, IssueCategory, ReportedVia } from '@/types/index';
import { X, Save, Building2, User as UserIcon, Phone, Mail, Tag } from 'lucide-react';
import { fetchEmployees } from '@/services/directory';
import { createTicket } from '@/features/tickets/api';
import { fetchCompanies } from '@/services/companies';
import type { Company, Employee } from '@/types/index';

interface Props {
  onClose: () => void;
  onCreated?: (ticket: Ticket) => void;
}

const STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
const PRIORITIES: PriorityLevel[] = ['P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'];
const CATEGORIES: IssueCategory[] = ['Hardware', 'Software', 'Network', 'Account & Access'];
const CHANNELS: ReportedVia[] = ['Web Portal', 'WhatsApp Direct', 'Phone Call', 'Walk-In'];

export default function ManualTicketForm({ onClose, onCreated }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [reporterId, setReporterId] = useState('');
  const [channel, setChannel] = useState<ReportedVia>('Phone Call');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Hardware');
  const [subcategory, setSubcategory] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('P3 - Medium');
  const [status, setStatus] = useState<TicketStatus>('Open');
  const [markResolved, setMarkResolved] = useState(false);
  const [rootCause, setRootCause] = useState('');
  const [solution, setSolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompanies().then(setCompanies).catch(() => {});
    fetchEmployees().then(setEmployees).catch(() => {});
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const filteredEmployees = employees.filter((e) => e.company_id === companyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !title.trim() || !description.trim()) return;
    setSaving(true);
    setError('');
    try {
      const finalStatus: TicketStatus = markResolved ? 'Resolved' : status;
      const d = new Date();
      const ticketNumber = `TIC-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      const created = await createTicket({
        ticket_number: ticketNumber,
        company_id: companyId,
        reporter_id: reporterId || null,
        reported_via: channel,
        issue_title: title,
        issue_description: description,
        issue_category: category,
        issue_subcategory: subcategory || 'General',
        priority_level: priority,
        ticket_status: finalStatus,
        pending_reason: null,
        root_cause: markResolved ? rootCause : null,
        solution_applied: markResolved ? solution : null,
        attachment_url: null,
        finished_at: markResolved ? new Date().toISOString() : null,
        resolution_duration_minutes: markResolved ? 0 : null,
      });
      onCreated?.(created);
      onClose();
    } catch {
      setError('Gagal membuat tiket. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />
      <div className="relative min-h-screen flex items-start sm:items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl my-8 animate-[slideUp_0.3s_ease]">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
            <h2 className="text-base font-semibold text-slate-800">
              Catat Tiket Manual
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Company & Reporter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 inline mr-1" />
                  Perusahaan
                </label>
                <select
                  value={companyId}
                  onChange={(e) => {
                    setCompanyId(e.target.value);
                    setReporterId('');
                  }}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white dark:bg-gray-800"
                >
                  <option value="">Pilih perusahaan...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  <UserIcon className="w-3.5 h-3.5 inline mr-1" />
                  Pelapor (Opsional)
                </label>
                <select
                  value={reporterId}
                  onChange={(e) => setReporterId(e.target.value)}
                  disabled={!companyId}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white dark:bg-gray-800 disabled:opacity-50"
                >
                  <option value="">Pilih karyawan...</option>
                  {filteredEmployees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name} — {e.division}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Channel */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                Dilaporkan Via
              </label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChannel(c)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                      channel === c
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Judul Masalah
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ringkasan kendala"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Deskripsi Masalah
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="Detail laporan dari user..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Category, Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white dark:bg-gray-800"
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
                  placeholder="cth: Monitor, VPN, Printer"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Prioritas
              </label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                      priority === p
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolve toggle */}
            <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl p-4">
              <button
                type="button"
                onClick={() => setMarkResolved(!markResolved)}
                className={`relative w-10 h-6 rounded-full transition-all ${
                  markResolved ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow-sm transition-transform ${
                    markResolved ? 'translate-x-4' : ''
                  }`}
                />
              </button>
              <span className="text-sm text-slate-700">
                Tandai sebagai Resolved segera
              </span>
            </div>

            {markResolved && (
              <div className="space-y-4 animate-[fadeIn_0.2s_ease] border-l-2 border-emerald-100 pl-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Root Cause
                  </label>
                  <textarea
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    rows={2}
                    placeholder="Akar masalah..."
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
                    rows={2}
                    placeholder="Solusi yang diterapkan..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {!markResolved && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Status Awal
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.filter((s) => s !== 'Resolved' && s !== 'Closed').map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                        status === s
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}
          </form>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-3xl">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-sm font-medium text-slate-500 hover:bg-slate-100 transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 rounded-full text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Tiket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
