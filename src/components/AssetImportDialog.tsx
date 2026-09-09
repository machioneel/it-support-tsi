import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
} from 'lucide-react';
import { createAsset, updateAsset, fetchCompanies } from '@/lib/supabase';
import { parseAssetCsv, IMPORT_COLUMNS } from '@/lib/assetCsv';
import type { ParseResult, RowError } from '@/lib/assetCsv';
import type { Asset, Company } from '@/lib/types';

interface AssetImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Existing assets, used to tell an update apart from an insert. */
  assets: Asset[];
}

interface ImportSummary {
  created: number;
  updated: number;
  failed: RowError[];
}

export default function AssetImportDialog({ isOpen, onClose, onSuccess, assets }: AssetImportDialogProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFileName('');
    setParsed(null);
    setSummary(null);
    setError(null);
    setProgress(0);
    fetchCompanies()
      .then((data) => setCompanies(data as Company[]))
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !importing) onClose(); };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, importing]);

  if (!isOpen) return null;

  const byTag = new Map(assets.map((a) => [a.asset_tag.toLowerCase(), a]));

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setSummary(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      setParsed(parseAssetCsv(text, companies));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Gagal membaca berkas');
      setParsed(null);
    }
  };

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    setProgress(0);
    setError(null);

    let created = 0;
    let updated = 0;
    const failed: RowError[] = [];

    // One row at a time: a partial import still leaves every successful row
    // saved, and each failure can name the line it came from.
    for (const row of parsed.rows) {
      try {
        const existing = byTag.get(row.assetTag.toLowerCase());
        if (existing) {
          await updateAsset(existing.id, row.fields);
          updated++;
        } else {
          await createAsset({ ...row.fields, asset_image: null });
          created++;
        }
      } catch (err: any) {
        console.error(err);
        failed.push({
          line: row.line,
          assetTag: row.assetTag,
          message: err?.code === '23505'
            ? 'Serial number sudah dipakai aset lain.'
            : err?.message || 'Gagal disimpan',
        });
      }
      setProgress((p) => p + 1);
    }

    setSummary({ created, updated, failed });
    setImporting(false);
    onSuccess();
  };

  const newCount = parsed?.rows.filter((r) => !byTag.has(r.assetTag.toLowerCase())).length ?? 0;
  const updateCount = (parsed?.rows.length ?? 0) - newCount;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !importing && onClose()}></div>

      <div className="liquid-panel shadow-2xl w-full sm:rounded-3xl max-w-2xl relative z-10 flex flex-col h-full sm:h-auto sm:max-h-[85vh] overflow-hidden animate-[slideUp_0.3s_ease]">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl liquid-icon-box text-blue-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Import Aset</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Unggah berkas CSV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={importing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 disabled:opacity-40 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 scrollbar-thin space-y-4">

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* --------------------------------------------- done */}
          {summary ? (
            <div className="liquid-card rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white">Import selesai</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <strong>{summary.created}</strong> aset baru ditambahkan,{' '}
                    <strong>{summary.updated}</strong> diperbarui
                    {summary.failed.length > 0 && <>, <strong>{summary.failed.length}</strong> gagal</>}.
                  </p>
                </div>
              </div>

              {summary.failed.length > 0 && (
                <ul className="mt-4 space-y-1 max-h-40 overflow-y-auto text-xs">
                  {summary.failed.map((f) => (
                    <li key={f.line} className="text-red-600 dark:text-red-400">
                      Baris {f.line} ({f.assetTag}): {f.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              {/* --------------------------------------------- pick file */}
              <label className={`flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-2xl border-2 border-dashed transition-colors text-center ${
                importing
                  ? 'border-gray-200 cursor-not-allowed opacity-60'
                  : 'border-gray-300/80 dark:border-gray-600 cursor-pointer hover:border-blue-500 hover:bg-white/40 dark:hover:bg-gray-800/30'
              }`}>
                <div className="w-11 h-11 rounded-full liquid-icon-box text-blue-700 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {fileName || 'Pilih berkas CSV'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Pemisah koma, titik koma, atau tab — terdeteksi otomatis
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,text/csv"
                  disabled={importing}
                  onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
                />
              </label>

              <a
                href="/contoh-import-assets.csv"
                download
                className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Download className="w-4 h-4" />
                Unduh contoh berkas
              </a>

              {/* --------------------------------------------- preview */}
              {parsed && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <Stat label="Siap diimpor" value={parsed.rows.length} tone="text-gray-900 dark:text-white" />
                    <Stat label="Aset baru" value={newCount} tone="text-emerald-600" />
                    <Stat label="Diperbarui" value={updateCount} tone="text-blue-600" />
                  </div>

                  {parsed.ignoredColumns.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Kolom diabaikan: {parsed.ignoredColumns.join(', ')}.
                    </p>
                  )}

                  {parsed.errors.length > 0 && (
                    <div className="liquid-card rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {parsed.errors.length} baris dilewati
                        </span>
                      </div>
                      <ul className="space-y-1 max-h-40 overflow-y-auto text-xs text-gray-600 dark:text-gray-400">
                        {parsed.errors.map((e, i) => (
                          <li key={`${e.line}-${i}`}>
                            <span className="font-medium">Baris {e.line}</span>
                            {e.assetTag && <span className="font-mono"> ({e.assetTag})</span>}: {e.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsed.rows.length > 0 && (
                    <div className="liquid-card rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto max-h-56">
                        <table className="w-full text-xs text-left whitespace-nowrap">
                          <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-100/60 dark:border-gray-700/50">
                            <tr>
                              <th className="px-3 py-2">Tag</th>
                              <th className="px-3 py-2">Nama</th>
                              <th className="px-3 py-2">Tipe</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                            {parsed.rows.map((r) => {
                              const isUpdate = byTag.has(r.assetTag.toLowerCase());
                              return (
                                <tr key={r.line}>
                                  <td className="px-3 py-2 font-mono">{r.assetTag}</td>
                                  <td className="px-3 py-2">{r.fields.asset_name}</td>
                                  <td className="px-3 py-2">{r.fields.asset_type}</td>
                                  <td className="px-3 py-2">{r.fields.status}</td>
                                  <td className="px-3 py-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      isUpdate
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                      {isUpdate ? 'Perbarui' : 'Baru'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!parsed && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Kolom yang dibaca: {IMPORT_COLUMNS.join(', ')}. Baris dicocokkan
                  berdasarkan <span className="font-mono">asset_tag</span> — yang sudah ada
                  akan diperbarui, sisanya ditambahkan. Kolom lain diabaikan.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 shrink-0 flex items-center justify-between gap-3 border-t border-white/50 dark:border-gray-700/50">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {importing && `Menyimpan ${progress} dari ${parsed?.rows.length ?? 0}...`}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 rounded-xl liquid-card text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white/60 disabled:opacity-50 transition-colors"
            >
              {summary ? 'Tutup' : 'Batal'}
            </button>
            {!summary && (
              <button
                onClick={handleImport}
                disabled={importing || !parsed || parsed.rows.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Import {parsed?.rows.length ? `${parsed.rows.length} baris` : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="liquid-card rounded-xl p-3">
      <div className={`text-xl font-bold ${tone}`}>{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
