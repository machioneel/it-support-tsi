import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText } from 'lucide-react';
import { fetchUsers } from '@/services/directory';
import { fetchCompanies } from '@/services/companies';
import type { ActiveAssignment } from '@/features/assets/api';
import { isoToDateInput, todayInput } from '@/lib/dates';
import { suggestDocNumber, longDate, dayName } from '@/lib/docFormat';
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

interface AssetHandoverDocProps {
  asset: Asset | null;
  holder: ActiveAssignment | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Job title suggested from the IT role on the user row; still editable. */
function suggestRole(user: User | undefined) {
  if (!user) return '';
  return user.role === 'Admin' ? 'IT Admin' : 'IT Support';
}

export default function AssetHandoverDoc({ asset, holder, isOpen, onClose }: AssetHandoverDocProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  // Pihak Pertama is picked from the users table (IT staff), not typed in.
  const [itStaff, setItStaff] = useState<User[]>([]);
  const [firstPartyId, setFirstPartyId] = useState('');

  // Editable heading fields — none of these live in the database, so they are
  // typed in rather than invented. The address stays blank until filled: this is
  // an official document and a made-up address does not belong on it.
  const [docNumber, setDocNumber] = useState('');
  const [handoverDate, setHandoverDate] = useState(todayInput());
  const [place, setPlace] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [firstPartyRole, setFirstPartyRole] = useState('');

  useEffect(() => {
    if (!isOpen || !asset) return;

    const date = holder ? isoToDateInput(holder.assignedDate) : todayInput();
    setHandoverDate(date);
    setDocNumber(suggestDocNumber('BAST-IT', date));

    fetchCompanies()
      .then((data) => setCompanies(data as Company[]))
      .catch(() => { });

    // fetchUsers() returns the users table, which since the users/employees split
    // holds IT staff only — exactly who can act as Pihak Pertama.
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
      .catch(() => { });
  }, [isOpen, asset, holder]);

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

  return createPortal(
    <div className="print-shell fixed inset-0 z-[70] flex items-start justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm no-print" onClick={onClose}></div>

      <div className="print-shell bg-white dark:bg-gray-900 shadow-2xl w-full sm:rounded-2xl max-w-4xl relative z-10 my-0 sm:my-4 overflow-hidden">

        {/* Header — screen only */}
        <div className="no-print flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Berita Acara Serah Terima</h2>
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
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Tanggal Serah Terima</label>
            <input
              type="date"
              value={handoverDate}
              max={todayInput()}
              onChange={(e) => setHandoverDate(e.target.value)}
              className={docInputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              Nama Pihak Pertama
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
          <LabelledInput label="Tempat" value={place} onChange={setPlace} placeholder="mis. Jakarta" />
          <LabelledInput label="Alamat pada kop" value={companyAddress} onChange={setCompanyAddress} placeholder="Kosongkan bila tidak dipakai" />
        </div>

        {/* ================= The printed document ================= */}
        <div className="print-area px-8 sm:px-12 py-8 bg-white text-black">

          <Letterhead companyName={companyName} companyAddress={companyAddress} />

          {/* Judul */}
          <div className="text-center mt-4 mb-3">
            <h1 className="text-base font-bold uppercase underline tracking-wide">
              Berita Acara Serah Terima Barang
            </h1>
            <p className="text-sm mt-1">Nomor: {docNumber || '—'}</p>
          </div>

          <p className="text-sm leading-snug text-justify">
            Pada hari ini, <strong>{dayName(handoverDate)}</strong> tanggal{' '}
            <strong>{longDate(handoverDate)}</strong>, yang bertanda tangan di bawah ini:
          </p>

          {/* Para pihak */}
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
                ['Nama', holder?.fullName ?? '—'],
                ['Divisi', holder?.division ?? '—'],
                ['Perusahaan', companyName],
              ]}
              caption="selanjutnya disebut PIHAK KEDUA."
            />
          </div>

          <p className="text-sm leading-snug text-justify mt-3">
            PIHAK PERTAMA menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA menerima dari
            PIHAK PERTAMA, barang inventaris milik perusahaan dengan rincian sebagai berikut:
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
                <Td className="text-center capitalize">{asset.condition || '—'}</Td>
                <Td className="text-center">1</Td>
              </tr>
            </tbody>
          </table>

          {/* Ketentuan */}
          <ol className="mt-3 text-sm leading-snug list-decimal pl-5 space-y-0.5 text-justify">
            <li>
              Barang tersebut di atas adalah milik perusahaan dan diserahkan kepada PIHAK
              KEDUA untuk menunjang pelaksanaan tugas dan pekerjaannya.
            </li>
            <li>
              PIHAK KEDUA bertanggung jawab atas penggunaan, pemeliharaan, dan keamanan
              barang selama berada dalam penguasaannya.
            </li>
            <li>
              Kerusakan atau kehilangan yang timbul akibat kelalaian PIHAK KEDUA menjadi
              tanggung jawab PIHAK KEDUA sesuai ketentuan perusahaan yang berlaku.
            </li>
            <li>
              Barang wajib dikembalikan kepada PIHAK PERTAMA dalam kondisi baik apabila
              diminta perusahaan atau pada saat berakhirnya hubungan kerja.
            </li>
          </ol>

          <p className="text-sm leading-snug text-justify mt-3">
            Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya dan
            ditandatangani oleh kedua belah pihak dalam keadaan sadar tanpa paksaan dari
            pihak mana pun, untuk dipergunakan sebagaimana mestinya.
          </p>

          {/* Tanda tangan */}
          <div className="mt-4 text-sm text-right">
            {place ? `${place}, ` : ''}{longDate(handoverDate)}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-8 text-sm text-center print-avoid-break">
            <SignatureBlock role="PIHAK PERTAMA" name={firstPartyName} subtitle={firstPartyRole} />
            <SignatureBlock role="PIHAK KEDUA" name={holder?.fullName} subtitle={holder?.division} />
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


