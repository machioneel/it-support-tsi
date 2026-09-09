import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Wrench,
  UserRound,
  Tag,
  Plus,
  Trash2,
  Loader2,
  QrCode,
  Paperclip,
  Upload,
  ExternalLink,
  FileText,
  AlertTriangle,
  AreaChart,
  Maximize2,
  Undo2,
} from 'lucide-react';
import {
  fetchAssetAssignments,
  fetchAssetMaintenanceLogs,
  fetchCompanies,
  createMaintenanceLog,
  deleteMaintenanceLog,
  fetchAssetDocuments,
  uploadAssetDocument,
  deleteAssetDocument,
} from '@/lib/supabase';
import { STATUS_CONFIG, CONDITION_CLASSES, getCategoryIcon } from '@/lib/assetConfig';
import { calculateDepreciation, isDepreciable, DEPRECIATION_YEARS } from '@/lib/depreciation';
import { dateInputToISO } from '@/lib/dates';
import { initialsOf } from '@/lib/text';
import { formatCurrency } from '@/lib/money';
import { movementOf, formatHoldDuration } from '@/lib/assetMovement';
import type { MovementRecord } from '@/lib/assetMovement';
import AssetReturnDoc from './AssetReturnDoc';
import type { Asset, AssetAssignment, AssetMaintenanceLog, AssetDocument, Company } from '@/lib/types';
import { ASSET_DOCUMENT_CATEGORIES } from '@/lib/types';

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  /** Opens the barcode sheet for this asset. */
  onShowBarcode?: (asset: Asset) => void;
}

const MAX_DOC_MB = 10;

