import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Save } from 'lucide-react';
import { createEmployee, updateEmployee, fetchCompanies } from '@/lib/supabase';
import type { Company, Employee } from '@/lib/types';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Pass an employee to edit it; omit to create a new one. */
  employee?: Employee | null;
}

export default function EmployeeFormModal({
  isOpen,
  onClose,
  onSuccess,
  employee = null,
}: EmployeeFormModalProps) {
  const isEdit = employee !== null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [division, setDivision] = useState('Lainnya');
  const [contactNumber, setContactNumber] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetchCompanies()
      .then((data) => {
        setCompanies(data as Company[]);
        // Only default the company when creating; an edit keeps what it has.
        if (!employee) setCompanyId((prev) => prev || data[0]?.id || '');
      })
      .catch(() => {});
  }, [isOpen, employee]);

  // Prefill from the employee being edited, or clear the form for a new one.
  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (employee) {
      setCompanyId(employee.company_id);
      setFullName(employee.full_name);
      setEmail(employee.email);
      setDivision(employee.division);
      setContactNumber(employee.contact_number ?? '');
    } else {
      setFullName('');
      setEmail('');
      setDivision('Lainnya');
      setContactNumber('');
    }
  }, [isOpen, employee]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose(); };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fields = {
      company_id: companyId,
      full_name: fullName.trim(),
      email: email.toLowerCase().trim(),
      division: division.trim() || 'Lainnya',
      // Empty stays NULL rather than '', so "no number" is one value not two.
      contact_number: contactNumber.trim() || null,
    };

    try {
      if (isEdit && employee) {
        await updateEmployee(employee.id, fields);
      } else {
        await createEmployee({ ...fields, contact_number: fields.contact_number ?? '' });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.code === '23505'
          ? `Email ${fields.email} sudah terdaftar untuk karyawan lain.`
          : err?.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} karyawan`
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => !loading && onClose()}></div>

      <div className="liquid-panel rounded-2xl shadow-xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_ease]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Karyawan' : 'Tambah Karyawan'}
            </h2>
            {isEdit && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{employee?.email}</p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 disabled:opacity-40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {!isEdit && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Karyawan mengirim keluhan lewat Employee Portal memakai emailnya.
                Mereka tidak login ke dashboard ini.
              </p>
            )}

            <Field label="Nama Lengkap" required>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="mis. Andi Pratama"
                className={inputClass}
              />
            </Field>

            <Field label="Email" required>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mis. andi.pratama@tsi.co.id"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Perusahaan" required>
                <select
                  required
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Pilih perusahaan...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Divisi">
                <input
                  type="text"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  placeholder="mis. Sertifikasi, HR, Finance"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Nomor Kontak">
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="mis. 6281234567890"
                className={inputClass}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Dipakai untuk notifikasi WhatsApp saat tiketnya selesai.
              </p>
            </Field>
          </div>

          <div className="p-5 border-t border-gray-100 dark:border-gray-700/50 shrink-0 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Simpan Perubahan' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

const inputClass =
  'w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
