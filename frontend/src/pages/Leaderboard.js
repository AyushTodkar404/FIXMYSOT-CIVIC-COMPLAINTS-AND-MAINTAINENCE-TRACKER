import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Navbar } from '../components/Navbar';
import { offlineCache } from '../lib/networkResilience';

export const Leaderboard = () => {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/gamification/leaderboard`, {
        withCredentials: true
      });
      setLeaderboard(data);
      offlineCache.set('leaderboard', data);
    } catch (error) {
      console.warn('Network issue fetching leaderboard, using cache:', error);
      const cached = offlineCache.get('leaderboard');
      if (cached && Array.isArray(cached)) {
        setLeaderboard(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank) => {
    if (rank === 1) return <PhosphorIcons.Medal size={36} weight="fill" className="text-yellow-500" />;
    if (rank === 2) return <PhosphorIcons.Medal size={36} weight="fill" className="text-stone-400" />;
    if (rank === 3) return <PhosphorIcons.Medal size={36} weight="fill" className="text-amber-600" />;
    return <span className="text-sm font-black text-stone-400 dark:text-stone-600">#{rank}</span>;
  };

  // Split into podium and list
  const podiumUsers = leaderboard.slice(0, 3);
  const listUsers = leaderboard.slice(3);

  // Re-order podium for layout: 2nd, 1st, 3rd
  const orderedPodium = [];
  if (podiumUsers[1]) orderedPodium.push({ ...podiumUsers[1], rank: 2 });
  if (podiumUsers[0]) orderedPodium.push({ ...podiumUsers[0], rank: 1 });
  if (podiumUsers[2]) orderedPodium.push({ ...podiumUsers[2], rank: 3 });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10" data-testid="leaderboard-page">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-stone-950 dark:text-white tracking-tight">{t('leaderboard')}</h1>
          <p className="text-stone-550 dark:text-stone-400 mt-1 font-medium font-semibold">Top contributors making a difference in the community.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-800 mx-auto"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-16 text-center shadow-sm">
            <PhosphorIcons.Trophy size={64} className="text-stone-300 dark:text-stone-700 mx-auto mb-4" />
            <p className="text-stone-500 dark:text-stone-400 font-medium">No entries yet. Be the first to report an issue and climb the rankings!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Visual Podium section */}
            {podiumUsers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6 max-w-3xl mx-auto">
                {orderedPodium.map((entry) => {
                  const isFirst = entry.rank === 1;
                  const isSecond = entry.rank === 2;
                  const isThird = entry.rank === 3;

                  let borderStyle = 'border-stone-200 dark:border-stone-800';
                  let scaleStyle = 'scale-95 md:translate-y-4';
                  let bgGradient = 'from-stone-50/50 to-white dark:from-stone-900/50 dark:to-stone-900';

                  if (isFirst) {
                    borderStyle = 'border-yellow-400 dark:border-yellow-600/40 shadow-xl shadow-yellow-500/5';
                    scaleStyle = 'scale-100 z-10';
                    bgGradient = 'from-yellow-50/20 to-white dark:from-yellow-950/10 dark:to-stone-900';
                  } else if (isSecond) {
                    borderStyle = 'border-stone-300 dark:border-stone-700/50';
                  } else if (isThird) {
                    borderStyle = 'border-amber-600/40 dark:border-amber-700/30';
                  }

                  return (
                    <div
                      key={entry.user_id}
                      className={`relative bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border rounded-3xl p-6 text-center flex flex-col items-center justify-center transition-all duration-500 hover:shadow-lg ${borderStyle} ${scaleStyle}`}
                      data-testid="leaderboard-entry"
                    >
                      {/* Rank Indicator */}
                      <div className="absolute -top-6 w-12 h-12 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-full flex items-center justify-center shadow-md">
                        {getMedalIcon(entry.rank)}
                      </div>

                      <div className="mt-4 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-450 flex items-center justify-center font-black text-lg mb-3 border border-emerald-100 dark:border-emerald-900/30">
                          {entry.name[0]?.toUpperCase()}
                        </div>
                        <h3 className="font-extrabold text-lg text-stone-900 dark:text-white leading-snug">{entry.name}</h3>
                        
                        {/* Points */}
                        <div className="flex items-center space-x-1.5 mt-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-100/30 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 font-extrabold text-sm">
                          <PhosphorIcons.Star size={16} weight="fill" />
                          <span>{entry.points} pts</span>
                        </div>
                      </div>

                      {/* Badges List */}
                      <div className="flex flex-wrap justify-center gap-1 mt-4">
                        {entry.badges.map((badge, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-amber-50 dark:bg-amber-955/30 text-amber-800 dark:text-amber-400 text-[9px] font-bold rounded-md border border-amber-200 dark:border-amber-900/30">
                            {badge}
                          </span>
                        ))}
                      </div>

                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-4">
                        {entry.issues_reported} reported issues
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List for 4th Rank and Below */}
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-stone-950 dark:text-white mb-6 pl-2">Rankings</h2>
              
              <div className="space-y-3">
                {/* Headers */}
                <div className="flex items-center justify-between px-6 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <div className="flex items-center space-x-4">
                    <span className="w-10 text-center">Rank</span>
                    <span>User Details</span>
                  </div>
                  <span>Contribution Points</span>
                </div>

                {/* Rows */}
                {listUsers.map((entry, index) => {
                  const rank = index + 4;
                  return (
                    <div
                      key={entry.user_id}
                      className="flex items-center justify-between p-4 px-6 rounded-2xl bg-white/50 dark:bg-stone-950/20 border border-stone-200/60 dark:border-stone-800/80 hover:shadow-sm transition-all duration-200"
                      data-testid="leaderboard-entry"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="w-10 text-center text-sm font-extrabold text-stone-400 dark:text-stone-500">#{rank}</span>
                        <div>
                          <h3 className="font-bold text-stone-900 dark:text-white text-sm">{entry.name}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {entry.badges.map((badge, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-amber-50 dark:bg-amber-955/30 text-amber-800 dark:text-amber-400 text-[9px] font-bold rounded-md border border-amber-205 dark:border-amber-900/30">
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-400 font-extrabold text-sm justify-end">
                          <PhosphorIcons.Star size={14} weight="fill" />
                          <span>{entry.points}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider mt-1">{entry.issues_reported} issues</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
