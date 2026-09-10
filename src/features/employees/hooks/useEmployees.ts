import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import type { Employee } from '@/types/index';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setEmployees(data as Employee[]);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();

    // Set up realtime subscription
    const channel = supabase
      .channel('public:employees')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        () => {
          fetchEmployees(); // Simple approach: refetch all on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEmployees]);

  return { employees, loading, error, refreshEmployees: fetchEmployees };
}