type TabId = 'ringkasan' | 'maintenance' | 'dokumen';

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('id-ID');
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('id-ID');
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AssetDetailModal({ asset, isOpen, onClose, onShowBarcode }: AssetDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ringkasan');
  // Reprinting the return document for any past holder, not only the last one.
  const [returnDocFor, setReturnDocFor] = useState<MovementRecord | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Without this the scroll offset of the previous tab carries over, so a short
  // tab can open already scrolled past its own content.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [logs, setLogs] = useState<AssetMaintenanceLog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // asset_assignments / asset_maintenance_logs may not exist yet (migration not run).
  const [historyUnavailable, setHistoryUnavailable] = useState(false);

  // Maintenance form
  const [showLogForm, setShowLogForm] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [logDescription, setLogDescription] = useState('');
  const [logPerformedAt, setLogPerformedAt] = useState('');
  const [logCost, setLogCost] = useState('');
  const [logNextAt, setLogNextAt] = useState('');

  // Documents
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [docsUnavailable, setDocsUnavailable] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docCategory, setDocCategory] = useState<string>(ASSET_DOCUMENT_CATEGORIES[0]);
  // Picked but not yet uploaded, so the category can be set for the file you can see.
  const [stagedFile, setStagedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isOpen || !asset) return;

    let cancelled = false;
    setActiveTab('ringkasan');
    setPhotoOpen(false);
    setHistoryLoading(true);
    setHistoryUnavailable(false);
    setShowLogForm(false);
    setStagedFile(null);
    setDocError(null);
    setLogError(null);

    Promise.all([
      fetchAssetAssignments(asset.id),
      fetchAssetMaintenanceLogs(asset.id),
    ])
      .then(([a, m]) => {
        if (cancelled) return;
        setAssignments(a);
        setLogs(m);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Asset history unavailable:', err);
        setAssignments([]);
        setLogs([]);
        setHistoryUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    fetchCompanies()
      .then((data) => { if (!cancelled) setCompanies(data as Company[]); })
      .catch(() => {});

    setDocsUnavailable(false);
    fetchAssetDocuments(asset.id)
      .then((rows) => { if (!cancelled) setDocuments(rows); })
      .catch((err) => {
        console.error('Asset documents unavailable:', err);
        if (cancelled) return;
        setDocuments([]);
        setDocsUnavailable(true);
      });

    return () => { cancelled = true; };
  }, [isOpen, asset]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // A document opened from the history sits above this modal and closes first.
      if (returnDocFor) { setReturnDocFor(null); return; }
      // The photo sits on top of the modal, so it takes Escape first — otherwise
      // dismissing the photo would close the whole detail view with it.
      if (photoOpen) {
        setPhotoOpen(false);
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, photoOpen, returnDocFor]);

  if (!isOpen || !asset) return null;

  const reloadLogs = async () => setLogs(await fetchAssetMaintenanceLogs(asset.id));

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLog(true);
    setLogError(null);
    try {
      const cost = logCost.trim() === '' ? null : Number(logCost);
      if (cost !== null && Number.isNaN(cost)) {
        throw new Error('Biaya harus berupa angka.');
      }
      await createMaintenanceLog({
        asset_id: asset.id,
        description: logDescription.trim() === '' ? null : logDescription.trim(),
        cost,
        // Let the column default to now() when no date was given.
        performed_at: dateInputToISO(logPerformedAt),
        next_maintenance_at: dateInputToISO(logNextAt),
      });
      await reloadLogs();
      setLogDescription('');
      setLogPerformedAt('');
      setLogCost('');
      setLogNextAt('');
      setShowLogForm(false);
    } catch (err: any) {
      console.error(err);
      setLogError(err?.message || 'Gagal menyimpan catatan perawatan');
    } finally {
      setSavingLog(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteMaintenanceLog(id);
      await reloadLogs();
    } catch (err: any) {
      console.error(err);
      setLogError(err?.message || 'Gagal menghapus catatan perawatan');
    }
  };

  const handlePickFile = (file: File | undefined) => {
    setDocError(null);
    if (!file) return;
    if (file.size > MAX_DOC_MB * 1024 * 1024) {
      setDocError(`Ukuran berkas ${formatBytes(file.size)} melebihi batas ${MAX_DOC_MB} MB.`);
      return;
    }
    setStagedFile(file);
  };

  const handleUploadDoc = async () => {
    if (!stagedFile) return;
    setUploading(true);
    setDocError(null);
    try {
      await uploadAssetDocument(asset.id, stagedFile, docCategory);
      setDocuments(await fetchAssetDocuments(asset.id));
      setStagedFile(null);
    } catch (err: any) {
      console.error(err);
      setDocError(err?.message || 'Gagal mengunggah dokumen');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (doc: AssetDocument) => {
    setDocError(null);
    try {
      await deleteAssetDocument(doc);
      setDocuments(await fetchAssetDocuments(asset.id));
    } catch (err: any) {
      console.error(err);
      setDocError(err?.message || 'Gagal menghapus dokumen');
    }
  };

  const CategoryIcon = getCategoryIcon(asset.category);
  const statusCfg = STATUS_CONFIG[asset.status];
  const companyName = companies.find((c) => c.id === asset.company_id)?.company_name ?? '—';
  const currentHolder = assignments.find((a) => a.status === 'assigned');
  // The active assignment is already shown above the list; repeating it there
  // just prints the same person twice.
  const pastAssignments = assignments.filter((a) => a.status !== 'assigned');
  const depreciation = calculateDepreciation(asset);
  const showDepreciation = isDepreciable(asset.asset_type);

  const tabs: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'ringkasan', label: 'Ringkasan', icon: Tag },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, count: logs.length },
    { id: 'dokumen', label: 'Dokumen', icon: Paperclip, count: documents.length },
  ];

  return createPortal(
    <>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="liquid-panel shadow-2xl w-full sm:rounded-3xl max-w-4xl relative z-10 flex flex-col h-full sm:h-[80vh] sm:max-h-[680px] overflow-hidden animate-[slideUp_0.3s_ease]">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            {asset.asset_image ? (
              <button
                type="button"
                onClick={() => setPhotoOpen(true)}
                title="Lihat foto"
                className="group relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 ring-1 ring-white/60 dark:ring-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img
                  src={asset.asset_image}
                  alt={asset.asset_name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-gray-900/0 group-hover:bg-gray-900/45 transition-colors">
                  <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </button>
            ) : (
              <div className="w-14 h-14 rounded-2xl liquid-icon-box text-blue-700 flex items-center justify-center shrink-0">
                <CategoryIcon size={24} />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{asset.asset_name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-mono tracking-wide">{asset.asset_tag}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border capitalize ${statusCfg?.classes ?? 'text-gray-600 bg-gray-50 border-gray-200 dark:border-gray-700'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {statusCfg?.label ?? asset.status.replace('_', ' ')}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs — one job per tab instead of everything at once */}
        <div className="px-4 sm:px-6 shrink-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-3">
            {tabs.map(({ id, label, icon: Icon, count }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'liquid-nav-item-active text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`} />
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold liquid-badge text-blue-700">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="overflow-y-auto flex-1 px-4 sm:px-6 pb-6 scrollbar-thin">

          {/* ---------------------------------------------------- Ringkasan */}
          {activeTab === 'ringkasan' && (
            <div className="space-y-4">
              {/* Two stacked columns rather than a 2x2 grid — cards of
                  differing height then flow instead of leaving gaps. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-4">
                  <Card title="Spesifikasi" icon={Tag}>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                      <Field label="Kategori" value={asset.category} capitalize />
                      <Field label="Tipe" value={asset.asset_type} />
                      <Field label="Merk" value={asset.brand} />
                      <Field label="Model" value={asset.model} />
                      <Field label="Serial number" value={asset.serial_number} mono />
                      <div>
                        <FieldLabel>Kondisi</FieldLabel>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border capitalize ${CONDITION_CLASSES[asset.condition] ?? 'text-gray-600 bg-gray-50 border-gray-200 dark:border-gray-700'}`}>
                          {asset.condition || '—'}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card
                    title="Penugasan"
                    icon={UserRound}
                    className={showDepreciation ? '' : 'md:col-span-2'}
                  >
                    {historyUnavailable ? (
                      <InlineUnavailable />
                    ) : historyLoading ? (
                      <Loading />
                    ) : (
                      <>
                        {currentHolder ? (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {initialsOf(currentHolder.employee?.full_name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {currentHolder.employee?.full_name ?? 'Karyawan tidak dikenal'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {currentHolder.employee?.division ?? '—'} · sejak {formatDate(currentHolder.assigned_date)}
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              Aktif
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Aset ini belum diserahkan ke siapa pun.
                          </p>
                        )}

                        {pastAssignments.length > 0 && (
                          <>
                            <div className="my-3 border-t border-white/60 dark:border-gray-700/50" />
                            <FieldLabel>
                              Riwayat perpindahan ({pastAssignments.length} pemegang sebelumnya)
                            </FieldLabel>
                            <ul className="space-y-1.5">
                              {pastAssignments.map((a) => {
                                const move = movementOf(a);
                                return (
                                  <li
                                    key={a.id}
                                    className="flex items-start justify-between gap-2 text-sm py-1"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-gray-700 dark:text-gray-200 truncate">
                                        {move.fullName}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(move.assignedDate)} → {formatDate(move.returnedDate)}
                                        {' · '}
                                        {formatHoldDuration(move.assignedDate, move.returnedDate)}
                                      </div>
                                      {move.notes && (
                                        <div className="text-xs text-gray-400 dark:text-gray-500 italic truncate">
                                          {move.notes}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => setReturnDocFor(move)}
                                      className="shrink-0 p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                      title="Cetak berita acara pengembalian"
                                    >
                                      <Undo2 className="w-3.5 h-3.5" />
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </>
                        )}
                      </>
                    )}
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card title="Penempatan & Pembelian" icon={FileText}>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                      <Field label="Perusahaan" value={companyName} />
                      <Field label="Lokasi" value={asset.location} placeholder="Belum diatur" />
                      <Field label="Harga beli" value={formatCurrency(asset.purchase_cost)} />
                      <Field label="Tanggal beli" value={formatDate(asset.purchase_date)} />
                    </div>
                  </Card>

                  {showDepreciation && (
                    <Card title="Penyusutan" icon={AreaChart}>
                      {depreciation ? (
                        <>
                        <FieldLabel>Nilai buku</FieldLabel>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(depreciation.bookValue)}
                        </div>

                        <div className="relative h-1.5 w-full rounded-full bg-gray-200/70 dark:bg-gray-700/50 mt-3">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              depreciation.fullyDepreciated ? 'bg-gray-400' : 'bg-blue-600'
                            }`}
                            style={{ width: `${depreciation.percentUsed}%` }}
                          />
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {Math.round(depreciation.percentUsed)}% terpakai · garis lurus {DEPRECIATION_YEARS} tahun
                          {depreciation.fullyDepreciated
                            ? ' · sudah disusutkan penuh'
                            : ` · sisa ${depreciation.monthsRemaining} bulan`}
                        </p>

                        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/60 dark:border-gray-700/50">
                          <Field label="Akumulasi" value={formatCurrency(depreciation.accumulated)} />
                          <Field label="Per bulan" value={formatCurrency(depreciation.monthly)} />
                          <Field label="Umur" value={`${depreciation.monthsElapsed}/${depreciation.monthsTotal} bln`} />
                        </div>
                        </>
                      ) : (
                        <Hint>Lengkapi harga dan tanggal pembelian untuk menghitung penyusutan.</Hint>
                      )}
                    </Card>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
                Dibuat {formatDateTime(asset.created_at)} · Diperbarui {formatDateTime(asset.updated_at)}
              </p>
            </div>
          )}

          {/* ---------------------------------------------------- Maintenance */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              {historyUnavailable ? (
                <Unavailable />
              ) : (
                <Card
                  title="Riwayat perawatan"
                  icon={Wrench}
                  action={
                    <button
                      type="button"
                      onClick={() => { setShowLogForm((v) => !v); setLogError(null); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showLogForm ? 'Batal' : 'Tambah'}
                    </button>
                  }
                >
                  {logError && <ErrorBox>{logError}</ErrorBox>}

                  {showLogForm && (
                    <form onSubmit={handleAddLog} className="mb-4 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/50 space-y-3">
                      <div>
                        <FieldLabel>Deskripsi pekerjaan</FieldLabel>
                        <input
                          type="text"
                          value={logDescription}
                          onChange={(e) => setLogDescription(e.target.value)}
                          placeholder="mis. Ganti thermal paste & bersihkan kipas"
                          className={inputClass}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <FieldLabel>Tanggal servis</FieldLabel>
                          <input type="date" value={logPerformedAt} onChange={(e) => setLogPerformedAt(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <FieldLabel>Biaya (IDR)</FieldLabel>
                          <input type="number" min="0" step="1" value={logCost} onChange={(e) => setLogCost(e.target.value)} placeholder="0" className={inputClass} />
                        </div>
                        <div>
                          <FieldLabel>Servis berikutnya</FieldLabel>
                          <input type="date" value={logNextAt} onChange={(e) => setLogNextAt(e.target.value)} className={inputClass} />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={savingLog}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {savingLog && <Loader2 className="w-4 h-4 animate-spin" />}
                          Simpan
                        </button>
                      </div>
                    </form>
                  )}

                  {historyLoading ? (
                    <Loading />
                  ) : logs.length === 0 ? (
                    <Empty icon={Wrench}>Belum ada riwayat perawatan.</Empty>
                  ) : (
                    <ul className="space-y-2">
                      {logs.map((log) => (
                        <li
                          key={log.id}
                          className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-white/50 dark:bg-gray-800/40 group"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.description || 'Servis'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {formatDate(log.performed_at)}
                              {log.next_maintenance_at && ` · berikutnya ${formatDate(log.next_maintenance_at)}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {formatCurrency(log.cost)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Hapus entri"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- Dokumen */}
          {activeTab === 'dokumen' && (
            <div className="space-y-4">
              {docsUnavailable ? (
                <Unavailable />
              ) : (
                <>
                  <Card title="Unggah dokumen" icon={Upload}>
                    {docError && <ErrorBox>{docError}</ErrorBox>}

                    {stagedFile ? (
                      /* Pick the file first, then say what it is — you can see what
                         you are labelling instead of setting a category blind. */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/60 dark:bg-gray-800/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {stagedFile.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatBytes(stagedFile.size)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStagedFile(null)}
                            disabled={uploading}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors shrink-0"
                            title="Batalkan pilihan"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                          <div className="flex-1">
                            <FieldLabel>Jenis dokumen</FieldLabel>
                            <select
                              value={docCategory}
                              onChange={(e) => setDocCategory(e.target.value)}
                              className={inputClass}
                            >
                              {ASSET_DOCUMENT_CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={handleUploadDoc}
                            disabled={uploading}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                          >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploading ? 'Mengunggah...' : 'Unggah'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-2xl border-2 border-dashed border-gray-300/80 dark:border-gray-600 cursor-pointer hover:border-blue-500 hover:bg-white/40 dark:hover:bg-gray-800/30 transition-colors text-center">
                        <div className="w-11 h-11 rounded-full liquid-icon-box text-blue-700 flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Pilih berkas untuk diunggah
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          BAST bertanda tangan, invoice, atau kartu garansi · PDF/gambar · maks {MAX_DOC_MB} MB
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="application/pdf,image/*"
                          onChange={(e) => {
                            handlePickFile(e.target.files?.[0]);
                            // Allow re-picking the same file after an error.
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </Card>

                  <Card title="Dokumen tersimpan" icon={Paperclip}>
                    {documents.length === 0 ? (
                      <Empty icon={Paperclip}>Belum ada dokumen terunggah.</Empty>
                    ) : (
                      <ul className="space-y-2">
                        {documents.map((doc) => (
                          <li
                            key={doc.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/40 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 flex items-center gap-1.5"
                                >
                                  <span className="truncate">{doc.file_name || 'Dokumen'}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                                </a>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold liquid-badge text-blue-700">
                                    {doc.category}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(doc.uploaded_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc)}
                              className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                              title="Hapus dokumen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 shrink-0 flex items-center justify-between gap-3 border-t border-white/50 dark:border-gray-700/50">
          {onShowBarcode ? (
            <button
              onClick={() => onShowBarcode(asset)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl liquid-card text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/50 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Barcode
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl liquid-card text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

    {/* Full-size photo, above the modal */}
    {photoOpen && asset.asset_image && (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-10 bg-gray-900/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={() => setPhotoOpen(false)}
      >
        <img
          src={asset.asset_image}
          alt={asset.asset_name}
          className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          type="button"
          onClick={() => setPhotoOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
          aria-label="Tutup foto"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-mono">
          {asset.asset_tag}
        </div>
      </div>
    )}

    <AssetReturnDoc
      asset={asset}
      movement={returnDocFor}
      isOpen={returnDocFor !== null}
      onClose={() => setReturnDocFor(null)}
    />
    </>,
    document.body
  );
}

// Helpers

const inputClass =
  'w-full px-3 py-2 bg-white/80 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';

function Card({
  title,
  icon: Icon,
  action,
  className = '',
  children,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`liquid-card rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{children}</div>;
}

function Field({
  label,
  value,
  placeholder = '—',
  mono = false,
  capitalize = false,
}: {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  const empty = !value;
  return (
    <div className="min-w-0">
      <FieldLabel>{label}</FieldLabel>
      <div
        className={`text-sm font-semibold break-words ${
          empty ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
        } ${mono ? 'font-mono' : ''} ${capitalize ? 'capitalize' : ''}`}
      >
        {value || placeholder}
      </div>
    </div>
  );
}

function Empty({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-7 text-center">
      <Icon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500 dark:text-gray-400">
      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      Memuat...
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>;
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm">
      {children}
    </div>
  );
}

/** Compact variant for use inside an existing Card. */
function InlineUnavailable() {
  return (
    <div className="flex items-start gap-2.5 text-sm text-amber-700 dark:text-amber-400">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>Data penugasan belum tersedia — jalankan migrasi assets.</span>
    </div>
  );
}

function Unavailable() {
  return (
    <div className="liquid-card rounded-2xl p-6 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Data belum tersedia</div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Jalankan migrasi assets untuk membuat tabel pendukungnya.
        </p>
      </div>
    </div>
  );
}
