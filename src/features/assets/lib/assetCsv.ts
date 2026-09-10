import { ASSET_STATUS_VALUES, ASSET_TYPES } from '@/features/assets/lib/assetConfig';
import type { ActiveAssignment } from '@/features/assets/api';
import type { Asset, Company } from '@/types/index';

/*
CSV import/export for the asset register.

Export writes every column below. Import only reads the ones marked writable —
anything else in the file (including the assignment columns) is ignored, so an
exported file can be edited and fed straight back in.
*/

const CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'damaged'];

/** Columns the importer understands, in template order. */
export const IMPORT_COLUMNS = [
  'asset_tag',
  'asset_name',
  'category',
  'asset_type',
  'brand',
  'model',
  'serial_number',
  'condition',
  'status',
  'company',
  'location',
  'purchase_cost',
  'purchase_date',
] as const;

/** Extra read-only columns added on export. */
export const EXPORT_ONLY_COLUMNS = ['assigned_to', 'assigned_division', 'assigned_date'] as const;

export const EXPORT_COLUMNS = [...IMPORT_COLUMNS, ...EXPORT_ONLY_COLUMNS];

export interface ParsedAssetRow {
  /** 1-based line number in the file, for error messages. */
  line: number;
  assetTag: string;
  fields: {
    asset_tag: string;
    asset_name: string;
    category: string;
    asset_type: string;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    condition: string;
    status: string;
    company_id: string | null;
    location: string | null;
    purchase_cost: number | null;
    purchase_date: string | null;
  };
}

export interface RowError {
  line: number;
  assetTag: string;
  message: string;
}

export interface ParseResult {
  rows: ParsedAssetRow[];
  errors: RowError[];
  /** Header names present in the file that the importer does not use. */
  ignoredColumns: string[];
  delimiter: string;
}

// ---------------------------------------------------------------- reading

/**
 * Splits delimited text into rows of fields, honouring RFC 4180 quoting:
 * quoted fields may contain the delimiter, newlines, and doubled quotes.
 */
export function parseDelimited(text: string, delimiter: string): string[][] {
  // Excel writes a BOM; left in place it would become part of the first header.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }

    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === delimiter) { row.push(field); field = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }

    field += ch; i++;
  }

  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/**
 * Indonesian Excel commonly saves CSV with semicolons, so guess from the header
 * line rather than forcing the file to be comma separated.
 */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  if (semicolons > commas && semicolons >= tabs) return ';';
  if (tabs > commas && tabs > semicolons) return '\t';
  return ',';
}

function toNumber(raw: string): number | null | 'invalid' {
  const cleaned = raw.trim().replace(/\s/g, '');
  if (cleaned === '') return null;
  // Accept "15.000.000", "15000000", and "15000000.50".
  const normalised = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/\.(?=\d{3}\b)/g, '');
  const n = Number(normalised);
  return Number.isFinite(n) ? n : 'invalid';
}

function toDate(raw: string): string | null | 'invalid' {
  const v = raw.trim();
  if (v === '') return null;
  // ISO first; then d/m/yyyy as typed in Indonesian spreadsheets.
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return 'invalid';
}

const orNull = (v: string) => (v.trim() === '' ? null : v.trim());

