import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Save, ImagePlus, Trash2 } from 'lucide-react';
import {
  createAsset,
  updateAsset,
  setAssetAssignment,
  uploadAssetImage,
  fetchCompanies,
  fetchEmployees,
  fetchAssetAssignments,
} from '@/lib/supabase';
import {
  STATUS_CONFIG,
  ASSET_STATUS_VALUES,
  ASSET_CATEGORIES,
  ASSET_TYPES,
  ASSET_LOCATIONS,
} from '@/lib/assetConfig';
import { isDepreciable, DEPRECIATION_YEARS } from '@/lib/depreciation';
import { dateInputToISO, isoToDateInput, todayInput } from '@/lib/dates';
import type { Asset, Company, Employee } from '@/lib/types';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Pass an asset to edit it; omit to create a new one. */
  asset?: Asset | null;
}

const CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'damaged'];

/** Empty text inputs must go in as NULL — '' would collide on the unique serial_number index. */
const orNull = (v: string) => {
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
};

export default function AssetFormModal({ isOpen, onClose, onSuccess, asset = null }: AssetFormModalProps) {
  const isEdit = asset !== null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  // Set once the asset row exists, so a retry after a failed assignment does not
  // try to insert the same asset_tag twice.
  const [createdAssetId, setCreatedAssetId] = useState<string | null>(null);

  const [assetTag, setAssetTag] = useState('');
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState(ASSET_CATEGORIES[0] ?? 'laptop');
  const [assetType, setAssetType] = useState(ASSET_TYPES[0]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [condition, setCondition] = useState('good');
  const [status, setStatus] = useState('active');
  const [companyId, setCompanyId] = useState('');
  const [location, setLocation] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [assignedDate, setAssignedDate] = useState(todayInput());
  // Who the asset was assigned to when this modal opened, so we can tell a
  // return apart from an asset that was never assigned.
  const [currentEmployeeId, setCurrentEmployeeId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const blankForm = () => {
    setAssetTag('');
    setAssetName('');
    setCategory(ASSET_CATEGORIES[0] ?? 'laptop');
    setAssetType(ASSET_TYPES[0]);
    setBrand('');
    setModel('');
    setSerialNumber('');
    setCondition('good');
    setStatus('active');
    setLocation('');
    setPurchaseCost('');
    setPurchaseDate('');
    setEmployeeId('');
    setCurrentEmployeeId('');
    setAssignedDate(todayInput());
    setImageFile(null);
    setCreatedAssetId(null);
    setError(null);
  };

  // Load reference data whenever the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    fetchCompanies()
      .then((data) => {
        setCompanies(data as Company[]);
        if (!asset) setCompanyId((prev) => prev || (data[0]?.id ?? ''));
      })
      .catch(() => {});
    fetchEmployees()
      .then((data) => setEmployees(data as Employee[]))
      .catch(() => {});
  }, [isOpen, asset]);

  // Prefill from the asset being edited, or clear the form for a new one.
  useEffect(() => {
    if (!isOpen) return;

    if (!asset) {
      blankForm();
      return;
    }

    setAssetTag(asset.asset_tag);
    setAssetName(asset.asset_name);
    setCategory(asset.category);
    setAssetType(asset.asset_type);
    setBrand(asset.brand ?? '');
    setModel(asset.model ?? '');
    setSerialNumber(asset.serial_number ?? '');
    setCondition(asset.condition ?? 'good');
    setStatus(asset.status ?? 'active');
    setCompanyId(asset.company_id ?? '');
    setLocation(asset.location ?? '');
    setPurchaseCost(asset.purchase_cost === null || asset.purchase_cost === undefined ? '' : String(asset.purchase_cost));
    setPurchaseDate(asset.purchase_date ?? '');
    setImageFile(null);
    setCreatedAssetId(null);
    setError(null);

    // Current holder comes from asset_assignments, not from the asset row.
    fetchAssetAssignments(asset.id)
      .then((rows) => {
        const active = rows.find((r) => r.status === 'assigned');
        setEmployeeId(active?.employee_id ?? '');
        setCurrentEmployeeId(active?.employee_id ?? '');
        setAssignedDate(active ? isoToDateInput(active.assigned_date) : todayInput());
      })
      .catch(() => {
        setEmployeeId('');
        setCurrentEmployeeId('');
        setAssignedDate(todayInput());
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, asset]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Only offer employees of the selected company, the way ManualTicketForm does.
  const selectableEmployees = companyId
    ? employees.filter((e) => e.company_id === companyId)
    : employees;

  // Clearing the holder of an already-assigned asset is a return, so the one date
  // field switches meaning rather than silently defaulting the return to today.
  const isReturning = isEdit && !employeeId && !!currentEmployeeId;
  const dateLabel = isReturning ? 'Tanggal Pengembalian' : 'Tanggal Serah Terima';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const cost = purchaseCost.trim() === '' ? null : Number(purchaseCost);
      if (cost !== null && Number.isNaN(cost)) {
        throw new Error('Purchase cost must be a number.');
      }

      // On a retry the asset (and its image) already exist — don't re-upload.
      let imageUrl: string | null = null;
      if (imageFile && !createdAssetId) {
        imageUrl = await uploadAssetImage(imageFile);
      }

      const fields = {
        asset_tag: assetTag.trim(),
        asset_name: assetName.trim(),
        category,
        asset_type: assetType.trim(),
        brand: orNull(brand),
        model: orNull(model),
        serial_number: orNull(serialNumber),
        condition,
        status,
        company_id: companyId || null,
        location: orNull(location),
        purchase_cost: cost,
        purchase_date: orNull(purchaseDate),
      };

      let assetId: string;

      if (isEdit && asset) {
        await updateAsset(asset.id, {
          ...fields,
          // Keep the existing photo unless a new one was picked.
          ...(imageUrl ? { asset_image: imageUrl } : {}),
        });
        assetId = asset.id;
        onSuccess();
      } else if (createdAssetId) {
        assetId = createdAssetId;
      } else {
        const created = await createAsset({ ...fields, asset_image: imageUrl });
        assetId = created.id as string;
        setCreatedAssetId(assetId);
        // Reflect the new asset in the table straight away — if the assignment
        // below fails, the asset itself is still saved.
        onSuccess();
      }

      await setAssetAssignment(assetId, employeeId || null, dateInputToISO(assignedDate));
      onSuccess();

      blankForm();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err?.code === '23505') {
        setError(
          err.message?.includes('serial_number')
            ? 'That serial number is already registered to another asset.'
            : 'That asset tag is already in use.'
        );
      } else if (createdAssetId) {
        setError(
          `Asset saved, but assigning it failed: ${err?.message || 'unknown error'}. ` +
          'Fix the problem and press Save again to retry only the assignment.'
        );
      } else {
        setError(err?.message || `Failed to ${isEdit ? 'update' : 'create'} asset`);
      }
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="liquid-panel shadow-xl w-full sm:rounded-xl max-w-2xl relative z-10 flex flex-col h-full sm:h-auto sm:max-h-[90vh] overflow-hidden animate-in fade-in sm:zoom-in-95">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Asset' : 'New Asset'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isEdit
                ? `Perbarui data ${asset?.asset_tag}`
                : 'Tambahkan perangkat baru ke inventaris IT'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="p-6 overflow-y-auto flex-1 space-y-6">

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Identity */}
            <FieldGroup title="Identity">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Asset Tag" required>
                  <input
                    type="text"
                    required
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    placeholder="e.g. TSI-LT-001"
                    className={inputClass}
                  />
                </Field>
                <Field label="Asset Name" required>
                  <input
                    type="text"
                    required
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="e.g. Lenovo ThinkPad T14"
                    className={inputClass}
                  />
                </Field>
              </div>
            </FieldGroup>

            {/* Classification */}
            <FieldGroup title="Classification">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category" required>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`${inputClass} capitalize`}
                  >
                    {/* An edited asset may carry a category that predates this list */}
                    {!ASSET_CATEGORIES.includes(category) && category && (
                      <option value={category}>{category}</option>
                    )}
                    {ASSET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Type" required>
                  <select
                    required
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className={inputClass}
                  >
                    {/* An edited asset may carry a type that predates this list */}
                    {!ASSET_TYPES.includes(assetType) && assetType && (
                      <option value={assetType}>{assetType}</option>
                    )}
                    {ASSET_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Brand">
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Lenovo"
                    className={inputClass}
                  />
                </Field>
                <Field label="Model">
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. T14 Gen 3"
                    className={inputClass}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Serial Number">
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="Kosongkan bila tidak ada"
                      className={`${inputClass} font-mono`}
                    />
                  </Field>
                </div>
              </div>
            </FieldGroup>

            {/* Status */}
            <FieldGroup title="Status & Condition">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Status" required>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass}
                  >
                    {ASSET_STATUS_VALUES.map((s) => (
                      <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Condition" required>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className={`${inputClass} capitalize`}
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </FieldGroup>

            {/* Placement */}
            <FieldGroup title="Placement">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Company">
                  <select
                    value={companyId}
                    onChange={(e) => { setCompanyId(e.target.value); setEmployeeId(''); }}
                    className={inputClass}
                  >
                    <option value="">Not set</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Location">
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Not set</option>
                    {/* An edited asset may carry a location that predates this list */}
                    {!ASSET_LOCATIONS.includes(location) && location && (
                      <option value={location}>{location}</option>
                    )}
                    {ASSET_LOCATIONS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Assigned To">
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Belum diserahkan</option>
                    {selectableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} — {emp.division}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={dateLabel}>
                  <input
                    type="date"
                    value={assignedDate}
                    max={todayInput()}
                    disabled={!employeeId && !isReturning}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                    {isReturning
                      ? 'Mengosongkan pemegang aset berarti aset dikembalikan. Isi tanggal pengembalian sebenarnya — boleh mundur.'
                      : 'Karyawan pemegang aset beserta tanggal serah terima sebenarnya — isi mundur bila asetnya baru diinput sekarang. Mengganti karyawan akan menutup catatan lama dan membuka yang baru di riwayat assignment.'}
                  </p>
                </div>
              </div>
            </FieldGroup>

            {/* Purchase */}
            <FieldGroup title="Purchase">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Purchase Cost (IDR)">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    placeholder="e.g. 15000000"
                    className={inputClass}
                  />
                </Field>
                <Field label="Purchase Date">
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              {isDepreciable(assetType) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Tipe {assetType} disusutkan garis lurus selama {DEPRECIATION_YEARS} tahun.
                  Isi biaya dan tanggal pembelian agar nilai bukunya bisa dihitung.
                </p>
              )}
            </FieldGroup>

            {/* Photo */}
            <FieldGroup title="Photo">
              {imageFile ? (
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3 min-w-0">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{imageFile.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {(imageFile.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {isEdit && asset?.asset_image && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <img
                        src={asset.asset_image}
                        alt={asset.asset_name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Foto saat ini. Pilih file baru untuk menggantinya.
                      </span>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors">
                    <ImagePlus className="w-4 h-4" />
                    <span>{isEdit && asset?.asset_image ? 'Ganti foto aset' : 'Pilih foto aset (opsional)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              )}
            </FieldGroup>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 dark:border-gray-700/50 shrink-0 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Save Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// Helpers

const inputClass =
  'w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-700/50">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
