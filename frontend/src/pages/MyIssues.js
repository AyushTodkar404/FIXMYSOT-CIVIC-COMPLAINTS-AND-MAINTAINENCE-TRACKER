import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'sonner';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { VerticalTimeline } from '../components/VerticalTimeline';
import { IssueImageComparison } from '../components/IssueImageComparison';
import { STATUS_LIST } from '../utils/statusUtils';
import { offlineCache } from '../lib/networkResilience';

export const MyIssues = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [reopenRemark, setReopenRemark] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);
  const abortControllerRef = React.useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchMyIssues();
  }, [filter]);

  useEffect(() => {
    const handleStorageUpdate = (event) => {
      if (event.key === 'issue-updated') {
        fetchMyIssues();
        // Clean up the storage key to prevent infinite loops
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('issue-updated');
        }
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  const fetchMyIssues = async () => {
    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const params = { my_issues: true };
      if (filter !== 'all') params.status = filter;

      const { data } = await axios.get(`${BACKEND_URL}/api/issues`, {
        params,
        withCredentials: true,
        signal: abortControllerRef.current.signal
      });
      setIssues(data);
      if (filter === 'all') {
        offlineCache.set('my_issues', data);
      }

      if (selectedIssue) {
        const updated = data.find(i => i.id === selectedIssue.id);
        if (updated) setSelectedIssue(updated);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Network issue fetching my issues, using offline cache:', error);
        const cached = offlineCache.get('my_issues');
        if (cached && Array.isArray(cached)) {
          let filtered = [...cached];
          if (filter !== 'all') filtered = filtered.filter(i => i.status === filter);
          setIssues(filtered);
        } else {
          toast.error('Unable to fetch your issues right now. Please check your connection.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCitizenAction = async (issueId, newStatus, remarkText, verificationStatus = null) => {
    try {
      await axios.patch(
        `${BACKEND_URL}/api/issues/${issueId}`,
        {
          status: newStatus,
          remark: remarkText,
          verification_status: verificationStatus
        },
        { withCredentials: true }
      );

      toast.success(`Complaint status updated to ${newStatus}`);
      setShowReopenModal(false);
      setReopenRemark('');
      setSelectedIssue(null);
      fetchMyIssues();
    } catch (error) {
      console.error('Failed citizen action:', error);
      const msg = error.response?.data?.detail ? String(error.response.data.detail) : 'Failed to update complaint status';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10" data-testid="my-issues-page">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-stone-950 dark:text-white tracking-tight">{t('myIssues')}</h1>
          <p className="text-stone-550 dark:text-stone-400 mt-1 font-medium">Track lifecycle progression and status audit timeline for your reported complaints.</p>
        </div>

        <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
          {/* Filters Bar */}
          <div className="flex flex-wrap gap-2.5 mb-6">
            {[
              { id: 'all', label: 'All Issues' },
              { id: 'Submitted', label: 'Submitted' },
              { id: 'Work Started', label: 'Work Started' },
              { id: 'Work Completed', label: 'Work Completed' },
              { id: 'Closed', label: 'Closed' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${filter === btn.id
                  ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-md'
                  : 'bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                  }`}
                data-testid={`filter-${btn.id.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-800 mx-auto"></div>
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-16">
              <PhosphorIcons.Folder size={64} className="text-stone-300 dark:text-stone-700 mx-auto mb-4" />
              <p className="text-stone-500 dark:text-stone-400 font-medium">No complaints found matching this filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-white/50 dark:bg-stone-950/20 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl p-6 hover:shadow-md transition-all duration-300"
                  data-testid="my-issue-card"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3">
                    <div>
                      <h3 className="text-xl font-extrabold text-stone-950 dark:text-white leading-snug">{issue.title}</h3>
                      <p className="text-stone-600 dark:text-stone-400 mt-1 font-medium text-sm leading-relaxed">{issue.description}</p>
                    </div>
                    <StatusBadge status={issue.status} size="md" />
                  </div>

                  {/* Actions & Lifecycle Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-b border-stone-150 dark:border-stone-800/60 py-4 my-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-stone-400 dark:text-stone-500 flex-1">
                      <div>
                        <span className="uppercase tracking-wider block mb-1 text-[10px]">Category</span>
                        <span className="text-stone-900 dark:text-stone-250 font-bold text-sm capitalize">{issue.category}</span>
                      </div>
                      <div>
                        <span className="uppercase tracking-wider block mb-1 text-[10px]">Reported Date</span>
                        <span className="text-stone-900 dark:text-stone-250 font-bold text-sm">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="uppercase tracking-wider block mb-1 text-[10px]">Location</span>
                        <span className="text-stone-900 dark:text-stone-250 font-bold text-sm block truncate max-w-[240px]">{issue.address}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedIssue(issue)}
                      className="px-4 py-2 bg-emerald-800 dark:bg-emerald-700 text-white rounded-xl font-bold text-xs hover:bg-emerald-900 transition-all flex items-center space-x-1.5 shadow-sm"
                      data-testid="view-timeline-btn"
                    >
                      <PhosphorIcons.ClockCounterClockwise size={16} weight="bold" />
                      <span>View Lifecycle Timeline ({issue.history?.length || 1})</span>
                    </button>
                  </div>

                  {/* Citizen Verification Actions if work completed */}
                  {['Work Completed', 'Citizen Verification Pending'].includes(issue.status) && (
                    <div className="space-y-3">
                      {(issue.photos?.length > 0 || issue.after_photos?.length > 0) && (
                        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                          <div className="mb-2 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Review evidence</p>
                              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Compare the original report with the municipal completion proof.</p>
                            </div>
                            <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                              Reported {new Date(issue.created_at).toLocaleString()}
                            </div>
                          </div>
                          <IssueImageComparison beforeImages={issue.photos || []} afterImages={issue.after_photos || []} />
                        </div>
                      )}

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs font-medium text-amber-800 dark:text-amber-300">
                          Work has been marked complete by municipal team. Please verify and confirm resolution.
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCitizenAction(issue.id, 'Closed', 'Verified and confirmed resolution by citizen.', 'verified')}
                            className="px-3.5 py-1.5 bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-sm hover:bg-emerald-800"
                          >
                            Verify & Close
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIssue(issue);
                              setShowReopenModal(true);
                            }}
                            className="px-3.5 py-1.5 bg-rose-600 text-white font-extrabold text-xs rounded-lg shadow-sm hover:bg-rose-700"
                          >
                            Reject & Reopen
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline Modal */}
      {selectedIssue && !showReopenModal && (
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

            {(selectedIssue.photos?.length > 0 || selectedIssue.after_photos?.length > 0) && (
              <div className="mb-6">
                <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-3">Before & After Evidence</h3>
                <IssueImageComparison beforeImages={selectedIssue.photos || []} afterImages={selectedIssue.after_photos || []} />
              </div>
            )}

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

      {/* Reopen Reason Modal */}
      {showReopenModal && selectedIssue && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShowReopenModal(false)}
        >
          <div
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-stone-950 dark:text-white mb-2">Reopen Complaint</h3>
            <p className="text-xs text-stone-500 mb-4 font-medium">Please specify why the work performed was incomplete or unsatisfactory.</p>

            <textarea
              rows={3}
              value={reopenRemark}
              onChange={(e) => setReopenRemark(e.target.value)}
              placeholder="e.g., Pothole was only partially filled..."
              className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-250 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white text-sm mb-4 focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
            />

            <div className="flex space-x-2">
              <button
                onClick={() => setShowReopenModal(false)}
                className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCitizenAction(selectedIssue.id, 'Reopened', reopenRemark || 'Reopened by citizen.', 'rejected')}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Confirm Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
