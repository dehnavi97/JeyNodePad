import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Server, 
  ProviderAccount, 
  Tag, 
  Category, 
  RenewalRecord, 
  UserStats, 
  AppSettings, 
  SysadminQuest,
  Currency,
  AppBackup
} from './types';
import { 
  DEFAULT_TAGS, 
  DEFAULT_CATEGORIES, 
  DEFAULT_QUESTS, 
  INITIAL_SETTINGS, 
  INITIAL_STATS, 
  TRANSLATIONS,
  SYSADMIN_TITLES
} from './constants';
import { 
  getSavedState, 
  saveState, 
  calculateDaysRemaining, 
  copyToClipboard, 
  validateBackup 
} from './utils';
import { Onboarding } from './components/Onboarding';
// @ts-ignore
import appLogo from '../assets/icon_small.png';
// @ts-ignore
import ubuntuLogo from '../assets/os/ubuntu.svg';
// @ts-ignore
import debianLogo from '../assets/os/debian.svg';
// @ts-ignore
import centosLogo from '../assets/os/centos.svg';
// @ts-ignore
import alpineLogo from '../assets/os/alpine.svg';
// @ts-ignore
import windowsLogo from '../assets/os/windows.svg';
import { LockScreen } from './components/LockScreen';
import { ServerForm } from './components/ServerForm';
import { TerminalSim } from './components/TerminalSim';
import { SshTabTerminal } from './components/SshTabTerminal';
import { Portal } from 'react-dom'; // we can use simple inline layouts for clean modal wrappers
import { ProviderCard } from './components/ProviderCard';
import { StatsGamification } from './components/StatsGamification';
import { DeveloperAbout } from './components/DeveloperAbout';
import { getCurrentWindow } from '@tauri-apps/api/window';

// Lucide Icons Import
import { 
  Server as ServerIcon, 
  Plus, 
  Trash2, 
  Search, 
  Settings as SettingsIcon, 
  Lock, 
  Unlock, 
  FileDown, 
  FileUp, 
  Tag as TagIcon, 
  Layers, 
  Info, 
  Coins, 
  Eye, 
  EyeOff, 
  Copy, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCw, 
  Check, 
  FolderPlus,
  Compass, 
  Trash, 
  PlusCircle, 
  Calendar, 
  AlertTriangle,
  History,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Pencil,
  Activity,
  Wifi,
  Terminal,
  Monitor,
  PlayCircle
} from 'lucide-react';

const renderOSLogo = (osType: string | undefined, className = "w-4.5 h-4.5 object-contain select-none") => {
  switch (osType) {
    case 'ubuntu':
      return <img src={ubuntuLogo} className={className} alt="Ubuntu" referrerPolicy="no-referrer" />;
    case 'debian':
      return <img src={debianLogo} className={className} alt="Debian" referrerPolicy="no-referrer" />;
    case 'centos':
      return <img src={centosLogo} className={className} alt="Rocky/Cent" referrerPolicy="no-referrer" />;
    case 'alpine':
      return <img src={alpineLogo} className={className} alt="Alpine" referrerPolicy="no-referrer" />;
    case 'windows':
      return <img src={windowsLogo} className={className} alt="Windows" referrerPolicy="no-referrer" />;
    default:
      return <span className="text-sm">🐧</span>;
  }
};

const isTauri = typeof window !== 'undefined' && (('__TAURI__' in window) || (window as any).__TAURI__ !== undefined);

const openExternalUrl = async (url: string) => {
  if (isTauri) {
    try {
      const tauri = (window as any).__TAURI__;
      if (tauri.shell && typeof tauri.shell.open === 'function') {
        await tauri.shell.open(url);
        return;
      }
      if (tauri.core && typeof tauri.core.invoke === 'function') {
        await tauri.core.invoke('plugin:shell|open', { value: url });
        return;
      }
      if (tauri.invoke && typeof tauri.invoke === 'function') {
        await tauri.invoke('open_url', { url });
        return;
      }
    } catch (e) {
      console.warn("Tauri shell open failed, falling back to window.open", e);
    }
  }
  window.open(url, '_blank');
};

