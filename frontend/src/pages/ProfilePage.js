import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const initialsFor = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'FM';

export const ProfilePage = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const uploadRef = useRef(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [issues, setIssues] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || ''); setPhone(user.phone || ''); setAvatar(user.avatar || '');
    axios.get(`${BACKEND_URL}/api/issues`, { params: { my_issues: true }, withCredentials: true })
      .then(({ data }) => setIssues(data))
      .catch(async (error) => {
        if (error.response?.status === 401) {
          // The access JWT is short-lived. Avoid leaving a stale profile on
          // screen that appears signed in but cannot access its own data.
          toast.info('Your session expired. Please sign in again.');
          await logout();
          navigate('/login', { replace: true });
          return;
        }
        toast.error(error.response?.data?.detail || 'Could not load your issues');
      });
  }, [user, BACKEND_URL, logout, navigate]);

  const uploadAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file');
    if (file.size > 2 * 1024 * 1024) return toast.error('Profile image must be smaller than 2MB');
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      await axios.patch(`${BACKEND_URL}/api/auth/profile`, { name, phone, avatar }, { withCredentials: true });
      await refreshUser(); toast.success('Profile updated');
    } catch (error) { toast.error(error.response?.data?.detail || 'Could not update your profile'); }
    finally { setSaving(false); }
  };

  const removeAvatar = async () => {
    setAvatar('');
    try {
      await axios.patch(`${BACKEND_URL}/api/auth/profile`, { remove_avatar: true }, { withCredentials: true });
      await refreshUser(); toast.success('Profile picture removed');
    } catch (error) { toast.error(error.response?.data?.detail || 'Could not remove profile picture'); }
  };

  const signOut = async () => { await logout(); navigate('/login'); };
  const activeIssues = issues.filter((issue) => !['Closed', 'resolved'].includes(issue.status)).length;
  const issuesPath = user?.role === 'municipal' ? '/municipal/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/citizen/my-issues';

  return <div className="min-h-screen bg-[#FAFAF9] dark:bg-stone-950 text-stone-900 dark:text-stone-100">
    <Navbar />
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-6 py-8 sm:p-10 text-white shadow-xl">
        <div className="relative flex flex-col sm:flex-row gap-6 sm:items-center">
          <button onClick={() => uploadRef.current?.click()} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-2 border-white/60 bg-emerald-950 text-3xl font-black shadow-lg" aria-label="Change profile picture">
            {avatar ? <img src={avatar} alt="Profile" className="h-full w-full object-cover" /> : initialsFor(user?.name)}
            <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"><PhosphorIcons.Camera size={26} /></span>
          </button>
          <input ref={uploadRef} className="hidden" type="file" accept="image/*" onChange={uploadAvatar} />
          <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">My account</p><h1 className="mt-1 text-3xl sm:text-4xl font-black">{user?.name}</h1><p className="mt-1 text-emerald-100">Your civic participation profile and activity at a glance.</p></div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/80">
          <div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-black">Personal information</h2><p className="mt-1 text-sm text-stone-500">Keep your contact details current.</p></div><PhosphorIcons.UserCircle size={30} className="text-emerald-700 dark:text-emerald-400" /></div>
          <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">Full name<input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-emerald-700 dark:border-stone-700 dark:bg-stone-950" /></label>
            <label className="text-sm font-bold">Mobile number<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="Add your mobile number" className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-emerald-700 dark:border-stone-700 dark:bg-stone-950" /></label>
            <label className="text-sm font-bold sm:col-span-2">Email address<input value={user?.email || ''} disabled className="mt-2 w-full cursor-not-allowed rounded-xl border border-stone-200 bg-stone-100 px-4 py-3 font-medium text-stone-500 dark:border-stone-700 dark:bg-stone-950" /></label>
            <div className="flex flex-wrap gap-3 pt-2 sm:col-span-2"><button disabled={saving} className="rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white transition hover:bg-emerald-900 disabled:opacity-60">{saving ? 'Saving…' : 'Save profile'}</button>{avatar && <button type="button" onClick={removeAvatar} className="rounded-xl border border-stone-200 px-5 py-3 font-bold text-stone-700 dark:border-stone-700 dark:text-stone-200">Remove photo</button>}</div>
          </form>
        </section>

        <aside className="rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900/80"><h2 className="text-xl font-black">Account overview</h2><div className="mt-5 space-y-4"><div className="flex items-center gap-3"><PhosphorIcons.ShieldCheck size={23} className="text-emerald-700" /><div><p className="text-xs font-bold uppercase text-stone-400">Role</p><p className="font-bold capitalize">{user?.role}</p></div></div><div className="flex items-center gap-3"><PhosphorIcons.Star size={23} className="text-amber-500" /><div><p className="text-xs font-bold uppercase text-stone-400">Contribution points</p><p className="font-bold">{user?.points || 0} points</p></div></div><div className="flex items-center gap-3"><PhosphorIcons.CalendarBlank size={23} className="text-blue-600" /><div><p className="text-xs font-bold uppercase text-stone-400">Member since</p><p className="font-bold">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}</p></div></div></div></aside>
      </div>

      <section className="mt-8 rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900/80"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-black">My issues</h2><p className="mt-1 text-sm text-stone-500">{issues.length} reported · {activeIssues} currently active</p></div><Link to={issuesPath} className="rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-bold text-emerald-800 dark:text-emerald-300">View all issues</Link></div><div className="mt-5 grid gap-3 md:grid-cols-3">{issues.slice(0, 3).map((issue) => <Link key={issue.id} to={issuesPath} className="rounded-2xl border border-stone-200 p-4 transition hover:border-emerald-500/50 hover:shadow-sm dark:border-stone-800"><p className="truncate font-bold">{issue.title}</p><div className="mt-3 flex items-center justify-between gap-2"><StatusBadge status={issue.status} size="sm" /><span className="text-xs text-stone-400">{new Date(issue.created_at).toLocaleDateString()}</span></div></Link>)}{issues.length === 0 && <div className="md:col-span-3 rounded-2xl bg-stone-50 p-6 text-center text-sm font-medium text-stone-500 dark:bg-stone-950">You have not reported an issue yet. <Link to="/citizen/report" className="font-bold text-emerald-700">Report your first one.</Link></div>}</div></section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3"><div className="lg:col-span-2 rounded-3xl bg-stone-950 p-7 text-stone-100"><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-400">About Fix My Spot</p><h2 className="mt-2 text-2xl font-black">Small reports. Visible change.</h2><p className="mt-3 max-w-2xl leading-relaxed text-stone-300">Fix My Spot helps communities turn everyday civic concerns into trackable action. We make reporting simple, keep progress transparent, and connect citizens with municipal teams working to improve the places we share.</p><div className="mt-6 flex flex-wrap gap-2">{['React', 'FastAPI', 'MongoDB', 'JWT', 'Leaflet Maps'].map((tech) => <span key={tech} className="rounded-full border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs font-bold text-stone-200">{tech}</span>)}</div></div><div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/30"><PhosphorIcons.Heart size={30} weight="fill" className="text-rose-500" /><h3 className="mt-4 text-lg font-black">Built for better neighborhoods</h3><p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">Clear issue tracking, timely updates, and meaningful community participation—so every report has a chance to make a difference.</p></div></section>

      <section className="mt-8 border-t border-stone-200 py-8 text-center dark:border-stone-800"><p className="mb-3 text-sm text-stone-500">Finished for now?</p><button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300"><PhosphorIcons.SignOut size={19} /> Log out securely</button></section>
    </main>
  </div>;
};
