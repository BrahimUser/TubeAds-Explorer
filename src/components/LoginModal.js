import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { buildMoroccoE164, mapFirebaseAuthError } from '../services/phonePasswordAuth';
import { useLogin, useRegister } from '../mutations/useAuth';

/**
 * Phone + password (no SMS). Session = JWT tokens in localStorage.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {'signin' | 'signup'} [props.authIntent]
 * @param {() => void} props.onClose
 * @param {() => void} [props.onSignedIn]
 */
export default function LoginModal({ open, authIntent = 'signin', onClose, onSignedIn }) {
  const { t } = useTranslation();
  const { refreshSession } = useAuth();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const isSignUp = authIntent === 'signup';
  const [localPhone, setLocalPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);

  const busy = loginMutation.isPending || registerMutation.isPending;

  useEffect(() => {
    if (!open) {
      setLocalPhone('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirm(false);
      setError(null);
    }
  }, [open, authIntent]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!buildMoroccoE164(localPhone)) {
      setError(t('authModal.errors.invalidPhone'));
      return;
    }
    if (!password || password.length < 6) {
      setError(t('authModal.errors.passwordTooShort'));
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError(t('authModal.errors.passwordMismatch'));
      return;
    }

    try {
      if (isSignUp) {
        try {
          await registerMutation.mutateAsync({ phone: localPhone, password });
        } catch (registerErr) {
          const registerMessage =
            registerErr?.response?.data?.message ||
            registerErr?.message ||
            mapFirebaseAuthError(registerErr);
          if (/already registered/i.test(registerMessage)) {
            await loginMutation.mutateAsync({ phone: localPhone, password });
          } else {
            throw registerErr;
          }
        }
      } else {
        await loginMutation.mutateAsync({ phone: localPhone, password });
      }
      await refreshSession?.();
      onSignedIn?.();
    } catch (err) {
      setError(err?.code ? mapFirebaseAuthError(err) : err?.message || t('authModal.errors.generic'));
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-[110] grid place-items-center bg-slate-900/45 backdrop-blur-sm p-4 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="w-full max-w-[420px] overflow-hidden rounded-3xl border border-orange-100/90 bg-white shadow-2xl ring-1 ring-orange-50">
        <div className="border-b border-orange-50 bg-gradient-to-br from-white to-orange-50/40 px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
                {isSignUp ? t('authModal.badgeSignUp') : t('authModal.badgeSignIn')}
              </p>
              <h2
                id="login-modal-title"
                className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.65rem]"
              >
                {isSignUp ? t('authModal.titleSignUp') : t('authModal.titleSignIn')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('authModal.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => !busy && onClose()}
              aria-label={t('authModal.closeAria')}
              className="shrink-0 rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
            >
              <Icon name="close" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-8 sm:pb-8">
          <div className="space-y-2">
            <label htmlFor="auth-phone" className="block text-sm font-semibold text-slate-800">
              {t('authModal.phoneLabel')}
            </label>
            <div className="flex overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
              <span className="flex shrink-0 items-center border-e-2 border-slate-100 bg-orange-50/80 px-4 py-4 text-lg font-bold text-brand-600">
                +212
              </span>
              <input
                id="auth-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
                disabled={busy}
                className="min-w-0 flex-1 bg-white px-4 py-4 text-lg font-medium text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="6XX XXX XXX"
              />
            </div>
            <p className="text-xs text-slate-500">{t('authModal.phoneHint')}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="auth-password" className="text-sm font-semibold text-slate-800">
                {t('authModal.passwordLabel')}
              </label>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                <Icon name="eye" className="h-3.5 w-3.5" />
                {showPassword ? t('authModal.hidePassword') : t('authModal.showPassword')}
              </button>
            </div>
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              placeholder={t('authModal.passwordPlaceholder')}
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="auth-confirm" className="text-sm font-semibold text-slate-800">
                  {t('authModal.confirmPasswordLabel')}
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  <Icon name="eye" className="h-3.5 w-3.5" />
                  {showConfirm ? t('authModal.hidePassword') : t('authModal.showPassword')}
                </button>
              </div>
              <input
                id="auth-confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={busy}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder={t('authModal.confirmPasswordPlaceholder')}
              />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full min-h-[52px] items-center justify-center rounded-2xl bg-brand-500 text-base font-bold text-white shadow-md transition hover:bg-brand-600 active:scale-[0.99] disabled:opacity-60"
          >
            {busy
              ? isSignUp
                ? t('authModal.busySigningUp')
                : t('authModal.busySigningIn')
              : isSignUp
                ? t('authModal.submitSignUp')
                : t('authModal.submitSignIn')}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-slate-500">{t('authModal.sessionHint')}</p>
        </form>
      </div>
    </div>
  );
}