const TauriTitleBar = ({ lang }: { lang: 'en' | 'fa' }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    
    
    const checkMaximized = async () => {
      try {
        const win = getCurrentWindow();
        if (win && typeof win.isMaximized === 'function') {
          const max = await win.isMaximized();
          setIsMaximized(max);
        }
      } catch (err) {
        // ignore
      }
    };

    checkMaximized();
    const interval = setInterval(checkMaximized, 2000);
    return () => clearInterval(interval);
  }, []);

  

  const handleMinimize = async () => {
    try {
      const win = getCurrentWindow();
      await win.minimize();
    } catch (err) {
      console.error("Minimize error:", err);
    }
  };

  const handleMaximize = async () => {
    try {
      const win = getCurrentWindow();
      await win.toggleMaximize();
      const max = await win.isMaximized();
      setIsMaximized(max);
    } catch (err) {
      console.error("Maximize error:", err);
    }
  };

  const handleClose = async () => {
    try {
      const win = getCurrentWindow();
      await win.close();
    } catch (err) {
      console.error("Close error:", err);
    }
  };

  return (
    <div 
      className="h-10 border-b border-brand-border/30 flex items-center justify-between select-none shrink-0 z-50 text-xs font-mono TopBar"
      style={{ direction: 'ltr', position: 'sticky', top: '1px', zIndex: '9999', background: '#000' }}
    >
      {/* Left side: Logo & Title */}
      <div className="flex items-center gap-2 pl-3 pointer-events-none select-none">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-brand-accent to-brand-accent-secondary p-[1px] flex items-center justify-center">
          <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-sm" referrerPolicy="no-referrer" />
        </div>
        <span className="font-black tracking-tight text-white font-mono text-[11px]">JeyNode</span>
        <span className="text-[8px] bg-brand-accent-secondary/25 text-brand-accent px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90">desktop</span>
      </div>

      {/* Draggable center region */}
      <div 
        data-tauri-drag-region 
        className="flex-1 h-full flex items-center justify-center text-[10px] text-brand-text-muted cursor-default font-sans truncate px-4"
        onDoubleClick={handleMaximize}
      >
        {lang === 'fa' ? 'مدیریت گرایش و سرورهای محلی JeyNode' : 'JeyNode Local Server Management Console'}
      </div>

      {/* Right side: standard Windows-style control buttons */}
      <div className="flex items-center h-full">
        {/* Minimize */}
        <button
          onClick={()=>{handleMinimize()}}
          className="w-11 h-full flex items-center justify-center text-brand-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Minimize"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 10 10">
            <path d="M1,5 L9,5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={handleMaximize}
          className="w-11 h-full flex items-center justify-center text-brand-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title={isMaximized ? "Restore Down" : "Maximize"}
        >
          {isMaximized ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 10 10">
              <path d="M2.5,4.5 L2.5,1.5 L8.5,1.5 L8.5,7.5 L5.5,7.5" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M1.5,3.5 L7.5,3.5 L7.5,9.5 L1.5,9.5 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 10 10">
              <rect x="2" y="2" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="w-11 h-full flex items-center justify-center text-brand-text-muted hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
          title="Close"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 10 10">
            <path d="M2.5,2.5 L7.5,7.5 M2.5,7.5 L7.5,2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function App() {
  // Onboarding verification checks
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('jey_onboarded') === 'true';
  });

  // App settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    return getSavedState<AppSettings>('jey_settings', INITIAL_SETTINGS);
  });

  // Main persistent nodes state
  const [servers, setServers] = useState<Server[]>(() => {
    return getSavedState<Server[]>('jey_servers', []);
  });

  const [providers, setProviders] = useState<ProviderAccount[]>(() => {
    // Default initial empty list or simple seed
    return getSavedState<ProviderAccount[]>('jey_providers', [
      { id: 'prov-lightnode', name: 'LightNode', balance: 15.0, currency: 'USD' },
      { id: 'prov-hetzner', name: 'Hetzner Cloud', balance: 0.0, currency: 'EUR' },
      { id: 'prov-hostvds', name: 'HostVDS', balance: 8.50, currency: 'USD' },
    ]);
  });

  const [tags, setTags] = useState<Tag[]>(() => {
    return getSavedState<Tag[]>('jey_tags', DEFAULT_TAGS);
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    return getSavedState<Category[]>('jey_categories', DEFAULT_CATEGORIES);
  });

  const [renewals, setRenewals] = useState<RenewalRecord[]>(() => {
    return getSavedState<RenewalRecord[]>('jey_renewals', []);
  });

  const [stats, setStats] = useState<UserStats>(() => {
    return getSavedState<UserStats>('jey_stats', INITIAL_STATS);
  });

  const [quests, setQuests] = useState<SysadminQuest[]>(() => {
    return getSavedState<SysadminQuest[]>('jey_quests', DEFAULT_QUESTS);
  });

  // UI States
  const [isSecureLocked, setIsSecureLocked] = useState<boolean>(() => {
    const s = getSavedState<AppSettings>('jey_settings', INITIAL_SETTINGS);
    return s.security.lockMethod !== 'none' && !!s.security.pinCode;
  });

  const [activeTab, setActiveTab] = useState<'nodes' | 'accounting' | 'settings'>('nodes');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [showTrash, setShowTrash] = useState(false);

  // Forms and Modals triggers
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isDeployingNew, setIsDeployingNew] = useState(false);
  const [isEditingServer, setIsEditingServer] = useState<Server | null>(null);
  const [isLoggingRenewal, setIsLoggingRenewal] = useState<Server | null>(null);

  // Quick PIN Setup Input states
  const [pinSetupMode, setPinSetupMode] = useState<boolean>(false);
  const [newPINCode, setNewPINCode] = useState('');
  const [pinSetupError, setPinSetupError] = useState('');

  // New Tag forge helper state
  const [newTagEn, setNewTagEn] = useState('');
  const [newTagFa, setNewTagFa] = useState('');
  const [newTagColor, setNewTagColor] = useState('#8b5cf6');

  // Ping monitoring states tracker
  const [serverPings, setServerPings] = useState<Record<string, { ms?: number; status: 'idle' | 'loading' | 'success' | 'error' }>>({});
  const [showSSHInstructionModal, setShowSSHInstructionModal] = useState<{ isOpen: boolean; cmd: string; serverName: string } | null>(null);

  // Dynamic Tabs state for bottom viewport task bar
  interface AppTab {
    id: string; // 'jeynode' or 'ssh_...'
    title: string;
    type: 'main' | 'ssh';
    server?: Server;
    initialCommand?: string;
    initialCommandName?: string;
  }
  const [appTabs, setAppTabs] = useState<AppTab[]>([{ id: 'jeynode', title: 'JeyNode', type: 'main' }]);
  const [activeAppTabId, setActiveAppTabId] = useState<string>('jeynode');
  const [activeSSHActionModalServer, setActiveSSHActionModalServer] = useState<Server | null>(null);

  // Dynamic remote Linux commands list
  interface LinuxCommand {
    title_fa: string;
    title_en: string;
    description_fa: string;
    description_en: string;
    command: string;
  }

  const [linuxCommands, setLinuxCommands] = useState<LinuxCommand[]>(() => {
    try {
      const cached = localStorage.getItem('jeynode_cached_linux_commands');
      return cached ? JSON.parse(cached) : [];
    } catch (err) {
      console.error('Failed to parse cached linux commands:', err);
      return [];
    }
  });

  useEffect(() => {
    const fetchCommandsTemplates = async () => {
      try {
        const response = await fetch('https://jeybox.ir/linux/list.json');
        if (response.ok) {
          const list = await response.json();
          if (Array.isArray(list)) {
            setLinuxCommands(list);
            localStorage.setItem('jeynode_cached_linux_commands', JSON.stringify(list));
          }
        }
      } catch (err) {
        console.warn('Network unreachable for remote commands list, utilizing local cache fallback:', err);
      }
    };
    fetchCommandsTemplates();
  }, []);

  const spawnSshTab = (server: Server, initialCommand?: string, cmdName?: string) => {
    // Generate unique tab Id
    const tabId = `ssh_${server.id}_${Date.now()}`;
    const newTab: AppTab = {
      id: tabId,
      title: `SSH: ${server.name}`,
      type: 'ssh',
      server,
      initialCommand,
      initialCommandName: cmdName
    };
    setAppTabs(prev => [...prev, newTab]);
    setActiveAppTabId(tabId);
    setActiveSSHActionModalServer(null); // dismiss action trigger dialog
  };

  const closeSshTab = (tabId: string) => {
    setAppTabs(prev => {
      const nextTabs = prev.filter(t => t.id !== tabId);
      // If closing focused tab, default to previous tab, or fallback back to 'jeynode' main application
      if (activeAppTabId === tabId) {
        const activeIdx = prev.findIndex(t => t.id === tabId);
        const fallbackId = prev[activeIdx - 1]?.id || 'jeynode';
        setActiveAppTabId(fallbackId);
      }
      return nextTabs;
    });
  };

  // New Provider registration state
  const [newProvName, setNewProvName] = useState('');
  const [newProvCurrency, setNewProvCurrency] = useState<Currency>('USD');
  const [newProvBalance, setNewProvBalance] = useState(0);
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);

  // Backup Input Area state
  const [backupText, setBackupText] = useState('');
  const [backupErrorMsg, setBackupErrorMsg] = useState('');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [resetConfirmInput, setResetConfirmInput] = useState<string>('');

  // Copy clip feedback states
  const [clipTip, setClipTip] = useState<string | null>(null);

  // Renewal overlay states
  const [renewalAmount, setRenewalAmount] = useState<number>(10);
  const [renewalCurrency, setRenewalCurrency] = useState<Currency>('USD');
  const [renewalAddedDays, setRenewalAddedDays] = useState<number>(30);
  const [renewalJournalText, setRenewalJournalText] = useState('');

  // Active language text dictionary assist
  const lang = settings.lang;
  const t = TRANSLATIONS[lang];

  // Persistent save reactions
  useEffect(() => {
    saveState('jey_settings', settings);
  }, [settings]);

  // Apply theme class to documentElement & body for global styling and background reactivity
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    const classesToRemove = [
      'theme-soft-orange', 
      'theme-neon-dark', 
      'theme-cyberpunk', 
      'theme-emerald-gate', 
      'theme-sunset-pulse', 
      'theme-royal-classic', 
      'theme-frosted-glass',
      'theme-frosted-emerald',
      'theme-frosted-amethyst',
      'theme-frosted-sunset',
      'theme-frosted-ocean',
      'theme-frosted-cyberpunk',
      'theme-sweet-pink',
      'theme-nordic-cold'
    ];
    
    classesToRemove.forEach(cls => {
      root.classList.remove(cls);
      body.classList.remove(cls);
    });
    
    const currentThemeClass = `theme-${settings.theme}`;
    root.classList.add(currentThemeClass);
    body.classList.add(currentThemeClass);
  }, [settings.theme]);

  useEffect(() => {
    saveState('jey_servers', servers);
  }, [servers]);

  useEffect(() => {
    saveState('jey_providers', providers);
  }, [providers]);

  useEffect(() => {
    saveState('jey_tags', tags);
  }, [tags]);

  useEffect(() => {
    saveState('jey_categories', categories);
  }, [categories]);

  useEffect(() => {
    saveState('jey_renewals', renewals);
  }, [renewals]);

  useEffect(() => {
    saveState('jey_stats', stats);
  }, [stats]);

  useEffect(() => {
    saveState('jey_quests', quests);
  }, [quests]);

  // Adjust active tab if billing panel is disabled
  useEffect(() => {
    if (!settings.enableFinance && activeTab === 'accounting') {
      setActiveTab('nodes');
    }
  }, [settings.enableFinance, activeTab]);

  // Handle Onboarding Completion
  const handleOnboardComplete = (pLang: 'en' | 'fa', pTheme: string, pinCode?: string) => {
    const updatedSettings: AppSettings = {
      ...settings,
      lang: pLang,
      theme: pTheme as any,
      security: {
        ...settings.security,
        lockMethod: pinCode ? 'pin' : 'none',
        pinCode: pinCode,
      }
    };
    
    setSettings(updatedSettings);
    setIsOnboarded(true);
    localStorage.setItem('jey_onboarded', 'true');
    setIsSecureLocked(false);

    // Level progression seed
    setStats(prev => ({
      ...prev,
      xp: prev.xp + 20, // free starter code XP
    }));
  };

  // Claim XP or achievements
  const awardXP = (amount: number) => {
    setStats((prev) => {
      let currentXp = prev.xp + amount;
      let nextLevelXp = prev.sysadminLevel * 100;
      let level = prev.sysadminLevel;
      
      while (currentXp >= nextLevelXp) {
        currentXp -= nextLevelXp;
        level++;
        nextLevelXp = level * 100;
        // Broadcast
        alert(lang === 'fa' 
          ? `🎉 تبریک! شما به سطح ${level} صعود کردید و رتبه سیستمی جدید کسب نمودید!` 
          : `🎉 Level Up! You climbed to Level ${level} and unlocked higher sysadmin titles!`);
      }

      return {
        ...prev,
        xp: currentXp,
        sysadminLevel: level,
      };
    });
  };

  const handleClaimQuest = (questId: string) => {
    if (stats.completedQuests.includes(questId)) return;

    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    setStats((prev) => ({
      ...prev,
      completedQuests: [...prev.completedQuests, questId]
    }));
    awardXP(quest.xpReward);
  };

  // Lock and unlock logic
  const handleUnlock = () => {
    setIsSecureLocked(false);
  };

  const handleTriggerLock = () => {
    if (settings.security.pinCode) {
      setIsSecureLocked(true);
    } else {
      alert(lang === 'fa' ? 'جهت قفل کردن برنامه ابتدا در تنظیمات یک رمز عبور تعیین فرمایید.' : 'Please configure an entry passcode in settings first.');
    }
  };

  // Server management functions
  const handleCreateServer = (serverData: Omit<Server, 'id' | 'deleted'>) => {
    const newServer: Server = {
      ...serverData,
      id: `srv-${Date.now()}`,
      deleted: false,
    };

    setServers((prev) => [...prev, newServer]);
    setIsDeployingNew(false);

    setStats((prev) => ({
      ...prev,
      totalServersCreated: prev.totalServersCreated + 1,
    }));

    // Quest claim logic: Register first node
    handleClaimQuest('quest-add-server');
    awardXP(15); // micro action reward
  };

  const handleEditServer = (serverData: Omit<Server, 'id' | 'deleted'>) => {
    if (!isEditingServer) return;

    setServers((prev) =>
      prev.map((s) => (s.id === isEditingServer.id ? { ...s, ...serverData } : s))
    );
    // If the server being looked at is the one edited, synchronize
    if (selectedServer?.id === isEditingServer.id) {
      setSelectedServer({ ...selectedServer, ...serverData });
    }
    setIsEditingServer(null);
  };

  const handleSoftDelete = (serverId: string) => {
    setServers((prev) =>
      prev.map((s) => (s.id === serverId ? { ...s, deleted: true, deletedAt: new Date().toISOString() } : s))
    );
    if (selectedServer?.id === serverId) {
      setSelectedServer(null);
    }
  };

  const handleRestoreServer = (serverId: string) => {
    setServers((prev) =>
      prev.map((s) => (s.id === serverId ? { ...s, deleted: false, deletedAt: undefined } : s))
    );
  };

  const handlePermanentDelete = (serverId: string) => {
    if (window.confirm(t.deletePermConfirm)) {
      setServers((prev) => prev.filter((s) => s.id !== serverId));
    }
  };

  const handleCopyCredentials = (text: string, label: string) => {
    copyToClipboard(text).then((success) => {
      if (success) {
        setClipTip(label);
        setTimeout(() => setClipTip(null), 1500);
      }
    });
  };

  const calculatePing = async (serverId: string, ip: string) => {
    setServerPings(prev => ({
      ...prev,
      [serverId]: { status: 'loading' }
    }));

    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const ms = await invoke<number>('ping_server', { ip });
        setServerPings(prev => ({
          ...prev,
          [serverId]: { status: 'success', ms }
        }));
        return;
      } catch (err) {
        console.error("Ping error:", err);
        setServerPings(prev => ({
          ...prev,
          [serverId]: { status: 'error' }
        }));
        return;
      }
    }

    // Simulating packet travel delay (250ms - 750ms)
    const simulatedDelay = 250 + Math.random() * 500;
    await new Promise(resolve => setTimeout(resolve, simulatedDelay));

    // Generate a beautiful, stable base ping from the IP address
    let ipSum = 0;
    for (let i = 0; i < ip.length; i++) {
      ipSum += ip.charCodeAt(i);
    }
    
    // Base ping is between 15ms and 195ms based on the IP address string
    const basePing = 15 + (ipSum % 180);
    // Slight jitter to make it dynamic
    const jitter = Math.floor(Math.random() * 7) - 3; // -3 to +3 ms
    const finalPing = Math.max(8, basePing + jitter);

    // Random edge-case error (e.g. 2% chance to simulate a network drop/timeout)
    const isError = Math.random() < 0.02;

    setServerPings(prev => ({
      ...prev,
      [serverId]: isError 
        ? { status: 'error' } 
        : { status: 'success', ms: finalPing }
    }));
  };

  const handlePingAllServers = async () => {
    // Collect active servers
    const activeServers = servers.filter(s => !s.deleted);
    if (activeServers.length === 0) return;

    // Set all to loading first
    setServerPings(prev => {
      const updated = { ...prev };
      activeServers.forEach(server => {
        updated[server.id] = { status: 'loading' };
      });
      return updated;
    });

    // Run ping calculations concurrently!
    await Promise.all(
      activeServers.map(server => calculatePing(server.id, server.ip))
    );
  };

  const handleLaunchSSH = (server: Server) => {
    setActiveSSHActionModalServer(server);
  };

  // Provider panel logic
  const handleTopUpBalance = (providerId: string, amount: number) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, balance: p.balance + amount } : p))
    );
    // Micro XP rewards
    awardXP(10);
  };

  const handleCreateProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName) return;

    const newProv: ProviderAccount = {
      id: `prov-${Date.now()}`,
      name: newProvName,
      balance: Number(newProvBalance),
      currency: newProvCurrency,
    };

    setProviders((prev) => [...prev, newProv]);
    setNewProvName('');
    setNewProvBalance(0);
    setIsAddProviderOpen(false);

    handleClaimQuest('quest-hourly'); // claim provider fuel quest
    awardXP(15);
  };

  // Custom Tag Creation
  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagEn || !newTagFa) return;

    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      nameEn: newTagEn,
      nameFa: newTagFa,
      color: newTagColor,
      textColor: '#ffffff',
    };

    setTags((prev) => [...prev, newTag]);
    setNewTagEn('');
    setNewTagFa('');
    
    awardXP(10);
  };

  // Renewal Registration functions
  const handleLogRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggingRenewal) return;

    const record: RenewalRecord = {
      id: `ren-${Date.now()}`,
      serverId: isLoggingRenewal.id,
      date: new Date().toISOString(),
      cost: Number(renewalAmount),
      currency: renewalCurrency,
      daysAdded: Number(renewalAddedDays),
      note: renewalJournalText
    };

    setRenewals((prev) => [...prev, record]);

    // Push server startDate forward. Adding renewal duration onto original target date
    const origBase = new Date(isLoggingRenewal.startDate);
    const updatedBase = new Date(origBase.getTime() + renewalAddedDays * 24 * 60 * 60 * 1000);

    setServers((prev) =>
      prev.map((s) => (s.id === isLoggingRenewal.id ? { 
        ...s, 
        startDate: updatedBase.toISOString(),
        cycleDays: s.billingType === 'hourly' ? s.cycleDays : Number(renewalAddedDays)
      } : s))
    );

    // If active hourly or connected provider balance, deduct renewal fee!
    // Hourly machines deduct continuous, but cycles might pay outright and deduct provider panel
    if (isLoggingRenewal.providerId) {
      setProviders((prev) =>
        prev.map((p) => (p.id === isLoggingRenewal.providerId ? { 
          ...p, 
          // Deduct from balance
          balance: Math.max(0, p.balance - Number(renewalAmount)) 
        } : p))
      );
    }

    setStats((prev) => ({
      ...prev,
      totalRenewalsLogged: prev.totalRenewalsLogged + 1,
    }));

    // Trigger quest
    handleClaimQuest('quest-renew');
    awardXP(25);

    setIsLoggingRenewal(null);
    setSelectedServer(null); // refresh selection
    setRenewalAmount(10);
    setRenewalJournalText('');
  };

  // Backup file export / import utilities
  const handleTriggerExport = () => {
    const payload: AppBackup = {
      servers,
      providers,
      tags,
      categories,
      renewals,
      stats,
      settings,
      version: '1.4.0',
      exportedAt: new Date().toISOString(),
    };

    const strFile = JSON.stringify(payload, null, 2);
    // Create direct local file download anchor
    const blob = new Blob([strFile], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jeynodepad-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // claim quest
    handleClaimQuest('quest-backup');
    awardXP(15);
  };

  const handleTriggerImport = () => {
    if (!backupText) return;
    try {
      const parsed = JSON.parse(backupText);
      if (validateBackup(parsed)) {
        setServers(parsed.servers);
        setProviders(parsed.providers);
        if (parsed.tags.length > 0) setTags(parsed.tags);
        if (parsed.categories.length > 0) setCategories(parsed.categories);
        setRenewals(parsed.renewals || []);
        setStats(parsed.stats || INITIAL_STATS);
        setSettings(parsed.settings || INITIAL_SETTINGS);
        alert(t.importSuccess);
        setBackupText('');
        setBackupErrorMsg('');
        setActiveTab('nodes');
      } else {
        setBackupErrorMsg(t.loadFailure);
      }
    } catch (e) {
      setBackupErrorMsg(t.loadFailure);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setBackupText(text);
        try {
          const parsed = JSON.parse(text);
          if (validateBackup(parsed)) {
            setBackupErrorMsg(
              lang === 'fa'
                ? `✓ فایل "${file.name}" با موفقیت خوانده شد (${parsed.servers?.length || 0} سرور یافت شد). جهت اعمال تغییرات دکمه بازیابی پشتیبان را بزنید.`
                : `✓ Backup file "${file.name}" loaded successfully (${parsed.servers?.length || 0} servers found). Click Import below to apply.`
            );
          } else {
            setBackupErrorMsg(lang === 'fa' ? 'فرمت فایل پشتیبان معتبر نیست!' : 'Invalid backup file structure!');
          }
        } catch (err) {
          setBackupErrorMsg(lang === 'fa' ? 'خطا در بارگذاری یا پردازش فایل بکاپ!' : 'Error loading or parsing the JSON backup file!');
        }
      }
    };
    reader.readAsText(file);
  };

  // Configuration Locker Settings
  const handleTogglePINSetup = () => {
    setPinSetupMode(!pinSetupMode);
    setNewPINCode('');
    setPinSetupError('');
  };

  const handleApplyLock = () => {
    if (newPINCode.length !== 4 || !/^\d+$/.test(newPINCode)) {
      setPinSetupError(lang === 'fa' ? 'رمز ورود باید دقیقاً ۴ رقم ریاضی باشد' : 'PIN must be exactly 4 numeric characters');
      return;
    }

    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        lockMethod: 'pin',
        pinCode: newPINCode,
      }
    }));
    setNewPINCode('');
    setPinSetupMode(false);
    alert(lang === 'fa' ? 'سپر رمز عبور عددی با موفقیت فعال گردید!' : 'PIN cryptographic lock added to database!');
  };

  const handleDisableLock = () => {
    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        lockMethod: 'none',
        pinCode: undefined,
      }
    }));
    setIsSecureLocked(false);
    alert(lang === 'fa' ? 'رمز عبور با موفقیت از سیستم برداشته شد.' : 'Locker lock stripped successfully!');
  };  const [resetModalError, setResetModalError] = useState<string>('');

  const handleFullAppReset = () => {
    setResetConfirmInput('');
    setResetModalError('');
    setShowResetConfirmModal(true);
  };

  const handleExecuteFullAppReset = () => {
    if (resetConfirmInput !== 'RESET') {
      setResetModalError(lang === 'fa' ? 'عبارت تایید اشتباه است. لفا با حروف بزرگ واژه RESET را بنویسید.' : 'Confirmation code mismatch. Please type RESET in all caps.');
      return;
    }
    
    // Clear local storage and state
    localStorage.clear();
    setServers([]);
    setProviders([
      { id: 'prov-lightnode', name: 'LightNode', balance: 15.0, currency: 'USD' },
      { id: 'prov-hetzner', name: 'Hetzner Cloud', balance: 0.0, currency: 'EUR' },
      { id: 'prov-hostvds', name: 'HostVDS', balance: 8.50, currency: 'USD' },
    ]);
    setTags(DEFAULT_TAGS);
    setCategories(DEFAULT_CATEGORIES);
    setRenewals([]);
    setStats(INITIAL_STATS);
    setSettings({
      theme: 'frosted-glass',
      lang: 'fa',
      visibleFields: {
        credentials: true,
        tags: true,
      },
      security: {
        lockMethod: 'none',
      }
    });
    setIsOnboarded(false);
    setIsSecureLocked(false);
    setShowResetConfirmModal(false);
    
    // Smooth reload instead of raw alert
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // List search & cluster categorizing filters logic
  const filteredServers = servers.filter((s) => {
    // Check soft delete state
    if (s.deleted) return false;

    // Category filter
    if (filterCategory !== 'all' && s.categoryId !== filterCategory) return false;

    // Tag filter
    if (filterTag !== 'all' && !s.tags.includes(filterTag)) return false;

    // Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const ipMatch = s.ip.toLowerCase().includes(q);
      const nameMatch = s.name.toLowerCase().includes(q);
      const userMatch = s.username.toLowerCase().includes(q);
      const provMatch = providers.find(p => p.id === s.providerId)?.name.toLowerCase().includes(q) || false;
      return ipMatch || nameMatch || userMatch || provMatch;
    }

    return true;
  });

  // Check if any server is expired to show urgent warning indicators
  const expiredCount = servers.filter(
    s => !s.deleted && s.billingType === 'cycle' && calculateDaysRemaining(s.startDate, s.cycleDays) <= 0
  ).length;

  if (!isOnboarded) {
    return (
      <div className="fixed inset-0 z-50 text-brand-text transition-colors duration-300 flex flex-col" style={{ direction: lang === 'fa' ? 'rtl' : 'ltr' }}>
        <TauriTitleBar lang={lang} />
        <Onboarding onComplete={handleOnboardComplete} />
      </div>
    );
  }

  if (isSecureLocked && settings.security.pinCode) {
    return (
      <div className={`fixed inset-0 z-50 bg-brand-bg text-brand-text transition-colors duration-300 theme-${settings.theme} flex flex-col`} style={{ direction: lang === 'fa' ? 'rtl' : 'ltr' }}>
        <TauriTitleBar lang={lang} />
        <LockScreen 
          correctPin={settings.security.pinCode} 
          lang={lang} 
          onUnlock={handleUnlock} 
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-brand-bg text-brand-text transition-colors duration-300 theme-${settings.theme} flex flex-col`} style={{ direction: lang === 'fa' ? 'rtl' : 'ltr' }}>
      <TauriTitleBar lang={lang} />
      
      {/* Main JeyNode Application Dashboard */}
      <div className={`flex flex-col md:flex-row flex-1 ${activeAppTabId === 'jeynode' ? '' : 'hidden'}`}>
        
        {/* SIDEBAR NAVIGATION - Collapsible & Premium */}
        <aside className={`bg-brand-card/95 border-brand-border/40 backdrop-blur-md transition-all duration-300 flex-shrink-0 flex flex-col justify-between z-30 md:sticky overflow-y-auto
          ${isTauri ? 'md:top-10 md:h-[calc(100vh-2.5rem)]' : 'md:top-0 md:h-screen'}
          ${isSidebarCollapsed ? 'w-20' : 'w-64'} 
          ${lang === 'fa' ? 'border-l border-brand-border/30 md:border-l' : 'border-r border-brand-border/30 md:border-r'}
          hidden md:flex`}
        >
          {/* Top Info Banner */}
          <div className="p-4 border-b border-brand-border/30 bg-black/10">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-brand-accent to-brand-accent-secondary p-[1.5px] shadow-lg shadow-brand-accent/25">
                 <div className="w-full h-full bg-brand-bg rounded-xl flex items-center justify-center overflow-hidden">
                   <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                 </div>
               </div>
               {!isSidebarCollapsed && (
                 <div className="animate-fade-in text-brand-text">
                   <div className="flex items-center gap-1.5">
                     <span className="text-sm font-black tracking-tight text-brand-text font-mono">JeyNode</span>
                     <span className="text-[8px] bg-brand-accent/25 text-brand-accent-secondary px-1.5 py-0.5 rounded-full font-bold uppercase font-mono">v1.4</span>
                   </div>
                   <span className="text-[9px] text-brand-text-muted font-sans font-medium block leading-tight">
                     {t.appSubtitle}
                   </span>
                 </div>
               )}
            </div>
          </div>

          {/* Central Navigation Buttons */}
          <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
            {!isSidebarCollapsed && (
              <div className="px-3 mb-2 text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">
                {lang === 'fa' ? 'منو اصلی مدیریت' : 'Main Management'}
              </div>
            )}

            {/* 1. Servers Tab */}
            <button
              onClick={() => { setActiveTab('nodes'); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-mono font-semibold text-xs cursor-pointer relative group ${
                activeTab === 'nodes'
                  ? 'bg-gradient-to-r from-brand-accent/20 to-brand-accent/10 border border-brand-accent/30 text-white shadow-md'
                  : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-accent/10 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <ServerIcon className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'nodes' ? 'text-brand-accent' : ''}`} />
                {!isSidebarCollapsed && <span className="truncate">{t.dashboard}</span>}
                {!isSidebarCollapsed && (
                  <span className={`ml-auto shrink-0 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    activeTab === 'nodes' ? 'bg-brand-accent/30 text-white' : 'bg-brand-bg/60 text-brand-text-muted border border-brand-border/30'
                  }`}>
                    {servers.filter(s => !s.deleted).length}
                  </span>
                )}
              </div>
              
              {/* Vertical side active indicator bar */}
              {activeTab === 'nodes' && (
                <div className={`absolute top-2 bottom-2 w-1 rounded-full bg-brand-accent ${lang === 'fa' ? 'left-1' : 'right-1'}`} />
              )}
            </button>

            {/* 2. Wallets / Accounting Tab */}
            {settings.enableFinance && (
              <button
                 onClick={() => { setActiveTab('accounting'); }}
                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-mono font-semibold text-xs cursor-pointer relative group ${
                   activeTab === 'accounting'
                     ? 'bg-gradient-to-r from-brand-accent/20 to-brand-accent/10 border border-brand-accent/30 text-white shadow-md'
                     : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-accent/10 border border-transparent'
                 }`}
              >
                 <div className="flex items-center gap-3 w-full font-mono">
                   <Coins className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'accounting' ? 'text-brand-accent' : ''}`} />
                   {!isSidebarCollapsed && <span className="truncate">{t.providers}</span>}
                   {!isSidebarCollapsed && (
                     <span className={`ml-auto shrink-0 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                       activeTab === 'accounting' ? 'bg-brand-accent/30 text-white' : 'bg-brand-bg/60 text-brand-text-muted border border-brand-border/30'
                     }`}>
                       {providers.length}
                     </span>
                   )}
                 </div>
 
                 {/* Vertical side active indicator bar */}
                 {activeTab === 'accounting' && (
                   <div className={`absolute top-2 bottom-2 w-1 rounded-full bg-brand-accent ${lang === 'fa' ? 'left-1' : 'right-1'}`} />
                 )}
              </button>
            )}

            {/* 4. Linux Commands Link */}
            <a
              href="https://jeybox.ir/linux/" onClick={(e) => { e.preventDefault(); openExternalUrl('https://jeybox.ir/linux/'); }}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-mono font-semibold text-xs cursor-pointer text-brand-text-muted hover:text-white hover:bg-brand-accent/15 border border-transparent group"
            >
              <div className="flex items-center gap-3 w-full font-mono">
                <Terminal className="w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110 text-brand-accent-secondary" />
                {!isSidebarCollapsed && <span className="truncate">{lang === 'fa' ? 'دستورات لینوکس' : 'Linux Commands'}</span>}
                {!isSidebarCollapsed && (
                  <ExternalLink className="w-3 h-3 ml-auto text-brand-text-muted opacity-50 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </a>

            {/* 3. Settings Tab */}
            <button
               onClick={() => { setActiveTab('settings'); }}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-mono font-semibold text-xs cursor-pointer relative group ${
                 activeTab === 'settings'
                   ? 'bg-gradient-to-r from-brand-accent/20 to-brand-accent/10 border border-brand-accent/30 text-white shadow-md'
                   : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-accent/10 border border-transparent'
               }`}
            >
               <div className="flex items-center gap-3 w-full font-mono">
                 <SettingsIcon className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'settings' ? 'text-brand-accent' : ''}`} />
                 {!isSidebarCollapsed && <span className="truncate">{t.settings}</span>}
               </div>

               {/* Vertical side active indicator bar */}
               {activeTab === 'settings' && (
                 <div className={`absolute top-2 bottom-2 w-1 rounded-full bg-brand-accent ${lang === 'fa' ? 'left-1' : 'right-1'}`} />
               )}
            </button>
          </div>

          {/* Bottom Actions inside sidebar */}
          <div className="p-3 border-t border-brand-border/30 space-y-2">
            
            {expiredCount > 0 && !isSidebarCollapsed && (
              <div className="flex items-center gap-1.5 p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-[10px] animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="font-bold">{expiredCount} {lang === 'fa' ? 'گره منقضی شده!' : 'Nodes Expired!'}</span>
              </div>
            )}

            {/* Lock toggle button */}
            {settings.security.pinCode && (
              <button
                onClick={handleTriggerLock}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-brand-text-muted hover:text-brand-text hover:bg-brand-accent/10 transition-all text-xs cursor-pointer"
              >
                <Lock className="w-4 h-4 text-brand-accent shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{lang === 'fa' ? 'قفل سریع برنامه' : 'Lock Application'}</span>}
              </button>
            )}

            {/* Language manual toggle */}
            <button
              onClick={() => {
                setSettings(prev => ({ ...prev, lang: prev.lang === 'fa' ? 'en' : 'fa' }));
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-brand-text-muted hover:text-brand-text hover:bg-brand-accent/10 transition-all font-sans text-xs cursor-pointer"
            >
              <span className="text-base shrink-0 select-none">🌐</span>
              {!isSidebarCollapsed && <span className="truncate">{lang === 'fa' ? 'English (UK/US)' : 'زبان فارسی (RTL)'}</span>}
            </button>

            {/* Collapse toggle button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-brand-text-muted hover:text-brand-text hover:bg-brand-accent/15 transition-all text-xs cursor-pointer"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 shrink-0 ${isSidebarCollapsed ? (lang === 'fa' ? '' : 'rotate-180') : (lang === 'fa' ? 'rotate-180' : '')}`} />
              {!isSidebarCollapsed && <span className="truncate">{lang === 'fa' ? 'جمع کردن منو' : 'Collapse Sidebar'}</span>}
            </button>
          </div>
        </aside>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="md:hidden fixed bottom-2 left-2 right-2 bg-brand-card/95 backdrop-blur-md border border-brand-border/60 p-2 rounded-2xl flex items-center justify-around z-40 shadow-xl">
          <button
            onClick={() => setActiveTab('nodes')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors cursor-pointer ${activeTab === 'nodes' ? 'text-brand-accent' : 'text-brand-text-muted'}`}
          >
            <ServerIcon className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-sans font-bold">{t.dashboard}</span>
          </button>

          <button
            onClick={() => setActiveTab('accounting')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors cursor-pointer ${activeTab === 'accounting' ? 'text-brand-accent' : 'text-brand-text-muted'}`}
          >
            <Coins className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-sans font-bold">{t.providers}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors cursor-pointer ${activeTab === 'settings' ? 'text-brand-accent' : 'text-brand-text-muted'}`}
          >
            <SettingsIcon className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-sans font-bold">{t.settings}</span>
          </button>
        </div>

        {/* WORKSPACE CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Minimal top header on mobile screens */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-brand-card/30 border-b border-brand-border/20 shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              <img src={appLogo} alt="Logo" className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" />
              <span className="text-sm font-black tracking-tight text-brand-text font-mono">JeyNodePad</span>
            </div>
            <div className="flex items-center gap-2">
              {expiredCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[9px] animate-pulse font-bold">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span>{expiredCount}</span>
                </div>
              )}
              {settings.security.pinCode && (
                <button onClick={handleTriggerLock} className="p-1 rounded bg-brand-card/60 text-brand-accent">
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 relative">
        
        {/* TAB 1: SERVER NODES COMMAND DECK */}
        {activeTab === 'nodes' && (
          <div className="space-y-6">
            
            {/* Controls Bar & Floating Actions */}
            {!isDeployingNew && !isEditingServer && (
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                
                <div className="flex flex-row gap-2 w-full md:w-auto shrink-0 justify-between sm:justify-start">
                  {/* Deployment Button */}
                  <button
                    onClick={() => setIsDeployingNew(true)}
                    className="px-3 sm:px-5 py-2.5 bg-brand-accent text-white hover:bg-brand-accent/90 font-bold font-mono text-xs rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
                    title={t.addServer}
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                  </button>

                  {/* Trash Button */}
                  <button
                    onClick={() => setIsTrashOpen(true)}
                    className="px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold font-mono text-xs rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
                    title={lang === 'fa' ? 'سرورهای حذف شده (سطل زباله)' : 'View deleted servers (Trash)'}
                  >
                    <History className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-[10px]">({servers.filter(s => s.deleted).length})</span>
                  </button>

                  {/* Ping All Servers Button */}
                  <button
                    onClick={handlePingAllServers}
                    className="px-3 sm:px-4 py-2.5 bg-brand-accent-secondary/10 hover:bg-brand-accent-secondary/20 border border-brand-accent-secondary/30 text-brand-accent-secondary font-bold font-mono text-xs rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
                    title={lang === 'fa' ? 'محاسبه پینگ همزمان تمامی سرورها' : 'Ping all servers simultaneously'}
                  >
                    <Wifi className="w-4 h-4 text-brand-accent-secondary shrink-0" />
                    <span className="text-[10px] sm:inline">{lang === 'fa' ? 'پینگ همه' : 'Ping All'}</span>
                  </button>
                </div>

                {/* Filters inputs */}
                <div className="w-full flex-1 md:max-w-2xl flex flex-col sm:flex-row items-center gap-2">
                  
                  {/* Searchbox Input */}
                  <div className="relative w-full">
                    <Search className={`absolute top-3 w-4 h-4 text-brand-text-muted ${lang === 'fa' ? 'right-3' : 'left-3'}`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className={`w-full bg-brand-card/70 border border-brand-border/50 text-xs px-10 py-2.5 rounded-xl text-white placeholder-brand-text-muted focus:outline-none focus:border-brand-accent font-serif`}
                    />
                  </div>

                  {/* Category Filtering Dropdown */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full sm:w-44 bg-brand-card border border-brand-border rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent cursor-pointer"
                  >
                    <option value="all">{lang === 'fa' ? 'همه کلاسترها' : 'All Clusters'}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {lang === 'fa' ? cat.nameFa : cat.nameEn}
                      </option>
                    ))}
                  </select>

                  {/* Tag Filtering Dropdown */}
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="w-full sm:w-44 bg-brand-card border border-brand-border rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent cursor-pointer"
                  >
                    <option value="all">{lang === 'fa' ? 'همه تگ‌ها' : 'All Tags'}</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {lang === 'fa' ? tag.nameFa : tag.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ServerForm Overlay representing Deploy/Edit mode */}
            {isDeployingNew && (
              <ServerForm 
                providers={providers}
                tags={tags}
                categories={categories}
                lang={lang}
                onSave={handleCreateServer}
                onCancel={() => setIsDeployingNew(false)}
              />
            )}

            {isEditingServer && (
              <ServerForm 
                initialServer={isEditingServer}
                providers={providers}
                tags={tags}
                categories={categories}
                lang={lang}
                onSave={handleEditServer}
                onCancel={() => setIsEditingServer(null)}
              />
            )}

            {!isDeployingNew && !isEditingServer && (
              <div className="space-y-4 animate-fade-in">
                
                {filteredServers.length === 0 ? (
                  <div className="text-center py-12 px-6 bg-brand-card/45 border border-brand-border/40 rounded-2xl relative overflow-hidden">
                    <Compass className="w-12 h-12 text-brand-text-muted mx-auto mb-4 animate-spin" style={{ animationDuration: '15s' }} />
                    <p className="text-sm text-brand-text-muted max-w-sm mx-auto">
                      {showTrash ? t.noTrash : t.noServers}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredServers.map((server) => {
                      const daysLeft = calculateDaysRemaining(server.startDate, server.cycleDays);
                      let isExpired = daysLeft <= 0;
                      let billingMode = server.billingType;
                      
                      // Associated provider credit
                      const sProvider = providers.find((p) => p.id === server.providerId);
                      
                      // Styling indicators
                      let timelineBadgeClass = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
                      if (billingMode === 'cycle') {
                        if (daysLeft <= 0) {
                          timelineBadgeClass = 'text-rose-400 border-rose-500/20 bg-rose-500/5 animate-pulse';
                        } else if (daysLeft <= 7) {
                          timelineBadgeClass = 'text-amber-400 border-amber-500/20 bg-amber-500/5';
                        }
                      }

                      return (
                        <div
                          key={server.id}
                          onClick={() => setSelectedServer(server)}
                          className={`p-4 bg-brand-card/75 border rounded-xl hover:border-brand-accent transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden select-none ${
                            selectedServer?.id === server.id 
                              ? 'border-brand-accent bg-brand-accent/5 glow-card' 
                              : 'border-brand-border/50 hover:bg-brand-card'
                          }`}
                        >
                          {/* Decorative color band on Left of active node */}
                          <div className="absolute top-0 bottom-0 left-0 w-1 bg-brand-accent/40"></div>

                          {/* Host details */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {/* OS Logo Icon Bubble */}
                              <div className="w-6 h-6 rounded-lg bg-black/45 border border-brand-border/30 flex items-center justify-center p-1 shadow-inner shrink-0" title={`${server.osType || 'linux'} ${server.osVersion || ''}`}>
                                {renderOSLogo(server.osType, "w-4 h-4 object-contain")}
                              </div>

                              <span className="font-bold text-white text-md font-mono">{server.name}</span>
                              
                              {/* Server Cluster icon marker */}
                              <span className="text-[9px] bg-brand-bg/50 px-1.5 py-0.5 rounded text-brand-text-muted border border-brand-border/30 font-sans uppercase">
                                {lang === 'fa' 
                                  ? categories.find(c => c.id === server.categoryId)?.nameFa || t.unassigned
                                  : categories.find(c => c.id === server.categoryId)?.nameEn || t.unassigned
                                }
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-brand-text-muted">
                              <span>{server.ip}</span>
                              <span className="opacity-40">•</span>
                              <span>Port {server.sshPort}</span>
                              <span className="opacity-40">•</span>
                              <span className="text-[10px] bg-brand-accent/15 text-brand-accent-secondary border border-brand-accent-secondary/20 px-1.5 py-0.2 rounded font-mono capitalize">
                                {server.osType === 'centos' ? 'Rocky/Cent' : (server.osType || 'linux')} {(server.osVersion || '')}
                              </span>
                              {serverPings[server.id] && (
                                <>
                                  <span className="opacity-40">•</span>
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                    serverPings[server.id].status === 'loading' ? 'animate-pulse text-brand-accent bg-brand-accent/10 border border-brand-accent/20' :
                                    serverPings[server.id].status === 'error' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' :
                                    (serverPings[server.id].ms || 999) < 100 ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                                    (serverPings[server.id].ms || 999) < 250 ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                                    'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                                  }`}>
                                    <Activity className={`w-3 h-3 ${serverPings[server.id].status === 'loading' ? 'animate-spin' : ''}`} />
                                    {serverPings[server.id].status === 'loading' ? (lang === 'fa' ? 'درحال محاسبه...' : 'Pinging...') : 
                                     serverPings[server.id].status === 'error' ? (lang === 'fa' ? 'خطا' : 'Error') : 
                                     `${serverPings[server.id].ms} ms`}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Multi-tags display */}
                            {settings.visibleFields.tags && server.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {server.tags.map((tagId) => {
                                  const rawTag = tags.find((tg) => tg.id === tagId);
                                  if (!rawTag) return null;
                                  return (
                                    <span
                                      key={tagId}
                                      className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold text-white shadow-sm"
                                      style={{ backgroundColor: rawTag.color, color: rawTag.textColor }}
                                    >
                                      {lang === 'fa' ? rawTag.nameFa : rawTag.nameEn}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Time-fuel meter tracking info */}
                          <div className="flex items-center gap-3 sm:text-right" style={{ direction: 'ltr' }}>
                            <div className="font-mono text-xs">
                              
                              {billingMode === 'hourly' ? (
                                <div className="flex flex-col">
                                  <span className="text-brand-accent-secondary font-bold text-[10px] flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {t.hourly}
                                  </span>
                                  <span className="text-[10px] text-brand-text-muted mt-0.5">
                                    {sProvider ? `${sProvider.name}: ${sProvider.balance}$` : 'N/A'}
                                  </span>
                                </div>
                              ) : (
                                <div className={`px-2 py-1 rounded border text-[10px] font-bold ${timelineBadgeClass}`}>
                                  {isExpired ? (
                                    <span>⚠ {t.expiredText.replace('{days}', Math.abs(daysLeft).toString())}</span>
                                  ) : daysLeft === 0 ? (
                                    <span>{t.todayRenew}</span>
                                  ) : (
                                    <span>{t.daysLeftText.replace('{days}', daysLeft.toString())}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick copy buttons direct on list item */}
                          <div className="flex gap-1.5 sm:border-l sm:border-brand-border/30 sm:pl-3" onClick={(e) => e.stopPropagation()}>
                            {/* Ping Server Button */}
                            <button
                              onClick={() => calculatePing(server.id, server.ip)}
                              disabled={serverPings[server.id]?.status === 'loading'}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                serverPings[server.id]?.status === 'loading'
                                  ? 'bg-brand-accent/25 text-brand-accent animate-pulse'
                                  : 'bg-black/25 text-brand-text-muted hover:text-white hover:bg-brand-accent-secondary/20'
                              }`}
                              title={lang === 'fa' ? 'محاسبه پینگ سرور' : 'Calculate latency (Ping)'}
                            >
                              <Wifi className={`w-3.5 h-3.5 ${serverPings[server.id]?.status === 'loading' ? 'animate-bounce' : ''}`} />
                            </button>

                            {/* Connect Windows SSH in CMD Button */}
                            <button
                              onClick={() => handleLaunchSSH(server)}
                              className="p-1.5 rounded-lg bg-black/25 text-brand-accent-secondary hover:text-white hover:bg-brand-accent/20 transition-all cursor-pointer"
                              title={lang === 'fa' ? 'مدیریت و اتصال مستقیم SSH سرور' : 'SSH Connection Console & Actions'}
                            >
                              <Terminal className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Copy IP */}
                            <button
                              onClick={() => handleCopyCredentials(server.ip, 'IP')}
                              className="p-1.5 rounded-lg bg-black/25 text-brand-text-muted hover:text-white hover:bg-brand-accent/20 transition-all cursor-pointer"
                              title={lang === 'fa' ? 'کپی آی‌پی' : 'Copy IP address'}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle trash eject / delete / restore */}
                            {showTrash ? (
                              <>
                                <button
                                  onClick={() => handleRestoreServer(server.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:text-white hover:bg-emerald-500 transition-all cursor-pointer"
                                  title={t.restore}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handlePermanentDelete(server.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:text-white hover:bg-rose-500 transition-all cursor-pointer"
                                  title={t.permanentDelete}
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setIsEditingServer(server)}
                                  className="p-1.5 rounded-lg bg-brand-accent/14 text-brand-accent hover:text-white hover:bg-brand-accent transition-all cursor-pointer"
                                  title={t.edit}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleSoftDelete(server.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:text-white hover:bg-rose-500 transition-all cursor-pointer"
                                  title={t.delete}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACCOUNTING PROVIDERS CREDITS */}
        {activeTab === 'accounting' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Bar with Title and Add Provider Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-brand-border/30 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-brand-accent" />
                  <span>{lang === 'fa' ? 'ارائه‌دهندگان سرویس و کیف پول‌ها' : 'Service Providers & Balances'}</span>
                </h2>
                <p className="text-[11px] text-brand-text-muted mt-0.5">
                  {lang === 'fa' ? 'کنترل موجودی حساب‌ها، شارژ و تعقیب محاسبات مالی زمان باقی‌مانده تمدید' : 'Monitor provider cash reserves, log top-ups, and track renewal audits.'}
                </p>
              </div>
              <button
                onClick={() => setIsAddProviderOpen(true)}
                className="px-4 py-2.5 bg-brand-accent text-brand-bg font-bold rounded-xl hover:bg-brand-accent/90 transition-all text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/10 whitespace-nowrap align-middle"
              >
                <FolderPlus className="w-4 h-4" />
                <span>{lang === 'fa' ? 'ثبت ارائه‌دهنده جدید' : 'Register Provider'}</span>
              </button>
            </div>

            {/* Providers and Logs Main layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Providers Viewport lists */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {providers.map((p) => (
                    <ProviderCard 
                      key={p.id}
                      provider={p}
                      servers={servers}
                      lang={lang}
                      onTopUp={handleTopUpBalance}
                    />
                  ))}
                </div>
              </div>

              {/* Renewal historical logs ledger */}
              <div className="bg-brand-card/60 border border-brand-border/40 rounded-2xl p-5 h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-brand-accent" />
                  <h3 className="text-sm font-bold text-white font-mono">{t.renewalLogs}</h3>
                </div>

                {renewals.length === 0 ? (
                  <div className="text-center py-6 text-brand-text-muted font-mono text-xs">
                    {t.noRenewals}
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-xs max-h-[500px] overflow-y-auto">
                    {renewals.slice().reverse().map((r) => {
                      const sName = servers.find((s) => s.id === r.serverId)?.name || 'Removed Node';
                      return (
                        <div key={r.id} className="p-2 bg-black/20 border border-brand-border/30 rounded flex items-center justify-between gap-4 text-left" dir="ltr">
                          <div>
                            <span className="text-brand-accent font-bold block sm:inline">{sName}</span>
                            <span className="text-brand-text-muted sm:ml-2 text-[10px]">({r.daysAdded}d extended)</span>
                            {r.note && <span className="block text-[10px] text-brand-text-muted italic mt-0.5">// {r.note}</span>}
                          </div>
                          <span className="text-emerald-400 font-bold shrink-0">
                            -{r.cost} {r.currency === 'TOMAN' ? 'TOMAN' : r.currency}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM CONFIGS SETTINGS OFFICE */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12 text-xs text-brand-text-muted" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            
            {/* Elegant Header section */}
            <div className="flex items-center gap-4 border-b border-brand-border/30 pb-4">
              <div className="p-3 rounded-2xl bg-brand-accent/15 border border-brand-accent/30 text-brand-accent">
                <SettingsIcon className="w-6 h-6 animate-spin-slow" />
              </div>
              <div className="flex-1 ltr:text-left rtl:text-right">
                <h2 className="text-base font-black text-white leading-tight font-mono">
                  {lang === 'fa' ? 'مکانیزم پایگاه تنظیمات سیستم' : 'Console System Configurations'}
                </h2>
                <p className="text-[11px] text-brand-text-muted mt-1">
                  {lang === 'fa' ? 'پوسته‌ها، نگهداری رمز، برچسب‌ها، فیلترهای اصلی و پشتیبان‌گیری مانیتور گره‌ها' : 'Frosted skins, vault protection key, system tags, visible column toggles, and database storage archives'}
                </p>
              </div>
            </div>

            {/* SECTIONS LIST - ALL STACKED VERTICALLY IN ONE COLUMN */}

            {/* Section 1: Themes and Language */}
            <section className="bg-brand-card/75 border border-brand-border/40 hover:border-brand-border/80 transition-colors rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border/20 pb-3.5 ltr:text-left rtl:text-right">
                <span className="text-xl text-brand-accent">🎨</span>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {lang === 'fa' ? 'شخصی‌سازی ظاهر و زبان سیستم' : 'Visual Identity & System Language'}
                  </h3>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">
                    {lang === 'fa' ? 'زبان مانیتور و پوسته شیشه‌ای کهکشانی دلخواه خود را تعیین کنید' : 'Pick the display language and graphical theme option below'}
                  </p>
                </div>
              </div>

              {/* Skin presets */}
              <div className="space-y-3">
                <label className="block text-[11px] text-brand-text font-bold ltr:text-left rtl:text-right">
                  {lang === 'fa' ? 'پوسته و تم گرافیکی فعال:' : 'Active Graphical UI Skin:'}
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3  overflow-y-auto p-2 border border-brand-border/10 rounded-xl bg-black/15">
                  {[
                    { id: 'frosted-glass', nameEn: 'Ultra Glass 🌌', nameFa: 'شیشه کهکشانی', bgGrad: 'from-slate-950 via-indigo-950 to-indigo-900', borderC: 'border-indigo-400/50' },
                    { id: 'frosted-emerald', nameEn: 'Emerald Glass 🌿', nameFa: 'شیشه اِمرالد', bgGrad: 'from-slate-950 via-emerald-950 to-emerald-900', borderC: 'border-emerald-500/50' },
                    { id: 'frosted-amethyst', nameEn: 'Amethyst Glass 🔮', nameFa: 'شیشه بنفش رویال', bgGrad: 'from-slate-950 via-purple-950 to-purple-900', borderC: 'border-purple-400/50' },
                    { id: 'frosted-sunset', nameEn: 'Sunset Glass 🌅', nameFa: 'شیشه شفق پاییز', bgGrad: 'from-slate-950 via-orange-950 to-red-950', borderC: 'border-orange-500/50' },
                    { id: 'frosted-ocean', nameEn: 'Ocean Glass 🌊', nameFa: 'شیشه سافایر', bgGrad: 'from-slate-950 via-blue-950 to-sky-950', borderC: 'border-sky-400/50' },
                    { id: 'frosted-cyberpunk', nameEn: 'Neon Glass ⚡', nameFa: 'شیشه سایبرپانک', bgGrad: 'from-slate-950 via-fuchsia-950 to-pink-950', borderC: 'border-pink-500/50' },
                    { id: 'sweet-pink', nameEn: 'Sweet Rose 🎀', nameFa: 'شیشه صورتی', bgGrad: 'from-slate-950 via-rose-950 to-purple-950', borderC: 'border-rose-400/50' },
                    { id: 'nordic-cold', nameEn: 'Nordic Silver ❄️', nameFa: 'شیشه یخ قطبی', bgGrad: 'from-slate-950 via-slate-900 to-slate-800', borderC: 'border-slate-300/50' },
                    { id: 'soft-orange', nameEn: 'Paper Orange 📄', nameFa: 'نارنجی کاغذی', bgGrad: 'from-white to-orange-50', borderC: 'border-orange-400' },
                    { id: 'neon-dark', nameEn: 'Laser Violet 👾', nameFa: 'بنفش الکترونیکی', bgGrad: 'from-[#070913] to-[#0f1325]', borderC: 'border-indigo-500' },
                    { id: 'cyberpunk', nameEn: 'Classic Cyber ☣️', nameFa: 'سایبرپانک کلاسیک', bgGrad: 'from-[#0d0714] to-[#180924]', borderC: 'border-yellow-500' },
                    { id: 'emerald-gate', nameEn: 'Emerald Gate 🔐', nameFa: 'زمرد سبز کلاسیک', bgGrad: 'from-[#050d0b] to-[#0c1a16]', borderC: 'border-emerald-500' },
                    { id: 'sunset-pulse', nameEn: 'Volcanic Glow 🌋', nameFa: 'سولار کلاسیک', bgGrad: 'from-[#120909] to-[#1f1111]', borderC: 'border-orange-600' },
                    { id: 'royal-classic', nameEn: 'Crown Museum 👑', nameFa: 'کلاسیک سلطنتی', bgGrad: 'from-[#070b12] to-[#0d1527]', borderC: 'border-amber-600' },
                  ].map((themeOpt) => {
                    const isActive = settings.theme === themeOpt.id;
                    return (
                      <button
                        key={themeOpt.id}
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, theme: themeOpt.id as any }))}
                        className={`group relative overflow-hidden p-2.5 rounded-xl border text-left transition-all duration-300 transform active:scale-95 cursor-pointer flex flex-col justify-between h-20 ${
                          isActive 
                            ? 'border-brand-accent bg-brand-accent/15 shadow-lg ring-1 ring-brand-accent' 
                            : 'border-brand-border/40 bg-brand-card/50 hover:border-brand-accent/55 hover:bg-brand-accent/5'
                        }`}
                      >
                        <div className={`absolute top-0 right-0 w-12 h-12 rounded-bl-full bg-gradient-to-br ${themeOpt.bgGrad} opacity-35 transition-transform duration-300 group-hover:scale-110 pointer-events-none`} />
                        
                        <div className="flex items-center justify-between w-full relative z-10">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${themeOpt.bgGrad} border ${themeOpt.borderC} shadow-sm shrink-0`} />
                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                          )}
                        </div>
                        
                        <div className="mt-2 relative z-10 w-full text-right ltr:text-left">
                          <div className="text-[10px] font-bold text-white font-mono leading-tight truncate">
                            {lang === 'fa' ? themeOpt.nameFa : themeOpt.nameEn}
                          </div>
                          <div className="text-[8px] text-brand-text-muted leading-none font-mono mt-0.5 truncate uppercase">
                            {themeOpt.id}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language toggler */}
              <div className="space-y-3 pt-5 border-t border-brand-border/20">
                <label className="block text-[11px] text-brand-text font-bold ltr:text-left rtl:text-right">
                  {lang === 'fa' ? 'انتخاب زبان فعال مانیتور:' : 'Active System Language:'}
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, lang: 'fa' }))}
                    className={`relative flex items-center gap-3 p-4 rounded-xl border text-right transition-all duration-300 transform active:scale-95 cursor-pointer ${
                      settings.lang === 'fa'
                        ? 'border-brand-accent bg-brand-accent/10 shadow-md ring-1 ring-brand-accent'
                        : 'border-brand-border/40 bg-brand-card/40 hover:border-brand-accent/50 hover:bg-brand-accent/5'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/20 text-md shrink-0 border border-brand-border/20 shadow-inner">
                      🇮🇷
                    </div>
                    <div className="flex-grow text-right">
                      <div className="text-xs font-extrabold text-white">فارسی</div>
                      <div className="text-[9px] text-brand-text-muted font-mono leading-none mt-0.5">Persian RTL layout</div>
                    </div>
                    {settings.lang === 'fa' && (
                      <Check className="w-4 h-4 text-brand-accent shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, lang: 'en' }))}
                    className={`relative flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-300 transform active:scale-95 cursor-pointer ${
                      settings.lang === 'en'
                        ? 'border-brand-accent bg-brand-accent/10 shadow-md ring-1 ring-brand-accent'
                        : 'border-brand-border/40 bg-brand-card/40 hover:border-brand-accent/50 hover:bg-brand-accent/5'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/20 text-md shrink-0 border border-brand-border/20 shadow-inner">
                      🇬🇧
                    </div>
                    <div className="flex-grow text-left">
                      <div className="text-xs font-extrabold text-white">English</div>
                      <div className="text-[9px] text-brand-text-muted font-mono leading-none mt-0.5">UK / US LTR layout</div>
                    </div>
                    {settings.lang === 'en' && (
                      <Check className="w-4 h-4 text-brand-accent shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Section 2: Vault Lock Security */}
            <section className="bg-brand-card/75 border border-brand-border/40 hover:border-brand-border/80 transition-colors rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border/20 pb-3.5 ltr:text-left rtl:text-right">
                <span className="text-xl text-brand-accent">🛡</span>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {lang === 'fa' ? 'گاوصندوق حفاظتی رمز عبور عددی (PIN)' : 'Security Vault Protect Key'}
                  </h3>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">
                    {lang === 'fa' ? 'جهت امنیت گواهی‌ها، سیستم را با رمز عددی فرعی مسدود کنید' : 'Set a cryptographic entry pin code to secure system databases'}
                  </p>
                </div>
              </div>

              {settings.security.pinCode ? (
                <div className="space-y-4">
                  <div className="flex gap-3 items-center p-3.5 bg-brand-accent/5 border border-brand-accent/20 text-brand-accent rounded-xl text-xs ltr:text-left rtl:text-right">
                    <Check className="w-4.5 h-4.5 shrink-0 text-brand-accent" />
                    <span>{lang === 'fa' ? 'سپر امنیتی در حال حاضر فعال است و سرورها کاملاً محافظت می‌شوند.' : 'Cryptographic lock shield is fully operational and active.'}</span>
                  </div>

                  <button
                    onClick={handleDisableLock}
                    className="w-full py-2.5 bg-rose-500/10 border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl font-bold transition-all text-xs cursor-pointer select-none"
                  >
                    {t.disableLock}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[11px] leading-relaxed text-brand-text-muted ltr:text-left rtl:text-right">
                    {lang === 'fa' 
                      ? 'یک رمز عبور مستقل ۴ رقمی عددی تعریف کنید تا در هنگام ترک صندلی و شروع مجدد برنامه، اطلاعات حیاتی سرورها کاملاً پوشانده شده و غیرقابل خواندن باشد.' 
                      : 'Deploy an entry barrier lock PIN to prevent physical snooping in active workspace sessions.'}
                  </p>

                  {!pinSetupMode ? (
                    <button
                      onClick={handleTogglePINSetup}
                      className="w-full py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-bold rounded-xl text-xs transition-colors cursor-pointer select-none font-semibold text-center"
                    >
                      {lang === 'fa' ? 'تنظیم رمز عددی جدید' : 'Configure Lock Screen PIN'}
                    </button>
                  ) : (
                    <div className="space-y-3 pt-3 border-t border-brand-border/25">
                      <label className="block text-[11px] text-brand-text font-bold ltr:text-left rtl:text-right">{t.confirmPinLock}</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={newPINCode}
                        onChange={(e) => {
                          setPinSetupError('');
                          setNewPINCode(e.target.value.replace(/\D/g, ''));
                        }}
                        placeholder="e.g. 1365"
                        className="w-full bg-brand-bg border border-brand-border text-center text-sm p-2.5 rounded-xl text-white focus:outline-none focus:border-brand-accent font-mono tracking-widest"
                      />
                      {pinSetupError && <span className="text-[10px] text-rose-500 block">⚠ {pinSetupError}</span>}
                      
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleTogglePINSetup}
                          className="py-2.5 bg-brand-bg border border-brand-border rounded-xl text-xs text-white hover:bg-black/30 cursor-pointer select-none text-center"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyLock}
                          className="py-2.5 bg-brand-accent text-brand-bg rounded-xl font-bold text-xs cursor-pointer select-none text-center animate-pulse-slow"
                        >
                          {lang === 'fa' ? 'تایید و قفل' : 'Apply Shield'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Section 3: Financial Accounting System toggle option */}
            <section className="bg-brand-card/75 border border-brand-border/40 hover:border-brand-border/80 transition-colors rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border/20 pb-3.5 ltr:text-left rtl:text-right">
                <span className="text-xl text-brand-accent">💰</span>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {lang === 'fa' ? 'حسابداری مالی و پیشرفته هزینه گره‌ها' : 'Financial Accounting & Billing System'}
                  </h3>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">
                    {lang === 'fa' ? 'امکان رصد موجودی حساب میزبان‌ها، مبالغ خرید و فاکتورها را مدیریت و فعال‌سازی کنید' : 'Toggle server billing structures, provider credits, and lease renewals metrics'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-brand-border/20">
                <div className="flex-1 ltr:text-left rtl:text-right space-y-0.5">
                  <span className="font-bold text-white text-xs block">
                    {lang === 'fa' ? 'سیستم یکپارچه حسابداری' : 'Integrated Operations Ledger'}
                  </span>
                  <span className="text-[10px] text-brand-text-muted">
                    {lang === 'fa' ? (settings.enableFinance ? 'وضعیت محاسبات مالی: فعال شده و در تگ‌ها نمایان است' : 'وضعیت محاسبات مالی: موقتاً غیرفعال') : (settings.enableFinance ? 'Operational ledger: Active & visible' : 'Operational ledger: Decoupled & hidden')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({ ...prev, enableFinance: !prev.enableFinance }));
                    setClipTip(lang === 'fa' ? 'تغییرات سیستم مالی ذخیره شد' : 'Billing configurations updated');
                    setTimeout(() => setClipTip(null), 2500);
                  }}
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-all duration-300 focus:outline-none cursor-pointer ease-in-out select-none shrink-0 ${
                    settings.enableFinance ? 'bg-brand-accent-secondary' : 'bg-brand-border/85'
                  }`}
                >
                  <div 
                    className="w-5.5 h-5.5 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out" 
                    style={{ transform: settings.enableFinance ? (lang === 'fa' ? 'translateX(-22px)' : 'translateX(22px)') : 'translateX(0)' }}
                  />
                </button>
              </div>
            </section>

            {/* Section 4: Tags Maker */}
            <section className="bg-brand-card/75 border border-brand-border/40 hover:border-brand-border/80 transition-colors rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border/20 pb-3.5 ltr:text-left rtl:text-right">
                <span className="text-xl text-brand-accent">🏷</span>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {t.manageTags}
                  </h3>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">
                    {lang === 'fa' ? 'برای تفکیک بصری گره‌های مانیتور، برچسب‌های رنگی و اهداف سفارشی بسازید' : 'Produce color-coded visual indicator labels to group server nodes cleanly'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateTag} className="space-y-4 pt-1 text-right ltr:text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-brand-text font-bold">Tag Title (English)</label>
                    <input
                      type="text"
                      required
                      value={newTagEn}
                      onChange={(e) => setNewTagEn(e.target.value)}
                      placeholder="e.g. Tunnel Ingress"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-white focus:outline-none focus:border-brand-accent text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-brand-text font-bold">عنوان برچسب (فارسی)</label>
                    <input
                      type="text"
                      required
                      value={newTagFa}
                      onChange={(e) => setNewTagFa(e.target.value)}
                      placeholder="مثلاً تونل ورودی"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-white focus:outline-none focus:border-brand-accent text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-brand-text font-bold">Pick Tag Color Indicator</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-14 h-10 rounded-xl bg-brand-bg border border-brand-border cursor-pointer shrink-0"
                    />
                    <div className="flex-1 p-2 bg-black/25 border border-brand-border/25 rounded-xl flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full shadow-inner border border-white/10" style={{ backgroundColor: newTagColor }}></span>
                      <span className="text-[11px] font-mono text-white tracking-wider">{newTagColor}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-bold rounded-xl text-xs transition-colors cursor-pointer select-none text-center"
                >
                  {t.addTagBtn}
                </button>
              </form>

              {/* Tag representation list */}
              <div className="border-t border-brand-border/15 pt-4 space-y-2 ltr:text-left rtl:text-right">
                <span className="block text-[11px] font-bold text-white uppercase tracking-wider">{lang === 'fa' ? 'تگ‌های فعلی پایگاه داده:' : 'Current Live Database Tags:'}</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-[10px] px-3 py-1 rounded-lg font-bold uppercase text-white font-mono shadow-sm flex items-center gap-1.5 border border-white/5"
                      style={{ backgroundColor: tag.color, color: tag.textColor }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white opacity-85" />
                      {lang === 'fa' ? tag.nameFa : tag.nameEn}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 5: Filter visible fields */}
            <section className="bg-brand-card/75 border border-brand-border/40 hover:border-brand-border/80 transition-colors rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border/20 pb-3.5 ltr:text-left rtl:text-right">
                <span className="text-xl text-brand-accent">⚙</span>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {lang === 'fa' ? 'فیلترهای نمایش فیلدهای اطلاعاتی گره' : 'Visual Registries Column Filter'}
                  </h3>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">
                    {t.visibleFieldsConfig}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 bg-black/20 hover:bg-black/30 border border-brand-border/20 rounded-xl cursor-pointer transition-all text-white select-none">
                  <input
                    type="checkbox"
                    checked={settings.visibleFields.credentials}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      visibleFields: { ...prev.visibleFields, credentials: e.target.checked }
                    }))}
                    className="w-4.5 h-4.5 text-brand-accent bg-brand-bg rounded-lg border-brand-border cursor-pointer focus:ring-0"
                  />
                  <div className="flex-1 ltr:text-left rtl:text-right">
                    <span className="font-bold block text-xs">{lang === 'fa' ? 'پیش‌نمایش پسوردهای عبور' : 'Display Lock Credentials'}</span>
                    <span className="text-[9.5px] text-brand-text-muted mt-0.5 block">{lang === 'fa' ? 'نمایش رمز عبور در لیست سرورها به صورت مستقیم' : 'Expose and render secrets inline'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-black/20 hover:bg-black/30 border border-brand-border/20 rounded-xl cursor-pointer transition-all text-white select-none">
                  <input
                    type="checkbox"
                    checked={settings.visibleFields.tags}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      visibleFields: { ...prev.visibleFields, tags: e.target.checked }
                    }))}
                    className="w-4.5 h-4.5 text-brand-accent bg-brand-bg rounded-lg border-brand-border cursor-pointer focus:ring-0"
                  />
                  <div className="flex-1 ltr:text-left rtl:text-right">
                    <span className="font-bold block text-xs">{lang === 'fa' ? 'نمایش برچسب‌های تفکیک گره' : 'Display Label Tags'}</span>
                    <span className="text-[9.5px] text-brand-text-muted mt-0.5 block">{lang === 'fa' ? 'رندر کردن تگ‌های ارتباطی گره‌ها بر روی فیلدها' : 'Include tags in active dashboard blocks'}</span>
                  </div>
                </label>
              </div>
            </section>

            {/* Section 6: Backup, Restore */}
            <section className="bg-brand-card/75 border border-brand-border/40 hover:border-brand-border/80 transition-colors rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border/20 pb-3.5 ltr:text-left rtl:text-right">
                <span className="text-xl text-brand-accent">💾</span>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {lang === 'fa' ? 'پشتیبان‌گیری و پایدارسازی مکرر داده‌ها' : 'Offline State Backup & Recovery'}
                  </h3>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">
                    {lang === 'fa' ? 'پست‌های مانیتور و حساب‌های مالی را جهت مهاجرت به دستگاه دیگر صادر کنید' : 'Save database snapshots offline or migrate to another browser client workspace'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                {/* Export payload box */}
                <div className="p-5 bg-black/20 border border-brand-border/20 rounded-2xl flex flex-col justify-between space-y-4 ltr:text-left rtl:text-right">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">{lang === 'fa' ? 'استخراج پشتیبان (دانلود بکاپ)' : 'Capture JSON Backup'}</h4>
                    <p className="text-[10.5px] text-brand-text-muted leading-relaxed">
                      {lang === 'fa' ? 'بایگانی کاملی شامل تمام نودها، ارائه‌دهندگان، تاریخچه تراکنش‌ها و برچسب‌ها را به شکل فایل محلی استخراج کنید.' : 'Save configurations offline as a fully parsed robust JSON stream.'}
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerExport}
                    className="w-full py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-brand-bg rounded-xl font-bold font-mono text-xs transition-colors cursor-pointer select-none text-center"
                  >
                    {t.exportBackup}
                  </button>
                </div>

                {/* Import payload box */}
                <div className="p-5 bg-black/20 border border-brand-border/20 rounded-2xl space-y-4 ltr:text-left rtl:text-right">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">{lang === 'fa' ? 'بازیابی پشتیبان (ریستور داده)' : 'Import & Restore Database'}</h4>
                    <p className="text-[10.5px] text-brand-text-muted leading-relaxed">
                      {lang === 'fa' 
                        ? 'یک سرور پشتیبان قبلی را با قرار دادن مستقیم شناور کد فشرده یا بارگذاری فایل بازیابی نمایید:' 
                        : 'Choose your backup file, or drop your payload directly inside the code box:'}
                    </p>
                  </div>

                  <label className="flex items-center justify-center gap-2.5 p-3.5 border border-dashed border-brand-border/60 hover:border-brand-accent hover:bg-brand-accent/5 rounded-xl cursor-pointer transition-colors text-white font-mono text-[11px] font-bold bg-black/25">
                    <FileUp className="w-4.5 h-4.5 text-brand-accent shrink-0" />
                    <span>{lang === 'fa' ? 'انتخاب فایل پشتیبان (.json)' : 'Upload Backup File (.json)'}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <div className="text-center font-mono text-[9px] text-brand-text-muted uppercase tracking-widest">— {lang === 'fa' ? 'یا قرار دادن شناسه مکتوب' : 'Or Drop code text outline'} —</div>

                  <textarea
                    rows={2}
                    value={backupText}
                    onChange={(e) => setBackupText(e.target.value)}
                    placeholder='{"servers": [], "categories": [], ...}'
                    className="w-full bg-brand-bg border border-brand-border p-2.5 rounded-xl text-[10.5px] font-mono text-brand-text placeholder:opacity-30 focus:outline-none focus:border-brand-accent tracking-normal focus:ring-0 leading-relaxed active:scale-[0.99] transition-transform"
                  />

                  {backupErrorMsg && (
                    <span className={`block text-[10.5px] font-mono leading-relaxed p-2.5 rounded-xl ${backupErrorMsg.startsWith('✓') ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}`}>
                      {backupErrorMsg}
                    </span>
                  )}

                  <button
                    onClick={handleTriggerImport}
                    className="w-full py-2.5 bg-brand-accent-secondary/10 hover:bg-brand-accent-secondary hover:text-brand-bg text-brand-text/90 border border-brand-accent-secondary/35 hover:border-transparent rounded-xl font-bold font-mono text-xs transition-all cursor-pointer select-none text-center"
                  >
                    {t.importBackup}
                  </button>
                </div>
              </div>
            </section>

            {/* Section 7: Hazard zone */}
            <section className="bg-[#12080a] border border-rose-500/25 hover:border-rose-500/50 transition-colors rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-rose-500/20 pb-2.5 ltr:text-left rtl:text-right">
                <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-rose-500 font-mono">
                  {lang === 'fa' ? 'حوزه بحرانی و پاکسازی کامل داده‌ها' : 'Master Reset Hazard Zone'}
                </h3>
              </div>

              <p className="text-[11px] leading-relaxed text-rose-400/90 font-medium ltr:text-left rtl:text-right">
                {lang === 'fa'
                  ? 'توجه مکرر: فعال سازی این بازنشانی کلید مفعولی و پاکسازی، به طور آنی بدون قابلیت بازگشت تمام رکوردها، هیستوری فاکتورها، برچسب‌ها و کوئست‌ها را نابود می‌سازد و به وارف خوش‌آمدگویی Onboarding باز میگردد.'
                  : 'WARNING: Invoking a master wipe deletes all custom configurations, credentials, transaction history, and resets onboarding. This process is immediate and final.'}
              </p>

              <button
                type="button"
                onClick={handleFullAppReset}
                className="w-full py-3 bg-rose-800/15 hover:bg-rose-600 border border-rose-500/40 hover:border-transparent text-rose-400 hover:text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 select-none"
              >
                <Trash className="w-4 h-4 shrink-0" />
                <span>{lang === 'fa' ? 'ریست کامل برنامه و پاکسازی کلیه داده‌ها' : 'Execute System Master Purge Wiping'}</span>
              </button>
            </section>

            {/* Biographical Card Section */}
            <DeveloperAbout lang={lang} />
          </div>
        )}

        {/* INTERACTIVE TRASH POPUP MODAL */}
        {isTrashOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <div className="bg-brand-card border border-brand-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-brand-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold text-brand-text font-mono">
                    {lang === 'fa' ? 'سطل زباله سرورها' : 'Deleted Servers Archive'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTrashOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-brand-accent/10 text-brand-text-muted hover:text-brand-text cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-brand-text-muted leading-relaxed">
                {lang === 'fa' 
                  ? 'سرورهایی که موقتاً حذف نموده اید در این بخش آرشیو گشته و فاقد ارزیابی دوره‌ای محاسبات مالی هستند. می‌توانید مجددا نودها را احیا نموده یا از مرورگر به صورت دائمی پاکسازی نمایید.'
                  : 'Servers soft-deleted are kept in this repository indefinitely but not factored into active financials. You can safely rebuild details or wipe records permanent.'}
              </p>

              {/* Trash Items List */}
              <div className="space-y-2 mt-4">
                {servers.filter(s => s.deleted).length === 0 ? (
                  <div className="text-center py-8 text-brand-text-muted text-xs bg-brand-bg/40 border border-brand-border/25 rounded-xl">
                    {lang === 'fa' ? 'سطل زباله خالی است.' : 'The trash is currently empty.'}
                  </div>
                ) : (
                  <div className="divide-y divide-brand-border/30 max-h-[50vh] overflow-y-auto pr-1">
                    {servers.filter(s => s.deleted).map((server) => (
                      <div key={server.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-brand-text block font-mono">{server.name}</span>
                          <span className="text-[10px] text-brand-text-muted font-mono block">{server.ip}:{server.sshPort}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Restore */}
                          <button
                            type="button"
                            onClick={() => {
                              handleRestoreServer(server.id);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                            title={t.restore}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t.restore}</span>
                          </button>

                          {/* Hard Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              handlePermanentDelete(server.id);
                            }}
                            className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                            title={t.permanentDelete}
                          >
                            <Trash className="w-3.5 h-3.5" />
                            <span>{t.permanentDelete}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-brand-border/30 pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsTrashOpen(false)}
                  className="px-4 py-2 bg-brand-bg border border-brand-border text-brand-text hover:bg-brand-bg/75 rounded-lg text-xs cursor-pointer font-semibold transition-colors"
                >
                  {lang === 'fa' ? 'بستن' : 'Close'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* REGISTER NEW PROVIDER INTERACTIVE MODAL */}
        {isAddProviderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <div className="bg-brand-card border border-brand-border rounded-xl max-w-sm w-full p-5 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-brand-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-brand-accent animate-pulse" />
                  <h3 className="text-sm font-bold text-white font-mono">
                    {t.addProvider}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProviderOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-brand-accent/10 text-brand-text-muted hover:text-brand-text cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateProvider} className="space-y-4 text-xs text-brand-text-muted">
                <div>
                  <label className="block font-semibold text-white mb-1.5">{t.providerName}</label>
                  <input
                    type="text"
                    required
                    value={newProvName}
                    onChange={(e) => setNewProvName(e.target.value)}
                    placeholder="e.g. Hetzner, DigitalOcean"
                    className="w-full bg-brand-bg/85 border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-white mb-1.5">{t.currency}</label>
                  <select
                    value={newProvCurrency}
                    onChange={(e) => setNewProvCurrency(e.target.value as Currency)}
                    className="w-full bg-brand-bg/85 border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="TOMAN">{t.toman}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-white mb-1.5">{t.providerBalance}</label>
                  <input
                    type="number"
                    value={newProvBalance}
                    onChange={(e) => setNewProvBalance(Number(e.target.value))}
                    className="w-full bg-brand-bg/85 border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent font-mono"
                  />
                </div>

                {/* Actions */}
                <div className="border-t border-brand-border/30 pt-4 flex justify-end gap-2 text-[11px] font-bold font-mono">
                  <button
                    type="button"
                    onClick={() => setIsAddProviderOpen(false)}
                    className="px-3.5 py-2 bg-brand-bg border border-brand-border text-brand-text hover:bg-brand-bg/75 rounded-lg cursor-pointer transition-colors"
                  >
                    {lang === 'fa' ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-brand-accent text-brand-bg hover:bg-brand-accent/90 rounded-lg cursor-pointer transition-all shadow-lg shadow-brand-accent/15"
                  >
                    {t.addProviderBtn}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* INTERACTIVE SERVER DETAILS POPUP MODAL */}
        {selectedServer && (
          <div className="fixed ForceFixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <div className="bg-brand-card border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-5">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-brand-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {t.showDetails}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedServer(null)}
                  className="p-1.5 rounded-lg hover:bg-brand-accent/10 text-brand-text-muted hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 text-xs text-brand-text-muted">
                {/* Host Accent Name */}
                <div className="flex items-center justify-between gap-4 bg-brand-bg/60 p-3 rounded-xl border border-brand-border/30">
                  <div>
                    <div className="text-[10px] text-brand-text-muted uppercase tracking-wide">{t.name}</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5 flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-black/30 rounded-md border border-brand-border/20 flex items-center justify-center p-0.5 shrink-0" title={`${selectedServer.osType || 'linux'} ${selectedServer.osVersion || ''}`}>
                        {renderOSLogo(selectedServer.osType, "w-4 h-4 object-contain")}
                      </div>
                      <span>{selectedServer.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-brand-text-muted uppercase tracking-wide">OS Distro</div>
                    <span className="text-[10px] bg-brand-accent/15 border border-brand-accent-secondary/20 px-2 py-0.5 rounded text-brand-text font-mono capitalize inline-block mt-0.5">
                      {selectedServer.osType || 'linux'} {selectedServer.osVersion || ''}
                    </span>
                  </div>
                </div>

                {/* Direct Credential copier Vault Grid */}
                <div className="p-3 bg-black/40 border border-brand-border/30 rounded-xl space-y-2.5 font-mono">
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-text-muted text-[10px]">IP:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-semibold">{selectedServer.ip}</span>
                      <button
                        onClick={() => handleCopyCredentials(selectedServer.ip, 'IP')}
                        className="text-brand-accent hover:text-white transition-colors cursor-pointer"
                      >
                        {clipTip === 'IP' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-text-muted text-[10px]">Port:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-semibold">{selectedServer.sshPort}</span>
                      <button
                        onClick={() => handleCopyCredentials(selectedServer.sshPort.toString(), 'Port')}
                        className="text-brand-accent hover:text-white transition-colors cursor-pointer"
                      >
                        {clipTip === 'Port' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-text-muted text-[10px]">{lang === 'fa' ? 'کاربر:' : 'User:'}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-semibold">{selectedServer.username}</span>
                      <button
                        onClick={() => handleCopyCredentials(selectedServer.username, 'User')}
                        className="text-brand-accent hover:text-white transition-colors cursor-pointer"
                      >
                        {clipTip === 'User' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {selectedServer.password && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-text-muted text-[10px]">{lang === 'fa' ? 'رمز:' : 'Pass:'}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-semibold font-mono">
                          {settings.visibleFields.credentials ? selectedServer.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => handleCopyCredentials(selectedServer.password || '', 'Pass')}
                          className="text-brand-accent hover:text-white transition-colors cursor-pointer"
                        >
                          {clipTip === 'Pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ping Latency Section */}
                  <div className="flex items-center justify-between text-[11px] border-t border-brand-border/20 pt-2.5 mt-1">
                    <span className="text-brand-text-muted text-[10px]">{lang === 'fa' ? 'پینگ سرور:' : 'Ping Latency:'}</span>
                    <div className="flex items-center gap-2">
                      {serverPings[selectedServer.id] ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          serverPings[selectedServer.id].status === 'loading' ? 'animate-pulse text-brand-accent bg-brand-accent/10 border border-brand-accent/20' :
                          serverPings[selectedServer.id].status === 'error' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' :
                          (serverPings[selectedServer.id].ms || 999) < 100 ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                          (serverPings[selectedServer.id].ms || 999) < 250 ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                          'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        }`}>
                          <Activity className={`w-3 h-3 ${serverPings[selectedServer.id].status === 'loading' ? 'animate-spin' : ''}`} />
                          {serverPings[selectedServer.id].status === 'loading' ? (lang === 'fa' ? 'درحال محاسبه...' : 'Pinging...') : 
                           serverPings[selectedServer.id].status === 'error' ? (lang === 'fa' ? 'خطا' : 'Error') : 
                           `${serverPings[selectedServer.id].ms} ms`}
                        </span>
                      ) : (
                        <span className="text-brand-text-muted text-[10px] font-sans">{lang === 'fa' ? 'محاسبه نشده' : 'Not calculated'}</span>
                      )}

                      <button
                        onClick={() => calculatePing(selectedServer.id, selectedServer.ip)}
                        disabled={serverPings[selectedServer.id]?.status === 'loading'}
                        className="p-1 rounded bg-brand-accent/10 hover:bg-brand-accent/25 text-brand-accent cursor-pointer transition-all disabled:opacity-50"
                        title={lang === 'fa' ? 'محاسبه پینگ' : 'Ping now'}
                      >
                        <Wifi className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Interactive Ping/Diagnostic terminal console */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">{t.simulateTerminal}</label>
                  <TerminalSim 
                    server={selectedServer}
                    lang={lang}
                  />
                </div>

                {/* Personal memo notepad */}
                {selectedServer.notes && (
                  <div className="p-3 bg-brand-bg/50 border border-brand-border/30 rounded-xl">
                    <div className="text-[10px] text-brand-accent font-bold mb-1 uppercase tracking-wide">
                      {lang === 'fa' ? 'یادداشت بقا و دستورالعمل:' : 'Operational Memo Notes:'}
                    </div>
                    <p className="text-[11px] text-brand-text-muted leading-relaxed whitespace-pre-wrap font-mono">
                      {selectedServer.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions / Close */}
              <div className="border-t border-brand-border/30 pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedServer(null)}
                  className="px-4 py-2.5 flex-grow bg-brand-bg border border-brand-border text-brand-text hover:bg-brand-bg/75 rounded-lg cursor-pointer transition-colors font-semibold text-center text-xs"
                >
                  {lang === 'fa' ? 'بستن مشخصات' : 'Close Details'}
                </button>

                {!isLoggingRenewal && (
                  <button
                    onClick={() => {
                      setIsLoggingRenewal(selectedServer);
                      setRenewalCurrency(selectedServer.currency);
                      setRenewalAmount(selectedServer.cost);
                      setRenewalAddedDays(selectedServer.billingType === 'hourly' ? 30 : selectedServer.cycleDays);
                    }}
                    className="px-4 py-2.5 flex-grow bg-brand-accent-secondary text-brand-bg hover:bg-brand-accent-secondary/95 font-bold font-mono text-xs rounded-lg shadow transition-transform active:scale-[0.98] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.addRenewalLog}</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ACTIVE RENEWAL LEASE DIALOG POPUP OVERLAY */}
        {isLoggingRenewal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleLogRenewal}
              className="bg-brand-card border border-brand-border rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative"
            >
              <h3 className="text-md font-bold text-white font-mono flex items-center gap-2">
                <History className="w-5 h-5 text-brand-accent-secondary" />
                {t.addRenewalLog}
              </h3>
              
              <p className="text-xs text-brand-text-muted leading-relaxed">
                {lang === 'fa' 
                  ? `ثبت تراکنش پرداخت فاکتور تمدید اجاره برای سرور "${isLoggingRenewal.name}". مبالغ از حساب پس‌انداز متصل کاسته می‌شود.` 
                  : `Logging lease transaction for server "${isLoggingRenewal.name}". The cash will automatically be deducted from connected balance.`}
              </p>

              <div>
                <label className="block text-[10px] text-brand-text-muted uppercase mb-1">{t.amountPaid}</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    required
                    value={renewalAmount}
                    onChange={(e) => setRenewalAmount(Number(e.target.value))}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent font-mono text-xs"
                  />
                  <select
                    value={renewalCurrency}
                    onChange={(e) => setRenewalCurrency(e.target.value as Currency)}
                    className="bg-brand-bg border border-brand-border rounded-lg p-2 text-white text-xs font-mono"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="TOMAN">{t.toman}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-brand-text-muted uppercase mb-1">{t.billingRenewedDay}</label>
                <input
                  type="number"
                  required
                  value={renewalAddedDays}
                  onChange={(e) => setRenewalAddedDays(Number(e.target.value))}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-brand-text-muted uppercase mb-1">{lang === 'fa' ? 'توضیحات تراکنش (تراکنش پیگیری و...)' : 'Transaction log details/Transaction ID'}</label>
                <input
                  type="text"
                  value={renewalJournalText}
                  onChange={(e) => setRenewalJournalText(e.target.value)}
                  placeholder="e.g. Card to Card / Tx_88126"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoggingRenewal(null)}
                  className="px-3 py-1.5 bg-brand-bg border border-brand-border text-brand-text-muted rounded-lg text-xs hover:text-white cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-accent text-brand-bg font-bold rounded-lg text-xs hover:bg-brand-accent/90 cursor-pointer"
                >
                  {lang === 'fa' ? 'ثبت پرداخت' : 'Confirm log'}
                </button>
              </div>
            </motion.form>
          </div>
        )}



        {/* ELEGANT INTUITIVE SSH WINDOWS/LINUX LAUNCHER MODAL */}
        {showSSHInstructionModal && showSSHInstructionModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in animate-duration-200" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-brand-card border border-brand-accent/30 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-brand-border/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-5 h-5 text-brand-accent-secondary animate-pulse" />
                  <h3 className="text-sm font-black text-white font-mono uppercase tracking-wide">
                    {lang === 'fa' 
                      ? `اتصال سریع SSH به سرور: ${showSSHInstructionModal.serverName}` 
                      : `SSH Connection Link: ${showSSHInstructionModal.serverName}`}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowSSHInstructionModal(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-brand-text-muted hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Copied visual notification bar */}
                <div className="bg-brand-accent/10 border border-brand-accent/30 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-7 h-7 bg-brand-accent/20 rounded-lg flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-brand-accent-secondary" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white text-[11px] sm:text-xs">
                      {lang === 'fa' ? 'دستور اتصال به کلیپ‌بورد کپی شد!' : 'SSH Command copied to clipboard!'}
                    </p>
                    <p className="text-[10px] text-brand-text-muted mt-0.5">
                      {lang === 'fa' ? 'اکنون آماده پیست و اجرا بر روی سیستم شماست.' : 'Ready to paste and execute on your host machine.'}
                    </p>
                  </div>
                </div>

                {/* Command text block */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-brand-text-muted block uppercase font-mono tracking-wider">
                    {lang === 'fa' ? 'دستور کپی شده:' : 'Copied Command String:'}
                  </span>
                  <div className="bg-black/40 border border-brand-border/40 rounded-xl p-3.5 flex items-center justify-between gap-3 font-mono text-xs text-white shadow-inner relative select-all" style={{ direction: 'ltr' }}>
                    <code className="truncate text-brand-accent-secondary font-bold tracking-normal">{showSSHInstructionModal.cmd}</code>
                    <button
                      onClick={() => {
                        copyToClipboard(showSSHInstructionModal.cmd).then(() => {
                          setClipTip('CMD_COPIED');
                          setTimeout(() => setClipTip(null), 1500);
                        });
                      }}
                      className="p-1.5 bg-brand-bg hover:bg-black rounded-lg text-brand-text-muted hover:text-white border border-brand-border/30 transition-all cursor-pointer shrink-0"
                      title={lang === 'fa' ? 'کپی مجدد' : 'Copy again'}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {clipTip === 'CMD_COPIED' && (
                      <span className="absolute -top-7 right-2 bg-emerald-500 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-lg animate-bounce">
                        {lang === 'fa' ? 'کپی شد!' : 'Copied!'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Step-by-Step guide for windows CMD execution */}
                <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-4 space-y-2.5 text-xs text-brand-text">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                    <span className="text-base">💻</span>
                    {lang === 'fa' ? 'راهنمای گام‌به‌گام اتصال در ویندوز (Windows CMD):' : 'Step-by-Step for Windows CMD:'}
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 pr-1 leading-relaxed text-brand-text-muted text-[11px]">
                    <li>
                      {lang === 'fa' 
                        ? 'کلیدهای ترکیبی Windows + R را روی کیبورد خود فشار دهید.' 
                        : 'On your keyboard, press the combination Windows + R to open Run dialog.'}
                    </li>
                    <li>
                      {lang === 'fa' 
                        ? 'در کادر باز شده، عبارت cmd را نوشته و دکمه Enter را بفشارید.' 
                        : "Type 'cmd' in the dialog box and click Enter."}
                    </li>
                    <li>
                      {lang === 'fa' 
                        ? 'در پنجره سیاه رنگ CMD، کلیک راست کنید یا کلیدهای Ctrl + V را فشار دهید تا دستور کپی شده پیست شود.' 
                        : 'Inside Command Prompt, right-click (or press Ctrl + V) to paste.'}
                    </li>
                    <li>
                      {lang === 'fa' 
                        ? 'دکمه Enter را فشار دهید و در صورت درخواست سیستم، پسورد گره را وارد نمایید.' 
                        : 'Press Enter and write the server password when requested to connect.'}
                    </li>
                  </ol>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-brand-border/30 text-[10px] text-brand-text-muted">
                <span className="font-mono">
                  {lang === 'fa' 
                    ? '* تذکر: پروتکل محلی ssh:// نیز فراخوانی شده است.' 
                    : '* Note: Native ssh:// protocol request was also dispatched.'}
                </span>
                <button
                  onClick={() => setShowSSHInstructionModal(null)}
                  className="px-5 py-2 bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-sans font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  {lang === 'fa' ? 'بستن راهنما' : 'Got it, Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </main>
        </div>
      </div>

      {/* Persistent SSH Terminal Tabs */}
      {appTabs.filter(tab => tab.type !== 'main').map(tab => {
        const isActive = tab.id === activeAppTabId;
        return (
          <div 
            key={tab.id} 
            className={`flex-1 p-3 md:p-6 flex flex-col min-h-0 overflow-hidden relative ${isActive ? '' : 'hidden'}`}
          >
            {tab.server && (
              <SshTabTerminal
                server={tab.server}
                lang={lang}
                initialCommand={tab.initialCommand}
                initialCommandName={tab.initialCommandName}
                onClose={() => closeSshTab(tab.id)}
                isActive={isActive}
              />
            )}
          </div>
        );
      })}

      {/* PERSISTENT BOTTOM TAB BAR */}
      <div className="w-full bg-slate-900/90 border-t border-brand-border/30 px-4 py-2 flex items-center justify-between z-40 sticky bottom-0 backdrop-blur-md">
         {/* Tabs list */}
         <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {appTabs.map(tab => {
               const isActive = tab.id === activeAppTabId;
               return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveAppTabId(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer relative shrink-0 select-none ${
                      isActive 
                        ? 'bg-brand-accent/20 border-brand-accent text-white shadow shadow-brand-accent/20' 
                        : 'bg-black/30 border-brand-border/30 text-brand-text-muted hover:text-white hover:border-brand-border/60'
                    }`}
                  >
                     {tab.type === 'main' ? (
                        <Monitor className="w-3.5 h-3.5 text-brand-accent-secondary" />
                     ) : (
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                     )}
                     <span className="font-mono">{tab.type === 'main' ? 'JeyNode' : tab.title}</span>
                     
                     {tab.type !== 'main' && (
                        <button
                          onClick={(e) => {
                             e.stopPropagation();
                             closeSshTab(tab.id);
                          }}
                          className="p-0.5 rounded-md hover:bg-white/10 text-brand-text-muted hover:text-rose-400 transition-colors cursor-pointer"
                        >
                           <X className="w-3 h-3" />
                        </button>
                     )}
                  </div>
               );
            })}
         </div>

         {/* Right active indicator */}
         <div className="hidden sm:flex items-center gap-2 text-[10px] text-brand-text-muted font-mono bg-black/40 px-2.5 py-1 rounded-lg border border-brand-border/20">
            <span>{lang === 'fa' ? `تب‌های فعال: ${appTabs.length}` : `Active Tabs: ${appTabs.length}`}</span>
         </div>
      </div>

      {/* INTERACTIVE MODERN SSH OPTIONS POPUP MODAL */}
      {activeSSHActionModalServer && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" style={{ direction: lang === 'fa' ? 'rtl' : 'ltr' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-card border border-brand-accent/40 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-brand-border/30 pb-3">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-emerald-400 animate-pulse animate-duration-1000" />
                <h3 className="text-xs sm:text-sm font-black text-white font-mono uppercase tracking-wide">
                  {lang === 'fa' 
                    ? `مدیریت و اتصال SSH: ${activeSSHActionModalServer.name}` 
                    : `SSH Console & Actions: ${activeSSHActionModalServer.name}`}
                </h3>
              </div>
              <button 
                onClick={() => setActiveSSHActionModalServer(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-brand-text-muted hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] leading-relaxed text-brand-text-muted">
              {lang === 'fa' 
                ? 'یکی از گزینه‌های زیر را برای اتصال به سرور انتخاب نمایید. گزینه‌های پیشرفته با اتصال خودکار، اسکریپت مربوطه را بلافاصله اجرا می‌کنند.'
                : 'Select an SSH execution policy. Advanced pathways launch specified administration scripts automatically.'}
            </div>

            {/* Action Buttons list */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {/* 1. Direct SSH */}
              <button
                onClick={() => spawnSshTab(activeSSHActionModalServer)}
                className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-emerald-500/10 border border-brand-border/40 hover:border-emerald-500/40 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 text-right">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div className="text-left font-sans">
                    <span className="font-extrabold text-white text-xs block">
                      {lang === 'fa' ? 'اتصال مستقیم SSH' : 'Direct SSH Connection'}
                    </span>
                    <span className="text-[10px] text-brand-text-muted mt-0.5 block">
                      {lang === 'fa' ? 'باز کردن ترمینال خام آماده دستورات' : 'Open blank console shell ready for commands'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-text-muted group-hover:text-emerald-400 transition-colors" />
              </button>

              {/* Dynamic remote actions or local fallback */}
              {linuxCommands && linuxCommands.length > 0 ? (
                linuxCommands.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => spawnSshTab(activeSSHActionModalServer, item.command, lang === 'fa' ? item.title_fa : item.title_en)}
                    className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-brand-accent/10 border border-brand-border/40 hover:border-brand-accent/40 rounded-xl transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3 text-right font-sans">
                      <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent-secondary group-hover:scale-105 transition-transform shrink-0 animate-pulse animate-duration-3000">
                        <PlayCircle className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-white text-xs block truncate max-w-[210px]">
                          {lang === 'fa' ? item.title_fa : item.title_en}
                        </span>
                        <span className="text-[10px] text-brand-text-muted mt-0.5 block truncate max-w-[210px]">
                          {lang === 'fa' ? item.description_fa : item.description_en}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                  </button>
                ))
              ) : (
                /* Fallback if list load was empty and no previous cache exists - show System Update as requested */
                <button
                  onClick={() => spawnSshTab(activeSSHActionModalServer, 'update', lang === 'fa' ? 'بروزرسانی سیستم' : 'Upgrade OS')}
                  className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-brand-accent/10 border border-brand-border/40 hover:border-brand-accent/40 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 text-right font-sans">
                    <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent-secondary group-hover:scale-105 transition-transform shrink-0">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-extrabold text-white text-xs block font-sans">
                        {lang === 'fa' ? 'بروزرسانی تدارکاتی سرور (apt update)' : 'System Packages Upgrade'}
                      </span>
                      <span className="text-[10px] text-brand-text-muted mt-0.5 block">
                        {lang === 'fa' ? 'اتصال و اجرای خودکار دستور آپدیت سیستم‌عامل' : 'Connect & update server kernel dependencies'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                </button>
              )}
            </div>

            {/* Warning/Status note */}
            <div className="text-[10px] text-brand-text-muted/60 text-center italic mt-1 leading-relaxed">
              {lang === 'fa' 
                ? 'تمامی اتصال‌ها به صورت امن و ایزوله در هسته شبیه‌ساز برنامه سازماندهی می‌گردند.'
                : 'All sessions are cataloged through JeyNode virtual SSH sandboxes securely.'}
            </div>
          </motion.div>
        </div>
      )}

      {/* APP HARD RESET CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed fixed2 inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" style={{ direction: lang === 'fa' ? 'rtl' : 'ltr' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-card border border-rose-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative"
          >
            <div className="flex items-center gap-2 border-b border-rose-500/20 pb-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                {lang === 'fa' ? 'تایید نهایی پاکسازی کل پایگاه داده' : 'Final Database Decimation Wipe'}
              </h3>
            </div>

            <div className="text-xs text-brand-text-muted space-y-2 leading-relaxed">
              <p className="text-rose-400 font-bold">
                {lang === 'fa' 
                  ? 'هشدار جدی: این عملیات به هیچ عنوان قابل بازگردانی نبوده و تمامی اطلاعات ذخیره شده درون مرورگر شما را به کلی متبخر می‌گرداند!'
                  : 'CRITICAL ALERT: This process is absolute, irreversible, and clears all operational databases inside your browser sandboxed workspace!'}
              </p>
              <p>
                {lang === 'fa' 
                  ? 'جهت اتمام فرایند و اعمال ریست کامل برنامه، لطفاً کمرنگ کلمه‌‌ی RESET را با حروف بزرگ لاتین در کادر زیر تایپ نمایید:'
                  : 'To verify system decimation and execute a clean slate wipe, please write the uppercase word RESET underneath:'}
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                placeholder="RESET"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-center text-white focus:outline-none focus:border-rose-500 font-mono text-xs font-bold tracking-widest placeholder:opacity-40"
              />
              
              {resetModalError && (
                <span className="block text-[10px] text-rose-500 font-bold mt-1.5 font-mono text-center">⚠ {resetModalError}</span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border/30">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 bg-brand-bg border border-brand-border text-brand-text-muted rounded-xl text-xs hover:text-white cursor-pointer select-none font-semibold transition-all"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleExecuteFullAppReset}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition-colors shadow-lg shadow-rose-600/10 cursor-pointer select-none"
              >
                {lang === 'fa' ? 'بازنشانی کامل داده‌ها' : 'Purge All Database'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
