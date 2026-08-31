import { X, ThumbsUp, Eye } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Article } from '@/lib/types';

interface ArticleModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ArticleModal({ article, isOpen, onClose }: ArticleModalProps) {
  if (!isOpen || !article) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="liquid-panel rounded-xl shadow-xl w-full max-w-3xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/50 shrink-0">
          <div className="text-xs font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {article.category}
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">{article.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-6 border-b border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>{article.views} views</span>
            </div>
            <div className="flex items-center gap-1.5 text-green-600 font-medium">
              <ThumbsUp className="w-4 h-4" />
              <span>{article.helpful_score}% helpful</span>
            </div>
            <span>•</span>
            <span>Published {new Date(article.created_at).toLocaleDateString()}</span>
          </div>

          <div className="prose prose-blue max-w-none prose-sm sm:prose-base text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-sans">
            {article.content}
          </div>
        </div>

        <div className="p-6 bg-transparent border-t border-gray-100 dark:border-gray-700/50 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Was this article helpful?</p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors shadow-sm">
                <ThumbsUp className="w-4 h-4" />
                Yes
              </button>
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors shadow-sm">
                <ThumbsUp className="w-4 h-4 rotate-180" />
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

