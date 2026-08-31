import { useState, useEffect } from 'react';
import { 
  Settings, 
  Mail, 
  MessageCircle, 
  Ticket, 
  Clock, 
  Users, 
  Folder, 
  List, 
  Plug, 
  Shield, 
  Cpu,
  ChevronDown,
  ChevronRight,
  Monitor,
  FileText,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../lib/useSettings';
const SETTINGS_MENU = [
  { id: 'general', icon: Settings, label: 'General', desc: 'Basic system settings' },
  { id: 'email', icon: Mail, label: 'Email Notifications', desc: 'Manage email alerts' },
  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp Notifications', desc: 'Manage WhatsApp alerts' },
  { id: 'ticket', icon: Ticket, label: 'Ticket Settings', desc: 'Configure ticket behavior' },
  { id: 'sla', icon: Clock, label: 'SLA Settings', desc: 'Manage SLA policies' },
  { id: 'roles', icon: Users, label: 'Roles & Permissions', desc: 'Manage user roles' },
  { id: 'categories', icon: Folder, label: 'Categories', desc: 'Manage ticket categories' },
  { id: 'custom-fields', icon: List, label: 'Custom Fields', desc: 'Manage custom fields' },
  { id: 'integrations', icon: Plug, label: 'Integrations', desc: 'Manage integrations' },
  { id: 'security', icon: Shield, label: 'Security', desc: 'Security preferences' },
  { id: 'system', icon: Cpu, label: 'System', desc: 'System information & update' },
];

export default function ITSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const { settings, loading, updateMultipleSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when hook data loads
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateMultipleSettings(localSettings);
    setIsSaving(false);
  };

  const updateLocal = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col space-y-6 min-w-0">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your IT Support system settings and preferences</p>
        </div>

        {/* Settings Layout */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          
          {/* Settings Navigation */}
          <div className="w-full lg:w-64 shrink-0 liquid-card rounded-xl p-3 h-fit hidden md:block">
            <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 px-3 pt-2">General</h3>
            <div className="space-y-1">
              {SETTINGS_MENU.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                      isActive 
                        ? 'bg-blue-50' 
                        : 'hover:bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className={`mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-700 dark:text-gray-200'}`}>
                        {item.label}
                      </div>
                      <div className={`text-xs ${isActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Settings Section */}
          <div className="flex-1 liquid-card rounded-xl p-6 lg:p-8">
            {activeTab === 'general' && (
              <div className="space-y-8">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">General Settings</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Update your system basic settings</p>
                  </div>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving || loading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                {/* System Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-700/50">System Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="System Name" value={localSettings.system_name} onChange={(v) => updateLocal('system_name', v)} />
                    <InputField label="Company Name" value={localSettings.company_name} onChange={(v) => updateLocal('company_name', v)} />
                    <InputField label="System URL" value={localSettings.system_url} onChange={(v) => updateLocal('system_url', v)} />
                    <SelectField 
                      label="Timezone" 
                      value={localSettings.timezone} 
                      onChange={(v) => updateLocal('timezone', v)}
                      options={['(GMT+07:00) Asia/Jakarta', '(GMT+00:00) UTC', '(GMT-05:00) Eastern Time']} 
                    />
                  </div>
                </div>

                {/* Regional Settings */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-700/50">Regional Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SelectField 
                      label="Date Format" 
                      value={localSettings.date_format} 
                      onChange={(v) => updateLocal('date_format', v)}
                      options={['May 27, 2025', '27 May 2025', '2025-05-27', 'MM/DD/YYYY', 'DD/MM/YYYY']} 
                    />
                    <SelectField 
                      label="Time Format" 
                      value={localSettings.time_format} 
                      onChange={(v) => updateLocal('time_format', v)}
                      options={['02:30 PM', '14:30']} 
                    />
                    <SelectField 
                      label="Language" 
                      value={localSettings.language} 
                      onChange={(v) => updateLocal('language', v)}
                      options={['English (US)', 'Bahasa Indonesia']} 
                    />
                    <SelectField 
                      label="First Day of Week" 
                      value={localSettings.first_day_of_week} 
                      onChange={(v) => updateLocal('first_day_of_week', v)}
                      options={['Monday', 'Sunday']} 
                    />
                  </div>
                </div>

                {/* Other Preferences */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-700/50">Other Preferences</h3>
                  <div className="space-y-5">
                    <ToggleRow 
                      icon={Users} 
                      title="Allow users to register" 
                      desc="Enable new users to register an account" 
                      isOn={localSettings.allow_registration}
                      onChange={(v: boolean) => updateLocal('allow_registration', v)}
                    />
                    <ToggleRow 
                      icon={Download} 
                      title="Enable data export" 
                      desc="Allow agents to export tickets and reports" 
                      isOn={localSettings.enable_export}
                      onChange={(v: boolean) => updateLocal('enable_export', v)}
                    />
                    <ToggleRow 
                      icon={Settings}
                      title="Show helpful tips" 
                      desc="Display helpful tips on the dashboard" 
                      isOn={localSettings.show_tips}
                      onChange={(v: boolean) => updateLocal('show_tips', v)}
                    />
                    <ToggleRow 
                      icon={FileText} 
                      title="Enable rich text editor" 
                      desc="Enable rich text editor in ticket response" 
                      isOn={localSettings.rich_text_editor}
                      onChange={(v: boolean) => updateLocal('rich_text_editor', v)}
                    />
                    
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">Auto close resolved tickets</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Automatically close tickets after number of days</div>
                        </div>
                      </div>
                      <div className="relative w-32 shrink-0">
                        <select 
                          value={localSettings.auto_close_days}
                          onChange={(e) => updateLocal('auto_close_days', e.target.value)}
                          className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option>7 days</option>
                          <option>14 days</option>
                          <option>30 days</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
            
            {activeTab !== 'general' && (
              <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
                <p>Settings content for {SETTINGS_MENU.find(m => m.id === activeTab)?.label} goes here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Widgets */}
      <div className="w-full lg:w-80 space-y-6 shrink-0 pt-[72px]">
        
        {/* Email Configuration */}
        <WidgetCard title="Email Configuration" linkText="Manage Email Settings">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">itsupport@company.com</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-green-700 bg-green-100 uppercase tracking-wider shrink-0">Verified</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">SMTP Server</div>
              <div className="font-medium text-gray-900 dark:text-white">smtp.company.com</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Port</div>
              <div className="font-medium text-gray-900 dark:text-white">587</div>
            </div>
          </div>
        </WidgetCard>

        {/* WhatsApp Configuration */}
        <WidgetCard title="WhatsApp Configuration" linkText="Manage WhatsApp Settings">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">+62 812-3456-7890</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-green-700 bg-green-100 uppercase tracking-wider shrink-0">Connected</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Provider</div>
              <div className="font-medium text-gray-900 dark:text-white">Fonnte</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Status</div>
              <div className="font-medium text-gray-900 dark:text-white">Active</div>
            </div>
          </div>
        </WidgetCard>

        {/* Storage Usage */}
        <WidgetCard title="Storage Usage" linkText="Manage Storage">
          <div className="mb-2">
            <span className="font-bold text-blue-600 text-sm">12.4 GB</span>
            <span className="text-sm text-gray-500 dark:text-gray-400"> of 50 GB used</span>
          </div>
          <div className="flex items-center gap-3 mb-1">
             <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
               <div className="h-full bg-blue-600 rounded-full" style={{ width: '24.8%' }}></div>
             </div>
             <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">24.8%</span>
          </div>
        </WidgetCard>

        {/* System Information */}
        <WidgetCard title="System Information" linkText="View System Logs">
           <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Monitor className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">System Information</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Version</span>
              <span className="font-medium text-gray-900 dark:text-white">v1.2.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Environment</span>
              <span className="font-medium text-gray-900 dark:text-white">Production</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
              <span className="font-medium text-gray-900 dark:text-white">May 20, 2025 09:15 AM</span>
            </div>
          </div>
        </WidgetCard>

      </div>
    </div>
  );
}

// Helpers

function InputField({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
      <input 
        type="text" 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (val: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <select 
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
        >
          {options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, title, desc, isOn, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="mt-1 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{title}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{desc}</div>
        </div>
      </div>
      <button 
        onClick={() => onChange(!isOn)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${isOn ? 'bg-blue-600' : 'bg-gray-200'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-800 shadow ring-0 transition duration-200 ease-in-out ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function WidgetCard({ title, linkText, children }: any) {
  return (
    <div className="liquid-card rounded-xl overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-gray-700/50">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        {children}
      </div>
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50">
        <Link to="#" className="flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-700">
          <span>{linkText}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

