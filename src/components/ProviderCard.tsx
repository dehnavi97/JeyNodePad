import React from 'react';
import { ProviderAccount, Server, Language } from '../types';
import { calculateProviderFuelDays } from '../utils';
import { TRANSLATIONS } from '../constants';
import { Wallet, Compass, AlertTriangle, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ProviderCardProps {
  key?: string;
  provider: ProviderAccount;
  servers: Server[];
  lang: Language;
  onTopUp: (providerId: string, amount: number) => void;
}

export function ProviderCard({ provider, servers, lang, onTopUp }: ProviderCardProps): React.JSX.Element {
  const t = TRANSLATIONS[lang];

  // Calculate days of fuel left
  const fuelDays = calculateProviderFuelDays(provider, servers);
  
  // Find servers connected
  const associatedServers = servers.filter(
    s => !s.deleted && s.providerId === provider.id && s.billingType === 'hourly' && s.status === 'active'
  );

  // Sum combined monthly burn cost
  const totalMonthlyBurn = associatedServers.reduce((acc, s) => acc + s.cost, 0);
  const totalDailyBurn = totalMonthlyBurn / 30;

  // Render fuel status
  let fuelStatusText = '';
  let fuelColorClass = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  let isAlert = false;

  if (fuelDays === 'infinite') {
    fuelStatusText = t.infiniteFuel;
  } else {
    fuelStatusText = `${fuelDays} ${lang === 'fa' ? 'روز حیات باقیمانده' : 'Days of fuel remaining'}`;
    if (fuelDays <= 5) {
      fuelColorClass = 'text-rose-400 border-rose-500/30 bg-rose-500/10 animate-pulse';
      isAlert = true;
    } else if (fuelDays <= 15) {
      fuelColorClass = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      isAlert = true;
    }
  }

  const handleQuickAdd = () => {
    let promptMsg = lang === 'fa' 
      ? `مبلغ مورد نیاز شارژ حساب ${provider.name} را وارد کنید:` 
      : `Enter credit balance top-up amount for account ${provider.name}:`;
    let response = window.prompt(promptMsg, '10');
    if (response) {
      let val = parseFloat(response);
      if (!isNaN(val) && val > 0) {
        onTopUp(provider.id, val);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-card/70 border border-brand-border/50 rounded-xl p-4 flex flex-col justify-between"
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
    >
      <div>
        {/* Title / Name */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-accent-secondary" />
            <h4 className="text-sm font-bold text-brand-text uppercase font-mono">{provider.name}</h4>
          </div>
          <button
            onClick={handleQuickAdd}
            className="text-[10px] bg-brand-accent/20 hover:bg-brand-accent text-brand-text font-bold p-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
            title={lang === 'fa' ? 'شارژ سریع حساب' : 'Quick balance top-up'}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{lang === 'fa' ? 'شارژ حساب' : 'Top up'}</span>
          </button>
        </div>

        {/* Balance spec */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2 bg-brand-bg/65 rounded-lg">
            <span className="text-[9px] text-brand-text-muted uppercase block">{t.providerBalance}</span>
            <span className="text-brand-text font-bold font-mono text-sm leading-tight">
              {provider.balance} <span className="text-brand-accent text-xs">{provider.currency === 'TOMAN' ? t.toman : provider.currency}</span>
            </span>
          </div>

          <div className="p-2 bg-brand-bg/65 rounded-lg">
            <span className="text-[9px] text-brand-text-muted uppercase block">{lang === 'fa' ? 'سوخت مصرفی در ماه' : 'Burn-rate sum / mo'}</span>
            <span className="text-brand-text font-bold font-mono text-sm leading-tight">
              {Math.round(totalMonthlyBurn * 100) / 100} <span className="text-brand-accent text-xs">{provider.currency === 'TOMAN' ? t.toman : provider.currency}</span>
            </span>
          </div>
        </div>

        {/* Associated nodes count */}
        <div className="text-[10px] text-brand-text-muted flex items-center gap-1.5 mb-3">
          <Compass className="w-3.5 h-3.5 text-brand-accent" />
          <span>
            {lang === 'fa' 
              ? `${associatedServers.length} گره ساعتی فعال روی این پنل متصل است.` 
              : `${associatedServers.length} active hourly nodes calculated on this workspace.`}
          </span>
        </div>
      </div>

      {/* Fuel indicator timeline */}
      <div className={`p-2 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 mt-auto ${fuelColorClass}`}>
        {isAlert && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
        <span>{fuelStatusText}</span>
      </div>
    </motion.div>
  );
}
