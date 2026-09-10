import { useEffect, useState, useRef } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { createTicket, uploadAttachment } from '@/features/tickets/api';
import { fetchCompanies } from '@/services/companies';
import { fetchEmployees } from '@/services/directory';
import { compressImage } from '@/lib/format';
import type { Company, Employee, ReportedVia } from '@/types';

const REPORTED_VIA: ReportedVia[] = ['Web Portal', 'WhatsApp Direct', 'Phone Call', 'Walk-In'];

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewTicketModal({ isOpen, onClose, onSuccess }: NewTicketModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    issue_title: '',
    issue_category: 'Software',
    issue_subcategory: 'General',
    priority_level: 'P3 - Medium',
    issue_description: '',
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reporterId, setReporterId] = useState('');
  // Kanal masuknya laporan. Sebelumnya dipaku ke 'Web Portal', padahal hampir
  // semua tiket di sini datang lewat WhatsApp — kolomnya terisi tapi salah.
  const [reportedVia, setReportedVia] = useState<ReportedVia>('WhatsApp Direct');

  useEffect(() => {
    if (!isOpen) return;
    fetchCompanies()
      .then((data) => {
        setCompanies(data as Company[]);
        setCompanyId((prev) => prev || (data[0]?.id ?? ''));
      })
      .catch(() => {});

    fetchEmployees()
      .then((data) => setEmployees(data as Employee[]))
      .catch(() => {});
  }, [isOpen]);

  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const compressedFiles = await Promise.all(newFiles.map(f => compressImage(f)));
      setFiles((prev) => [...prev, ...compressedFiles].slice(0, 3)); // Max 3 files
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      const compressedFiles = await Promise.all(newFiles.map(f => compressImage(f)));
      setFiles((prev) => [...prev, ...compressedFiles].slice(0, 3));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!companyId) {
        throw new Error('Pilih perusahaan terlebih dahulu.');
      }

      // Generate a simple ticket number
      const ticketNumber = `INC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // Berkas yang dipilih sebelumnya tidak pernah diunggah ke mana pun —
      // pemilihnya ada, hasilnya tidak tersimpan. Satu berkas pertama dipakai
      // karena `tickets` hanya punya satu kolom attachment_url.
      let attachmentUrl: string | null = null;
      if (files.length > 0) {
        attachmentUrl = await uploadAttachment(files[0]);
      }

      await createTicket({
        ticket_number: ticketNumber,
        company_id: companyId,
        reporter_id: reporterId || null,
        issue_title: formData.issue_title,
        issue_category: formData.issue_category as any,
        issue_subcategory: formData.issue_subcategory,
        priority_level: formData.priority_level as any,
        issue_description: formData.issue_description,
        ticket_status: 'Open',
        reported_via: reportedVia,
        attachment_url: attachmentUrl,
      });

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        issue_title: '',
        issue_category: 'Software',
        issue_subcategory: 'General',
        priority_level: 'P3 - Medium',
        issue_description: '',
      });
      setFiles([]);
      setReporterId('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="liquid-panel rounded-xl shadow-xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Ticket</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form id="new-ticket-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Issue Title <span className="text-red-500">*</span></label>
              <input 
                required
                type="text" 
                value={formData.issue_title}
                onChange={(e) => setFormData({...formData, issue_title: e.target.value})}
                placeholder="Brief summary of the issue"
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Company <span className="text-red-500">*</span></label>
              <select
                required
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Pilih perusahaan...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Pelapor
                </label>
                <select
                  value={reporterId}
                  onChange={(e) => setReporterId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Tidak dicatat</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} — {e.division}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Dilaporkan via <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={reportedVia}
                  onChange={(e) => setReportedVia(e.target.value as ReportedVia)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {REPORTED_VIA.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Category <span className="text-red-500">*</span></label>
                <select 
                  required
                  value={formData.issue_category}
                  onChange={(e) => setFormData({...formData, issue_category: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none"
                >
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Network">Network</option>
                  <option value="Account & Access">Account & Access</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Priority <span className="text-red-500">*</span></label>
                <select 
                  required
                  value={formData.priority_level}
                  onChange={(e) => setFormData({...formData, priority_level: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none"
                >
                  <option value="P1 - Critical">P1 - Critical</option>
                  <option value="P2 - High">P2 - High</option>
                  <option value="P3 - Medium">P3 - Medium</option>
                  <option value="P4 - Low">P4 - Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea 
                required
                rows={5}
                value={formData.issue_description}
                onChange={(e) => setFormData({...formData, issue_description: e.target.value})}
                placeholder="Detailed description of the problem..."
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
              />
            </div>
            
            {/* Drag & Drop */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Attachments (Optional)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*"
                />
                <div className="text-center">
                  <Upload
                    className={`w-6 h-6 mx-auto mb-2 transition-colors ${
                      dragOver ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
                    }`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Drag and drop images here, or{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      browse
                    </span>
                  </p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm"
                    >
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1 font-medium">
                        {f.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700/50 shrink-0 flex items-center justify-end gap-3 bg-transparent rounded-b-xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="new-ticket-form"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}

