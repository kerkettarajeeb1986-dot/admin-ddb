import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  X,
  Send,
} from 'lucide-react';
import { useAuth, AUTHORIZED_SUPER_ADMIN_UID } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onCancel }) => {
  const { loginAsAdmin, sendAdminPasswordReset, unauthorizedNotice, setUnauthorizedNotice } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password modal/panel state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const displayError = errorMessage || unauthorizedNotice;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setUnauthorizedNotice(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please enter both Super Admin Email and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginAsAdmin(cleanEmail, cleanPassword);
      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetFeedback(null);

    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail) {
      setResetFeedback({
        type: 'error',
        message: 'Please provide the Super Admin email address.',
      });
      return;
    }

    setIsSendingReset(true);
    try {
      const result = await sendAdminPasswordReset(targetEmail);
      if (result.success) {
        setResetFeedback({
          type: 'success',
          message:
            result.message ||
            `Password reset link dispatched to ${targetEmail}. Check your inbox or spam folder.`,
        });
      } else {
        setResetFeedback({
          type: 'error',
          message: result.error || 'Failed to dispatch password reset email.',
        });
      }
    } catch (err: any) {
      setResetFeedback({
        type: 'error',
        message: err.message || 'Error sending password reset email.',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Brand Banner Header */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-white p-6 sm:p-8 text-center relative border-b border-emerald-800">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-white rounded-full p-1 shadow-xl mb-3 flex items-center justify-center border-2 border-emerald-400">
            <img
              src="/logo.png"
              alt="Dooars Daily Basket Logo"
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Dooars Daily Basket
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-emerald-800/80 border border-emerald-500/50 text-xs font-bold text-emerald-200 shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            SUPER ADMIN LOGIN
          </div>
          <p className="text-xs text-emerald-100/80 mt-2 max-w-xs mx-auto">
            Authorized administrator access only. All dashboard operations require verified Super
            Admin credentials.
          </p>
        </div>

        {/* Login Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {displayError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-0.5">
                <span className="font-semibold block">{displayError}</span>
                {displayError.includes('not authorized') && (
                  <span className="text-[11px] text-rose-700 block">
                    Access is restricted strictly to authorized administrators ({AUTHORIZED_SUPER_ADMIN_UID} / rajeebkerketta1986@gmail.com).
                  </span>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dooarsdailybasket.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons: LOGIN & FORGOT PASSWORD */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Firebase Authentication...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>LOGIN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetFeedback(null);
                  setShowForgotPassword(true);
                }}
                className="w-full py-2 px-3 text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition text-center cursor-pointer uppercase tracking-wider"
              >
                FORGOT PASSWORD
              </button>
            </div>
          </form>

          {/* Optional return to customer store */}
          {onCancel && (
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-semibold text-slate-500 hover:text-emerald-700 transition underline underline-offset-2"
              >
                ← Return to Storefront
              </button>
            </div>
          )}

          {/* Security Notice */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Firebase Auth Enforced
              </span>
              <span>Protected Console</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono text-center truncate pt-1">
              Authorized UID: {AUTHORIZED_SUPER_ADMIN_UID}
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Super Admin Password</h3>
                <p className="text-xs text-slate-500">
                  Firebase Password Reset link will be sent to your registered email
                </p>
              </div>
            </div>

            {resetFeedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
                  resetFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border border-rose-300 text-rose-800'
                }`}
              >
                {resetFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{resetFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSendPasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Super Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@dooarsdailybasket.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSendingReset ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
