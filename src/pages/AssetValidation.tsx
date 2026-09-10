import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { fetchAssetByTag, fetchAssetAssignments } from '@/features/assets/api';
import { STATUS_CONFIG, CONDITION_CLASSES, getCategoryIcon } from '@/features/assets/lib/assetConfig';
import type { Asset } from '@/types/index';
import { initialsOf } from '@/lib/text';

type AssetWithCompany = Asset & { companies?: { company_name: string } | null };

/*
This page renders outside ITLayout, so it carries its own background. The liquid
glass classes are translucent — they only read as glass over a tinted, blurred
backdrop, which is why the orbs below mirror the ones in ITLayout.

Dark mode is not persisted anywhere in the app (ITLayout holds it in component
state), so this standalone page is deliberately light-only rather than carrying
`dark:` classes that could never activate here.
*/

const VERDICTS = {
  ok: {
    icon: CheckCircle2,
    title: 'Aset terdaftar',
    description: 'Perangkat ini tercatat di inventaris IT.',
    accent: 'text-emerald-600',
    glow: 'from-emerald-400/40 to-emerald-300/5',
    bar: 'from-emerald-400 to-emerald-500',
  },
  missing: {
    icon: XCircle,
    title: 'Aset tidak terdaftar',
    description: 'Kode ini tidak ada di inventaris IT.',
    accent: 'text-red-600',
    glow: 'from-red-400/40 to-red-300/5',
    bar: 'from-red-400 to-red-500',
  },
  error: {
    icon: AlertTriangle,
    title: 'Tidak dapat diverifikasi',
    description: 'Terjadi kendala saat memeriksa aset.',
    accent: 'text-amber-600',
    glow: 'from-amber-400/40 to-amber-300/5',
    bar: 'from-amber-400 to-amber-500',
  },
} as const;

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Public page a scanned asset barcode lands on. Reachable without signing in —
 * the point is that anyone holding the device can confirm it is registered.
 */
