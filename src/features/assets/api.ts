import { supabase } from '@/services/supabase';
import { isSameLocalDay } from '@/lib/dates';
import type { AssetAssignment, AssetMaintenanceLog, AssetDocument } from '@/types';

/**
 * Assignment history for one asset, newest first.
 * Throws if the asset_assignments table has not been created yet — callers that
 * want the rest of the UI to keep working should catch and degrade.
 */
export async function fetchAssetAssignments(assetId: string) {
  const { data, error } = await supabase
    .from('asset_assignments')
    .select(
      `id, asset_id, employee_id, assigned_date, returned_date, status, notes, created_at,
       employee:employees(full_name, email, division)`
    )
    .eq('asset_id', assetId)
    .order('assigned_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AssetAssignment[];
}

/** Maintenance history for one asset, newest first. Same caveat as above. */
export async function fetchAssetMaintenanceLogs(assetId: string) {
  const { data, error } = await supabase
    .from('asset_maintenance_logs')
    .select('id, asset_id, description, cost, performed_at, next_maintenance_at, created_at')
    .eq('asset_id', assetId)
    .order('performed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AssetMaintenanceLog[];
}

export async function createAsset(asset: {
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
  asset_image: string | null;
}) {
  const { data, error } = await supabase
    .from('assets')
    .insert(asset)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Uploads to the asset-files bucket created by the assets migration. */
export async function uploadAssetImage(file: File): Promise<string | null> {
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const { error } = await supabase.storage
    .from('asset-files')
    .upload(fileName, file);
  if (error) throw error;

  const { data } = supabase.storage
    .from('asset-files')
    .getPublicUrl(fileName);
  return data.publicUrl;
}

export async function updateAsset(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Cascades to the asset's assignments, maintenance logs and documents. */
export async function deleteAsset(id: string) {
  const { error } = await supabase.from('assets').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Moves an asset to a new holder, or hands it back (employeeId = null).
 *
 * Only one assignment per asset may be active at a time — the assets migration
 * enforces that with a partial unique index — so the open assignment is closed
 * off as 'returned' before a new one is opened.
 *
 * `effectiveDate` is when the change actually happened, which is often earlier
 * than when it gets typed in. One date covers both sides of a hand-over: the old
 * assignment closes on that date and the new one starts on it. Omit it to let
 * the database default to now().
 *
 * `returnNote` is appended to the assignment being closed (condition on return,
 * reason, and so on).
 */
export async function setAssetAssignment(
  assetId: string,
  employeeId: string | null,
  effectiveDate?: string | null,
  returnNote?: string | null
) {
  const { data: current, error: readError } = await supabase
    .from('asset_assignments')
    .select('id, employee_id, assigned_date, notes')
    .eq('asset_id', assetId)
    .eq('status', 'assigned')
    .maybeSingle();
  if (readError) throw readError;

  const currentEmployeeId = current?.employee_id ?? null;

  if (currentEmployeeId === employeeId && !returnNote) {
    // Same holder, but the recorded handover date may still need correcting.
    if (current && effectiveDate && !isSameLocalDay(current.assigned_date, effectiveDate)) {
      const { error } = await supabase
        .from('asset_assignments')
        .update({ assigned_date: effectiveDate })
        .eq('id', current.id);
      if (error) throw error;
    }
    return;
  }

  if (current) {
    // An asset cannot come back before it went out. The database has no such
    // constraint, so reject it here rather than storing a negative holding period.
    if (effectiveDate && new Date(effectiveDate) < new Date(current.assigned_date)) {
      throw new Error(
        'Tanggal pengembalian tidak boleh mendahului tanggal serah terima (' +
        new Date(current.assigned_date).toLocaleDateString('id-ID') + ').'
      );
    }

    const notes = [current.notes, returnNote].filter(Boolean).join(' · ') || null;

    const { error } = await supabase
      .from('asset_assignments')
      .update({
        status: 'returned',
        returned_date: effectiveDate ?? new Date().toISOString(),
        notes,
      })
      .eq('id', current.id);
    if (error) throw error;
  }

  if (employeeId) {
    const { error } = await supabase
      .from('asset_assignments')
      .insert({
        asset_id: assetId,
        employee_id: employeeId,
        status: 'assigned',
        ...(effectiveDate ? { assigned_date: effectiveDate } : {}),
      });
    if (error) throw error;
  }
}

/** Hands an asset back to IT. Thin wrapper so call sites read as what they do. */
export async function returnAsset(
  assetId: string,
  returnedDate?: string | null,
  note?: string | null
) {
  return setAssetAssignment(assetId, null, returnedDate, note);
}

export async function createMaintenanceLog(log: {
  asset_id: string;
  description: string | null;
  cost: number | null;
  performed_at: string | null;
  next_maintenance_at: string | null;
}) {
  const { data, error } = await supabase
    .from('asset_maintenance_logs')
    .insert(log)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMaintenanceLog(id: string) {
  const { error } = await supabase.from('asset_maintenance_logs').delete().eq('id', id);
  if (error) throw error;
}

/** The open assignment for one asset, flattened for list rendering. */
export interface ActiveAssignment {
  employeeId: string | null;
  fullName: string;
  division: string;
  assignedDate: string;
}

/**
 * Every asset that is currently checked out, keyed by asset_id.
 *
 * Throws when asset_assignments is missing so the caller can say so, rather
 * than presenting an empty result as "nothing is assigned".
 */
export async function fetchActiveAssignments(): Promise<Record<string, ActiveAssignment>> {
  const { data, error } = await supabase
    .from('asset_assignments')
    .select('asset_id, employee_id, assigned_date, employees(full_name, division)')
    .eq('status', 'assigned');
  if (error) throw error;

  const map: Record<string, ActiveAssignment> = {};
  for (const row of (data ?? []) as any[]) {
    if (!row.asset_id) continue;
    map[row.asset_id] = {
      employeeId: row.employee_id ?? null,
      fullName: row.employees?.full_name ?? 'Karyawan tidak dikenal',
      division: row.employees?.division ?? '—',
      assignedDate: row.assigned_date,
    };
  }
  return map;
}

export async function fetchAssetByTag(assetTag: string) {
  const { data, error } = await supabase
    .from('assets')
    .select('*, companies(company_name)')
    .eq('asset_tag', assetTag)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const ASSET_BUCKET = 'asset-files';

export async function fetchAssetDocuments(assetId: string) {
  const { data, error } = await supabase
    .from('asset_documents')
    .select('id, asset_id, file_url, file_name, file_type, category, uploaded_at')
    .eq('asset_id', assetId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AssetDocument[];
}

/**
 * Uploads a signed document and records it against the asset.
 *
 * Files live under a `documents/` prefix in the same bucket as asset photos; the
 * bucket policy allows the whole bucket, so no extra policy is needed.
 */
export async function uploadAssetDocument(
  assetId: string,
  file: File,
  category: string
) {
  const safeName = file.name.replace(/[^\w.-]+/g, '_');
  const path = `documents/${assetId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(ASSET_BUCKET)
    .upload(path, file);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from('asset_documents')
    .insert({
      asset_id: assetId,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type || null,
      category,
    })
    .select()
    .single();

  if (error) {
    // Do not leave an orphaned file behind if the row could not be written.
    await supabase.storage.from(ASSET_BUCKET).remove([path]).catch(() => {});
    throw error;
  }
  return data as AssetDocument;
}

export async function deleteAssetDocument(doc: AssetDocument) {
  const { error } = await supabase.from('asset_documents').delete().eq('id', doc.id);
  if (error) throw error;

  // Derive the storage path back out of the public URL. The bucket name is ours,
  // so this split is stable; a failure here only leaves an unreferenced file.
  const marker = `/${ASSET_BUCKET}/`;
  const index = doc.file_url.indexOf(marker);
  if (index !== -1) {
    const path = decodeURIComponent(doc.file_url.slice(index + marker.length));
    await supabase.storage.from(ASSET_BUCKET).remove([path]);
  }
}

/** One asset an employee holds, or used to hold. */
export interface EmployeeAssetHolding {
  assignmentId: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  assignedDate: string;
  returnedDate: string | null;
  active: boolean;
}

/**
 * Everything ever handed to one employee, newest first.
 *
 * Returned assignments are included on purpose: "aset apa saja yang dipegang"
 * is answered by the open ones, but the closed ones are what tell you whether
 * a laptop was swapped or simply never issued.
 */
export async function fetchAssetsByEmployee(employeeId: string): Promise<EmployeeAssetHolding[]> {
  const { data, error } = await supabase
    .from('asset_assignments')
    .select(
      `id, assigned_date, returned_date, status,
       asset:assets(id, asset_tag, asset_name, category, brand, model)`
    )
    .eq('employee_id', employeeId)
    .order('assigned_date', { ascending: false });
  if (error) throw error;

  interface JoinedRow {
    id: string;
    assigned_date: string;
    returned_date: string | null;
    status: string;
    asset: {
      id: string;
      asset_tag: string;
      asset_name: string;
      category: string | null;
      brand: string | null;
      model: string | null;
    } | null;
  }

  // flatMap rather than filter+map: it drops the rows and narrows the type in
  // one step, so `asset` is known non-null below without an assertion.
  return ((data ?? []) as unknown as JoinedRow[]).flatMap((row) => {
    // The join comes back null when the asset row was deleted; there is nothing
    // to show for those, and they would render as an empty line.
    const asset = row.asset;
    if (!asset) return [];
    return [{
      assignmentId: row.id,
      assetId: asset.id,
      assetTag: asset.asset_tag,
      assetName: asset.asset_name,
      category: asset.category ?? null,
      brand: asset.brand ?? null,
      model: asset.model ?? null,
      assignedDate: row.assigned_date,
      returnedDate: row.returned_date,
      active: row.status === 'assigned',
    }];
  });
}

/**
 * How many assets each employee currently holds, keyed by employee id.
 *
 * One query for the whole directory rather than one per row — the employee list
 * shows this as a column, and 84 requests to fill it would be absurd.
 */
export async function fetchActiveAssetCountsByEmployee(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('asset_assignments')
    .select('employee_id')
    .eq('status', 'assigned');
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { employee_id: string | null }[]) {
    if (!row.employee_id) continue;
    counts[row.employee_id] = (counts[row.employee_id] ?? 0) + 1;
  }
  return counts;
}
