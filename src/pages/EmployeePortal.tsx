import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Upload, X, CheckCircle2, Loader2, LifeBuoy, Search, FileText, Eye, ChevronRight, ShieldCheck, Headphones } from 'lucide-react';
import { supabase, checkEmail, createTicket, uploadAttachment } from '@/lib/supabase';
import { compressImage } from '@/lib/utils';
import { useArticles } from '@/lib/useArticles';
import type { Company, User, Article } from '@/lib/types';
import ArticleModal from '@/components/ArticleModal';



export default function EmployeePortal() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // complaint fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Knowledge base fields
  const { articles, loading: articlesLoading } = useArticles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [showAllArticles, setShowAllArticles] = useState(false);

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

  const sortedFilteredArticles = filteredArticles.sort((a, b) => (b.views || 0) - (a.views || 0));
  const displayedArticles = showAllArticles ? sortedFilteredArticles : sortedFilteredArticles.slice(0, 5);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const found = await checkEmail(email);
      if (found) {
        setUser(found);
        const { data: comp } = await supabase
          .from('companies')
          .select('id, company_name')
          .eq('id', found.company_id)
          .maybeSingle();
        setCompany(comp as Company | null);
        setStep(2);
      } else {
        setUser(null);
        setCompany(null);
        setError('Email tidak terdaftar di sistem. Silakan hubungi IT Support.');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      const compressedFiles = await Promise.all(newFiles.map(f => compressImage(f)));
      setFiles((prev) => [...prev, ...compressedFiles].slice(0, 3));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const compressedFiles = await Promise.all(newFiles.map(f => compressImage(f)));
      setFiles((prev) => [...prev, ...compressedFiles].slice(0, 3)); // Max 3 files
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !user) return;

    setSubmitting(true);
    setError('');
    try {
      const reporterId = user.id;
      const companyId = user.company_id;

      let attachmentUrl: string | null = null;
      if (files.length > 0) {
        attachmentUrl = await uploadAttachment(files[0]);
      }

      const d = new Date();
      const ticketNumber = `TIC-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      await createTicket({
        ticket_number: ticketNumber,
        company_id: companyId,
        reporter_id: reporterId,
        reported_via: 'Web Portal',
        issue_title: title,
        issue_description: description,
        issue_category: 'Software',
        issue_subcategory: 'General',
        priority_level: 'P3 - Medium',
        ticket_status: 'Open',
        pending_reason: null,
        root_cause: null,
        solution_applied: null,
        attachment_url: attachmentUrl,
      });

      // Invoke Supabase Edge Function for WhatsApp Notification
      console.log("Invoking Edge Function fonnte_whatsapp...");
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('fonnte_whatsapp', {
        body: {
          type: 'INSERT',
          record: {
            ticket_number: ticketNumber,
            issue_title: title,
            priority_level: 'P3 - Medium',
            reporter_id: reporterId
          }
        }
      });
      
      console.log("Edge Function Response Data:", edgeData);
      if (edgeError) {
        console.error("Edge Function Invocation Error:", edgeError);
      }

      setSuccess(true);
    } catch {
      setError('Gagal mengirim keluhan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setEmail('');
    setUser(null);
    setCompany(null);
    setTitle('');
    setDescription('');
    setFiles([]);
    setSuccess(false);
    setError('');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="liquid-panel rounded-3xl shadow-lg p-8 max-w-md w-full text-center animate-[fadeIn_0.4s_ease]">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Keluhan Terkirim
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Terima kasih. Tim IT Support akan segera menindaklanjuti laporan
            Anda. Anda akan menerima pembaruan via WhatsApp.
          </p>
          <button
            onClick={resetForm}
            className="w-full py-3 px-6 bg-slate-800 text-white rounded-full font-medium text-sm hover:bg-slate-900 transition-colors"
          >
            Kirim Keluhan Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#f0f4f8] flex flex-col font-sans relative">
      {/* Decorative Background for Glass Effect */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="shrink-0 px-4 sm:px-8 py-4 flex items-center justify-between bg-white/60 backdrop-blur-md border-b border-white/50 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
            <LifeBuoy className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-base">IT Helpdesk</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm text-xs font-medium text-slate-600">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Status Sistem
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50/50 hover:bg-indigo-100/50"
          >
            <span className="hidden sm:inline">IT Support Login</span>
            <span className="sm:hidden">Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 lg:min-h-0 lg:overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Ticket Submission */}
        <div className="w-full lg:w-[420px] shrink-0 lg:h-full lg:overflow-y-auto lg:pr-1 space-y-6">
          {/* Step 1: Email Gatekeeper */}
          {step === 1 && (
            <div className="liquid-panel rounded-3xl p-8 sm:p-10 animate-[fadeIn_0.4s_ease]">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-white border border-slate-100 shadow-sm relative">
                  {/* Decorative sparkles */}
                  <div className="absolute top-1 right-2 w-1 h-1 bg-indigo-300 rounded-full"></div>
                  <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
                  <div className="absolute top-4 left-1 w-1 h-1 bg-purple-300 rounded-full"></div>
                  <Mail className="w-8 h-8 text-indigo-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">
                  Laporkan Kendala IT
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                  Masukkan email kantor Anda untuk memulai melaporkan kendala teknis.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    Email Kantor
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Gunakan email perusahaan Anda (contoh: nama@perusahaan.co.id)
                  </p>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@perusahaan.co.id"
                      required
                      autoFocus
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-red-600 mt-2">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3.5 px-6 bg-indigo-500 text-white rounded-xl font-medium text-sm hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Lanjutkan
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Keamanan & Privasi */}
              <div className="mt-8 liquid-card bg-indigo-50/30 rounded-2xl p-4 flex gap-4 border border-indigo-100/50">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">Keamanan & Privasi</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Email Anda hanya akan digunakan untuk validasi dan keperluan ticket support. Data Anda aman bersama kami.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Complaint Form */}
          {step === 2 && (
            <div className="liquid-panel rounded-3xl p-6 sm:p-8 animate-[fadeIn_0.4s_ease]">
              {/* Greeting */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {user && `Halo ${user.full_name.split(' ')[0]}, silakan tulis kendala Anda`}
                  </h2>
                  {company && (
                    <p className="text-xs text-slate-500 mt-1">
                      {company.company_name}
                    </p>
                  )}
                </div>
              </div>

              {/* User Info Card */}
              <div className="mb-6 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-3">Informasi Pelapor</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Nama Lengkap</p>
                    <p className="text-sm font-medium text-slate-700">{user?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Divisi</p>
                    <p className="text-sm font-medium text-slate-700">{user?.division}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-400 mb-0.5">No. WhatsApp / Kontak</p>
                    <p className="text-sm font-medium text-slate-700">{user?.contact_number || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Back button */}
              <button
                onClick={resetForm}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors mb-6 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                Ganti email
              </button>

              <form onSubmit={handleSubmit} className="space-y-5">


                {/* Complaint fields */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Judul Keluhan
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ringkasan singkat kendala"
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Deskripsi Keluhan
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Jelaskan kendala yang Anda alami secara detail..."
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none bg-white"
                  />
                </div>

                {/* Drag & Drop */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Lampiran (Opsional)
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all ${dragOver
                        ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*"
                    />
                    <div className="text-center">
                      <Upload
                        className={`w-6 h-6 mx-auto mb-2 transition-colors ${dragOver ? 'text-indigo-500' : 'text-slate-400'
                          }`}
                      />
                      <p className="text-xs text-slate-500">
                        Seret gambar ke sini atau{' '}
                        <span className="text-indigo-600 font-medium">
                          pilih file
                        </span>
                      </p>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm animate-[fadeIn_0.2s_ease]"
                        >
                          <span className="text-xs text-slate-600 truncate flex-1 font-medium">
                            {f.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(i);
                            }}
                            className="text-slate-400 hover:text-red-500 transition-colors ml-2"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 bg-indigo-500 text-white rounded-xl font-medium text-sm hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Kirim Keluhan'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Urgent Support Info */}
          <div className="px-2">
            <h4 className="text-sm font-bold text-slate-800 mb-1">Butuh bantuan mendesak?</h4>
            <p className="text-xs text-slate-500 mb-4">
              Hubungi IT Support melalui kanal resmi perusahaan.
            </p>
            <button className="flex items-center gap-2 text-indigo-600 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors">
              <Headphones className="w-4 h-4" />
              Lihat Kontak IT Support
            </button>
          </div>
        </div>

        {/* Right Column: Knowledge Base */}
        <div className="flex-1 w-full lg:h-full">
          <div className="liquid-panel rounded-3xl p-8 sm:p-10 h-full flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-1 shrink-0">Cari Solusi Mandiri</h2>
            <p className="text-sm text-slate-500 mb-6 shrink-0">Temukan solusi dari artikel dan panduan yang sering dicari.</p>

            <div className="relative mb-6 shrink-0">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari artikel, panduan, atau troubleshooting..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
              />
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <h3 className="font-bold text-slate-800 text-sm mb-3 shrink-0">
                {searchQuery ? 'Hasil Pencarian' : 'Artikel Populer'}
              </h3>

              <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-4 flex-1">
                {articlesLoading ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                ) : displayedArticles.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-slate-200 rounded-2xl">
                    Tidak ada artikel yang sesuai dengan pencarian Anda.
                  </div>
                ) : (
                  displayedArticles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => handleArticleClick(article)}
                      className="group p-4 rounded-2xl border border-slate-100 bg-white/50 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4 shrink-0"
                    >
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{article.title}</h4>
                        <p className="text-[13px] text-slate-500 line-clamp-1 mb-2">{article.description}</p>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 bg-slate-100">{article.category}</span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Eye className="w-3 h-3" />
                            <span>{article.views}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                    </div>
                  ))
                )}
              </div>

              {filteredArticles.length > 5 && (
                <div className="pt-4 shrink-0 flex justify-center border-t border-slate-100/50 mt-auto">
                  <button 
                    type="button"
                    onClick={() => setShowAllArticles(!showAllArticles)}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {showAllArticles ? 'Sembunyikan Sebagian Artikel' : 'Lihat Semua Artikel'}
                    <ArrowRight className={`w-4 h-4 transition-transform ${showAllArticles ? '-rotate-90' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 px-4 py-6 text-center mt-auto border-t border-slate-200/50">
        <p className="text-xs text-slate-400">
          IT Helpdesk Complaint Management System
        </p>
      </footer>

      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
      />
    </div>
  );
}