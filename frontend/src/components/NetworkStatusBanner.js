import React from 'react';
import { useNetworkStatus } from '../lib/networkResilience';
import * as PhosphorIcons from '@phosphor-icons/react';

export const NetworkStatusBanner = () => {
  const { isOnline, effectiveType, isWeakConnection } = useNetworkStatus();

  if (isOnline && !isWeakConnection) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full py-1.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-colors duration-200 z-50 ${
        !isOnline
          ? 'bg-amber-600 text-white'
          : 'bg-emerald-900 text-emerald-100 dark:bg-stone-850 dark:text-emerald-300'
      }`}
      data-testid="network-status-banner"
    >
      {!isOnline ? (
        <>
          <PhosphorIcons.WifiSlash size={16} weight="bold" />
          <span>Offline mode active. Previously loaded data remains available.</span>
        </>
      ) : (
        <>
          <PhosphorIcons.CellSignalLow size={16} weight="bold" />
          <span>
            Weak connection ({effectiveType.toUpperCase()}). Auto-compressing images and retrying requests for rural reliability.
          </span>
        </>
      )}
    </div>
  );
};
