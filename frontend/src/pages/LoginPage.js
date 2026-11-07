import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Navbar } from '../components/Navbar';

export const LoginPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresAdminPasskey, setRequiresAdminPasskey] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password, formData.adminPasskey);
    setLoading(false);

    if (result.success) {
      const dashboard = result.user.role === 'admin'
        ? '/admin/dashboard'
        : result.user.role === 'municipal'
          ? '/municipal/dashboard'
          : '/citizen/dashboard';
      navigate(dashboard);
    } else if (result.requiresAdminPasskey) {
      setRequiresAdminPasskey(true);
    } else {
      setError(result.error);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/citizen/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar />

      <div className="flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full">
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/60 dark:border-stone-800 rounded-3xl p-8 shadow-xl shadow-stone-200/30 dark:shadow-none animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 rounded-2xl mb-4">
                <PhosphorIcons.LockOpen size={28} weight="duotone" />
              </div>
              <h2 className="text-3xl font-black text-stone-950 dark:text-white mb-2">{t('signIn')}</h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-400 rounded-xl text-sm font-medium flex items-center space-x-2" data-testid="error-message">
                <PhosphorIcons.WarningCircle size={18} weight="fill" className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">{t('email')}</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-stone-50/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-850 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-800 focus:border-transparent focus:outline-none transition-all duration-200 placeholder-stone-400"
                  placeholder="your@email.com"
                  data-testid="email-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">{t('password')}</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-stone-50/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-850 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-800 focus:border-transparent focus:outline-none transition-all duration-200 placeholder-stone-400"
                  placeholder="••••••••"
                  data-testid="password-input"
                />
              </div>

              {requiresAdminPasskey && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">Administrator passkey</label>
                  <input
                    type="password"
                    name="adminPasskey"
                    required
                    autoComplete="one-time-code"
                    value={formData.adminPasskey || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-stone-50/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-850 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-800 focus:border-transparent focus:outline-none transition-all duration-200"
                    placeholder="Enter administrator passkey"
                    data-testid="admin-passkey-input"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3.5 bg-emerald-800 dark:bg-emerald-700 text-white rounded-xl hover:bg-emerald-900 dark:hover:bg-emerald-600 font-bold transition-all duration-300 shadow-md shadow-emerald-800/10 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                data-testid="login-submit-button"
              >
                {loading ? 'Signing In...' : requiresAdminPasskey ? 'Verify Passkey' : t('signIn')}
              </button>
            </form>

            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-stone-200 dark:border-stone-800"></div>
              <span className="px-4 text-xs font-bold text-stone-400 uppercase tracking-wider">{t('or')}</span>
              <div className="flex-1 border-t border-stone-200 dark:border-stone-800"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full px-6 py-3 bg-white/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 text-stone-750 dark:text-stone-300 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-900 font-bold transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center space-x-2 shadow-sm"
              data-testid="google-login-button"
            >
              <PhosphorIcons.GoogleLogo size={20} weight="bold" className="text-emerald-700 dark:text-emerald-500" />
              <span>{t('signInWith')} Google</span>
            </button>

            <p className="mt-8 text-center text-sm text-stone-500 dark:text-stone-455">
              {t('dontHaveAccount')}{' '}
              <Link to="/register" className="text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 font-bold transition-colors" data-testid="register-link">
                {t('signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
