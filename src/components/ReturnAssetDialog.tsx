import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Undo2 } from 'lucide-react';
import { returnAsset } from '@/lib/supabase';
import type { ActiveAssignment } from '@/lib/supabase';
import { dateInputToISO, isoToDateInput, todayInput } from '@/lib/dates';
import { initialsOf } from '@/lib/text';
import type { MovementRecord } from '@/lib/assetMovement';
import type { Asset } from '@/lib/types';

interface ReturnAssetDialogProps {
  asset: Asset | null;
  holder: ActiveAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  /**
   * Receives the leg of the movement history that was just closed, so the caller
   * can raise the return document without re-reading it from the database.
   */
  onSuccess: (movement: MovementRecord) => void;
}

export default function ReturnAssetDialog({
  asset,
  holder,
  isOpen,
  onClose,
  onSuccess,
}: ReturnAssetDialogProps) {
  const [returnedDate, setReturnedDate] = useState(todayInput());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setReturnedDate(todayInput());
    setNote('');
    setError(null);
  }, [isOpen, asset]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, saving]);

  if (!isOpen || !asset) return null;

  // The asset cannot come back before it went out.
  const minDate = holder ? isoToDateInput(holder.assignedDate) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const returnedIso = dateInputToISO(returnedDate);
      await returnAsset(asset.id, returnedIso, note.trim() || null);
      onSuccess({
        fullName: holder?.fullName ?? '—',
        division: holder?.division ?? '—',
        assignedDate: holder?.assignedDate ?? returnedIso ?? '',
        returnedDate: returnedIso,
        notes: note.trim() || null,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Gagal mencatat pengembalian');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => !saving && onClose()}></div>

      <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl w-full max-w-md relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease]">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Undo2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kembalikan Aset</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 truncate font-mono">{asset.asset_tag}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Who is handing it back */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {initialsOf(holder?.fullName)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {holder?.fullName ?? 'Tidak diketahui'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {holder?.division ?? '—'}
                  {holder && ` · dipegang sejak ${new Date(holder.assignedDate).toLocaleDateString('id-ID')}`}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Tanggal Pengembalian <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={returnedDate}
                min={minDate}
                max={todayInput()}
                onChange={(e) => setReturnedDate(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Boleh diisi mundur bila aset sudah dikembalikan sebelum dicatat.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Catatan
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="mis. Kembali dalam kondisi baik"
                className={inputClass}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
              Kembalikan
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
