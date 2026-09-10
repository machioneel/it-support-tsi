import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Download,
  Search,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Package,
} from 'lucide-react';

import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { deleteEmployee, countEmployeeReferences } from '@/features/employees/api';
import { fetchCompanies } from '@/services/companies';
import {
  fetchAssetsByEmployee,
  fetchActiveAssetCountsByEmployee,
} from '@/features/assets/api';
import type { EmployeeAssetHolding } from '@/features/assets/api';
import { getCategoryIcon } from '@/features/assets/lib/assetConfig';
import EmployeeFormModal from '@/features/employees/components/EmployeeFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SortableHeader from '@/components/ui/SortableHeader';
import type { SortDir } from '@/components/ui/SortableHeader';
import type { Company, Employee } from '@/types/index';

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('id-ID');
}

/** Sortable columns. 'company' sorts on the resolved name, not the raw uuid. */
type SortKey =
  | 'full_name'
  | 'email'
  | 'company'
  | 'division'
  | 'contact_number'
  | 'assets'
  | 'created_at';

export default function ITEmployees() {
  const { employees, loading, refreshEmployees } = useEmployees();
  const [companies, setCompanies] = useState<Company[]>([]);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  // What a delete would detach — fetched when the confirm dialog opens.
  const [deleteImpact, setDeleteImpact] = useState<{
    tickets: number;
    activeAssets: number;
    assetsUnavailable: boolean;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Defaults mirror the order useEmployees already returns (newest first), so
  // turning on sorting does not silently rearrange the table on first load.
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // employee_id -> jumlah aset yang sedang dipegang. Satu query untuk seluruh
  // direktori, bukan satu per baris.
  const [assetCounts, setAssetCounts] = useState<Record<string, number>>({});
  const [assetsUnavailable, setAssetsUnavailable] = useState(false);

  // Rincian aset milik karyawan yang sedang dibuka di panel kanan.
  const [holdings, setHoldings] = useState<EmployeeAssetHolding[]>([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);

  useEffect(() => {
    fetchCompanies()
      .then((data) => setCompanies(data as Company[]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchActiveAssetCountsByEmployee()
      .then((counts) => {
        setAssetCounts(counts);
        setAssetsUnavailable(false);
      })
      .catch((err) => {
        console.error('Data aset tidak dapat dimuat:', err);
        setAssetCounts({});
        setAssetsUnavailable(true);
      });
  }, [employees]);

  // The cancelled flag stops a slow earlier response from overwriting a newer
  // one when the user clicks through several people quickly.
  useEffect(() => {
    if (!selectedEmployee) {
      setHoldings([]);
      return;
    }
    let cancelled = false;
    setHoldingsLoading(true);
    fetchAssetsByEmployee(selectedEmployee.id)
      .then((rows) => { if (!cancelled) setHoldings(rows); })
      .catch((err) => {
        console.error('Riwayat aset karyawan tidak dapat dimuat:', err);
        if (!cancelled) setHoldings([]);
      })
      .finally(() => { if (!cancelled) setHoldingsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedEmployee]);

  const askDelete = (employee: Employee) => {
    setDeletingEmployee(employee);
    setDeleteImpact(null);
    countEmployeeReferences(employee.id)
      .then(setDeleteImpact)
      .catch((err) => {
        console.error('Tidak bisa menghitung relasi karyawan:', err);
        setDeleteImpact(null);
      });
  };

  const companyName = (id: string) =>
    companies.find((c) => c.id === id)?.company_name ?? '-';

  // `division` holds one text value, but a few people genuinely belong to more
  // than one — those are stored comma-separated. Everything that reasons about
  // divisions goes through this, so a person shows up under each of theirs
  // rather than under a combined label nobody would think to filter for.
  const divisionsOf = (employee: Employee) =>
    employee.division
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

  const divisions = Array.from(
    new Set(employees.flatMap(divisionsOf))
  ).sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }));

  const filteredEmployees = employees.filter((employee) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !employee.full_name.toLowerCase().includes(q) &&
        !employee.email.toLowerCase().includes(q) &&
        !employee.division.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (companyFilter !== 'All' && employee.company_id !== companyFilter) return false;
    if (divisionFilter !== 'All' && !divisionsOf(employee).includes(divisionFilter)) return false;
    return true;
  });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Text reads best A-Z; dates and counts are most useful highest-first.
      setSortDir(key === 'created_at' || key === 'assets' ? 'desc' : 'asc');
    }
    // Page 4 of a re-ordered list is meaningless.
    setCurrentPage(1);
  };

  // null means "no value here" — those rows sink to the bottom in BOTH
  // directions, since a page of blanks is never what someone sorted for.
  const sortValue = (employee: Employee): string | number | null => {
    switch (sortKey) {
      case 'company':
        return companies.find((c) => c.id === employee.company_id)?.company_name ?? null;
      case 'created_at':
        return employee.created_at ? new Date(employee.created_at).getTime() : null;
      case 'contact_number':
        return employee.contact_number || null;
      case 'assets':
        return assetCounts[employee.id] ?? 0;
      default:
        return employee[sortKey];
    }
  };

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const av = sortValue(a);
    const bv = sortValue(b);
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;

    const cmp =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'id', { sensitivity: 'base', numeric: true });

    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalFiltered = filteredEmployees.length;
  const totalPages = Math.ceil(totalFiltered / rowsPerPage);
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (validCurrentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalFiltered);
  const paginatedEmployees = sortedEmployees.slice(startIndex, endIndex);

  const withContact = employees.filter((e) => !!e.contact_number).length;

  const activeHoldings = holdings.filter((h) => h.active);
  const pastHoldings = holdings.filter((h) => !h.active);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Company employee directory — the people who report tickets through the Employee Portal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 liquid-card rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Employees" value={employees.length.toString()} icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <StatCard title="Divisions" value={divisions.length.toString()} icon={Briefcase} color="text-purple-600" bg="bg-purple-50" />
          <StatCard title="With WhatsApp" value={withContact.toString()} icon={Phone} color="text-green-600" bg="bg-green-50" />
        </div>

        {/* Table Area */}
        <div className="liquid-card rounded-xl overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search employees..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={companyFilter}
                  onChange={(e) => { setCompanyFilter(e.target.value); setCurrentPage(1); }}
                  className="pl-3 pr-8 py-2 liquid-card rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800/50 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="All">All Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={divisionFilter}
                  onChange={(e) => { setDivisionFilter(e.target.value); setCurrentPage(1); }}
                  className="pl-3 pr-8 py-2 liquid-card rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800/50 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="All">All Divisions</option>
                  {divisions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {assetsUnavailable && (
            <div className="px-4 py-3 border-b border-amber-200/60 dark:border-amber-700/40 bg-amber-50/70 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-400">
              Data aset tidak dapat dimuat — kolom "Aset" dikosongkan.
              Jalankan migrasi assets untuk membuat tabel asset_assignments.
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-transparent text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100/50 dark:border-gray-700/50">
                <tr>
                  <SortableHeader label="Employee" columnKey="full_name" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="min-w-[200px]" />
                  <SortableHeader label="Email" columnKey="email" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="min-w-[250px]" />
                  <SortableHeader label="Company" columnKey="company" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Division" columnKey="division" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Contact" columnKey="contact_number" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Aset" columnKey="assets" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Registered" columnKey="created_at" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {loading ? (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">Loading employees...</td></tr>
                ) : paginatedEmployees.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">No employees match your filter.</td></tr>
                ) : paginatedEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className={`hover:bg-gray-50 dark:bg-gray-800/50 transition-colors cursor-pointer ${selectedEmployee?.id === employee.id ? 'bg-blue-50/30' : ''}`}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0">
                          {employee.full_name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white truncate">{employee.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                      <div className="truncate max-w-[230px]">{employee.email}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{companyName(employee.company_id)}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {divisionsOf(employee).map((division) => (
                          <span
                            key={division}
                            className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold border text-gray-600 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                          >
                            {division}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{employee.contact_number || '-'}</td>
                    <td className="px-5 py-3">
                      {assetsUnavailable ? (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      ) : (assetCounts[employee.id] ?? 0) === 0 ? (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50">
                          <Package className="w-3 h-3" />
                          {assetCounts[employee.id]}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{employee.created_at ? new Date(employee.created_at).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingEmployee(employee)}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => askDelete(employee)}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-gray-100/50 dark:border-gray-700/50 bg-transparent flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-6">
              <span>{totalFiltered === 0 ? 0 : startIndex + 1}-{endIndex} of {totalFiltered}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (validCurrentPage <= 3) pageNum = i + 1;
                  else if (validCurrentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = validCurrentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded flex items-center justify-center ${validCurrentPage === pageNum ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-100 dark:bg-gray-700/50'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages || totalPages === 0}
                  className="p-1 rounded hover:bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Employee Details */}
      {selectedEmployee && (
        <div className="w-full lg:w-80 liquid-card rounded-xl flex flex-col shrink-0 self-start sticky top-20">
          <div className="p-6 pb-4 flex flex-col items-center text-center relative border-b border-gray-100 dark:border-gray-700/50">
            <button
              onClick={() => setSelectedEmployee(null)}
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-3xl mb-4">
              {selectedEmployee.full_name.charAt(0)}
            </div>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{selectedEmployee.full_name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedEmployee.division}</p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Employee Information</h3>
              <div className="space-y-3 text-sm">
                <InfoRow icon={Mail} label="Email" value={selectedEmployee.email} />
                <InfoRow icon={Building2} label="Company" value={companyName(selectedEmployee.company_id)} />
                <InfoRow icon={Briefcase} label="Division" value={selectedEmployee.division} />
                <InfoRow icon={Phone} label="Contact" value={selectedEmployee.contact_number || '-'} />
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-700/50"></div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                Aset Dipegang
                {!holdingsLoading && activeHoldings.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
                    {activeHoldings.length}
                  </span>
                )}
              </h3>

              {holdingsLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
              ) : activeHoldings.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tidak ada aset yang sedang dipegang.
                </p>
              ) : (
                <ul className="space-y-2">
                  {activeHoldings.map((h) => {
                    const Icon = getCategoryIcon(h.category ?? '');
                    return (
                      <li key={h.assignmentId} className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {h.assetName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {h.assetTag}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            sejak {formatDate(h.assignedDate)}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {pastHoldings.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                    Pernah memegang {pastHoldings.length} aset lain
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {pastHoldings.map((h) => (
                      <li key={h.assignmentId} className="text-xs">
                        <span className="text-gray-700 dark:text-gray-200">{h.assetName}</span>
                        <span className="text-gray-400 dark:text-gray-500 font-mono"> · {h.assetTag}</span>
                        <div className="text-gray-400 dark:text-gray-500">
                          {formatDate(h.assignedDate)} → {formatDate(h.returnedDate)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-700/50"></div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Portal access only</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Submits complaints through the Employee Portal. No dashboard login.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingEmployee(selectedEmployee)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => askDelete(selectedEmployee)}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 dark:border-red-700/50 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <EmployeeFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={refreshEmployees}
      />

      <EmployeeFormModal
        employee={editingEmployee}
        isOpen={editingEmployee !== null}
        onClose={() => setEditingEmployee(null)}
        onSuccess={() => {
          refreshEmployees();
          // Keep the detail panel showing the row that was just edited.
          setSelectedEmployee((prev) =>
            prev && editingEmployee && prev.id === editingEmployee.id ? null : prev
          );
        }}
      />

      <ConfirmDialog
        isOpen={deletingEmployee !== null}
        title="Hapus karyawan?"
        message={
          <>
            <span className="font-medium text-gray-900 dark:text-white">
              {deletingEmployee?.full_name}
            </span>{' '}
            ({deletingEmployee?.email}) akan dihapus permanen.
            {deleteImpact === null ? (
              <p className="mt-2 text-gray-400">Memeriksa data terkait...</p>
            ) : (deleteImpact.tickets > 0 || deleteImpact.activeAssets > 0) ? (
              <span className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Riwayatnya tidak ikut terhapus, tetapi kehilangan nama pemiliknya:
                  {deleteImpact.tickets > 0 && (
                    <> <strong>{deleteImpact.tickets} tiket</strong> akan kehilangan pelapor</>
                  )}
                  {deleteImpact.tickets > 0 && deleteImpact.activeAssets > 0 && ' dan'}
                  {deleteImpact.activeAssets > 0 && (
                    <> <strong>{deleteImpact.activeAssets} aset</strong> yang sedang dipegang akan kehilangan pemegang</>
                  )}
                  . Pertimbangkan mengembalikan asetnya lebih dulu.
                </span>
              </span>
            ) : (
              <p className="mt-2 text-gray-500">Tidak ada tiket atau aset yang terkait.</p>
            )}
          </>
        }
        confirmLabel="Hapus"
        onConfirm={async () => {
          if (!deletingEmployee) return;
          await deleteEmployee(deletingEmployee.id);
          if (selectedEmployee?.id === deletingEmployee.id) setSelectedEmployee(null);
          refreshEmployees();
        }}
        onClose={() => { setDeletingEmployee(null); setDeleteImpact(null); }}
      />
    </div>
  );
}

// Helpers
function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="liquid-card rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2 shrink-0">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className="text-gray-900 dark:text-white font-medium text-right break-all">{value}</span>
    </div>
  );
}
