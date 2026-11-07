import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import * as PhosphorIcons from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200/60 dark:border-stone-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2.5 group" data-testid="logo-link">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-800 dark:group-hover:bg-emerald-700 group-hover:text-white transition-all duration-300">
              <PhosphorIcons.MapPin size={24} weight="duotone" />
            </div>
            <span className="text-xl font-extrabold text-stone-900 dark:text-white tracking-tight group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors duration-300">
              Fix My Spot
            </span>
          </Link>

          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center space-x-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-semibold text-sm transition-colors duration-200"
                data-testid="language-selector"
              >
                <PhosphorIcons.Translate size={18} />
                <span className="uppercase">{i18n.language}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border border-stone-200/80 dark:border-stone-850 rounded-xl shadow-xl py-1 animate-fade-in z-50">
                  <button
                    onClick={() => changeLanguage('en')}
                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 dark:hover:bg-stone-800/60 font-medium text-stone-700 dark:text-stone-300"
                    data-testid="lang-en"
                  >
                    English
                  </button>
                  <button
                    onClick={() => changeLanguage('hi')}
                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 dark:hover:bg-stone-800/60 font-medium text-stone-700 dark:text-stone-300"
                    data-testid="lang-hi"
                  >
                    हिंदी
                  </button>
                  <button
                    onClick={() => changeLanguage('mr')}
                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 dark:hover:bg-stone-800/60 font-medium text-stone-700 dark:text-stone-300"
                    data-testid="lang-mr"
                  >
                    मराठी
                  </button>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <PhosphorIcons.Sun size={18} weight="duotone" />
              ) : (
                <PhosphorIcons.Moon size={18} weight="duotone" />
              )}
            </button>

            {user ? (
              <>
                <NotificationBell />
                <Link
                  to="/explore"
                  className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-semibold text-sm transition-colors duration-200"
                  data-testid="nav-explore"
                >
                  Explore
                </Link>
                <Link
                  to="/analytics"
                  className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-semibold text-sm transition-colors duration-200"
                  data-testid="nav-analytics"
                >
                  Analytics
                </Link>
                <Link
                  to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'municipal' ? '/municipal/dashboard' : '/citizen/dashboard'}
                  className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-semibold text-sm transition-colors duration-200"
                  data-testid="nav-dashboard"
                >
                  {t('dashboard')}
                </Link>
                <Link to="/profile" className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-semibold text-sm transition-colors" data-testid="nav-profile">
                  <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-emerald-100 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {user.name?.slice(0, 1).toUpperCase()}
                    {user.avatar && <img src={user.avatar} alt="Profile" onError={(event) => { event.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" />}
                  </span>
                  <span className="hidden lg:inline">Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-emerald-800 dark:bg-emerald-700 text-white rounded-xl hover:bg-emerald-950 dark:hover:bg-emerald-600 font-bold text-sm transition-all duration-205 shadow-sm shadow-emerald-800/10 hover:shadow-md"
                  data-testid="logout-button"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 bg-emerald-800 dark:bg-emerald-700 text-white rounded-xl hover:bg-emerald-950 dark:hover:bg-emerald-600 font-bold text-sm transition-all duration-205 shadow-sm shadow-emerald-800/10 hover:shadow-md"
                data-testid="login-button"
              >
                {t('login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
