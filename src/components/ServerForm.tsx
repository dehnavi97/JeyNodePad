import React, { useState, useEffect } from 'react';
import { Server, ProviderAccount, Tag, Category, Currency } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_TAGS, TRANSLATIONS } from '../constants';
import { 
  Server as ServerIcon, 
  Globe, 
  Shield, 
  Tag as TagIcon, 
  FileText, 
  DollarSign, 
  CalendarCheck, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServerFormProps {
  initialServer?: Server;
  providers: ProviderAccount[];
  tags: Tag[];
  categories: Category[];
  lang: Language;
  onSave: (serverData: Omit<Server, 'id' | 'deleted'>) => void;
  onCancel: () => void;
}

type Language = 'en' | 'fa';

export function ServerForm({
  initialServer,
  providers,
  tags,
  categories,
  lang,
  onSave,
  onCancel,
}: ServerFormProps) {
  const t = TRANSLATIONS[lang];

  // States
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [sshPort, setSshPort] = useState(22);
  const [username, setUsername] = useState('root');
  const [password, setPassword] = useState('');
  const [providerId, setProviderId] = useState('');
  const [billingType, setBillingType] = useState<'hourly' | 'cycle'>('cycle');
  const [cost, setCost] = useState(0);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [cycleDays, setCycleDays] = useState(30);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [osType, setOsType] = useState('ubuntu');
  const [osVersion, setOsVersion] = useState('22.04 LTS');

  // Step tracker
  const [step, setStep] = useState(1);

  // Hydrate if editing
  useEffect(() => {
    if (initialServer) {
      setName(initialServer.name);
      setIp(initialServer.ip);
      setSshPort(initialServer.sshPort || 22);
      setUsername(initialServer.username || 'root');
      setPassword(initialServer.password || '');
      setProviderId(initialServer.providerId || '');
      setBillingType(initialServer.billingType || 'cycle');
      setCost(initialServer.cost || 0);
      setCurrency(initialServer.currency || 'USD');
      setCycleDays(initialServer.cycleDays || 30);
      setStartDate(initialServer.startDate ? initialServer.startDate.split('T')[0] : new Date().toISOString().split('T')[0]);
      setNotes(initialServer.notes || '');
      setSelectedTags(initialServer.tags || []);
      setCategoryId(initialServer.categoryId || '');
      setOsType(initialServer.osType || 'ubuntu');
      setOsVersion(initialServer.osVersion || '22.04 LTS');
    } else {
      // Defaults
      if (providers.length > 0) {
        setProviderId(providers[0].id);
      }
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }
  }, [initialServer, providers, categories]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const validateCurrentStep = (): boolean => {
    if (step === 1) {
      if (!name.trim()) {
        alert(lang === 'fa' ? 'لطفا نام سرور را وارد کنید.' : 'Please enter the server name.');
        return false;
      }
      if (!ip.trim()) {
        alert(lang === 'fa' ? 'لطفا آدرس آی‌پی سرور را وارد کنید.' : 'Please enter the server IP Address.');
        return false;
      }
      if (!sshPort || sshPort <= 0) {
        alert(lang === 'fa' ? 'لطفا پورت اتصال SSH معتبری وارد کنید.' : 'Please enter a valid SSH port.');
        return false;
      }
    }
    if (step === 2) {
      if (!username.trim()) {
        alert(lang === 'fa' ? 'لطفا نام کاربری ورود ریشه را مشخص کنید.' : 'Please clarify the access root username.');
        return false;
      }
    }
    return true;
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) return;

    if (!name || !ip || !username) {
      alert(t.emptyWarn);
      return;
    }

    onSave({
      name,
      ip,
      sshPort: Number(sshPort),
      username,
      password,
      providerId,
      billingType,
      cost: Number(cost),
      currency,
      cycleDays: Number(cycleDays),
      startDate: new Date(startDate).toISOString(),
      notes,
      tags: selectedTags,
      categoryId,
      status: 'active',
      osType,
      osVersion,
    });
  };

  // Steps lists
  const stepsList = [
    { num: 1, title: lang === 'fa' ? 'مشخصات سرور' : 'Specs', icon: Globe },
    { num: 2, title: lang === 'fa' ? 'اطلاعات دسترسی' : 'Credentials', icon: Shield },
    { num: 3, title: lang === 'fa' ? 'سرویس‌دهنده و مالی' : 'Financials', icon: DollarSign },
    { num: 4, title: lang === 'fa' ? 'یادداشت و تگ‌ها' : 'Labels & Notes', icon: TagIcon },
  ];

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      onSubmit={handleSubmit}
      className="space-y-6 bg-brand-card/85 p-5 sm:p-7 rounded-2xl border border-brand-border/60 backdrop-blur-xl relative"
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-accent to-brand-accent-secondary"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
          <ServerIcon className="w-5 h-5 text-brand-accent" />
          {initialServer ? t.editServerHeading : t.addServerHeading}
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/25 text-brand-accent">
          {lang === 'fa' ? `گام ${step} از ۴` : `Step ${step} of 4`}
        </span>
      </div>

      {/* Mini step visualizer progress indicator timeline */}
      <div className="flex items-center justify-between gap-1 max-w-xl mx-auto py-2.5 bg-black/25 border border-brand-border/30 rounded-xl px-3 sm:px-4 select-none">
        {stepsList.map((st, idx) => {
          const StepIcon = st.icon;
          const isActive = step === st.num;
          const isCompleted = step > st.num;
          return (
            <React.Fragment key={st.num}>
              <button
                type="button"
                onClick={() => {
                  if (st.num < step) {
                    setStep(st.num);
                  } else if (st.num > step) {
                    // Only allow multi-step jump forward if the current step is valid
                    if (validateCurrentStep()) {
                      if (st.num === step + 1) {
                        setStep(st.num);
                      }
                    }
                  }
                }}
                className="flex flex-col items-center gap-1 focus:outline-none cursor-pointer flex-1"
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-brand-accent text-brand-bg font-black scale-105 shadow-md shadow-brand-accent/20'
                    : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-brand-bg/90 text-brand-text-muted border border-brand-border/80'
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-[8px] sm:text-[9px] font-bold ${isActive ? 'text-brand-accent' : isCompleted ? 'text-emerald-400' : 'text-brand-text-muted'}`}>
                  {st.title}
                </span>
              </button>
              {idx < stepsList.length - 1 && (
                <div className={`h-[1px] flex-grow transition-all ${step > st.num ? 'bg-emerald-500' : 'bg-brand-border/60'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Main step inputs workspace with clean animation */}
      <div className="bg-brand-bg/25 border border-brand-border/30 rounded-xl p-4 sm:p-5 text-xs text-brand-text-muted min-h-[190px]">
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, x: lang === 'fa' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Name / Host */}
            <div>
              <label className="block font-semibold text-brand-text mb-1.5">{t.name} *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tehran-Ubt-Main"
                className="w-full bg-brand-bg/65 border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-all font-mono"
              />
            </div>

            {/* IP Address */}
            <div>
              <label className="block font-semibold text-brand-text mb-1.5">{t.ip} *</label>
              <div className="relative">
                <Globe className={`absolute top-3 w-4 h-4 text-brand-text-muted ${lang === 'fa' ? 'left-3' : 'right-3'}`} />
                <input
                  type="text"
                  required
                  value={ip}
                  onChange={(e) => setIp(e.target.value.trim())}
                  placeholder="e.g. 185.112.56.24"
                  className="w-full bg-brand-bg/65 border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-all font-mono"
                />
              </div>
            </div>

            {/* SSH Port */}
            <div>
              <label className="block font-semibold text-brand-text mb-1.5">{t.sshPort} *</label>
              <input
                type="number"
                required
                value={sshPort}
                onChange={(e) => setSshPort(Number(e.target.value))}
                placeholder="e.g. 22"
                className="w-full bg-brand-bg/65 border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-all font-mono"
              />
            </div>

            {/* Categories Clustering dropdown */}
            <div>
              <label className="block font-semibold text-brand-text mb-1.5">{t.searchCategory} *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-all cursor-pointer font-sans"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="text-black bg-white">
                    {lang === 'fa' ? cat.nameFa : cat.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Operating System Distribution Selector */}
            <div className="col-span-1 md:col-span-2 border-t border-brand-border/30 pt-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-brand-text mb-1.5">
                  {lang === 'fa' ? 'توزیع سیستم‌عامل' : 'Operating System Distro'} *
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: 'ubuntu', label: 'Ubuntu', logo: '🟠' },
                    { id: 'debian', label: 'Debian', logo: '🌀' },
                    { id: 'centos', label: 'Rocky/Cent', logo: '🟢' },
                    { id: 'alpine', label: 'Alpine', logo: '🏔️' },
                    { id: 'windows', label: 'Windows', logo: '🪟' },
                  ].map((os) => {
                    const isSelected = osType === os.id;
                    return (
                      <button
                        type="button"
                        key={os.id}
                        onClick={() => setOsType(os.id)}
                        className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'border-brand-accent bg-brand-accent/20 text-white font-bold'
                            : 'border-brand-border/40 bg-brand-bg/40 text-brand-text-muted hover:border-brand-accent/20'
                        }`}
                        title={os.label}
                      >
                        <span className="text-sm select-none">{os.logo}</span>
                        <span className="text-[8px] font-mono leading-none truncate w-full text-center">{os.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-brand-text mb-1.5">
                  {lang === 'fa' ? 'نسخه سیستم‌عامل' : 'OS Version / Edition'} *
                </label>
                <input
                  type="text"
                  required
                  value={osVersion}
                  onChange={(e) => setOsVersion(e.target.value)}
                  placeholder="e.g. 22.04 LTS, 12, 2022"
                  className="w-full bg-brand-bg/65 border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-all font-mono"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: lang === 'fa' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-1.5 text-brand-accent font-semibold text-[11px] uppercase tracking-wider mb-2 border-b border-brand-border/30 pb-2">
              <Shield className="w-4 h-4 text-brand-accent-secondary" />
              <span>{lang === 'fa' ? 'تنظیمات دسترسی ریشه (Root Access)' : 'Root Access Credentials'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-brand-text-muted mb-1.5">{t.username} *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-brand-bg/65 border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-all font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-brand-text-muted mb-1.5">{t.password} ({t.optional})</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-brand-bg/65 border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-all font-mono"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, x: lang === 'fa' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 animate-fade-in"
          >
            <div className="flex items-center gap-1.5 text-brand-accent font-semibold text-[11px] uppercase tracking-wider border-b border-brand-border/30 pb-2 mb-2">
              <DollarSign className="w-4 h-4 text-brand-accent-secondary animate-pulse" />
              <span>{lang === 'fa' ? 'مشخصات فاکتور و اجاره هاست' : 'Provider Leases & Billing Cycles'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Select Hosting accounts Provider */}
              <div>
                <label className="block font-semibold text-brand-text-muted mb-1.5">{t.provider}</label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-all cursor-pointer font-sans"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id} className="text-black bg-white">
                      {p.name} ({p.balance} {p.currency === 'TOMAN' ? t.toman : p.currency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Billing Type Selection */}
              <div>
                <label className="block font-semibold text-brand-text-muted mb-1.5">{lang === 'fa' ? 'چرخه صورت‌حساب' : 'Billing Schema'}</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBillingType('cycle')}
                    className={`py-2 px-1 rounded-lg border font-medium text-center transition-all text-[11px] ${
                      billingType === 'cycle'
                        ? 'bg-brand-accent/20 border-brand-accent text-white font-bold'
                        : 'bg-brand-bg/45 border-brand-border/40 text-brand-text-muted hover:border-brand-accent/30'
                    }`}
                  >
                    {t.monthlyBilling}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingType('hourly')}
                    className={`py-2 px-1 rounded-lg border font-medium text-center transition-all text-[11px] ${
                      billingType === 'hourly'
                        ? 'bg-brand-accent/20 border-brand-accent text-white font-bold'
                        : 'bg-brand-bg/45 border-brand-border/40 text-brand-text-muted hover:border-brand-accent/30'
                    }`}
                  >
                    {t.hourlyBilling}
                  </button>
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block font-semibold text-brand-text-muted mb-1.5">{t.currency}</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-all cursor-pointer font-sans"
                >
                  <option value="USD" className="text-black bg-white">{t.usd}</option>
                  <option value="EUR" className="text-black bg-white">{t.eur}</option>
                  <option value="TOMAN" className="text-black bg-white">{t.toman}</option>
                </select>
              </div>

              {/* Rate Core Cost */}
              <div>
                <label className="block font-semibold text-brand-text-muted mb-1.5">
                  {billingType === 'hourly' 
                    ? (lang === 'fa' ? 'هزینه ماهانه معادل' : 'Equiv. Monthly Cost:')
                    : t.costLabel}
                </label>
                <input
                  type="number"
                  step="any"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full bg-brand-bg/65 border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent font-mono"
                />
              </div>

              {/* Period Days - Cycle billing only */}
              {billingType === 'cycle' && (
                <div>
                  <label className="block font-semibold text-brand-text-muted mb-1.5">{t.cycleDays}</label>
                  <input
                    type="number"
                    value={cycleDays}
                    onChange={(e) => setCycleDays(Number(e.target.value))}
                    className="w-full bg-brand-bg/65 border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent font-mono"
                  />
                </div>
              )}

              {/* Starting lease date / genesis */}
              <div>
                <label className="block font-semibold text-brand-text-muted mb-1.5">
                  <CalendarCheck className="inline-block w-3.5 h-3.5 mr-1" />
                  {t.lastRenewalDate}
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-brand-bg/65 border border-brand-border rounded-lg p-2.5 text-brand-text focus:outline-none focus:border-brand-accent font-sans"
                />
              </div>
            </div>
            
            {billingType === 'hourly' && (
              <p className="text-[10px] text-brand-accent-secondary bg-brand-accent-secondary/5 p-2 rounded border border-brand-accent-secondary/20">
                ℹ {t.hourlyDesc}
              </p>
            )}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            initial={{ opacity: 0, x: lang === 'fa' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Custom server labels / Tagging checkbox array */}
            <div>
              <label className="block font-semibold text-brand-text mb-2 flex items-center gap-1.5">
                <TagIcon className="w-4 h-4 text-brand-accent" />
                {t.tags}
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-brand-bg/40 rounded-xl border border-brand-border/40">
                {tags.map((tag) => {
                  const checked = selectedTags.includes(tag.id);
                  return (
                    <button
                      type="button"
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase transition-all cursor-pointer ${
                        checked
                          ? 'border-transparent text-white animate-pulse'
                          : 'border-brand-border/50 text-brand-text-muted bg-brand-bg/40 hover:border-brand-accent/30'
                      }`}
                      style={{
                        backgroundColor: checked ? tag.color : undefined,
                        color: checked ? tag.textColor : undefined,
                        boxShadow: checked ? `0 0 10px ${tag.color}3a` : undefined,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full border border-white" style={{ backgroundColor: tag.color }}></span>
                      <span>{lang === 'fa' ? tag.nameFa : tag.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct notepad area */}
            <div>
              <label className="block font-semibold text-brand-text mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand-accent-secondary" />
                {t.notes}
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.personalNotesPlaceholder}
                className="w-full bg-brand-bg/65 border border-brand-border rounded-lg p-3 text-brand-text focus:outline-none focus:border-brand-accent transition-all font-mono leading-relaxed"
              ></textarea>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer controls buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-brand-border/30">
        
        {/* Cancel Button (Always visible on left / right depending on RTL) */}
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-black/10 border border-brand-border hover:bg-black/25 text-brand-text-muted hover:text-brand-text font-semibold rounded-lg transition-colors cursor-pointer text-xs"
        >
          {t.cancel}
        </button>

        {/* Wizard Navigation Actions */}
        <div className="flex gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-3.5 py-2 bg-brand-bg border border-brand-border hover:bg-brand-bg-light text-brand-text font-semibold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <ChevronRight className={`w-4 h-4 ${lang === 'fa' ? '' : 'rotate-180'}`} />
              <span>{lang === 'fa' ? 'گام قبلی' : 'Back'}</span>
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-bold rounded-lg transition-all cursor-pointer text-xs flex items-center gap-1"
            >
              <span>{lang === 'fa' ? 'گام بعدی' : 'Next Step'}</span>
              <ChevronLeft className={`w-4 h-4 ${lang === 'fa' ? '' : 'rotate-180'}`} />
            </button>
          ) : (
            <button
              type="submit"
              className="px-5 py-2 bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-bold rounded-lg transition-all cursor-pointer text-xs shadow-lg shadow-brand-accent/15 flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>{t.saveConfig}</span>
            </button>
          )}
        </div>
      </div>
    </motion.form>
  );
}
