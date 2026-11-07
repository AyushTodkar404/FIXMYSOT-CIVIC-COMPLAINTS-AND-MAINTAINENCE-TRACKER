import React from 'react';
import { getStatusMeta } from '../utils/statusUtils';
import * as PhosphorIcons from '@phosphor-icons/react';

export const VerticalTimeline = ({ history = [], estimatedCompletionDate = null }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-stone-400 dark:text-stone-500 italic bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-150 dark:border-stone-800">
        No status history recorded yet.
      </div>
    );
  }

  // Sort history chronologically (earliest to latest or latest first? Timeline is usually initial -> current)
  const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const formatDate = (isoString) => {
    if (!isoString || typeof isoString !== 'string') {
      return 'Invalid date';
    }
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="py-2" data-testid="vertical-timeline">
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-blue-500 before:to-stone-300 dark:before:to-stone-700">
        {sortedHistory.map((item, index) => {
          const isLatest = index === sortedHistory.length - 1;
          const meta = getStatusMeta(item.status);
          const isMunicipal = item.changed_by_role === 'municipal' || item.changed_by_role === 'admin';

          return (
            <div key={item.id || index} className="relative group animate-fade-in">
              {/* Timeline Icon Node */}
              <div className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-transform duration-200 ${isLatest
                ? `${meta.colorClass} border-current ring-4 ring-emerald-500/20 shadow-md scale-110`
                : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400'
                }`}>
                {meta.icon(14, isLatest ? "bold" : "duotone")}
              </div>

              {/* Card Container */}
              <div className={`p-4 rounded-2xl border transition-all duration-200 ${isLatest
                ? 'bg-white dark:bg-stone-900 border-stone-250 dark:border-stone-800 shadow-sm'
                : 'bg-stone-50/60 dark:bg-stone-950/30 border-stone-200/60 dark:border-stone-850'
                }`}>
                {/* Top Row: Status title & Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-stone-900 dark:text-white text-sm sm:text-base tracking-tight">
                      {meta.label}
                    </span>
                    {isLatest && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white rounded-full shadow-sm animate-pulse">
                        Current Stage
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 flex items-center space-x-1">
                    <PhosphorIcons.Clock size={12} />
                    <span>{formatDate(item.timestamp)}</span>
                  </span>
                </div>

                {/* User / Officer Info */}
                <div className="flex items-center space-x-2 mb-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
                  <span className="text-stone-400 dark:text-stone-500">Updated by:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">{item.changed_by_name || 'System'}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${isMunicipal
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                    }`}>
                    {item.changed_by_role || 'user'}
                  </span>
                </div>

                {/* Verification status */}
                {item.status === 'Closed' && item.remark?.toLowerCase().includes('verified') && (
                  <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">
                    <PhosphorIcons.UserCheck size={14} weight="bold" />
                    <span>Citizen verified and closed</span>
                  </div>
                )}
                {item.status === 'Reopened' && item.remark?.toLowerCase().includes('reopened') && (
                  <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold border border-rose-500/20">
                    <PhosphorIcons.ArrowClockwise size={14} weight="bold" />
                    <span>Citizen rejected resolution and reopened</span>
                  </div>
                )}

                {/* Remark Text */}
                {item.remark && (
                  <div className="mt-2.5 p-3 rounded-xl bg-stone-100/80 dark:bg-stone-950/60 border border-stone-200/50 dark:border-stone-800/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium leading-relaxed">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <PhosphorIcons.ChatText size={11} />
                      <span>Remarks / Notes</span>
                    </div>
                    {item.remark}
                  </div>
                )}

                {/* Estimated Completion Date (if set in this step or latest step) */}
                {(item.estimated_completion_date || (isLatest && estimatedCompletionDate)) && (
                  <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold border border-amber-500/20">
                    <PhosphorIcons.CalendarBlank size={14} weight="bold" />
                    <span>Est. Completion: {item.estimated_completion_date || estimatedCompletionDate}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