export function parseAssetCsv(text: string, companies: Company[]): ParseResult {
  const delimiter = detectDelimiter(text);
  const table = parseDelimited(text, delimiter).filter(
    (r) => r.some((cell) => cell.trim() !== '')
  );

  if (table.length === 0) {
    return { rows: [], errors: [{ line: 0, assetTag: '', message: 'Berkas kosong.' }], ignoredColumns: [], delimiter };
  }

  const header = table[0].map((h) => h.trim().toLowerCase());
  const index = (name: string) => header.indexOf(name);

  const missing = ['asset_tag', 'asset_name', 'category', 'asset_type'].filter((c) => index(c) === -1);
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [{ line: 1, assetTag: '', message: `Kolom wajib tidak ditemukan: ${missing.join(', ')}.` }],
      ignoredColumns: [],
      delimiter,
    };
  }

  const ignoredColumns = header.filter((h) => h !== '' && !IMPORT_COLUMNS.includes(h as never));

  const cell = (row: string[], name: string) => {
    const i = index(name);
    return i === -1 ? '' : (row[i] ?? '');
  };

  const rows: ParsedAssetRow[] = [];
  const errors: RowError[] = [];
  const seenTags = new Set<string>();

  for (let r = 1; r < table.length; r++) {
    const row = table[r];
    const line = r + 1;
    const assetTag = cell(row, 'asset_tag').trim();

    const fail = (message: string) => errors.push({ line, assetTag, message });

    if (assetTag === '') { fail('asset_tag wajib diisi.'); continue; }
    if (seenTags.has(assetTag.toLowerCase())) { fail(`asset_tag "${assetTag}" muncul lebih dari sekali di berkas.`); continue; }
    seenTags.add(assetTag.toLowerCase());

    const assetName = cell(row, 'asset_name').trim();
    if (assetName === '') { fail('asset_name wajib diisi.'); continue; }

    const category = cell(row, 'category').trim();
    if (category === '') { fail('category wajib diisi.'); continue; }

    // asset_type is free text in the database, but depreciation keys off an exact
    // match, so a typo here would silently stop an asset being depreciated.
    const assetType = cell(row, 'asset_type').trim();
    if (!ASSET_TYPES.includes(assetType)) {
      fail(`asset_type "${assetType}" tidak dikenal. Pilih: ${ASSET_TYPES.join(', ')}.`);
      continue;
    }

    const conditionRaw = cell(row, 'condition').trim().toLowerCase();
    const condition = conditionRaw === '' ? 'good' : conditionRaw;
    if (!CONDITIONS.includes(condition)) {
      fail(`condition "${conditionRaw}" tidak dikenal. Pilih: ${CONDITIONS.join(', ')}.`);
      continue;
    }

    const statusRaw = cell(row, 'status').trim().toLowerCase();
    const status = statusRaw === '' ? 'active' : statusRaw;
    if (!ASSET_STATUS_VALUES.includes(status)) {
      fail(`status "${statusRaw}" tidak dikenal. Pilih: ${ASSET_STATUS_VALUES.join(', ')}.`);
      continue;
    }

    const companyRaw = cell(row, 'company').trim();
    let companyId: string | null = null;
    if (companyRaw !== '') {
      const match = companies.find(
        (c) => c.company_name.toLowerCase() === companyRaw.toLowerCase()
      );
      if (!match) { fail(`Perusahaan "${companyRaw}" tidak terdaftar.`); continue; }
      companyId = match.id;
    }

    const cost = toNumber(cell(row, 'purchase_cost'));
    if (cost === 'invalid') { fail('purchase_cost harus berupa angka.'); continue; }

    const date = toDate(cell(row, 'purchase_date'));
    if (date === 'invalid') { fail('purchase_date harus berformat YYYY-MM-DD atau DD/MM/YYYY.'); continue; }

    rows.push({
      line,
      assetTag,
      fields: {
        asset_tag: assetTag,
        asset_name: assetName,
        category,
        asset_type: assetType,
        brand: orNull(cell(row, 'brand')),
        model: orNull(cell(row, 'model')),
        serial_number: orNull(cell(row, 'serial_number')),
        condition,
        status,
        company_id: companyId,
        location: orNull(cell(row, 'location')),
        purchase_cost: cost,
        purchase_date: date,
      },
    });
  }

  return { rows, errors, ignoredColumns, delimiter };
}

// ---------------------------------------------------------------- writing

function escapeCell(value: unknown, delimiter: string): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /["\n\r]/.test(s) || s.includes(delimiter) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][], delimiter = ','): string {
  const lines = [
    header.map((h) => escapeCell(h, delimiter)).join(delimiter),
    ...rows.map((r) => r.map((c) => escapeCell(c, delimiter)).join(delimiter)),
  ];
  // The BOM makes Excel read UTF-8 rather than the local codepage.
  return '﻿' + lines.join('\r\n');
}

export function buildAssetCsv(
  assets: Asset[],
  holders: Record<string, ActiveAssignment>,
  companies: Company[]
): string {
  const companyName = (id: string | null) =>
    companies.find((c) => c.id === id)?.company_name ?? '';

  const rows = assets.map((a) => {
    const holder = holders[a.id];
    return [
      a.asset_tag,
      a.asset_name,
      a.category,
      a.asset_type,
      a.brand ?? '',
      a.model ?? '',
      a.serial_number ?? '',
      a.condition ?? '',
      a.status ?? '',
      companyName(a.company_id),
      a.location ?? '',
      a.purchase_cost ?? '',
      a.purchase_date ?? '',
      holder?.fullName ?? '',
      holder?.division ?? '',
      holder ? holder.assignedDate.slice(0, 10) : '',
    ];
  });

  return toCsv([...EXPORT_COLUMNS], rows);
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
