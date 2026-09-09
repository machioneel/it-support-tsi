import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, RefreshCw } from 'lucide-react';
import { fetchCompanies, fetchUsers } from '@/lib/supabase';
import type { ActiveAssignment } from '@/lib/supabase';
import { todayInput } from '@/lib/dates';
import { suggestDocNumber, longDate, shortDate } from '@/lib/docFormat';
import { formatCurrency } from '@/lib/money';
import { assetAgeMonths, formatAge, RENEWAL_AGE_YEARS } from '@/lib/assetAge';
import { calculateDepreciation, DEPRECIATION_YEARS } from '@/lib/depreciation';
import {
  docInputClass,
  LabelledInput,
  Letterhead,
  SignatureBlock,
  Th,
  Td,
} from './documentParts';
import type { Asset, Company, User } from '@/lib/types';

interface AssetRenewalReportProps {
  /**
   * The rows to print: either the ticked selection or, when nothing is ticked,
   * everything the renewal tab currently lists.
   */
  assets: Asset[];
  /** True when `assets` came from ticked rows, so the document can say so. */
  selectionUsed?: boolean;
  holders: Record<string, ActiveAssignment>;
  isOpen: boolean;
  onClose: () => void;
}

function suggestRole(user: User | undefined) {
  if (!user) return '';
  return user.role === 'Admin' ? 'IT Admin' : 'IT Support';
}

