import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Navbar } from '../components/Navbar';

const departments = ['Roads', 'Water', 'Electrical', 'Sanitation', 'Parks', 'Other'];
const emptyForm = { name: '', email: '', password: '', department: 'Roads' };

export const AdminDashboard = () => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requiresPasskey, setRequiresPasskey] = useState(false);
  const [adminPasskey, setAdminPasskey] = useState('');

  const request = { withCredentials: true };
  const loadWorkers = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/admin/municipal-workers`, request);
      setWorkers(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load municipal workers.');
    } finally { setLoading(false); }
  };
  useEffect(() => { loadWorkers(); }, []);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const reset = () => { setForm(emptyForm); setEditingId(null); setError(''); setRequiresPasskey(false); setAdminPasskey(''); };
  const submit = async (event) => {
    event.preventDefault(); setError('');
    try {
      if (editingId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await axios.patch(`${BACKEND_URL}/api/admin/municipal-workers/${editingId}`, payload, request);
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/municipal-workers`, form, {
          ...request,
          headers: adminPasskey ? { 'X-Admin-Passkey': adminPasskey } : undefined,
        });
      }
      reset(); await loadWorkers();
    } catch (err) {
      if (err.response?.data?.detail?.code === 'admin_passkey_required') {
        setRequiresPasskey(true);
        setError('Confirm your administrator passkey to create this worker.');
      } else {
        setError(err.response?.data?.detail || 'Unable to save municipal worker.');
      }
    }
  };
  const edit = (worker) => {
    setEditingId(worker.id);
    setForm({ name: worker.name, email: worker.email, password: '', department: worker.department || 'Other' });
    setError('');
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this municipal worker account?')) return;
    try { await axios.delete(`${BACKEND_URL}/api/admin/municipal-workers/${id}`, request); await loadWorkers(); }
    catch (err) { setError(err.response?.data?.detail || 'Unable to delete municipal worker.'); }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
            Administrator Portal
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-stone-950 dark:text-white tracking-tight">
            Municipal Staff Management
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Create, assign departments, and maintain municipal staff credentials.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-800 text-sm flex items-center gap-2">
            <PhosphorIcons.WarningCircle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Worker Form */}
          <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 h-fit shadow-sm">
            <h2 className="font-bold text-lg text-stone-900 dark:text-white mb-5">
              {editingId ? 'Edit Staff Member' : 'Register Municipal Worker'}
            </h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  Full Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  required
                  placeholder="Officer name"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 p-3 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  Official Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={change}
                  required
                  placeholder="worker@municipality.gov"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 p-3 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  {editingId ? 'New Password (Optional)' : 'Initial Password'}
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={change}
                  required={!editingId}
                  minLength="8"
                  placeholder={editingId ? 'Leave blank to preserve' : 'Min. 8 characters'}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 p-3 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  Department Assignment
                </label>
                <select
                  name="department"
                  value={form.department}
                  onChange={change}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 p-3 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {departments.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              {!editingId && requiresPasskey && (
                <div>
                  <label className="block text-xs font-semibold text-red-700 dark:text-red-400 mb-1.5">
                    Administrator Passkey Required
                  </label>
                  <input
                    type="password"
                    value={adminPasskey}
                    onChange={(e) => setAdminPasskey(e.target.value)}
                    required
                    placeholder="Enter passkey"
                    aria-label="Administrator passkey"
                    className="w-full rounded-xl border border-red-300 dark:border-red-800 p-3 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold p-3 text-sm transition-colors shadow-sm"
                >
                  {editingId ? 'Save Staff Changes' : 'Register Staff Account'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 transition-colors"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Worker List */}
          <section className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-stone-900 dark:text-white">Active Municipal Staff</h2>
                <p className="text-xs text-stone-500">Field workers & department coordinators</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {workers.length} {workers.length === 1 ? 'account' : 'accounts'}
              </span>
            </div>

            {loading ? (
              <p className="p-8 text-center text-sm text-stone-500">Loading worker directory...</p>
            ) : workers.length === 0 ? (
              <div className="p-12 text-center text-stone-500">
                <PhosphorIcons.UsersThree size={36} className="mx-auto text-stone-400 mb-2" />
                <p className="text-sm font-medium">No municipal workers registered yet.</p>
                <p className="text-xs text-stone-400 mt-1">Use the registration form on the left to add staff.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-200 dark:divide-stone-800">
                {workers.map((worker) => (
                  <div key={worker.id} className="p-5 flex flex-wrap gap-4 items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-850/50 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-sm">
                        {worker.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-stone-900 dark:text-white">{worker.name}</p>
                        <p className="text-xs text-stone-500">{worker.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {worker.department || 'General'}
                      </span>
                      <button
                        onClick={() => edit(worker)}
                        aria-label={`Edit ${worker.name}`}
                        className="p-2 rounded-lg text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-stone-800 transition-colors"
                        title="Edit Worker"
                      >
                        <PhosphorIcons.PencilSimple size={18} />
                      </button>
                      <button
                        onClick={() => remove(worker.id)}
                        aria-label={`Delete ${worker.name}`}
                        className="p-2 rounded-lg text-stone-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-stone-800 transition-colors"
                        title="Delete Worker"
                      >
                        <PhosphorIcons.Trash size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
