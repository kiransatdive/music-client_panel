import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/artist/verify-otp', { email, otp });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await axios.post('/api/artist/forgot-password', { email });
      alert('OTP sent to your email');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-slate-900 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="card shadow-soft-lg dark:shadow-soft-dark border border-slate-100 dark:border-dark-border/40 bg-white/80 dark:bg-dark-card/85 backdrop-blur-md">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/LOGOMusic.png" alt="Shivam Music Group Logo" className="h-20 w-auto object-contain" />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Verify OTP</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              We've sent a 6-digit verification code to <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm font-medium animate-pulse-soft">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 text-center">OTP Code</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <ShieldCheck size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input-field pl-11 text-center text-2xl tracking-widest font-bold"
                  placeholder="••••••"
                  maxLength={6}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-sm font-semibold tracking-wide uppercase" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <button
            onClick={handleResend}
            className="w-full mt-4 text-sm font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
          >
            Resend OTP
          </button>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-dark-border/40">
            <Link
              to={import.meta.env.VITE_API_BASE_URL || 'https://nrzzqsnw-3000.inc1.devtunnels.ms'}
              className="btn-outline block text-center py-2.5 text-sm"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
