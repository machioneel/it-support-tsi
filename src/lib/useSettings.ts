import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { SystemSetting } from './types';

// Default values as fallback
const DEFAULT_SETTINGS = {
  system_name: 'IT Support Ticketing System',
  company_name: 'PT. Company Indonesia',
  system_url: 'https://itsupport.company.com',
  timezone: '(GMT+07:00) Asia/Jakarta',
  date_format: 'May 27, 2025',
  time_format: '02:30 PM',
  language: 'English (US)',
  first_day_of_week: 'Monday',
  allow_registration: false,
  enable_export: true,
  show_tips: true,
  rich_text_editor: true,
  auto_close_days: '14 days'
};

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, any>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsMap: Record<string, any> = { ...DEFAULT_SETTINGS };
        data.forEach((item: SystemSetting) => {
          settingsMap[item.setting_key] = item.setting_value;
        });
        setSettings(settingsMap);
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('system_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateSetting = async (key: string, value: any, description?: string) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          setting_key: key, 
          setting_value: value, 
          description,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      
      // Optimistic update
      setSettings(prev => ({ ...prev, [key]: value }));
      return { success: true };
    } catch (err: any) {
      console.error(`Error updating setting ${key}:`, err);
      return { success: false, error: err.message };
    }
  };

  const updateMultipleSettings = async (updates: Record<string, any>) => {
    try {
      const payload = Object.keys(updates).map(key => ({
        setting_key: key,
        setting_value: updates[key],
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('system_settings')
        .upsert(payload, { onConflict: 'setting_key' });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error(`Error updating settings:`, err);
      return { success: false, error: err.message };
    }
  }

  return {
    settings,
    loading,
    error,
    updateSetting,
    updateMultipleSettings,
    refreshSettings: fetchSettings
  };
}
