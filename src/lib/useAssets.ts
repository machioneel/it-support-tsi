import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Asset } from './types';

export function useAssets() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from('assets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAssets(data || []);
        } catch (err: any) {
            console.error('Error fetching assets:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    return { assets, loading, error, refetch: fetchAssets };
}