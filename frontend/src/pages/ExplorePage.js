import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { VerticalTimeline } from '../components/VerticalTimeline';
import { IssueImageComparison } from '../components/IssueImageComparison';
import { STATUS_LIST, getStatusMeta } from '../utils/statusUtils';
import { MapBasemapControl } from '../components/MapBasemapControl';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from 'next-themes';
import { offlineCache } from '../lib/networkResilience';

const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

export const ExplorePage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const issueFromQuery = searchParams.get('issue');
  const { resolvedTheme } = useTheme();
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [viewMode, setViewMode] = useState('grid'); // grid or map
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/categories`);
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        offlineCache.set('categories', data);
      }
    } catch {
      const cached = offlineCache.get('categories');
      if (cached) {
        setCategories(cached);
      } else {
        setCategories([
          { id: 'pothole', name: 'Pothole' },
          { id: 'garbage', name: 'Garbage' },
          { id: 'streetlight', name: 'Street Light' },
          { id: 'sewage', name: 'Sewage' },
          { id: 'water', name: 'Water Supply' },
          { id: 'electrical', name: 'Electrical' },
          { id: 'road', name: 'Road Damage' },
          { id: 'park', name: 'Park Maintenance' },
          { id: 'noise', name: 'Noise Pollution' },
          { id: 'other', name: 'Other' }
        ]);
      }
    }
  };

  const fetchIssues = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const { data } = await axios.get(`${BACKEND_URL}/api/issues`, {
        params,
        withCredentials: true
      });
      setIssues(data);
      if (!filters.status && !filters.category && !filters.search) {
        offlineCache.set('all_issues', data);
      }
    } catch (error) {
      console.warn('Network issue fetching issues, recovering from offline cache:', error);
      const cached = offlineCache.get('all_issues');
      if (cached && Array.isArray(cached)) {
        let filtered = [...cached];
        if (filters.category) filtered = filtered.filter(i => i.category === filters.category);
        if (filters.status) filtered = filtered.filter(i => i.status === filters.status);
        if (filters.search) {
          const q = filters.search.toLowerCase();
          filtered = filtered.filter(i => (i.title || '').toLowerCase().includes(q) || (i.address || '').toLowerCase().includes(q));
        }
        setIssues(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (issueId) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/issues/${issueId}/comments`, {
        withCredentials: true
      });
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleAddComment = async (issueId) => {
    if (!newComment.trim()) return;

    try {
      await axios.post(
        `${BACKEND_URL}/api/issues/${issueId}/comments`,
        { text: newComment },
        { withCredentials: true }
      );
      setNewComment('');
      await fetchComments(issueId);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleIssueClick = async (issue) => {
    setSelectedIssue(issue);
    await fetchComments(issue.id);
  };

  useEffect(() => {
    if (!issueFromQuery || issues.length === 0) return;
    const match = issues.find((i) => i.id === issueFromQuery);
    if (match) {
      setSelectedIssue(match);
      fetchComments(match.id);
    }
  }, [issueFromQuery, issues]);

  const getCategoryIcon = (category) => {
    const iconMap = {
      pothole: <PhosphorIcons.RoadHorizon size={18} weight="duotone" />,
      garbage: <PhosphorIcons.Trash size={18} weight="duotone" />,
      streetlight: <PhosphorIcons.Lightbulb size={18} weight="duotone" />,
      sewage: <PhosphorIcons.Drop size={18} weight="duotone" />,
      water: <PhosphorIcons.Drop size={18} weight="duotone" />,
      electrical: <PhosphorIcons.Lightning size={18} weight="duotone" />,
      road: <PhosphorIcons.Warning size={18} weight="duotone" />,
      park: <PhosphorIcons.Tree size={18} weight="duotone" />,
      noise: <PhosphorIcons.SpeakerHigh size={18} weight="duotone" />,
      other: <PhosphorIcons.DotsThree size={18} weight="duotone" />
    };
    return iconMap[category] || <PhosphorIcons.MapPin size={18} weight="duotone" />;
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10" data-testid="explore-page">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-stone-950 dark:text-white tracking-tight">Explore Issues</h1>
          <p className="text-stone-550 dark:text-stone-400 mt-1 font-medium">View and track civic issues reported in your community.</p>
        </div>

        {/* Filter Card */}
        <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">Search</label>
              <div className="relative">
                <PhosphorIcons.MagnifyingGlass size={18} className="absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50/50 dark:bg-stone-950/50 border border-stone-250 dark:border-stone-850 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-800 focus:border-transparent focus:outline-none transition-all placeholder-stone-400 text-sm font-semibold"
                  data-testid="search-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50/50 dark:bg-stone-950/50 border border-stone-250 dark:border-stone-850 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-800 focus:border-transparent focus:outline-none transition-all cursor-pointer text-sm font-semibold"
                data-testid="status-filter"
              >
                <option value="" className="dark:bg-stone-900 font-semibold">All Statuses</option>
                {STATUS_LIST.map((st) => (
                  <option key={st} value={st} className="dark:bg-stone-900 font-semibold">{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50/50 dark:bg-stone-950/50 border border-stone-250 dark:border-stone-850 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-800 focus:border-transparent focus:outline-none transition-all cursor-pointer text-sm font-semibold"
                data-testid="category-filter"
              >
                <option value="" className="dark:bg-stone-900 font-semibold">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="dark:bg-stone-900 font-semibold">{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">View Mode</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all duration-200 border ${viewMode === 'grid'
                    ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-transparent shadow-md'
                    : 'bg-stone-50 dark:bg-stone-950 border-stone-205 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300'
                    }`}
                  data-testid="grid-view-btn"
                >
                  <PhosphorIcons.SquaresFour size={18} weight="bold" />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all duration-200 border ${viewMode === 'map'
                    ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-transparent shadow-md'
                    : 'bg-stone-50 dark:bg-stone-950 border-stone-205 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300'
                    }`}
                  data-testid="map-view-btn"
                >
                  <PhosphorIcons.MapTrifold size={18} weight="bold" />
                  <span>Map</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800/80 pt-4 mt-4">
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Showing {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
            </p>
            {(filters.status || filters.category || filters.search) && (
              <button
                onClick={() => setFilters({ status: '', category: '', search: '' })}
                className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 transition-colors"
                data-testid="clear-filters-btn"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-800 mx-auto"></div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.length === 0 ? (
              <div className="col-span-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-16 text-center shadow-sm">
                <PhosphorIcons.Folder size={64} className="text-stone-300 dark:text-stone-700 mx-auto mb-4" />
                <p className="text-stone-500 dark:text-stone-400 font-medium">No issues found matching selected criteria.</p>
              </div>
            ) : (
              issues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-white/60 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl overflow-hidden hover:shadow-lg hover:border-emerald-500/20 dark:hover:border-emerald-500/20 transition-all duration-300 cursor-pointer flex flex-col hover:-translate-y-1"
                  onClick={() => handleIssueClick(issue)}
                  data-testid="explore-issue-card"
                >
                  {issue.photos && issue.photos.length > 0 ? (
                    <img
                      src={issue.photos[0]}
                      alt={issue.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-900 dark:to-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-600">
                      {getCategoryIcon(issue.category)}
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h3 className="font-bold text-stone-900 dark:text-white text-base leading-snug line-clamp-1">{issue.title}</h3>
                        <StatusBadge status={issue.status} size="sm" />
                      </div>
                      <p className="text-xs text-stone-550 dark:text-stone-400 mb-4 line-clamp-2 leading-relaxed font-medium">{issue.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">
                      <span className="flex items-center">
                        {getCategoryIcon(issue.category)}
                        <span className="ml-1 capitalize">{issue.category}</span>
                      </span>
                      <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm p-2" style={{ height: '600px' }}>
            <MapContainer
              center={[19.0760, 72.8777]}
              zoom={12}
              style={{ height: '100%', width: '100%', borderRadius: '1.25rem' }}
              data-testid="explore-map"
              className="modern-map"
            >
              <MapBasemapControl isDark={isDark} />
              {issues.map((issue) => (
                <Marker
                  key={issue.id}
                  position={[issue.location.lat, issue.location.lng]}
                  icon={createCustomIcon(getStatusMeta(issue.status).hexColor)}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px] text-stone-900">
                      <h4 className="font-bold text-stone-950 mb-1 leading-snug">{issue.title}</h4>
                      <p className="text-xs text-stone-600 mb-2.5 font-medium line-clamp-2">{issue.description}</p>
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                        <StatusBadge status={issue.status} size="sm" />
                        <span className="text-stone-400 capitalize">{issue.category}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>

      {/* Issue Detail Modal with Vertical Timeline */}
      {selectedIssue && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedIssue(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 border border-stone-200/65 dark:border-stone-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="issue-detail-modal"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-b border-stone-200/60 dark:border-stone-800/80 p-5 flex justify-between items-center z-20">
              <h2 className="text-2xl font-extrabold text-stone-950 dark:text-white leading-tight">{selectedIssue.title}</h2>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-stone-500 hover:text-stone-900 dark:hover:text-white bg-stone-50 dark:bg-stone-950 p-2 rounded-xl border border-stone-200/60 dark:border-stone-800 transition-colors flex items-center justify-center"
                data-testid="close-modal-btn"
              >
                <PhosphorIcons.X size={18} weight="bold" />
              </button>
            </div>

            {/* Image Previews */}
            {(selectedIssue.photos?.length > 0 || selectedIssue.after_photos?.length > 0) && (
              <div className="p-5 bg-stone-50 dark:bg-stone-950/20 border-b border-stone-100 dark:border-stone-850">
                <IssueImageComparison beforeImages={selectedIssue.photos || []} afterImages={selectedIssue.after_photos || []} />
              </div>
            )}

            <div className="p-6">
              <p className="text-stone-600 dark:text-stone-400 font-medium leading-relaxed mb-6">{selectedIssue.description}</p>

              {/* Modal Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-xs font-semibold text-stone-400 dark:text-stone-505 border-b border-stone-150 dark:border-stone-850 pb-5">
                <div>
                  <span className="uppercase tracking-wider block mb-1">Status</span>
                  <StatusBadge status={selectedIssue.status} size="sm" />
                </div>
                <div>
                  <span className="uppercase tracking-wider block mb-1">Category</span>
                  <span className="text-stone-900 dark:text-stone-250 font-bold text-sm capitalize">{selectedIssue.category}</span>
                </div>
                <div>
                  <span className="uppercase tracking-wider block mb-1">Reported by</span>
                  <span className="text-stone-900 dark:text-stone-250 font-bold text-sm">{selectedIssue.created_by_name}</span>
                </div>
                <div>
                  <span className="uppercase tracking-wider block mb-1">Date</span>
                  <span className="text-stone-900 dark:text-stone-250 font-bold text-sm">
                    {new Date(selectedIssue.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-xs font-bold text-stone-400 dark:text-stone-505 uppercase tracking-wider block mb-1.5">Location details</span>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-200 bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-150 dark:border-stone-850">{selectedIssue.address}</p>
              </div>

              {/* Vertical Timeline Section */}
              <div className="border-t border-stone-200 dark:border-stone-800 pt-6 mb-6">
                <h3 className="text-lg font-extrabold text-stone-950 dark:text-white mb-4 flex items-center space-x-2">
                  <PhosphorIcons.ClockCounterClockwise size={20} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                  <span>Complaint History Timeline</span>
                </h3>
                <VerticalTimeline
                  history={selectedIssue.history}
                  estimatedCompletionDate={selectedIssue.estimated_completion_date}
                />
              </div>

              {/* Comments Section */}
              <div className="border-t border-stone-200 dark:border-stone-800 pt-6">
                <h3 className="text-lg font-extrabold text-stone-950 dark:text-white mb-4">Comments ({comments.length})</h3>

                <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-sm text-stone-400 dark:text-stone-500 italic">No comments yet. Be the first to comment!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-stone-50 dark:bg-stone-950/40 p-4 border border-stone-150/40 dark:border-stone-850 rounded-2xl">
                        <div className="flex items-center justify-between mb-1.5 text-xs">
                          <span className="font-bold text-stone-900 dark:text-white">{comment.user_name}</span>
                          <span className="text-stone-400 dark:text-stone-500 font-semibold">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-stone-600 dark:text-stone-300 font-medium leading-relaxed">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2.5 bg-stone-50/50 dark:bg-stone-950/50 border border-stone-250 dark:border-stone-850 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-800 focus:border-transparent focus:outline-none placeholder-stone-400 transition-all text-sm font-semibold"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(selectedIssue.id)}
                    data-testid="comment-input"
                  />
                  <button
                    onClick={() => handleAddComment(selectedIssue.id)}
                    className="px-5 py-2.5 bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-950 dark:hover:bg-emerald-600 text-white rounded-xl font-bold transition-all duration-300 shadow-sm text-sm"
                    data-testid="add-comment-btn"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
