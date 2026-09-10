import { Search, Monitor, Wifi, UserCircle, Shield, FileText, ChevronRight, MessageSquare, Plus, ThumbsUp, Eye, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';





import { useState } from 'react';
import { useArticles } from '@/features/knowledge-base/hooks/useArticles';
import type { Article } from '@/types/index';
import NewArticleModal from '@/features/knowledge-base/components/NewArticleModal';
import ArticleModal from '@/features/knowledge-base/components/ArticleModal';

export default function ITKnowledgeBase() {
  const { articles, loading, error, refreshArticles } = useArticles();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'popular' | 'recent' | 'category'>('popular');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredArticles = articles.filter(article => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!article.title.toLowerCase().includes(q) && 
          !article.description.toLowerCase().includes(q) &&
          !article.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const topHelpful = [...filteredArticles].sort((a, b) => b.helpful_score - a.helpful_score).slice(0, 5);

  let displayedArticles = filteredArticles;
  if (activeTab === 'popular') {
    displayedArticles = [...filteredArticles].sort((a, b) => b.views - a.views).slice(0, 5);
  } else if (activeTab === 'recent') {
    displayedArticles = [...filteredArticles].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (activeTab === 'category' && selectedCategory) {
    displayedArticles = filteredArticles.filter(a => a.category === selectedCategory);
  }

  const categories = [
    { icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-50', title: 'Hardware', count: articles.filter(a => a.category === 'Hardware').length, desc: 'Guides for laptops, desktops, printers, and other devices' },
    { icon: Wifi, color: 'text-green-500', bg: 'bg-green-50', title: 'Network', count: articles.filter(a => a.category === 'Network').length, desc: 'Connectivity, VPN, Wi-Fi, and network troubleshooting' },
    { icon: UserCircle, color: 'text-purple-500', bg: 'bg-purple-50', title: 'Accounts & Access', count: articles.filter(a => a.category === 'Accounts & Access').length, desc: 'Password reset, account access, and permissions' },
    { icon: () => <div className="font-bold font-serif">W</div>, color: 'text-orange-500', bg: 'bg-orange-50', title: 'Microsoft 365', count: articles.filter(a => a.category === 'Microsoft 365').length, desc: 'Outlook, Teams, OneDrive, and other M365 apps' },
    { icon: Shield, color: 'text-red-500', bg: 'bg-red-50', title: 'Security', count: articles.filter(a => a.category === 'Security').length, desc: 'Security best practices and troubleshooting' },
  ];

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setIsDetailModalOpen(true);
  };
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-8 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Find answers to common questions and troubleshooting guides</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Article</span>
          </button>
        </div>

        {/* Hero Search Area */}
        <div className="liquid-card rounded-xl p-6 md:p-8 flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10 max-w-xl w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How can we help you?</h2>
            <div className="relative mb-4">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for articles, topics, or keywords..." 
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <span className="text-gray-500 dark:text-gray-400 font-medium mr-1">Popular searches:</span>
              {['Outlook', 'VPN', 'Password Reset', 'Microsoft 365', 'Wi-Fi'].map(tag => (
                <button key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-full transition-colors text-xs font-medium">
                  {tag}
                </button>
              ))}
            </div>
          </div>
          {/* Decorative Illustration placeholder */}
          <div className="hidden md:block absolute right-0 bottom-0 top-0 w-1/3 bg-blue-50/50 [clip-path:polygon(20%_0,100%_0,100%_100%,0_100%)] flex items-center justify-center">
            <div className="text-blue-200">
               {/* A very simple SVG illustration representing a document/search */}
               <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                 <polyline points="14 2 14 8 20 8"></polyline>
                 <line x1="16" y1="13" x2="8" y2="13"></line>
                 <line x1="16" y1="17" x2="8" y2="17"></line>
                 <polyline points="10 9 9 9 8 9"></polyline>
                 <circle cx="15.5" cy="11.5" r="2.5"></circle>
                 <line x1="17.27" y1="13.27" x2="19.5" y2="15.5"></line>
               </svg>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Browse by Category</h3>
            <Link to="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all categories</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Link key={i} to="#" onClick={(e) => { e.preventDefault(); setSelectedCategory(cat.title); setActiveTab('category'); }} className="liquid-card rounded-xl p-5 hover:shadow-md transition-shadow group flex flex-col items-center text-center sm:block sm:text-left">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.bg} ${cat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{cat.title}</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-2 font-medium">{cat.count} articles</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{cat.desc}</p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Articles List */}
        <div className="liquid-card rounded-xl overflow-hidden">
          <div className="flex items-center gap-6 px-5 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => { setActiveTab('popular'); setSelectedCategory(null); }}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'popular' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              Popular Articles
            </button>
            <button 
              onClick={() => { setActiveTab('recent'); setSelectedCategory(null); }}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'recent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              Recently Updated
            </button>
            {activeTab === 'category' && selectedCategory && (
              <button className="py-4 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
                Category: {selectedCategory}
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {displayedArticles.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No articles found.</div>
            ) : displayedArticles.map((article) => (
              <div 
                key={article.id} 
                onClick={() => handleArticleClick(article)}
                className="p-5 flex items-start gap-4 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1 group-hover:text-blue-600 transition-colors">{article.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">{article.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-700/50">{article.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 font-medium shrink-0 pt-1">
                  <Eye className="w-4 h-4" />
                  <span>{article.views}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
            <Link to="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all articles <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-72 space-y-6 shrink-0">
        
        {/* Need Help CTA */}
        <div className="liquid-card rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">Can't find what you're looking for?</p>
          <button className="flex items-center justify-center gap-2 w-full py-2 liquid-card rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors mb-4">
            <MessageSquare className="w-4 h-4" />
            <span>Create a Ticket</span>
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Our support team is ready to assist you.
          </p>
          <div className="mt-4 flex justify-center text-blue-100">
             <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
        </div>

        {/* Stats */}
        <div className="liquid-card rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Knowledge Base Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-4 h-4" /> <span>Total Articles</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{articles.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Layers className="w-4 h-4" /> <span>Categories</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">5</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Eye className="w-4 h-4" /> <span>Total Views</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{articles.reduce((acc, curr) => acc + (curr.views || 0), 0)}</span>
            </div>
          </div>
        </div>

        {/* Top Helpful */}
        <div className="liquid-card rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Helpful Articles</h3>
          <div className="space-y-4">
            {topHelpful.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">No data available</div>
            ) : topHelpful.map((article, i) => (
              <div key={article.id} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h4 onClick={() => handleArticleClick(article)} className="text-sm font-medium text-gray-800 dark:text-gray-100 hover:text-blue-600 cursor-pointer leading-tight mb-1">{article.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <ThumbsUp className="w-3 h-3" /> {article.helpful_score}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            Based on user feedback
          </div>
        </div>

      </div>

      <NewArticleModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={refreshArticles} 
      />

      <ArticleModal
        article={selectedArticle}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}
