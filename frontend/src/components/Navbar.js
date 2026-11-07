import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import * as PhosphorIcons from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setLangOpen(false);
  }, [location.pathname]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isDark = mounted && resolvedTheme === 'dark';
  const dashboardPath = user?.role === 'admin' 
    ? '/admin/dashboard' 
    : user?.role === 'municipal' 
      ? '/municipal/dashboard' 
      : '/citizen/dashboard';

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200/60 dark:border-stone-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group" data-testid="logo-link">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-800 dark:group-hover:bg-emerald-700 group-hover:text-white transition-all duration-300">
              <PhosphorIcons.MapPin size={22} weight="duotone" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white tracking-tight group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors duration-300">
              Fix My Spot
            </span>
          </Link>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center space-x-1 p-2 min-h-[44px] min-w-[44px] justify-center text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors duration-200"
                data-testid="language-selector"
                aria-label="Select Language"
              >
                <PhosphorIcons.Translate size={18} />
                <span className="uppercase text-xs font-bold">{i18n.language}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl shadow-xl py-1 animate-fade-in z-50">
                  <button
                    onClick={() => changeLanguage('en')}
                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-stone-700 dark:text-stone-300"
                    data-testid="lang-en"
                  >
                    English
                  </button>
                  <button
                    onClick={() => changeLanguage('hi')}
                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-stone-700 dark:text-stone-300"
                    data-testid="lang-hi"
                  >
                    हिंदी
                  </button>
                  <button
                    onClick={() => changeLanguage('mr')}
                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-stone-700 dark:text-stone-300"
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
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl bg-stone-100/80 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <PhosphorIcons.Sun size={18} weight="duotone" />
              ) : (
                <PhosphorIcons.Moon size={18} weight="duotone" />
              )}
            </button>

            {user && <NotificationBell />}

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-5">
              {user ? (
                <>
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
                    to={dashboardPath}
                    className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-semibold text-sm transition-colors duration-200"
                    data-testid="nav-dashboard"
                  >
                    {t('dashboard')}
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-semibold text-sm transition-colors"
                    data-testid="nav-profile"
                  >
                    <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-emerald-100 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {user.name?.slice(0, 1).toUpperCase()}
                      {user.avatar && (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          onError={(event) => { event.currentTarget.style.display = 'none'; }}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="hidden lg:inline">{user.name?.split(' ')[0] || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-stone-150 dark:bg-stone-850 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-250 dark:border-stone-750 rounded-xl font-bold text-sm transition-all"
                    data-testid="logout-button"
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-emerald-800 dark:bg-emerald-700 text-white rounded-xl hover:bg-emerald-950 dark:hover:bg-emerald-600 font-bold text-sm transition-all shadow-sm"
                  data-testid="login-button"
                >
                  {t('login')}
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Toggle (Phones & Portrait Tablets) */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 transition-colors"
                aria-label="Open mobile navigation menu"
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? (
                  <PhosphorIcons.X size={20} weight="bold" />
                ) : (
                  <PhosphorIcons.List size={20} weight="bold" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Slide-down Menu */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden bg-white/98 dark:bg-stone-950/98 border-b border-stone-200 dark:border-stone-800 px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-xl"
          data-testid="mobile-nav-drawer"
        >
          {user ? (
            <>
              {/* Profile Card Header */}
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800"
              >
                <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-emerald-100 text-sm font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {user.name?.slice(0, 1).toUpperCase()}
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </span>
                <div>
                  <p className="font-bold text-stone-950 dark:text-white text-sm">{user.name}</p>
                  <p className="text-xs text-stone-500 capitalize">{user.role} Member</p>
                </div>
              </Link>

              {/* Navigation Items */}
              <div className="space-y-1 pt-2">
                <Link
                  to={dashboardPath}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 dark:text-stone-250 font-semibold text-sm hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                >
                  <PhosphorIcons.SquaresFour size={18} weight="duotone" className="text-emerald-700 dark:text-emerald-400" />
                  <span>{t('dashboard')}</span>
                </Link>
                <Link
                  to="/explore"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 dark:text-stone-250 font-semibold text-sm hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                >
                  <PhosphorIcons.Compass size={18} weight="duotone" className="text-emerald-700 dark:text-emerald-400" />
                  <span>Explore Issues</span>
                </Link>
                <Link
                  to="/analytics"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 dark:text-stone-250 font-semibold text-sm hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                >
                  <PhosphorIcons.ChartBar size={18} weight="duotone" className="text-emerald-700 dark:text-emerald-400" />
                  <span>Analytics & Reports</span>
                </Link>
              </div>

              {/* Logout Action */}
              <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold text-sm rounded-xl hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                >
                  <PhosphorIcons.SignOut size={18} weight="bold" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                to="/login"
                className="w-full block text-center py-3 bg-emerald-800 dark:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm hover:bg-emerald-950 transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="w-full block text-center py-3 bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-bold text-sm rounded-xl hover:bg-stone-200 transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};
