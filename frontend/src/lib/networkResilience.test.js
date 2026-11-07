import { getNetworkQuality, offlineCache } from './networkResilience';

describe('networkResilience utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('getNetworkQuality returns standard network info in browser environment', () => {
    const quality = getNetworkQuality();
    expect(quality).toHaveProperty('isOnline');
    expect(quality).toHaveProperty('effectiveType');
    expect(quality).toHaveProperty('isWeakConnection');
    expect(quality).toHaveProperty('saveData');
  });

  test('offlineCache stores and retrieves data reliably', () => {
    const testData = [{ id: 'issue-101', title: 'Pothole on Main St' }];
    offlineCache.set('test_issues', testData);

    const retrieved = offlineCache.get('test_issues');
    expect(retrieved).toEqual(testData);

    offlineCache.remove('test_issues');
    expect(offlineCache.get('test_issues')).toBeNull();
  });

  test('offlineCache returns stale data instead of failing when expired', () => {
    const staleData = { count: 42 };
    // Set timestamp to 2 days ago
    const pastTimestamp = Date.now() - 48 * 60 * 60 * 1000;
    localStorage.setItem('fms_cache_stale_key', JSON.stringify({ data: staleData, timestamp: pastTimestamp }));

    const retrieved = offlineCache.get('stale_key', 24 * 60 * 60 * 1000);
    expect(retrieved).toEqual(staleData);
  });
});

