import React, { useState, useEffect } from 'react';
import { Theme, Language } from '../types';
import { TRANSLATIONS } from '../constants';
// @ts-ignore
import appLogo from '../../assets/icon_small.png';
import { Monitor, KeyRound, CheckSquare, Sparkles, Languages, Paintbrush } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingProps {
  onComplete: (lang: Language, theme: Theme, pin?: string) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [lang, setLang] = useState<Language>('fa');
  const [theme, setTheme] = useState<Theme>('frosted-glass');
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const t = TRANSLATIONS[lang];

  const themeOptions: { id: Theme; nameEn: string; nameFa: string; colorClass: string; desc: string }[] = [
    { id: 'frosted-glass', nameEn: 'Ultra Frosted Glass 🌌', nameFa: 'شیشه مات کهکشانی (پیش‌فرض)', colorClass: 'bg-indigo-600/40 border-indigo-400', desc: 'Deep violet space mist under ice-coated glass sheets' },
    { id: 'frosted-emerald', nameEn: 'Frosted Emerald 🌿', nameFa: 'شیشه مات اِمرالد', colorClass: 'bg-emerald-600/40 border-emerald-400', desc: 'Peaceful deep forest evergreen ice-glass mist' },
    { id: 'frosted-amethyst', nameEn: 'Frosted Amethyst 🔮', nameFa: 'شیشه مات بنفش رویال', colorClass: 'bg-purple-600/40 border-purple-400', desc: 'Mystical imperial purple with hot fuschia highlights' },
    { id: 'frosted-sunset', nameEn: 'Frosted Sunset 🌅', nameFa: 'شیشه مات شفق پاییز', colorClass: 'bg-orange-600/40 border-yellow-400', desc: 'Cozy warming solar embers on velvet glass plates' },
    { id: 'frosted-ocean', nameEn: 'Frosted Ocean 🌊', nameFa: 'شیشه مات سـافایر مِستر', colorClass: 'bg-cyan-600/40 border-blue-400', desc: 'Chilled sapphire deep ocean current under frozen sheets' },
    { id: 'frosted-cyberpunk', nameEn: 'Frosted Cyberpunk ⚡', nameFa: 'شیشه مات سایبرپانک', colorClass: 'bg-pink-600/40 border-yellow-400', desc: 'Sizzling bright neon pulse fused with glass refraction' },
    { id: 'sweet-pink', nameEn: 'Sweet Lavender Rose 🎀', nameFa: 'شیشه مات صورتی فانتزی', colorClass: 'bg-rose-500/40 border-rose-400', desc: 'Soothing sweet rose orchid glass aesthetics' },
    { id: 'nordic-cold', nameEn: 'Nordic Silver Ice ❄️', nameFa: 'شیشه مات یخ قطبی', colorClass: 'bg-slate-400/40 border-slate-300', desc: 'Pure silver-asphalt winter glass minimalism' },
    { id: 'soft-orange', nameEn: 'Paper Orange Shell 📄', nameFa: 'کاغذی پرتقالی (روشن)', colorClass: 'bg-orange-500 border-orange-400', desc: 'Simple white display layout with crisp orange details' },
    { id: 'neon-dark', nameEn: 'Laser Violet 👾', nameFa: 'بنفش نئونی تاریک', colorClass: 'bg-indigo-900 border-indigo-400', desc: 'Dark sleek cockpit with laser violet & neon outline accents' },
    { id: 'cyberpunk', nameEn: 'Classic Cyberpunk ☣️', nameFa: 'سایبرپانک کلاسیک زرد', colorClass: 'bg-yellow-400 border-pink-500', desc: 'Highly reactive high-contrast classic yellow & toxic pink' },
    { id: 'emerald-gate', nameEn: 'Emerald Safe House 🔐', nameFa: 'زمرد سبز کلاسیک', colorClass: 'bg-emerald-800 border-emerald-500', desc: 'Safe offline green display, comfortable on eyes' },
    { id: 'sunset-pulse', nameEn: 'Volcanic Glow 🌋', nameFa: 'سولار و غروب کلاسیک', colorClass: 'bg-orange-700 border-amber-400', desc: 'Rich volcanic oranges and deep coal backgrounds' },
    { id: 'royal-classic', nameEn: 'Crown Museum 👑', nameFa: 'سلطنتی سرمه زرد', colorClass: 'bg-amber-700 border-sky-400', desc: 'Golden accents with deep oceanic navy backdrop' },
  ];

  // Apply theme class to documentElement & body during onboarding welcome preview
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
    
    const currentThemeClass = `theme-${theme}`;
    root.classList.add(currentThemeClass);
    body.classList.add(currentThemeClass);
  }, [theme]);

  const handleFinish = () => {
    if (pinEnabled) {
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        setPinError(lang === 'fa' ? 'کد مستر باید دقیقاً ۴ رقم ریاضی باشد' : 'PIN must be exactly 4 numeric characters');
        return;
      }
      if (pin !== confirmPin) {
        setPinError(lang === 'fa' ? 'کد وارد شده دوباره همخوانی ندارد' : 'PIN codes do not match!');
        return;
      }
    }
    onComplete(lang, theme, pinEnabled ? pin : undefined);
  };

  return (
    <div className={`min-h-screen terminal-grid bg-brand-bg flex items-center justify-center p-4 transition-all duration-300 theme-${theme}`} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-brand-card/90 border border-brand-border/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl glow-card relative overflow-hidden"
      >
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-brand-accent-secondary/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Title & Introduction */}
        <div className="text-center mb-8">
          <div className="inline-flex p-[1.5px] rounded-2xl bg-gradient-to-br from-brand-accent to-brand-accent-secondary mb-4 shadow-md shadow-brand-accent/15">
            <div className="w-14 h-14 bg-brand-bg rounded-2xl flex items-center justify-center overflow-hidden p-1">
              <img src={appLogo} alt="Logo" className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-mono">
            {TRANSLATIONS[lang].welcome}
          </h1>
          <p className="text-sm text-brand-text-muted max-w-lg mx-auto">
            {TRANSLATIONS[lang].welcomeDesc}
          </p>
        </div>

        {/* 1. Language Toggle Carousel */}
        <div className="mb-6 p-4 rounded-xl bg-black/30 border border-brand-border/40">
          <label className="text-xs font-semibold tracking-wider text-brand-accent uppercase mb-3 flex items-center gap-2">
            <Languages className="w-4 h-4 text-brand-accent-secondary" />
            {t.langSelect}
          </label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => setLang('fa')}
              className={`p-3 rounded-lg border font-medium text-xs transition-all ${
                lang === 'fa'
                  ? 'bg-brand-accent/20 border-brand-accent text-white font-bold'
                  : 'bg-brand-bg/45 border-brand-border/50 text-brand-text-muted hover:border-brand-accent/40'
              }`}
            >
              فارسی (RTL Layout)
            </button>
            <button
              onClick={() => setLang('en')}
              className={`p-3 rounded-lg border font-medium text-xs transition-all ${
                lang === 'en'
                  ? 'bg-brand-accent/20 border-brand-accent text-white font-bold'
                  : 'bg-brand-bg/45 border-brand-border/50 text-brand-text-muted hover:border-brand-accent/40'
              }`}
            >
              English (LTR Layout)
            </button>
          </div>
        </div>

        {/* 2. Theme Selective Bento */}
        <div className="mb-6 p-4 rounded-xl bg-black/30 border border-brand-border/40">
          <label className="text-xs font-semibold tracking-wider text-brand-accent uppercase mb-2 flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-brand-accent-secondary" />
            {t.themeSelect}
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`p-3 text-right rounded-lg border transition-all flex items-start gap-3 relative overflow-hidden ${
                  theme === opt.id
                    ? 'border-brand-accent bg-brand-accent/10 shadow-lg'
                    : 'border-brand-border/40 bg-brand-bg/30 hover:border-brand-accent/30'
                }`}
                style={{ direction: lang === 'fa' ? 'rtl' : 'ltr' }}
              >
                <div className={`w-4 h-4 rounded-full mt-1 shrink-0 ${opt.colorClass} border-2`}></div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {lang === 'fa' ? opt.nameFa : opt.nameEn}
                  </div>
                  <div className="text-[10px] text-brand-text-muted mt-1 leading-snug">
                    {opt.desc}
                  </div>
                </div>
                {theme === opt.id && (
                  <div className="absolute top-1 right-1">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Security Shield Option */}
        <div className="mb-8 p-4 rounded-xl bg-black/30 border border-brand-border/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-accent" />
              {lang === 'fa' ? 'سپر رمزگذاری عددی (Lock-PIN)' : 'Cryptographic Entry lock-PIN'}
            </span>
            <input
              type="checkbox"
              id="pinToggle"
              checked={pinEnabled}
              onChange={(e) => setPinEnabled(e.target.checked)}
              className="w-4 h-4 text-brand-accent bg-brand-bg rounded border-brand-border focus:ring-brand-accent focus:ring-2 accent-brand-accent cursor-pointer"
            />
          </div>

          {pinEnabled && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 pt-3 border-t border-brand-border/30 grid grid-cols-2 gap-4"
            >
              <div>
                <label className="text-[10px] text-brand-text-muted">
                  {lang === 'fa' ? 'رمز ورود ۴ رقمی:' : '4-Digit PIN Code:'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setPinError('');
                    setPin(e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder="e.g. 1376"
                  className="w-full mt-1 bg-brand-bg border border-brand-border text-center text-sm p-2 rounded text-white focus:outline-none focus:border-brand-accent font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-brand-text-muted">
                  {lang === 'fa' ? 'تکرار رمز ورود:' : 'Confirm PIN:'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => {
                    setPinError('');
                    setConfirmPin(e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder="e.g. 1376"
                  className="w-full mt-1 bg-brand-bg border border-brand-border text-center text-sm p-2 rounded text-white focus:outline-none focus:border-brand-accent font-mono"
                />
              </div>
              {pinError && (
                <div className="col-span-2 text-[11px] text-rose-500 font-bold block pt-1">
                  ⚠ {pinError}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleFinish}
          className="w-full bg-brand-accent hover:bg-brand-accent/90 text-brand-bg py-3 px-6 rounded-xl font-bold font-mono text-sm shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          {t.getStarted}
        </button>
      </motion.div>
    </div>
  );
}
