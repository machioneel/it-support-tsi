import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Undo2 } from 'lucide-react';
import { fetchUsers } from '@/services/directory';
import { fetchCompanies } from '@/services/companies';
import { isoToDateInput, todayInput } from '@/lib/dates';
import { suggestDocNumber, longDate, dayName } from '@/lib/docFormat';
import { formatHoldDuration } from '@/features/assets/lib/assetMovement';
import type { MovementRecord } from '@/features/assets/lib/assetMovement';
import {
  docInputClass,
  LabelledInput,
  Letterhead,
  PartyBlock,
  SignatureBlock,
  Th,
  Td,
} from '@/components/ui/documentParts';
import type { Asset, Company, User } from '@/types/index';

interface AssetReturnDocProps {
  asset: Asset | null;
  /**
   * The handover being closed. Any leg of the movement history works, not just
   * the current one — that is how a return document gets reprinted for someone
   * who gave the asset back two holders ago.
   */
  movement: MovementRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Job title suggested from the IT role on the user row; still editable. */
function suggestRole(user: User | undefined) {
  if (!user) return '';
  return user.role === 'Admin' ? 'IT Admin' : 'IT Support';
}

export default function AssetReturnDoc({ asset, movement, isOpen, onClose }: AssetReturnDocProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [itStaff, setItStaff] = useState<User[]>([]);
  const [firstPartyId, setFirstPartyId] = useState('');

  const [docNumber, setDocNumber] = useState('');
  const [returnDate, setReturnDate] = useState(todayInput());
  const [place, setPlace] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [firstPartyRole, setFirstPartyRole] = useState('');
  // Condition at handback, which is not necessarily the condition on the asset
  // record — that one may have been edited since, or not yet updated.
  const [returnCondition, setReturnCondition] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (!isOpen || !asset) return;

    const date = movement?.returnedDate ? isoToDateInput(movement.returnedDate) : todayInput();
    setReturnDate(date);
    setDocNumber(suggestDocNumber('BAP-IT', date));
    setReturnCondition(asset.condition ?? '');
    setRemarks(movement?.notes ?? '');

    fetchCompanies()
      .then((data) => setCompanies(data as Company[]))
      .catch(() => {});

    fetchUsers()
      .then((data) => {
        const staff = data as User[];
        setItStaff(staff);

        // Default to whoever is signed in, matched by the session e-mail.
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
        setFirstPartyId(chosen?.id ?? '');
        setFirstPartyRole(suggestRole(chosen));
      })
      .catch(() => {});
  }, [isOpen, asset, movement]);

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

  if (!isOpen || !asset) return null;

  const companyName =
    companies.find((c) => c.id === asset.company_id)?.company_name ?? '—';

  const firstParty = itStaff.find((u) => u.id === firstPartyId);
  const firstPartyName = firstParty?.full_name ?? '';

  const heldFor = movement
    ? formatHoldDuration(movement.assignedDate, movement.returnedDate ?? returnDate)
    : '—';

  return createPortal(
    <div className="print-shell fixed inset-0 z-[70] flex items-start justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm no-print" onClick={onClose}></div>

      <div className="print-shell bg-white dark:bg-gray-900 shadow-2xl w-full sm:rounded-2xl max-w-4xl relative z-10 my-0 sm:my-4 overflow-hidden">

        {/* Header — screen only */}
        <div className="no-print flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Undo2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Berita Acara Pengembalian</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-mono truncate">{asset.asset_tag}</p>
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
        <div className="no-print px-6 py-5 bg-gray-50/70 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LabelledInput label="Nomor Berita Acara" value={docNumber} onChange={setDocNumber} />
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Tanggal Pengembalian</label>
            <input
              type="date"
              value={returnDate}
              min={movement ? isoToDateInput(movement.assignedDate) : undefined}
              max={todayInput()}
              onChange={(e) => setReturnDate(e.target.value)}
              className={docInputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              Nama Pihak Pertama (penerima)
            </label>
            <select
              value={firstPartyId}
              onChange={(e) => {
                setFirstPartyId(e.target.value);
                setFirstPartyRole(suggestRole(itStaff.find((u) => u.id === e.target.value)));
              }}
              className={docInputClass}
            >
              <option value="">Pilih staf IT...</option>
              {itStaff.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} — {u.role}
                </option>
              ))}
            </select>
          </div>
          <LabelledInput label="Jabatan Pihak Pertama" value={firstPartyRole} onChange={setFirstPartyRole} />
          <LabelledInput
            label="Kondisi saat dikembalikan"
            value={returnCondition}
            onChange={setReturnCondition}
            placeholder="mis. baik / rusak ringan"
          />
          <LabelledInput
            label="Keterangan"
            value={remarks}
            onChange={setRemarks}
            placeholder="mis. lengkap dengan charger dan tas"
          />
          <LabelledInput label="Tempat" value={place} onChange={setPlace} placeholder="mis. Jakarta" />
          <LabelledInput
            label="Alamat pada kop"
            value={companyAddress}
            onChange={setCompanyAddress}
            placeholder="Kosongkan bila tidak dipakai"
          />
        </div>

        {/* ================= The printed document ================= */}
        <div className="print-area px-8 sm:px-12 py-8 bg-white text-black">

          <Letterhead companyName={companyName} companyAddress={companyAddress} />

          {/* Judul */}
          <div className="text-center mt-4 mb-3">
            <h1 className="text-base font-bold uppercase underline tracking-wide">
              Berita Acara Pengembalian Barang
            </h1>
            <p className="text-sm mt-1">Nomor: {docNumber || '—'}</p>
          </div>

          <p className="text-sm leading-snug text-justify">
            Pada hari ini, <strong>{dayName(returnDate)}</strong> tanggal{' '}
            <strong>{longDate(returnDate)}</strong>, yang bertanda tangan di bawah ini:
          </p>

          {/*
            Party numbering is kept identical to the handover document on purpose:
            IT is always PIHAK PERTAMA, the employee always PIHAK KEDUA. The two
            papers are filed together, and swapping the labels between them would
            make the pair read as if two different people were involved.
          */}
          <div className="mt-3 space-y-2 text-sm">
            <PartyBlock
              rows={[
                ['Nama', firstPartyName || '—'],
                ['Jabatan', firstPartyRole || '—'],
                ['Perusahaan', companyName],
              ]}
              caption="selanjutnya disebut PIHAK PERTAMA."
            />
            <PartyBlock
              rows={[
                ['Nama', movement?.fullName ?? '—'],
                ['Divisi', movement?.division ?? '—'],
                ['Perusahaan', companyName],
              ]}
              caption="selanjutnya disebut PIHAK KEDUA."
            />
          </div>

          <p className="text-sm leading-snug text-justify mt-3">
            PIHAK KEDUA mengembalikan kepada PIHAK PERTAMA, dan PIHAK PERTAMA menerima
            kembali dari PIHAK KEDUA, barang inventaris milik perusahaan dengan rincian
            sebagai berikut:
          </p>

          {/* Rincian barang */}
          <table className="w-full mt-2 text-xs border-collapse print-avoid-break">
            <thead>
              <tr className="bg-gray-100">
                <Th className="w-10 text-center">No</Th>
                <Th>Nama Barang</Th>
                <Th>Merk / Tipe</Th>
                <Th>Serial Number</Th>
                <Th>Kode Aset</Th>
                <Th className="text-center">Kondisi</Th>
                <Th className="w-14 text-center">Jml</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td className="text-center">1</Td>
                <Td>{asset.asset_name}</Td>
                <Td>{[asset.brand, asset.model].filter(Boolean).join(' / ') || '—'}</Td>
                <Td className="font-mono">{asset.serial_number || '—'}</Td>
                <Td className="font-mono">{asset.asset_tag}</Td>
                <Td className="text-center capitalize">{returnCondition || '—'}</Td>
                <Td className="text-center">1</Td>
              </tr>
            </tbody>
          </table>

          {/* Masa pemakaian — the part a handover document does not have */}
          <table className="w-full mt-2 text-xs border-collapse print-avoid-break">
            <tbody>
              <tr>
                <Td className="w-52 font-semibold">Diserahkan pada</Td>
                <Td>{movement ? longDate(movement.assignedDate) : '—'}</Td>
              </tr>
              <tr>
                <Td className="font-semibold">Dikembalikan pada</Td>
                <Td>{longDate(returnDate)}</Td>
              </tr>
              <tr>
                <Td className="font-semibold">Lama pemakaian</Td>
                <Td>{heldFor}</Td>
              </tr>
              <tr>
                <Td className="font-semibold">Keterangan</Td>
                <Td>{remarks || '—'}</Td>
              </tr>
            </tbody>
          </table>

          {/* Ketentuan */}
          <ol className="mt-3 text-sm leading-snug list-decimal pl-5 space-y-0.5 text-justify">
            <li>
              PIHAK PERTAMA telah memeriksa barang tersebut di atas dan menerimanya dalam
              kondisi sebagaimana tercantum pada tabel.
            </li>
            <li>
              Barang dikembalikan beserta seluruh kelengkapannya sesuai keterangan di atas.
            </li>
            <li>
              Terhitung sejak tanggal berita acara ini, tanggung jawab PIHAK KEDUA atas
              penggunaan, pemeliharaan, dan keamanan barang tersebut berakhir.
            </li>
            <li>
              Apabila di kemudian hari ditemukan kerusakan atau kekurangan yang tidak
              tercatat pada berita acara ini, penyelesaiannya mengacu pada ketentuan
              perusahaan yang berlaku.
            </li>
          </ol>

          <p className="text-sm leading-snug text-justify mt-3">
            Demikian Berita Acara Pengembalian ini dibuat dengan sebenarnya dan
            ditandatangani oleh kedua belah pihak dalam keadaan sadar tanpa paksaan dari
            pihak mana pun, untuk dipergunakan sebagaimana mestinya.
          </p>

          {/* Tanda tangan */}
          <div className="mt-4 text-sm text-right">
            {place ? `${place}, ` : ''}{longDate(returnDate)}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-8 text-sm text-center print-avoid-break">
            <SignatureBlock
              role="PIHAK PERTAMA"
              name={firstPartyName}
              subtitle={firstPartyRole}
            />
            <SignatureBlock
              role="PIHAK KEDUA"
              name={movement?.fullName}
              subtitle={movement?.division}
            />
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
