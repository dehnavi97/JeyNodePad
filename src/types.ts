export type Language = 'en' | 'fa';

export type Theme = 'frosted-glass' | 'soft-orange' | 'neon-dark' | 'cyberpunk' | 'emerald-gate' | 'sunset-pulse' | 'royal-classic' | 'frosted-emerald' | 'frosted-amethyst' | 'frosted-sunset' | 'frosted-ocean' | 'frosted-cyberpunk' | 'nordic-cold' | 'sweet-pink';

export type Currency = 'USD' | 'EUR' | 'TOMAN';

export interface ProviderAccount {
  id: string;
  name: string; // e.g. LightNode, HostVDS, Hetzner, Hetzner Cloud
  balance: number; // Current credit left in provider panel
  currency: Currency;
  notes?: string;
}

export interface Tag {
  id: string;
  nameEn: string;
  nameFa: string;
  color: string; // Tailwind bg color class (e.g. "bg-rose-500", "bg-emerald-500")
  textColor: string; // Text color class
}

export interface Category {
  id: string;
  nameEn: string;
  nameFa: string;
  icon: string; // Lucide icon identifier
}

export interface Server {
  id: string;
  name: string;
  ip: string;
  sshPort: number;
  username: string;
  password?: string;
  providerId: string; // Connects to ProviderAccount balance or just label
  billingType: 'hourly' | 'cycle';
  cost: number; // monthly or hourly cost
  currency: Currency;
  cycleDays: number; // 30, 90, 365, etc.
  startDate: string; // ISO format date string representing start or last billing point
  notes?: string;
  tags: string[]; // array of Tag IDs
  categoryId: string; // Category ID (e.g. personal, work)
  status: 'active' | 'inactive';
  deleted: boolean;
  deletedAt?: string;
  osType?: string;
  osVersion?: string;
}

export interface RenewalRecord {
  id: string;
  serverId: string;
  date: string; // ISO Date of renewal
  cost: number;
  currency: Currency;
  daysAdded: number;
  note?: string;
}

export interface HelpTopic {
  id: string;
  titleEn: string;
  titleFa: string;
  contentEn: string;
  contentFa: string;
}

export interface SysadminQuest {
  id: string;
  titleEn: string;
  titleFa: string;
  descriptionEn: string;
  descriptionFa: string;
  xpReward: number;
  completed: boolean;
}

export interface UserStats {
  sysadminLevel: number;
  xp: number;
  completedQuests: string[];
  totalServersCreated: number;
  totalRenewalsLogged: number;
}

export interface SecurityConfig {
  lockMethod: 'none' | 'pin' | 'pattern';
  pinCode?: string; // 4-digit PIN for locks
  patternPoints?: number[]; // indices 0 to 8 of grid
  isLocked: boolean;
  lockTimeoutMinutes: number; // Auto lock after timing out
}

export interface AppSettings {
  lang: Language;
  theme: Theme;
  visibleFields: {
    ip: boolean;
    sshPort: boolean;
    credentials: boolean;
    daysRemaining: boolean;
    daysCost: boolean;
    tags: boolean;
    category: boolean;
    provider: boolean;
  };
  security: SecurityConfig;
  enableFinance?: boolean;
}

export interface AppBackup {
  servers: Server[];
  providers: ProviderAccount[];
  tags: Tag[];
  categories: Category[];
  renewals: RenewalRecord[];
  stats: UserStats;
  settings: AppSettings;
  version: string;
  exportedAt: string;
}
