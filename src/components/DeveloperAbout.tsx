import { User, Send, Calendar, Cpu, Bookmark } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { copyToClipboard } from '../utils';
import React, { useState } from 'react';
import { motion } from 'motion/react';

interface DeveloperAboutProps {
  lang: Language;
}

export function DeveloperAbout({ lang }: DeveloperAboutProps) {
  const t = TRANSLATIONS[lang];
  const [copied, setCopied] = useState(false);

  const handleCopyTelegram = () => {
    copyToClipboard('@Jey_Box').then((success) => {
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-card/70 border border-brand-border/60 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md"
    >
      <div className="absolute top-0 right-0 p-8 transform translate-x-12 -translate-y-12 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
        {/* Profile Avatar Frame */}
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-accent to-brand-accent-secondary p-[2px] shadow-xl">
            <div className="w-full h-full bg-brand-bg rounded-2xl flex items-center justify-center text-brand-accent">
              <User className="w-12 h-12" />
            </div>
          </div>
          <span className="absolute -bottom-2 -right-2 bg-brand-accent text-brand-bg text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono shadow">
            Creator
          </span>
        </div>

        {/* Bio text */}
        <div className="text-center md:text-right flex-1" style={{ textAlign: lang === 'fa' ? 'right' : 'left' }}>
          <h3 className="text-xl font-bold text-white mb-1">
            {t.creatorName}
          </h3>
          <p className="text-xs text-brand-accent-secondary font-semibold font-mono mb-2">
            Lead Decent Tech Architect / Chief Security Officer
          </p>
          <p className="text-xs text-brand-text-muted leading-relaxed max-w-xl">
            {t.aboutDesc}
          </p>
        </div>

        {/* Social Channel Direct Link */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">
            {t.creatorTg}
          </span>
          <button
            onClick={handleCopyTelegram}
            className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-bg rounded-xl font-bold text-xs transition-transform hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-lg shadow-brand-accent/10"
          >
            <Send className="w-4 h-4" />
            <span>@Jey_Box</span>
            {copied && (
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">
                ✓ {t.copied}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Metadata diagnostics spec boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-brand-border/30 text-xs font-mono">
        <div className="p-3 bg-brand-bg/40 border border-brand-border/30 rounded-xl">
          <div className="text-brand-text-muted text-[10px] uppercase flex items-center gap-1.5 mb-1">
            <Bookmark className="w-3.5 h-3.5 text-brand-accent" />
            <span>App Name</span>
          </div>
          <div className="text-white font-bold">JeyNodePad</div>
        </div>

        <div className="p-3 bg-brand-bg/40 border border-brand-border/30 rounded-xl">
          <div className="text-brand-text-muted text-[10px] uppercase flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5 text-brand-accent-secondary" />
            <span>Build Release</span>
          </div>
          <div className="text-white font-bold">v1.4.0-Stable</div>
        </div>

        <div className="p-3 bg-brand-bg/40 border border-brand-border/30 rounded-xl">
          <div className="text-brand-text-muted text-[10px] uppercase flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-brand-accent" />
            <span>Temporal Point</span>
          </div>
          <div className="text-white font-bold">June 2026</div>
        </div>

        <div className="p-3 bg-brand-bg/40 border border-brand-border/30 rounded-xl">
          <div className="text-brand-text-muted text-[10px] uppercase flex items-center gap-1.5 mb-1">
            <Send className="w-3.5 h-3.5 text-brand-accent-secondary" />
            <span>License Core</span>
          </div>
          <div className="text-white font-bold">Apache-2.0</div>
        </div>
      </div>
    </motion.div>
  );
}