export default function AssetRenewalReport({
  assets,
  selectionUsed = false,
  holders,
  isOpen,
  onClose,
}: AssetRenewalReportProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [itStaff, setItStaff] = useState<User[]>([]);

  const [docNumber, setDocNumber] = useState('');
  const [reportDate, setReportDate] = useState(todayInput());
  const [place, setPlace] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [preparedById, setPreparedById] = useState('');
  const [preparedByRole, setPreparedByRole] = useState('');
  // No table holds who approves a budget request, so it is typed in and left
  // blank rather than guessed at.
  const [approverName, setApproverName] = useState('');
  const [approverRole, setApproverRole] = useState('');

  const now = new Date();

  useEffect(() => {
    if (!isOpen) return;

    const date = todayInput();
    setReportDate(date);
    setDocNumber(suggestDocNumber('UPA-IT', date));

    fetchCompanies()
      .then((data) => {
        const list = data as Company[];
        setCompanies(list);
        // The list can span several companies, so the letterhead defaults to
        // whichever owns most of the rows — and the table names the owner of
        // every asset anyway, so nothing is hidden by that choice.
        const tally = new Map<string, number>();
        for (const a of assets) {
          if (a.company_id) tally.set(a.company_id, (tally.get(a.company_id) ?? 0) + 1);
        }
        const dominant = [...tally.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
        setCompanyId(dominant ?? list[0]?.id ?? '');
      })
      .catch(() => {});

    fetchUsers()
      .then((data) => {
        const staff = data as User[];
        setItStaff(staff);

        let signedIn: User | undefined;
        const session = sessionStorage.getItem('it_session');
        if (session) {
          try {
            const { email } = JSON.parse(session);
            if (email) {
              signedIn = staff.find(
                (u) => u.email.toLowerCase() === String(email).toLowerCase()
              );
            }
          } catch {
            // Malformed session — fall through to the first staff member.
          }
        }

        const chosen = signedIn ?? staff[0];
        setPreparedById(chosen?.id ?? '');
        setPreparedByRole(suggestRole(chosen));
      })
      .catch(() => {});
  }, [isOpen, assets]);

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

  const companyNameOf = (id: string | null | undefined) =>
    companies.find((c) => c.id === id)?.company_name ?? '—';

  const headCompany = companyNameOf(companyId);
  const preparedBy = itStaff.find((u) => u.id === preparedById);

  // One pass, so the table and the summary can never disagree.
  const rows = assets.map((asset) => {
    const months = assetAgeMonths(asset.purchase_date, now);
    const dep = calculateDepreciation(asset, now);
    return {
      asset,
      months,
      overdue: months !== null && months >= DEPRECIATION_YEARS * 12,
      bookValue: dep ? dep.bookValue : null,
      holder: holders[asset.id]?.fullName ?? null,
    };
  });

  const overdueCount = rows.filter((r) => r.overdue).length;
  const withCost = rows.filter((r) => r.asset.purchase_cost != null);
  const totalCost = withCost.reduce((sum, r) => sum + Number(r.asset.purchase_cost), 0);
  const withBook = rows.filter((r) => r.bookValue !== null);
  const totalBook = withBook.reduce((sum, r) => sum + (r.bookValue as number), 0);
  const missingCost = rows.length - withCost.length;

  return createPortal(
    <div className="print-shell fixed inset-0 z-[70] flex items-start justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm no-print" onClick={onClose}></div>

      <div className="print-shell bg-white dark:bg-gray-900 shadow-2xl w-full sm:rounded-2xl max-w-6xl relative z-10 my-0 sm:my-4 overflow-hidden">

        {/* Header — screen only */}
        <div className="no-print flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Usulan Peremajaan Aset</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 truncate">
                {rows.length} aset — {selectionUsed ? 'baris yang Anda pilih' : 'sesuai filter yang sedang aktif'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fields the document needs but the database does not hold */}
        <div className="no-print px-6 py-5 bg-gray-50/70 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <LabelledInput label="Nomor Dokumen" value={docNumber} onChange={setDocNumber} />
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Tanggal</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className={docInputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Perusahaan pada kop</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className={docInputClass}
            >
              <option value="">Pilih perusahaan...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Disiapkan oleh</label>
            <select
              value={preparedById}
              onChange={(e) => {
                setPreparedById(e.target.value);
                setPreparedByRole(suggestRole(itStaff.find((u) => u.id === e.target.value)));
              }}
              className={docInputClass}
            >
              <option value="">Pilih staf IT...</option>
              {itStaff.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} — {u.role}</option>
              ))}
            </select>
          </div>
          <LabelledInput label="Jabatan penyusun" value={preparedByRole} onChange={setPreparedByRole} />
          <LabelledInput label="Tempat" value={place} onChange={setPlace} placeholder="mis. Jakarta" />
          <LabelledInput label="Menyetujui — nama" value={approverName} onChange={setApproverName} placeholder="Kosongkan bila ditandatangani manual" />
          <LabelledInput label="Menyetujui — jabatan" value={approverRole} onChange={setApproverRole} placeholder="mis. Direktur" />
          <LabelledInput label="Alamat pada kop" value={companyAddress} onChange={setCompanyAddress} placeholder="Kosongkan bila tidak dipakai" />
        </div>

        {/* ================= The printed document ================= */}
        <div className="print-area print-landscape px-6 sm:px-10 py-8 bg-white text-black">

          <Letterhead companyName={headCompany} companyAddress={companyAddress} />

          <div className="text-center mt-4 mb-3">
            <h1 className="text-base font-bold uppercase underline tracking-wide">
              Daftar Usulan Peremajaan Aset
            </h1>
            <p className="text-sm mt-1">Nomor: {docNumber || '—'}</p>
          </div>

          <p className="text-sm leading-snug text-justify">
            Berikut daftar aset yang telah mencapai umur <strong>{RENEWAL_AGE_YEARS} tahun</strong>{' '}
            atau lebih terhitung sejak tanggal pembelian, per{' '}
            <strong>{longDate(reportDate)}</strong>, untuk diusulkan peremajaannya.
            {selectionUsed && ' Daftar ini merupakan pilihan sebagian dari keseluruhan aset yang memenuhi kriteria tersebut.'}
          </p>

          {/* Ringkasan */}
          <table className="w-full mt-3 text-xs border-collapse print-avoid-break">
            <tbody>
              <tr>
                <Td className="w-56 font-semibold">Jumlah aset diusulkan</Td>
                <Td>{rows.length} unit</Td>
                <Td className="w-56 font-semibold">Total harga perolehan</Td>
                <Td>
                  {formatCurrency(totalCost)}
                  {missingCost > 0 && (
                    <span className="text-gray-600">
                      {' '}({missingCost} aset tanpa harga, belum termasuk)
                    </span>
                  )}
                </Td>
              </tr>
              <tr>
                <Td className="font-semibold">
                  Melewati umur ekonomis {DEPRECIATION_YEARS} tahun
                </Td>
                <Td>{overdueCount} unit</Td>
                <Td className="font-semibold">Sisa nilai buku</Td>
                <Td>
                  {formatCurrency(totalBook)}
                  <span className="text-gray-600"> (dari {withBook.length} aset yang disusutkan)</span>
                </Td>
              </tr>
            </tbody>
          </table>

          {/* Rincian */}
          <table className="w-full mt-3 text-[10px] border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <Th className="w-8 text-center">No</Th>
                <Th>Kode Aset</Th>
                <Th>Kategori</Th>
                <Th>Merk / Tipe</Th>
                <Th>Serial Number</Th>
                <Th>Perusahaan</Th>
                <Th>Pemegang</Th>
                <Th className="text-center">Tgl Beli</Th>
                <Th className="text-center">Umur</Th>
                <Th className="text-center">Kondisi</Th>
                <Th className="text-right">Harga Perolehan</Th>
                <Th className="text-right">Nilai Buku</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ asset, months, overdue, bookValue, holder }, i) => (
                <tr key={asset.id} className="print-avoid-break">
                  <Td className="text-center">{i + 1}</Td>
                  <Td className="font-mono">{asset.asset_tag}</Td>
                  <Td className="capitalize">{asset.category || '—'}</Td>
                  <Td>{[asset.brand, asset.model].filter(Boolean).join(' / ') || '—'}</Td>
                  <Td className="font-mono">{asset.serial_number || '—'}</Td>
                  <Td>{companyNameOf(asset.company_id)}</Td>
                  <Td>{holder ?? '—'}</Td>
                  <Td className="text-center">{shortDate(asset.purchase_date)}</Td>
                  <Td className={`text-center ${overdue ? 'font-bold' : ''}`}>
                    {months === null ? '—' : formatAge(months)}
                  </Td>
                  <Td className="text-center capitalize">{asset.condition || '—'}</Td>
                  <Td className="text-right">{formatCurrency(asset.purchase_cost)}</Td>
                  <Td className="text-right">{bookValue === null ? '—' : formatCurrency(bookValue)}</Td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-semibold">
                <Td className="text-center" />
                <Td>Total</Td>
                <Td />
                <Td />
                <Td />
                <Td />
                <Td />
                <Td />
                <Td />
                <Td />
                <Td className="text-right">{formatCurrency(totalCost)}</Td>
                <Td className="text-right">{formatCurrency(totalBook)}</Td>
              </tr>
            </tbody>
          </table>

          <p className="text-[10px] text-gray-700 mt-2 leading-snug">
            Umur dihitung dalam bulan penuh sejak tanggal pembelian. Nilai buku memakai
            metode garis lurus dengan umur ekonomis {DEPRECIATION_YEARS} tahun dan hanya
            berlaku untuk aset bertipe Hardware yang harga perolehannya tercatat; aset
            lain ditandai "—". Umur yang dicetak tebal berarti sudah melewati umur
            ekonomis.
          </p>

          {/* Tanda tangan */}
          <div className="mt-5 text-sm text-right">
            {place ? `${place}, ` : ''}{longDate(reportDate)}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-8 text-sm text-center print-avoid-break">
            <SignatureBlock
              role="Disiapkan oleh"
              name={preparedBy?.full_name}
              subtitle={preparedByRole}
            />
            <SignatureBlock role="Menyetujui" name={approverName} subtitle={approverRole} />
          </div>
        </div>

        {/* Footer — screen only */}
        <div className="no-print px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
