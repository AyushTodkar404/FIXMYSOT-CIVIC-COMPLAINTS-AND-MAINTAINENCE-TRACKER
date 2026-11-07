import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { StatusUpdateModal } from '../components/StatusUpdateModal';
import { VerticalTimeline } from '../components/VerticalTimeline';
import { STATUS_LIST } from '../utils/statusUtils';

export const MunicipalDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedIssueForModal, setSelectedIssueForModal] = useState(null);
  const [selectedIssueForTimeline, setSelectedIssueForTimeline] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchIssues();
  }, [filter]);

  useEffect(() => {
    const handleStorageUpdate = (event) => {
      if (event.key === 'issue-updated') {
        fetchIssues();
        // Clean up to prevent infinite loops
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('issue-updated');
        }
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  const fetchIssues = async () => {
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;

      const { data } = await axios.get(`${BACKEND_URL}/api/issues`, {
        params,
        withCredentials: true
      });
      setIssues(data);

      // Refresh timeline modal if selected
      if (selectedIssueForTimeline) {
        const updatedSelected = data.find(i => i.id === selectedIssueForTimeline.id);
        if (updatedSelected) setSelectedIssueForTimeline(updatedSelected);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: issues.length,
    submitted: issues.filter(i => ['Submitted', 'Verified'].includes(i.status)).length,
    active: issues.filter(i => ['Assigned', 'Inspection Scheduled', 'Inspection Completed', 'Work Started'].includes(i.status)).length,
    pendingVerification: issues.filter(i => i.status === 'Citizen Verification Pending').length,
    closed: issues.filter(i => i.status === 'Closed').length
  };

  const filterOptions = [
    { id: 'all', label: 'All Complaints' },
    { id: 'Submitted', label: 'Submitted' },
    { id: 'Verified', label: 'Verified' },
    { id: 'Assigned', label: 'Assigned' },
    { id: 'Inspection Scheduled', label: 'Inspection Scheduled' },
    { id: 'Work Started', label: 'Work Started' },
    { id: 'Work Completed', label: 'Work Completed' },
    { id: 'Citizen Verification Pending', label: 'Pending Verification' },
    { id: 'Closed', label: 'Closed' }
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10" data-testid="municipal-dashboard">
        <div className="mb-8">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-955/40 text-blue-700 dark:text-blue-400 font-extrabold text-xs rounded-full uppercase tracking-wider border border-blue-200 dark:border-blue-800/40 mb-2 inline-block">
            Municipal Officer Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-950 dark:text-white tracking-tight">
            Municipal Dashboard
          </h1>
          <p className="text-stone-550 dark:text-stone-400 mt-1 font-medium">
            Manage complaint lifecycle stages, schedule inspections, assign officers, and update resolution history.
          </p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          {/* Total Issues */}
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-stone-450 dark:text-stone-400 uppercase tracking-wider">Total Complaints</p>
                <p className="text-3xl font-black text-stone-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 rounded-xl border border-stone-200/60 dark:border-stone-800">
                <PhosphorIcons.Files size={24} weight="duotone" />
              </div>
            </div>
          </div>

          {/* New / Submitted */}
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Newly Submitted</p>
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.submitted}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100/30 dark:border-amber-900/30">
                <PhosphorIcons.PaperPlaneTilt size={24} weight="duotone" />
              </div>
            </div>
          </div>

          {/* Active Work */}
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Active Operations</p>
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/30 dark:border-blue-900/30">
                <PhosphorIcons.Wrench size={24} weight="duotone" />
              </div>
            </div>
          </div>

          {/* Awaiting Citizen Verification */}
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Pending Verification</p>
                <p className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-1">{stats.pendingVerification}</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-955/20 text-orange-600 dark:text-orange-400 rounded-xl border border-orange-100/30 dark:border-orange-900/30">
                <PhosphorIcons.UserCircle size={24} weight="duotone" />
              </div>
            </div>
          </div>

          {/* Closed / Completed */}
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Completed / Closed</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats.closed}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-emerald-955/20 text-green-600 dark:text-emerald-400 rounded-xl border border-green-100/30 dark:border-emerald-900/30">
                <PhosphorIcons.CheckCircle size={24} weight="duotone" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and List */}
        <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-150 dark:border-stone-800/80 pb-4">
            {filterOptions.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all duration-200 ${filter === btn.id
                    ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-md scale-105'
                    : 'bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
                  }`}
                data-testid={`filter-${btn.id.toLowerCase().replace(/\s+/g, '-')}-municipal`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16">
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
                  className="bg-white/50 dark:bg-stone-950/20 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl p-6 hover:shadow-md hover:border-emerald-500/20 transition-all duration-300"
                  data-testid="municipal-issue-card"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-xl font-extrabold text-stone-950 dark:text-white leading-snug">
                          {issue.title}
                        </h3>
                        <StatusBadge status={issue.status} size="md" />
                        {issue.status === 'Citizen Verification Pending' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-400">
                            <PhosphorIcons.UserCircle size={12} weight="duotone" />
                            Awaiting citizen verification
                          </span>
                        )}
                      </div>
                      <p className="text-stone-600 dark:text-stone-400 font-medium text-sm leading-relaxed">
                        {issue.description}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedIssueForModal(issue)}
                        className="px-4 py-2.5 bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-all hover:-translate-y-0.5 shadow-sm flex items-center space-x-1.5"
                        data-testid="update-status-btn"
                      >
                        <PhosphorIcons.PencilSimpleLine size={16} weight="bold" />
                        <span>Update Status</span>
                      </button>
                      <button
                        onClick={() => setSelectedIssueForTimeline(issue)}
                        className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl font-bold text-xs transition-all hover:-translate-y-0.5 border border-stone-200 dark:border-stone-700 flex items-center space-x-1.5"
                        data-testid="view-history-btn"
                      >
                        <PhosphorIcons.ClockCounterClockwise size={16} weight="bold" />
                        <span>View Lifecycle ({issue.history?.length || 1})</span>
                      </button>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-stone-400 dark:text-stone-500 border-t border-b border-stone-150 dark:border-stone-800/60 py-4">
                    <div>
                      <span className="uppercase tracking-wider block mb-1 text-[10px]">Category</span>
                      <span className="text-stone-900 dark:text-stone-250 font-bold text-sm capitalize">{issue.category}</span>
                    </div>
                    <div>
                      <span className="uppercase tracking-wider block mb-1 text-[10px]">Assigned Officer</span>
                      <span className="text-stone-900 dark:text-stone-250 font-bold text-sm truncate block">
                        {issue.assigned_to || 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <span className="uppercase tracking-wider block mb-1 text-[10px]">Est. Completion</span>
                      <span className="text-stone-900 dark:text-stone-250 font-bold text-sm">
                        {issue.estimated_completion_date || 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="uppercase tracking-wider block mb-1 text-[10px]">Reported Address</span>
                      <span className="text-stone-900 dark:text-stone-250 font-bold text-sm block truncate max-w-[240px]">
                        {issue.address}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Municipal Update Status Modal */}
      {selectedIssueForModal && (
        <StatusUpdateModal
          issue={selectedIssueForModal}
          onClose={() => setSelectedIssueForModal(null)}
          onSuccess={fetchIssues}
        />
      )}

      {/* Lifecycle Timeline Drawer/Modal */}
      {selectedIssueForTimeline && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedIssueForTimeline(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
            data-testid="timeline-modal"
          >
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-stone-150 dark:border-stone-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                  Complaint Lifecycle History
                </span>
                <h2 className="text-2xl font-black text-stone-950 dark:text-white leading-tight">
                  {selectedIssueForTimeline.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedIssueForTimeline(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800"
              >
                <PhosphorIcons.X size={18} weight="bold" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-3">
                Lifecycle Progression Timeline
              </h3>
              <VerticalTimeline
                history={selectedIssueForTimeline.history}
                estimatedCompletionDate={selectedIssueForTimeline.estimated_completion_date}
              />
            </div>

            <div className="pt-4 border-t border-stone-150 dark:border-stone-800 flex justify-end">
              <button
                onClick={() => {
                  const issue = selectedIssueForTimeline;
                  setSelectedIssueForTimeline(null);
                  setSelectedIssueForModal(issue);
                }}
                className="px-5 py-2.5 bg-emerald-800 dark:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-900"
              >
                Advance Status State
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
