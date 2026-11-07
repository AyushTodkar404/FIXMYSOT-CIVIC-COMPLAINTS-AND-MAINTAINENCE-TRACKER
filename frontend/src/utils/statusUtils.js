import React from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';

export const STATUS_LIST = [
  'Submitted',
  'Verified',
  'Assigned',
  'Inspection Scheduled',
  'Inspection Completed',
  'Work Started',
  'Work Completed',
  'Citizen Verification Pending',
  'Closed',
  'Reopened'
];

export const STATUS_METADATA = {
  'Submitted': {
    label: 'Submitted',
    colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dotColor: 'bg-amber-500',
    hexColor: '#F59E0B',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.PaperPlaneTilt size={size} weight={weight} />,
    description: 'Complaint received and recorded in system.'
  },
  'Verified': {
    label: 'Verified',
    colorClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    dotColor: 'bg-sky-500',
    hexColor: '#0284C7',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.ShieldCheck size={size} weight={weight} />,
    description: 'Complaint verified by municipal authority.'
  },
  'Assigned': {
    label: 'Assigned',
    colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    dotColor: 'bg-indigo-500',
    hexColor: '#6366F1',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.UserPlus size={size} weight={weight} />,
    description: 'Assigned to municipal department/engineer.'
  },
  'Inspection Scheduled': {
    label: 'Inspection Scheduled',
    colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    dotColor: 'bg-purple-500',
    hexColor: '#9333EA',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.Calendar size={size} weight={weight} />,
    description: 'Field inspection date scheduled.'
  },
  'Inspection Completed': {
    label: 'Inspection Completed',
    colorClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
    dotColor: 'bg-violet-500',
    hexColor: '#7C3AED',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.ClipboardText size={size} weight={weight} />,
    description: 'Site inspection assessment completed.'
  },
  'Work Started': {
    label: 'Work Started',
    colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    dotColor: 'bg-blue-500',
    hexColor: '#2563EB',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.Wrench size={size} weight={weight} />,
    description: 'Physical work and repairs in progress.'
  },
  'Work Completed': {
    label: 'Work Completed',
    colorClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
    dotColor: 'bg-teal-500',
    hexColor: '#0D9488',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.CheckCircle size={size} weight={weight} />,
    description: 'Repair work completed by field team.'
  },
  'Citizen Verification Pending': {
    label: 'Verification Pending',
    colorClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    dotColor: 'bg-orange-500',
    hexColor: '#EA580C',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.UserCheck size={size} weight={weight} />,
    description: 'Awaiting citizen review and sign-off.'
  },
  'Closed': {
    label: 'Closed',
    colorClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    hexColor: '#166534',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.CheckFat size={size} weight={weight} />,
    description: 'Complaint verified and permanently closed.'
  },
  'Reopened': {
    label: 'Reopened',
    colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    dotColor: 'bg-rose-500',
    hexColor: '#E11D48',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.ArrowClockwise size={size} weight={weight} />,
    description: 'Complaint reopened for further action.'
  },
  'pending': {
    label: 'Submitted',
    colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dotColor: 'bg-amber-500',
    hexColor: '#F59E0B',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.Clock size={size} weight={weight} />,
    description: 'Pending review'
  },
  'in-progress': {
    label: 'Work Started',
    colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    dotColor: 'bg-blue-500',
    hexColor: '#2563EB',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.CircleNotch size={size} className="animate-spin" />,
    description: 'In progress'
  },
  'resolved': {
    label: 'Closed',
    colorClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    hexColor: '#166534',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.CheckCircle size={size} weight={weight} />,
    description: 'Resolved'
  }
};

export const getStatusMeta = (status) => {
  return STATUS_METADATA[status] || {
    label: status ? status.replace('-', ' ') : 'Unknown',
    colorClass: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/30',
    dotColor: 'bg-stone-500',
    hexColor: '#78716C',
    icon: (size = 18, weight = "duotone") => <PhosphorIcons.Info size={size} weight={weight} />,
    description: ''
  };
};
