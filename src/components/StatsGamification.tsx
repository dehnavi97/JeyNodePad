import React from 'react';
import { Award, Shield, CheckCircle2, Circle, Flame } from 'lucide-react';
import { TRANSLATIONS, SYSADMIN_TITLES } from '../constants';
import { Language, UserStats, SysadminQuest } from '../types';
import { motion } from 'motion/react';

interface StatsGamificationProps {
  stats: UserStats;
  quests: SysadminQuest[];
  lang: Language;
  onClaimQuest: (questId: string) => void;
}

export function StatsGamification({ stats, quests, lang, onClaimQuest }: StatsGamificationProps) {
  const t = TRANSLATIONS[lang];

  // Get current title based on level
  const levelTitle = SYSADMIN_TITLES.find((o) => o.level === stats.sysadminLevel) || {
    en: 'Command-Line Overlord',
    fa: 'ارباب مطلق ترمینال و شبکه',
  };

  // Level Up logic: Level i requires i * 100 XP to level up. E.g. Level 1 needs 100 XP.
  const xpNeeded = stats.sysadminLevel * 100;
  const progressPercent = Math.min(Math.round((stats.xp / xpNeeded) * 100), 100);

  return (
    <div className="space-y-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      {/* Level Summary Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-brand-card/80 border border-brand-border/60 rounded-2xl p-5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 transform translate-x-8 -translate-y-8 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Circular badge */}
          <div className="w-16 h-16 rounded-full bg-brand-accent/15 border-2 border-brand-accent text-brand-accent flex items-center justify-center font-bold text-2xl font-mono shadow-lg shadow-brand-accent/10 shrink-0">
            {stats.sysadminLevel}
          </div>

          <div className="text-center sm:text-right flex-1" style={{ textAlign: lang === 'fa' ? 'right' : 'left' }}>
            <h3 className="text-md font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
              <Award className="w-4 h-4 text-brand-accent-secondary" />
              <span>{lang === 'fa' ? levelTitle.fa : levelTitle.en}</span>
            </h3>
            <p className="text-xs text-brand-text-muted mt-1">
              {t.levelTitle}: <span className="font-mono text-white font-semibold">{stats.xp}</span> / <span className="font-mono text-brand-accent">{xpNeeded} XP</span>
            </p>

            {/* Custom Progress Bar */}
            <div className="w-full h-2.5 bg-black/40 rounded-full mt-3 overflow-hidden border border-brand-border/40">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-to-r from-brand-accent to-brand-accent-secondary rounded-full"
              ></motion.div>
            </div>
          </div>

          {/* Metrics box */}
          <div className="flex gap-3 text-center sm:border-l sm:border-brand-border/30 sm:pl-4">
            <div className="px-3 py-1 bg-brand-bg/60 border border-brand-border/30 rounded-lg">
              <div className="text-[10px] text-brand-text-muted">{lang === 'fa' ? 'عملیاتی' : 'Active Nodes'}</div>
              <div className="text-sm font-bold text-white font-mono">{stats.totalServersCreated}</div>
            </div>
            <div className="px-3 py-1 bg-brand-bg/60 border border-brand-border/30 rounded-lg">
              <div className="text-[10px] text-brand-text-muted">{lang === 'fa' ? 'تمدیدهای موفق' : 'Success leases'}</div>
              <div className="text-sm font-bold text-white font-mono">{stats.totalRenewalsLogged}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Guild Quests list */}
      <div className="bg-brand-card/60 border border-brand-border/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4.5 h-4.5 text-brand-accent-secondary" />
          <h4 className="text-xs font-bold tracking-wider uppercase text-white">
            {t.quests}
          </h4>
        </div>

        <div className="space-y-2.5">
          {quests.map((quest) => {
            const isCompleted = stats.completedQuests.includes(quest.id);
            return (
              <div
                key={quest.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  isCompleted 
                    ? 'bg-brand-accent/5 border-brand-accent/30' 
                    : 'bg-brand-bg/40 border-brand-border/40 hover:border-brand-border/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    disabled={isCompleted}
                    onClick={() => onClaimQuest(quest.id)}
                    className={`mt-0.5 shrink-0 ${isCompleted ? 'text-brand-accent cursor-default' : 'text-brand-text-muted hover:text-brand-accent-secondary transition-colors cursor-pointer'}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <h5 className={`text-xs font-semibold ${isCompleted ? 'text-brand-text-muted line-through' : 'text-white'}`}>
                      {lang === 'fa' ? quest.titleFa : quest.titleEn}
                    </h5>
                    <p className="text-[10px] text-brand-text-muted mt-0.5 leading-snug">
                      {lang === 'fa' ? quest.descriptionFa : quest.descriptionEn}
                    </p>
                  </div>
                </div>

                {/* Reward Badge */}
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${isCompleted ? 'bg-brand-bg/30 text-brand-text-muted border border-brand-border/20' : 'bg-brand-accent-secondary/15 text-brand-accent-secondary border border-brand-accent-secondary/30'}`}>
                  +{quest.xpReward} XP
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
