import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { VerticalTimeline } from '../components/VerticalTimeline';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const CitizenDashboard = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [issuesRes, statsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/issues`, { withCredentials: true, timeout: 12000 }),
        axios.get(`${BACKEND_URL}/api/gamification/my-stats`, { withCredentials: true, timeout: 12000 })
      ]);
      setIssues(issuesRes.data);
      setStats(statsRes.data);
      await refreshUser();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoadError('We could not load community issues right now. Please refresh in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10" data-testid="citizen-dashboard">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-950 dark:text-white tracking-tight">Welcome, {user?.name}!</h1>
            <p className="text-stone-550 dark:text-stone-400 mt-1 font-medium">Track civic issues and earn rewards for making a difference.</p>
          </div>
          <Link
            to="/citizen/report"
            className="px-6 py-3 bg-emerald-800 dark:bg-emerald-700 text-white rounded-xl hover:bg-emerald-900 dark:hover:bg-emerald-600 font-bold flex items-center space-x-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            data-testid="report-issue-btn"
          >
            <PhosphorIcons.Plus size={18} weight="bold" />
            <span>{t('reportIssue')}</span>
          </Link>
        </div>

        {/* Stats Strip */}
        {!loading && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {/* Points Card */}
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">My Points</p>
                  <p className="text-3xl font-black text-emerald-855 dark:text-emerald-400 mt-1">{stats.points}</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 rounded-xl">
                  <PhosphorIcons.Star size={26} weight="duotone" />
                </div>
              </div>
            </div>

            {/* Reported Card */}
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Reported</p>
                  <p className="text-3xl font-black text-stone-950 dark:text-white mt-1">{stats.issues_reported}</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-405 rounded-xl">
                  <PhosphorIcons.Flag size={26} weight="duotone" />
                </div>
              </div>
            </div>

            {/* Resolved Card */}
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Resolved / Closed</p>
                  <p className="text-3xl font-black text-stone-950 dark:text-white mt-1">{stats.issues_resolved}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-405 rounded-xl">
                  <PhosphorIcons.CheckCircle size={26} weight="duotone" />
                </div>
              </div>
            </div>

            {/* Badges Card */}
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5">Badges Earned</p>
                <div className="flex flex-wrap gap-1.5">
                  {stats.badges.length > 0 ? (
                    stats.badges.map((badge, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-amber-50 dark:bg-amber-955/30 text-amber-800 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-200 dark:border-amber-900/30">
                        {badge}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-semibold text-stone-400 dark:text-stone-500 italic">No badges earned yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Issues List */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
              <h2 className="text-2xl font-extrabold text-stone-950 dark:text-white mb-6">Recent Community Issues</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-800 mx-auto"></div>
                </div>
              ) : loadError ? (
                <div className="text-center py-12">
                  <PhosphorIcons.WarningCircle size={48} className="text-amber-500 mx-auto mb-3" weight="duotone" />
                  <p className="text-stone-600 dark:text-stone-300 font-medium">{loadError}</p>
                  <button onClick={fetchData} className="mt-4 text-sm font-bold text-emerald-800 dark:text-emerald-400">Try again</button>
                </div>
              ) : issues.length === 0 ? (
                <div className="text-center py-16">
                  <PhosphorIcons.MapTrifold size={64} className="text-stone-300 dark:text-stone-700 mx-auto mb-4" />
                  <p className="text-stone-500 dark:text-stone-400 font-medium">No issues reported yet in the community</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.slice(0, 5).map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="bg-white/50 dark:bg-stone-950/20 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl overflow-hidden hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 cursor-pointer"
                      data-testid="issue-card"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {issue.photos && issue.photos.length > 0 && (
                          <img
                            src={issue.photos[0]}
                            alt={issue.title}
                            className="w-full sm:w-32 h-40 sm:h-32 object-cover"
                          />
                        )}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <h3 className="font-bold text-stone-900 dark:text-white text-base leading-snug">{issue.title}</h3>
                              <StatusBadge status={issue.status} size="sm" />
                            </div>
                            <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mt-1 font-medium">{issue.description}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-stone-400 dark:text-stone-500 font-semibold">
                            <span className="flex items-center">
                              <PhosphorIcons.MapPin size={14} className="mr-1" />
                              <span className="truncate max-w-[200px]">{issue.address}</span>
                            </span>
                            <span className="flex items-center">
                              <PhosphorIcons.CalendarBlank size={14} className="mr-1" />
                              {new Date(issue.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <Link
                to="/citizen/my-issues"
                className="block text-center mt-6 text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 font-bold transition-colors text-sm"
                data-testid="view-all-issues"
              >
                View All My Issues & Timeline →
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-extrabold text-stone-950 dark:text-white mb-5">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/citizen/report"
                  className="flex items-center px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 font-bold transition-all duration-200 hover:-translate-y-0.5"
                  data-testid="quick-report"
                >
                  <PhosphorIcons.Plus size={18} weight="bold" className="mr-3" />
                  Report New Issue
                </Link>
                <Link
                  to="/explore"
                  className="flex items-center px-4 py-3 bg-blue-50 dark:bg-blue-955/20 text-blue-800 dark:text-blue-400 rounded-xl hover:bg-blue-100 font-bold transition-all duration-200 hover:-translate-y-0.5"
                  data-testid="quick-explore"
                >
                  <PhosphorIcons.MagnifyingGlass size={18} weight="bold" className="mr-3" />
                  Explore All Issues
                </Link>
                <Link
                  to="/citizen/leaderboard"
                  className="flex items-center px-4 py-3 bg-amber-50 dark:bg-amber-955/20 text-amber-800 dark:text-amber-400 rounded-xl hover:bg-amber-100 font-bold transition-all duration-200 hover:-translate-y-0.5"
                  data-testid="quick-leaderboard"
                >
                  <PhosphorIcons.Trophy size={18} weight="bold" className="mr-3" />
                  View Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Timeline Modal */}
      {selectedIssue && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedIssue(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-stone-150 dark:border-stone-800">
              <h2 className="text-2xl font-black text-stone-950 dark:text-white leading-tight">{selectedIssue.title}</h2>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800"
              >
                <PhosphorIcons.X size={18} weight="bold" />
              </button>
            </div>

            <p className="text-stone-600 dark:text-stone-400 font-medium text-sm mb-6">{selectedIssue.description}</p>

            <div className="mb-6">
              <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-3">
                Lifecycle Progression Timeline
              </h3>
              <VerticalTimeline
                history={selectedIssue.history}
                estimatedCompletionDate={selectedIssue.estimated_completion_date}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
