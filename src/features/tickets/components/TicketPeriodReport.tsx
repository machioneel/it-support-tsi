import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileBarChart } from 'lucide-react';
import { fetchCompanies } from '@/services/companies';
import { fetchUsers } from '@/services/directory';
import { suggestDocNumber, longDate, shortDate } from '@/lib/docFormat';
import { formatDuration } from '@/lib/format';
import { dateToInput } from '@/lib/dates';
import {
  docInputClass,
  LabelledInput,
  Letterhead,
  SignatureBlock,
  Th,
  Td,
} from '@/components/ui/documentParts';
import type { Company, Ticket, TicketStatus, User } from '@/types';

interface TicketPeriodReportProps {
  /** Seluruh tiket; komponen ini yang menyaring per periode. */
  tickets: Ticket[];
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_ORDER: TicketStatus[] = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
const PRIORITY_ORDER = ['P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'];
const OPEN_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Pending'];

function suggestRole(user: User | undefined) {
  if (!user) return '';
  return user.role === 'Admin' ? 'IT Admin' : 'IT Support';
}

const firstOfThisMonth = () => {
  const n = new Date();
  return dateToInput(new Date(n.getFullYear(), n.getMonth(), 1));
};

/** Hari 0 bulan berikutnya = hari terakhir bulan ini. */
const lastOfThisMonth = () => {
  const n = new Date();
  return dateToInput(new Date(n.getFullYear(), n.getMonth() + 1, 0));
};

const dayLabel = (input: string) =>
  new Date(`${input}T12:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

/**
 * "1 Agustus 2026 – 31 Agustus 2026" dipendekkan jadi "Agustus 2026" ketika
 * rentangnya kebetulan tepat satu bulan penuh — kasus yang paling sering.
 */
function periodLabel(start: string, end: string) {
  if (!start || !end) return '—';
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '—';

  const wholeMonth =
    a.getDate() === 1 &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    b.getDate() === new Date(b.getFullYear(), b.getMonth() + 1, 0).getDate();

  if (wholeMonth) {
    return a.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  return `${dayLabel(start)} – ${dayLabel(end)}`;
}

export default function TicketPeriodReport({ tickets, isOpen, onClose }: TicketPeriodReportProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [itStaff, setItStaff] = useState<User[]>([]);

  const [startDate, setStartDate] = useState(firstOfThisMonth);
  const [endDate, setEndDate] = useState(lastOfThisMonth);
  const [docNumber, setDocNumber] = useState('');
  const [place, setPlace] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [preparedById, setPreparedById] = useState('');
  const [preparedByRole, setPreparedByRole] = useState('');
  const [approverName, setApproverName] = useState('');
  const [approverRole, setApproverRole] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    fetchCompanies()
      .then((data) => {
        const list = data as Company[];
        setCompanies(list);
        setCompanyId((prev) => prev || list[0]?.id || '');
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
              signedIn = staff.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
            }
          } catch {
            // Sesi rusak — jatuh ke staf pertama.
          }
        }

        const chosen = signedIn ?? staff[0];
        setPreparedById(chosen?.id ?? '');
        setPreparedByRole(suggestRole(chosen));
      })
      .catch(() => {});
  }, [isOpen]);

  // Nomor dokumen mengikuti awal periode, bukan hari mencetaknya.
  useEffect(() => {
    setDocNumber(suggestDocNumber('LTB-IT', startDate));
  }, [startDate]);

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

  // Kedua ujung inklusif: dari 00:00 tanggal awal sampai 23:59:59 tanggal akhir,
  // dalam waktu lokal — supaya tiket sore hari di tanggal terakhir ikut terhitung.
  const rangeStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const rangeEnd = endDate ? new Date(`${endDate}T23:59:59.999`) : null;
  const rangeInvalid = Boolean(rangeStart && rangeEnd && rangeEnd < rangeStart);

  /*
   * Disaring pada tanggal MASUK, bukan tanggal selesai. Artinya sebuah tiket
   * selalu muncul tepat sekali, di periode ia dilaporkan — termasuk kalau ia
   * baru selesai setelahnya, yang justru penting untuk dilihat.
   */
  const rows = rangeInvalid
    ? []
    : tickets
        .filter((t) => {
          const d = new Date(t.created_at);
          if (Number.isNaN(d.getTime())) return false;
          if (rangeStart && d < rangeStart) return false;
          if (rangeEnd && d > rangeEnd) return false;
          return true;
        })
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const done = rows.filter((t) => t.ticket_status === 'Resolved' || t.ticket_status === 'Closed');
  const stillOpen = rows.filter((t) => OPEN_STATUSES.includes(t.ticket_status));

  const durations = rows
    .map((t) => t.resolution_duration_minutes)
    .filter((d): d is number => typeof d === 'number' && d > 0);
  const avgDuration = durations.length
    ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
    : null;

  const tally = (values: string[]) => {
    const map = new Map<string, number>();
    for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
    return map;
  };
  const byStatus = tally(rows.map((t) => t.ticket_status));
  const byPriority = tally(rows.map((t) => t.priority_level));
  const byCategory = tally(rows.map((t) => t.issue_category));
  const byChannel = tally(rows.map((t) => t.reported_via));

  const headCompany = companies.find((c) => c.id === companyId)?.company_name ?? '—';
  const preparedBy = itStaff.find((u) => u.id === preparedById);

  return createPortal(
    <div className="print-shell fixed inset-0 z-[70] flex items-start justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm no-print" onClick={onClose}></div>

      <div className="print-shell bg-white dark:bg-gray-900 shadow-2xl w-full sm:rounded-2xl max-w-6xl relative z-10 my-0 sm:my-4 overflow-hidden">

        {/* Header — layar saja */}
        <div className="no-print flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileBarChart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Laporan Tiket</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 truncate">
                {rangeInvalid
                  ? 'Tanggal akhir lebih awal daripada tanggal mulai'
                  : `${periodLabel(startDate, endDate)} — ${rows.length} tiket`}
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

        {/* Isian yang tidak ada di database */}
        <div className="no-print px-6 py-5 bg-gray-50/70 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              Periode (tanggal mulai – tanggal akhir)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={docInputClass}
              />
              <span className="text-gray-400 shrink-0">–</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={docInputClass}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <PresetButton label="Bulan ini" onClick={() => {
                setStartDate(firstOfThisMonth());
                setEndDate(lastOfThisMonth());
              }} />
              <PresetButton label="Bulan lalu" onClick={() => {
                const n = new Date();
                setStartDate(dateToInput(new Date(n.getFullYear(), n.getMonth() - 1, 1)));
                setEndDate(dateToInput(new Date(n.getFullYear(), n.getMonth(), 0)));
              }} />
              <PresetButton label="Tahun ini" onClick={() => {
                const y = new Date().getFullYear();
                setStartDate(dateToInput(new Date(y, 0, 1)));
                setEndDate(dateToInput(new Date(y, 11, 31)));
              }} />
              {rangeInvalid && (
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  Tanggal akhir lebih awal daripada tanggal mulai.
                </span>
              )}
            </div>
          </div>
          <LabelledInput label="Nomor Dokumen" value={docNumber} onChange={setDocNumber} />
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
          <LabelledInput label="Mengetahui — nama" value={approverName} onChange={setApproverName} placeholder="Kosongkan bila ditandatangani manual" />
          <LabelledInput label="Mengetahui — jabatan" value={approverRole} onChange={setApproverRole} placeholder="mis. Manager IT" />
          <LabelledInput label="Alamat pada kop" value={companyAddress} onChange={setCompanyAddress} placeholder="Kosongkan bila tidak dipakai" />
        </div>

        {/* ================= Dokumen yang dicetak ================= */}
        <div className="print-area print-landscape px-6 sm:px-10 py-8 bg-white text-black">

          <Letterhead companyName={headCompany} companyAddress={companyAddress} />

          <div className="text-center mt-4 mb-3">
            <h1 className="text-base font-bold uppercase underline tracking-wide">
              Laporan Tiket IT Support
            </h1>
            <p className="text-sm mt-1">Periode: {periodLabel(startDate, endDate)}</p>
            <p className="text-sm">Nomor: {docNumber || '—'}</p>
          </div>

          {/* Ringkasan */}
          <table className="w-full mt-3 text-xs border-collapse print-avoid-break">
            <tbody>
              <tr>
                <Td className="w-48 font-semibold">Tiket masuk</Td>
                <Td className="w-28">{rows.length}</Td>
                <Td className="w-48 font-semibold">Selesai</Td>
                <Td className="w-28">{done.length}</Td>
                <Td className="w-48 font-semibold">Belum selesai</Td>
                <Td>{stillOpen.length}</Td>
              </tr>
              <tr>
                <Td className="font-semibold">Rata-rata penyelesaian</Td>
                <Td>{avgDuration === null ? '—' : formatDuration(avgDuration)}</Td>
                <Td className="font-semibold">Durasi tercatat</Td>
                <Td>{durations.length} dari {done.length}</Td>
                <Td className="font-semibold">Kanal terbanyak</Td>
                <Td>
                  {byChannel.size === 0
                    ? '—'
                    : [...byChannel.entries()].sort((a, b) => b[1] - a[1])[0][0]}
                </Td>
              </tr>
            </tbody>
          </table>

          {/* Rekap */}
          <div className="grid grid-cols-3 gap-3 mt-3 print-avoid-break">
            <Breakdown title="Per status" order={STATUS_ORDER} counts={byStatus} />
            <Breakdown title="Per prioritas" order={PRIORITY_ORDER} counts={byPriority} />
            <Breakdown title="Per kategori" order={[...byCategory.keys()].sort()} counts={byCategory} />
          </div>

          {/* Rincian */}
          <table className="w-full mt-3 text-[10px] border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <Th className="w-8 text-center">No</Th>
                <Th>Nomor Tiket</Th>
                <Th className="text-center">Tgl Masuk</Th>
                <Th>Pelapor</Th>
                <Th>Perihal</Th>
                <Th>Kategori</Th>
                <Th>Kanal</Th>
                <Th className="text-center">Prioritas</Th>
                <Th className="text-center">Status</Th>
                <Th>Ditangani</Th>
                <Th className="text-center">Tgl Selesai</Th>
                <Th className="text-right">Durasi</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <Td className="text-center">—</Td>
                  <Td className="text-center">
                    Tidak ada tiket yang masuk pada periode ini.
                  </Td>
                  <Td /><Td /><Td /><Td /><Td /><Td /><Td /><Td /><Td /><Td />
                </tr>
              ) : rows.map((t, i) => (
                <tr key={t.id} className="print-avoid-break">
                  <Td className="text-center">{i + 1}</Td>
                  <Td className="font-mono">{t.ticket_number}</Td>
                  <Td className="text-center">{shortDate(t.created_at)}</Td>
                  <Td>{t.reporter?.full_name ?? '—'}</Td>
                  <Td>{t.issue_title}</Td>
                  <Td>{t.issue_category}</Td>
                  <Td>{t.reported_via}</Td>
                  <Td className="text-center">{t.priority_level.split(' - ')[0]}</Td>
                  <Td className="text-center">{t.ticket_status}</Td>
                  <Td>{t.assignee?.full_name ?? '—'}</Td>
                  <Td className="text-center">{shortDate(t.finished_at)}</Td>
                  <Td className="text-right">
                    {t.resolution_duration_minutes ? formatDuration(t.resolution_duration_minutes) : '—'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-[10px] text-gray-700 mt-2 leading-snug">
            Tiket disaring berdasarkan tanggal masuk, sehingga setiap tiket muncul tepat
            sekali di bulan ia dilaporkan — termasuk yang baru selesai pada bulan
            berikutnya. Kolom Durasi terisi hanya bila tanggal selesainya sudah dicatat;
            tanda "—" berarti belum, bukan berarti nol.
          </p>

          {/* Tanda tangan */}
          <div className="mt-5 text-sm text-right">
            {place ? `${place}, ` : ''}{longDate(dateToInput(new Date()))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-8 text-sm text-center print-avoid-break">
            <SignatureBlock role="Disiapkan oleh" name={preparedBy?.full_name} subtitle={preparedByRole} />
            <SignatureBlock role="Mengetahui" name={approverName} subtitle={approverRole} />
          </div>
        </div>

        {/* Footer — layar saja */}
        <div className="no-print px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Pada dialog cetak, pilih <strong>Margin: Default</strong> — preset
            "Minimum" membuang margin dokumen ini sehingga kop menempel ke tepi
            kertas. Orientasi sudah dikunci landscape.
          </p>
          <div className="flex items-center gap-3 shrink-0">
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
      </div>
    </div>,
    document.body
  );
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      {label}
    </button>
  );
}

/** Satu kolom rekap kecil: label di kiri, jumlah di kanan. */
function Breakdown({
  title,
  order,
  counts,
}: {
  title: string;
  order: string[];
  counts: Map<string, number>;
}) {
  return (
    <table className="w-full text-[10px] border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <Th colSpan={2}>{title}</Th>
        </tr>
      </thead>
      <tbody>
        {order.length === 0 ? (
          <tr><Td colSpan={2}>—</Td></tr>
        ) : order.map((key) => (
          <tr key={key}>
            <Td>{key}</Td>
            <Td className="text-right w-12">{counts.get(key) ?? 0}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
