/**
 * Priority and status pills for tickets.
 *
 * These used to be exported from the dashboard page, which meant the tickets
 * page imported from another page. They belong to the tickets feature.
 */

export function PriorityBadge({ priority }: { priority: string }) {
  const colors = (() => {
    switch (priority) {
      case 'P1 - Critical': return 'text-red-600 border-red-200 bg-red-50/50';
      case 'P2 - High':     return 'text-orange-600 border-orange-200 bg-orange-50/50';
      case 'P3 - Medium':   return 'text-blue-600 border-blue-200 bg-blue-50/50';
      case 'P4 - Low':      return 'text-gray-600 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
      default:              return 'text-gray-600 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
    }
  })();

  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${colors}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors = (() => {
    switch (status) {
      case 'Open':        return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'In Progress': return 'text-indigo-600 border-indigo-200 bg-indigo-50';
      case 'Pending':     return 'text-purple-600 border-purple-200 bg-purple-50';
      case 'Resolved':    return 'text-green-600 border-green-200 bg-green-50';
      case 'Closed':      return 'text-gray-500 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
      default:            return 'text-gray-600 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
    }
  })();

  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${colors}`}>
      {status}
    </span>
  );
}
