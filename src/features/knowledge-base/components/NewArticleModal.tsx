import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { createPortal } from 'react-dom';
import { supabase } from '@/services/supabase';

interface NewArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewArticleModal({ isOpen, onClose, onSuccess }: NewArticleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error: insertError } = await supabase
        .from('knowledge_base_articles')
        .insert({
          title,
          description,
          category,
          content,
          views: 0,
          helpful_score: 100
        });

      if (insertError) throw insertError;
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Hardware');
      setContent('');
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add article');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="liquid-panel rounded-xl shadow-xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/50 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Article</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Article Title <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to connect to the VPN"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Network">Network</option>
                <option value="Accounts & Access">Accounts & Access</option>
                <option value="Microsoft 365">Microsoft 365</option>
                <option value="Security">Security</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Short Description <span className="text-red-500">*</span></label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short summary for search results..."
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Content (Markdown) <span className="text-red-500">*</span></label>
              <textarea 
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Full guide instructions..."
                rows={8}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono" 
              />
            </div>
          </div>

          <div className="p-5 border-t border-gray-100 dark:border-gray-700/50 shrink-0 flex items-center justify-end gap-3 bg-transparent">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Publish Article
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}


