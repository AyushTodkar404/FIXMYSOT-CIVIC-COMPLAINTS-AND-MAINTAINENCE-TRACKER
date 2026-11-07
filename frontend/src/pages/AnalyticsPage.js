import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Navbar } from '../components/Navbar';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

const STAGE_COLORS = ['#F59E0B', '#0284C7', '#6366F1', '#2563EB', '#0D9488', '#166534', '#E11D48'];

export const AnalyticsPage = () => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [issuesRes, leaderboardRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/issues`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/gamification/leaderboard`, { withCredentials: true })
      ]);
      
      setIssues(issuesRes.data);
      setUsers(leaderboardRes.data);
      calculateAnalytics(issuesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (issuesData) => {
    // Stage distribution
    const submittedCount = issuesData.filter(i => ['Submitted', 'pending'].includes(i.status)).length;
    const verifiedCount = issuesData.filter(i => i.status === 'Verified').length;
    const assignedCount = issuesData.filter(i => ['Assigned', 'Inspection Scheduled', 'Inspection Completed'].includes(i.status)).length;
    const inProgressCount = issuesData.filter(i => ['Work Started', 'in-progress'].includes(i.status)).length;
    const workCompletedCount = issuesData.filter(i => ['Work Completed', 'Citizen Verification Pending'].includes(i.status)).length;
    const closedCount = issuesData.filter(i => ['Closed', 'resolved'].includes(i.status)).length;
    const reopenedCount = issuesData.filter(i => i.status === 'Reopened').length;

    // Category distribution
    const categoryMap = {};
    issuesData.forEach(issue => {
      categoryMap[issue.category] = (categoryMap[issue.category] || 0) + 1;
    });

    // Timeline data (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = issuesData.filter(issue => {
        const issueDate = new Date(issue.created_at).toISOString().split('T')[0];
        return issueDate === dateStr;
      }).length;
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        issues: count
      });
    }

    // Average resolution time
    const resolvedIssues = issuesData.filter(i => ['Closed', 'resolved', 'Work Completed'].includes(i.status));
    let avgResolutionTime = 0;
    if (resolvedIssues.length > 0) {
      const totalTime = resolvedIssues.reduce((sum, issue) => {
        const created = new Date(issue.created_at);
        const updated = new Date(issue.updated_at);
        return sum + (updated - created);
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedIssues.length / (1000 * 60 * 60 * 24));
    }

    const totalClosed = closedCount + workCompletedCount;

    setAnalytics({
      statusData: [
        { name: 'Submitted', value: submittedCount, color: '#F59E0B' },
        { name: 'Verified', value: verifiedCount, color: '#0284C7' },
        { name: 'Assigned / Inspection', value: assignedCount, color: '#6366F1' },
        { name: 'Work Started', value: inProgressCount, color: '#2563EB' },
        { name: 'Work Completed', value: workCompletedCount, color: '#0D9488' },
        { name: 'Closed', value: closedCount, color: '#166534' },
        { name: 'Reopened', value: reopenedCount, color: '#E11D48' }
      ].filter(item => item.value > 0 || true),
      categoryData: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
      timelineData: last7Days,
      avgResolutionTime,
      totalIssues: issuesData.length,
      totalUsers: users.length,
      resolutionRate: issuesData.length > 0 ? ((totalClosed / issuesData.length) * 100).toFixed(1) : 0
    });
  };

  const exportToPDF = () => {
    if (!analytics) return;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('FIX MY SPOT - Municipal Analytics & Complaint Audit Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    // Summary stats
    doc.setFontSize(14);
    doc.text('Summary Statistics', 14, 40);
    doc.setFontSize(10);
    doc.text(`Total Complaints: ${analytics.totalIssues}`, 14, 48);
    doc.text(`Resolution Rate: ${analytics.resolutionRate}%`, 14, 54);
    doc.text(`Avg Resolution Time: ${analytics.avgResolutionTime} days`, 14, 60);
    doc.text(`Active Users: ${analytics.totalUsers}`, 14, 66);
    
    // Issues table
    autoTable(doc, {
      startY: 75,
      head: [['Title', 'Category', 'Status', 'Created', 'Reporter', 'History Count']],
      body: issues.slice(0, 50).map(issue => [
        issue.title,
        issue.category,
        issue.status,
        new Date(issue.created_at).toLocaleDateString(),
        issue.created_by_name,
        issue.history ? issue.history.length : 1
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 101, 52] }
    });
    
    doc.save('fix-my-spot-analytics-report.pdf');
    toast.success('PDF report exported successfully!');
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Category', 'Status', 'Description', 'Address', 'Created At', 'Reporter', 'History Steps'];
    const rows = issues.map(issue => [
      issue.title,
      issue.category,
      issue.status,
      issue.description.replace(/,/g, ';'),
      issue.address.replace(/,/g, ';'),
      new Date(issue.created_at).toLocaleString(),
      issue.created_by_name,
      issue.history ? issue.history.length : 1
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'fix-my-spot-complaints.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10" data-testid="analytics-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-950 dark:text-white tracking-tight">Analytics & Insights</h1>
            <p className="text-stone-550 dark:text-stone-400 mt-1 font-medium">Real-time metrics, complaint lifecycle breakdown, and municipal performance.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl font-bold text-xs hover:bg-stone-200 flex items-center space-x-2 border border-stone-250 dark:border-stone-700 transition-all"
              data-testid="export-csv-btn"
            >
              <PhosphorIcons.FileCsv size={18} weight="bold" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2.5 bg-emerald-800 dark:bg-emerald-700 text-white rounded-xl font-bold text-xs hover:bg-emerald-900 flex items-center space-x-2 shadow-sm transition-all"
              data-testid="export-pdf-btn"
            >
              <PhosphorIcons.FilePdf size={18} weight="bold" />
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>

        {!loading && analytics && (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Complaints</p>
                <p className="text-3xl font-black text-stone-950 dark:text-white mt-1">{analytics.totalIssues}</p>
              </div>
              <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Resolution Rate</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{analytics.resolutionRate}%</p>
              </div>
              <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Avg Resolution Time</p>
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{analytics.avgResolutionTime} days</p>
              </div>
              <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Active Citizens</p>
                <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">{analytics.totalUsers}</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Lifecycle Stage Breakdown */}
              <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-xl font-extrabold text-stone-950 dark:text-white mb-6">Complaint Lifecycle Distribution</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={analytics.statusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e7e5e4"} />
                      <XAxis dataKey="name" stroke={isDark ? "#a1a1aa" : "#78716c"} tick={{ fontSize: 11 }} />
                      <YAxis stroke={isDark ? "#a1a1aa" : "#78716c"} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#ffffff', borderRadius: '12px' }} />
                      <Bar dataKey="value" fill="#0284C7" radius={[8, 8, 0, 0]}>
                        {analytics.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-xl font-extrabold text-stone-950 dark:text-white mb-6">Issues by Category</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={analytics.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {analytics.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#ffffff', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