export default function AssetValidation() {
  const { assetTag = '' } = useParams();

  const [asset, setAsset] = useState<AssetWithCompany | null>(null);
  const [holder, setHolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAsset(null);
    setHolder(null);

    fetchAssetByTag(assetTag)
      .then(async (row) => {
        if (cancelled) return;
        setAsset(row as AssetWithCompany | null);
        if (!row) return;
        try {
          const rows = await fetchAssetAssignments((row as Asset).id);
          const active = rows.find((r) => r.status === 'assigned');
          if (!cancelled) setHolder(active?.employee?.full_name ?? null);
        } catch {
          // Assignment table may not exist yet — the verdict does not depend on it.
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError(err?.message || 'Gagal memeriksa aset');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [assetTag]);

  const verdictKey = error ? 'error' : asset ? 'ok' : 'missing';
  const verdict = VERDICTS[verdictKey];
  const VerdictIcon = verdict.icon;

  const statusCfg = asset ? STATUS_CONFIG[asset.status] : undefined;
  const CategoryIcon = getCategoryIcon(asset?.category ?? '');

  return (
    <div className="min-h-screen bg-[#f0f4f8] relative font-sans overflow-hidden text-gray-900">
      {/* Ambient colour so the glass has something to refract */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-18%] left-[-12%] w-[45%] h-[45%] rounded-full bg-blue-400/25 blur-[110px]" />
        <div className="absolute bottom-[-18%] right-[-12%] w-[45%] h-[45%] rounded-full bg-purple-400/20 blur-[110px]" />
        <div className="absolute top-[35%] right-[18%] w-[22%] h-[22%] rounded-full bg-sky-300/20 blur-[90px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg animate-[slideUp_0.45s_ease]">

          {/* Brand */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl liquid-panel flex items-center justify-center">
              <img src="/tsi_logo.svg" alt="TSI" className="w-9 h-9" />
            </div>
            <p className="mt-3 text-[11px] font-semibold tracking-[0.22em] text-slate-500">
              VALIDASI ASET IT
            </p>
          </div>

          <div className="liquid-panel rounded-3xl overflow-hidden">
            {/* Accent bar */}
            <div className={`h-1 bg-gradient-to-r ${loading ? 'from-blue-400 to-blue-500' : verdict.bar}`} />

            {loading ? (
              <div className="px-6 py-16 flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-blue-400/40 to-blue-300/5 blur-xl" />
                  <div className="relative w-16 h-16 rounded-full liquid-card flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                </div>
                <p className="mt-5 text-sm text-slate-500">Memeriksa aset...</p>
                <p className="mt-1 font-mono text-xs text-slate-400">{assetTag}</p>
              </div>
            ) : (
              <>
                {/* Verdict hero */}
                <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-b ${verdict.glow} blur-xl`} />
                    <div className="relative w-16 h-16 rounded-full liquid-card flex items-center justify-center">
                      <VerdictIcon className={`w-8 h-8 ${verdict.accent}`} />
                    </div>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">{verdict.title}</h1>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    {error ?? verdict.description}
                  </p>
                </div>

                {asset ? (
                  <>
                    {/* Identity */}
                    <div className="px-6 pb-5">
                      <div className="liquid-card rounded-2xl p-4 flex items-center gap-4">
                        {asset.asset_image ? (
                          <img
                            src={asset.asset_image}
                            alt={asset.asset_name}
                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl liquid-icon-box text-blue-700 flex items-center justify-center shrink-0">
                            <CategoryIcon size={24} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{asset.asset_name}</div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-white/60 border border-white/70 font-mono text-xs text-slate-500 tracking-wide">
                            {asset.asset_tag}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Facts */}
                    <div className="px-6 pb-5 grid grid-cols-2 gap-3">
                      <Tile label="Status">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusCfg?.classes ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {statusCfg?.label ?? asset.status.replace('_', ' ')}
                        </span>
                      </Tile>
                      <Tile label="Condition">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border capitalize ${CONDITION_CLASSES[asset.condition] ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                          {asset.condition || '—'}
                        </span>
                      </Tile>

                      <TextTile label="Company" value={asset.companies?.company_name} />
                      <TextTile label="Location" value={asset.location} />
                      <TextTile label="Category" value={asset.category} capitalize />
                      <TextTile label="Type" value={asset.asset_type} />
                      <TextTile label="Brand" value={asset.brand} />
                      <TextTile label="Model" value={asset.model} />
                    </div>

                    {/* Holder */}
                    <div className="px-6 pb-5">
                      <div className="liquid-card rounded-2xl p-4">
                        <div className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 mb-2.5">
                          DIPEGANG OLEH
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                            {holder ? initialsOf(holder) : '—'}
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {holder ?? 'Belum diserahkan'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="px-6 py-4 border-t border-white/50 flex items-center justify-between gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Terverifikasi
                      </span>
                      <span>Terdaftar {formatDate(asset.created_at)}</span>
                    </div>
                  </>
                ) : (
                  /* Missing or errored — show what was scanned so it can be reported */
                  <div className="px-6 pb-8">
                    <div className="liquid-card rounded-2xl p-4 text-center">
                      <div className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 mb-2">
                        KODE YANG DIPINDAI
                      </div>
                      <div className="font-mono text-sm text-slate-900">{assetTag}</div>
                    </div>
                    <p className="mt-4 text-center text-sm text-slate-500">
                      Hubungi IT Support bila Anda yakin aset ini milik perusahaan.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Halaman ini hanya menampilkan informasi verifikasi aset.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helpers

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="liquid-card rounded-2xl p-3.5 min-w-0">
      <div className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 mb-2">
        {label.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

function TextTile({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string | null | undefined;
  capitalize?: boolean;
}) {
  return (
    <Tile label={label}>
      <div
        className={`text-sm font-semibold break-words ${
          value ? 'text-slate-900' : 'text-slate-400'
        } ${capitalize ? 'capitalize' : ''}`}
      >
        {value || '—'}
      </div>
    </Tile>
  );
}
