import { ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortDir = 'asc' | 'desc';

/**
 * A clickable table header.
 *
 * Generic over the column key so each table keeps its own union of sortable
 * columns and a typo becomes a compile error rather than a header that silently
 * sorts nothing.
 */
export default function SortableHeader<T extends string>({
  label,
  columnKey,
  activeKey,
  direction,
  onSort,
  className = '',
}: {
  label: string;
  columnKey: T;
  activeKey: T;
  direction: SortDir;
  onSort: (key: T) => void;
  className?: string;
}) {
  const active = activeKey === columnKey;
  const Icon = !active ? ChevronsUpDown : direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th
      className={`px-5 py-3 ${className}`}
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        title={`Urutkan berdasarkan ${label}`}
        className="group flex items-center gap-1.5 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {label}
        <Icon
          className={`w-3.5 h-3.5 shrink-0 ${
            active
              ? 'text-blue-600'
              : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-400'
          }`}
        />
      </button>
    </th>
  );
}
