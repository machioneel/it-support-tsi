import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { Article } from './types';

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .select('*')
        .order('views', { ascending: false });

      if (error) {
        throw error;
      }

      setArticles(data as Article[]);
    } catch (err: any) {
      console.error('Error fetching articles:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();

    // Set up realtime subscription
    const channel = supabase
      .channel('public:knowledge_base_articles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'knowledge_base_articles' },
        (payload) => {
          fetchArticles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchArticles]);

  return { articles, loading, error, refreshArticles: fetchArticles };
}
