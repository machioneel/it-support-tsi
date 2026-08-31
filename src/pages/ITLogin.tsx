import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LifeBuoy, Mail, Lock, ArrowRight, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function ITLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      sessionStorage.setItem(
        'it_session',
        JSON.stringify({ email, ts: Date.now() })
      );
      setTimeout(() => navigate('/dashboard'), 600);
    } catch {
      setError('Login gagal. Periksa kembali kredensial Anda.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col relative overflow-hidden font-sans">
      {/* Decorative Background for Glass Effect */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between bg-white/60 backdrop-blur-md border-b border-white/50 sticky top-0">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-sm">IT Helpdesk</span>
        </Link>
        <Link
          to="/"
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali
        </Link>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="liquid-panel rounded-3xl p-8 sm:p-10 animate-[fadeIn_0.4s_ease]">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                {/* Decorative sparkles */}
                <div className="absolute top-1 right-2 w-1 h-1 bg-indigo-300 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
                <div className="absolute top-4 left-1 w-1 h-1 bg-purple-300 rounded-full"></div>
                <Lock className="w-7 h-7 text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 mb-2">
                IT Support Login
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Masuk untuk mengakses Workspace Dashboard dan Analytical Report Center.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Email
                </label>
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
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-12 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-slate-800 text-white rounded-full font-medium text-sm hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
