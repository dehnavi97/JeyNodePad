import { Server, ProviderAccount, AppBackup } from './types';

// Storage Helper
export function getSavedState<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value) as T;
    }
  } catch (e) {
    console.error(`Local Storage read error for key: ${key}`, e);
  }
  return defaultValue;
}

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Local Storage write error for key: ${key}`, e);
  }
}

// Date Mechanics
export function calculateDaysRemaining(startDate: string, cycleDays: number): number {
  if (!startDate) return 0;
  
  const genesis = new Date(startDate);
  const targetDate = new Date(genesis.getTime() + cycleDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  // Calculate difference in milliseconds
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Calculate Provider Fuel Remaining Days
export function calculateProviderFuelDays(
  provider: ProviderAccount,
  servers: Server[]
): number | 'infinite' {
  // Find all active, non-deleted hourly servers of this provider
  const hourlyServers = servers.filter(
    s => !s.deleted && s.providerId === provider.id && s.billingType === 'hourly' && s.status === 'active'
  );

  if (hourlyServers.length === 0) {
    return 'infinite';
  }

  // Sum up the daily cost rates. If different currency, we assume they align with provider's currency
  let totalDailyCost = 0;
  hourlyServers.forEach(server => {
    // We assume cost is monthly equivalent price.
    // Daily cost = monthly / 30
    const dailyCost = server.cost / 30;
    totalDailyCost += dailyCost;
  });

  if (totalDailyCost <= 0) {
    return 'infinite';
  }

  // Days left = balance / totalDailyCost
  const days = Math.floor(provider.balance / totalDailyCost);
  return days >= 0 ? days : 0;
}

// Copy to Clipboard Assist
export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false);
  } else {
    // Fallback
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed'; // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return Promise.resolve(successful);
    } catch (err) {
      return Promise.resolve(false);
    }
  }
}

// Validate backup schema
export function validateBackup(data: any): data is AppBackup {
  return (
    data &&
    Array.isArray(data.servers) &&
    Array.isArray(data.providers) &&
    Array.isArray(data.tags) &&
    Array.isArray(data.categories) &&
    typeof data.stats === 'object' &&
    typeof data.settings === 'object'
  );
}
