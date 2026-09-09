/**
 * Presentational pieces shared by the printed asset documents.
 *
 * The letterhead in particular must be identical across BAST and BAP — they are
 * filed together, and a logo or rule that differs between them looks like one of
 * them is forged.
 */

export const docInputClass =
  'w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';

/** Navy taken from tsi_logo.svg, so print and logo agree. */
export const BRAND_NAVY = '#05186E';

export function LabelledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={docInputClass}
      />
    </div>
  );
}

export function Letterhead({
  companyName,
  companyAddress,
}: {
  companyName: string;
  companyAddress?: string;
}) {
  return (
    <>
      <div className="flex items-center gap-4 pb-2">
        <img src="/tsi_logo.svg" alt="" className="w-14 h-14 shrink-0" />
        <div className="min-w-0">
          <div className="text-base font-bold tracking-wide uppercase leading-tight" style={{ color: BRAND_NAVY }}>
            {companyName}
          </div>
          {companyAddress && <div className="text-xs text-gray-700 mt-1">{companyAddress}</div>}
          <div className="text-xs text-gray-600 mt-0.5">Divisi Teknologi Informasi</div>
        </div>
      </div>
      <div className="border-t-[3px] border-b border-double" style={{ borderColor: BRAND_NAVY }} />
    </>
  );
}

export function PartyBlock({ rows, caption }: { rows: [string, string][]; caption: string }) {
  return (
    <div>
      <table className="text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="align-top pr-3 w-28">{label}</td>
              <td className="align-top pr-2">:</td>
              <td className="align-top font-semibold">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1">{caption}</p>
    </div>
  );
}

/** `children` is optional: a spacer cell in a totals row is legitimately empty. */
export function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`border border-gray-400 px-2 py-1 font-semibold text-left ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`border border-gray-400 px-2 py-1 align-top ${className}`}>{children}</td>;
}

/** One signature column. `name` falls back to a blank rule to sign over. */
export function SignatureBlock({
  role,
  name,
  subtitle,
}: {
  role: string;
  name?: string | null;
  subtitle?: string | null;
}) {
  return (
    <div>
      <div className="font-semibold">{role}</div>
      <div className="h-14" />
      <div className="border-b border-black w-4/5 mx-auto" />
      <div className="mt-1.5 font-semibold">{name || '(...........................)'}</div>
      <div className="text-xs text-gray-700">{subtitle || '—'}</div>
    </div>
  );
}
