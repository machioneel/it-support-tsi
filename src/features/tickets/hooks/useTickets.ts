import { useState, useEffect, useCallback } from 'react';
import { fetchTickets } from '@/features/tickets/api';
import type { Ticket } from '@/types/index';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTickets();
      setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tickets'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return { tickets, loading, error, refreshTickets: loadTickets };
}
