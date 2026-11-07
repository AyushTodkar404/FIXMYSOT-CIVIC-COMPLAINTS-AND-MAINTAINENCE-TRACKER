import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Navbar } from '../components/Navbar';

const ISSUE_CATEGORIES = [
  { icon: <PhosphorIcons.RoadHorizon size={18} weight="duotone" />, label: 'Pothole', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50' },
  { icon: <PhosphorIcons.Trash size={18} weight="duotone" />, label: 'Garbage', color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50' },
  { icon: <PhosphorIcons.Lightbulb size={18} weight="duotone" />, label: 'Street Light', color: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/50' },
  { icon: <PhosphorIcons.Drop size={18} weight="duotone" />, label: 'Sewage', color: 'bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-900/50' },
  { icon: <PhosphorIcons.Lightning size={18} weight="duotone" />, label: 'Electrical', color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-900/50' },
  { icon: <PhosphorIcons.Tree size={18} weight="duotone" />, label: 'Park Maintenance', color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50' },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    icon: <PhosphorIcons.MapPin size={24} weight="duotone" />,
    title: 'Pin & Describe',
    desc: 'Capture the spot with your phone or browser. Attach photo evidence, speak or type the description, and confirm location on the interactive map.',
  },
  {
    step: '02',
    icon: <PhosphorIcons.Buildings size={24} weight="duotone" />,
    title: 'Municipal Action',
    desc: 'Assigned municipal departments schedule inspection and deploy crews. Every status change logs transparent timestamped updates.',
  },
  {
    step: '03',
    icon: <PhosphorIcons.CheckCircle size={24} weight="duotone" />,
    title: 'Citizen Verification',
    desc: 'Once work is marked complete with officer after-photos, the original reporter verifies the resolution before closing the complaint permanently.',
  },
];

const PLATFORM_PILLARS = [
  {
    icon: <PhosphorIcons.MapTrifold size={24} weight="duotone" />,
    title: 'Live City Map',
    desc: 'Full geographic visibility with color-coded markers for pending, active, and completed civic works.',
  },
  {
    icon: <PhosphorIcons.Microphone size={24} weight="duotone" />,
    title: 'Voice Reporting',
    desc: 'Speak your issue in everyday language — automated speech-to-text transcribes your complaint accurately.',
  },
  {
    icon: <PhosphorIcons.ShieldCheck size={24} weight="duotone" />,
    title: 'Verified Resolution',
    desc: 'Dual-party accountability ensures no issue is closed without proof photos and citizen verification.',
  },
  {
    icon: <PhosphorIcons.ChartBar size={24} weight="duotone" />,
    title: 'Civic Transparency',
    desc: 'Public analytics track department resolution speed, active stages, and community maintenance trends.',
  },
  {
    icon: <PhosphorIcons.Translate size={24} weight="duotone" />,
    title: 'Multilingual Support',
    desc: 'Native localization in English, Hindi, and Marathi ensures accessibility for every neighborhood resident.',
  },
  {
    icon: <PhosphorIcons.Medal size={24} weight="duotone" />,
    title: 'Civic Recognition',
    desc: 'Earn community badges and points for active reporting, fostering neighborhood pride and engagement.',
  },
];

export const LandingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      if (user.role === 'municipal' || user.role === 'admin') {
        navigate('/municipal/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Heading & Action */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                Community Civic Utility
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-950 dark:text-white tracking-tight leading-[1.1] mb-6">
                Spot it. Report it.<br />
                <span className="text-emerald-800 dark:text-emerald-400">Track the fix.</span>
              </h1>

              <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-300 leading-relaxed mb-8 max-w-xl">
                Fix My Spot connects residents directly with municipal departments. Report broken infrastructure with geolocated photos and voice notes, then track real-time resolution from dispatch to final verification.
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-10 w-full sm:w-auto">
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-800 text-white rounded-xl font-bold text-base hover:bg-emerald-900 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
                  data-testid="get-started-btn"
                >
                  <span>Report an Issue</span>
                  <PhosphorIcons.ArrowRight size={18} weight="bold" />
                </Link>
                <Link
                  to="/explore"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-xl font-semibold text-base hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <PhosphorIcons.MapTrifold size={18} weight="duotone" />
                  <span>View City Map</span>
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3.5 text-stone-600 dark:text-stone-400 font-semibold text-base hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  data-testid="sign-in-btn"
                >
                  {t('signIn')}
                </Link>
              </div>

              {/* Category Quick Badges */}
              <div className="w-full border-t border-stone-200 dark:border-stone-800 pt-6">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                  Reportable Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {ISSUE_CATEGORIES.map((cat) => (
                    <span
                      key={cat.label}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${cat.color}`}
                    >
                      {cat.icon}
                      {cat.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Grounded Civic Overview Card */}
            <div className="lg:col-span-5">
              <div className="bg-stone-100 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-700 mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-lg bg-emerald-800 text-white">
                      <PhosphorIcons.MapPin size={20} weight="fill" />
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-white">Active Civic Tracking</h3>
                      <p className="text-xs text-stone-500">Live community feed</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                    Transparent
                  </span>
                </div>

                {/* Sample issue cards representing real workflows */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-stone-900 dark:text-white">Main Street Pothole</span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Work Completed
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">Assigned: Roads Department · Awaiting Citizen Verification</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-stone-900 dark:text-white">Broken Street Light at 4th Ave</span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Inspection Scheduled
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">Assigned: Electrical Division · Crew scheduled for Monday</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-stone-900 dark:text-white">Overflowing Waste Container</span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        Assigned
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">Assigned: Sanitation Wing · Ticket dispatched</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs text-stone-500">
                  <span>Open to all residents</span>
                  <Link to="/explore" className="text-emerald-800 dark:text-emerald-400 font-semibold hover:underline">
                    Explore live complaints &rarr;
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold text-emerald-850 dark:text-emerald-400 uppercase tracking-widest mb-2">
            The Three-Step Resolution Loop
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-white tracking-tight">
            How Complaints Get Fixed
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mt-3 text-base">
            Designed for clear accountability. No ticket disappears into bureaucratic silence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {WORKFLOW_STEPS.map((item) => (
            <div
              key={item.step}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl text-emerald-800 dark:text-emerald-400">
                    {item.icon}
                  </div>
                  <span className="text-2xl font-black text-stone-300 dark:text-stone-700">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-stone-950 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold text-emerald-850 dark:text-emerald-400 uppercase tracking-widest mb-2">
              Platform Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-white tracking-tight">
              Built for Community Action
            </h2>
            <p className="text-stone-600 dark:text-stone-400 mt-3 text-base">
              Practical civic tools for everyday citizens and municipal field workers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_PILLARS.map((feature, i) => (
              <div
                key={i}
                className="bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 p-6 flex flex-col justify-start hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-stone-200 dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-base text-stone-950 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="border-t border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-white mb-4">
            Help Keep Your Neighborhood Maintained
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-base max-w-xl mx-auto mb-8">
            Create an account in 30 seconds to report issues, track repairs, and verify completion photos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-7 py-3.5 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900 transition-colors shadow-sm"
              data-testid="join-now-btn"
            >
              Register as Citizen
            </Link>
            <Link
              to="/login"
              className="px-7 py-3.5 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 rounded-xl font-semibold hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-emerald-800 text-white">
              <PhosphorIcons.MapPin size={16} weight="bold" />
            </span>
            <span className="font-bold text-stone-900 dark:text-white text-sm">Fix My Spot</span>
            <span className="text-stone-400 text-xs">· Civic Complaints & Maintenance Tracker</span>
          </div>
          <p className="text-xs text-stone-500">
            Open, participatory civic technology for responsive municipal administration.
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-stone-600 dark:text-stone-400">
            <Link to="/explore" className="hover:text-stone-900 dark:hover:text-white transition-colors">City Map</Link>
            <Link to="/login" className="hover:text-stone-900 dark:hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-stone-900 dark:hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
