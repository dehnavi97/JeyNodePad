import React, { useState } from 'react';
import { ShieldAlert, KeyRound, ArrowLeft, Delete } from 'lucide-react';
// @ts-ignore
import appLogo from '../../assets/icon_small.png';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { motion } from 'motion/react';

interface LockScreenProps {
  correctPin: string;
  lang: Language;
  onUnlock: () => void;
}

export function LockScreen({ correctPin, lang, onUnlock }: LockScreenProps) {
  const [enteredPin, setEnteredPin] = useState('');
  const [isError, setIsError] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleKeyPress = (num: string) => {
    setIsError(false);
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      
      // Auto submit on reaching 4 numbers
      if (nextPin === correctPin) {
        onUnlock();
      } else if (nextPin.length === 4) {
        // Failed attempt
        setTimeout(() => {
          setIsError(true);
          setEnteredPin('');
        }, 120);
      }
    }
  };

  const handleClear = () => {
    setEnteredPin('');
    setIsError(false);
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  return (
    <div className="fixed inset-0 z-50 terminal-grid bg-brand-bg flex items-center justify-center p-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-sm bg-brand-card border ${isError ? 'border-rose-500 animate-shake' : 'border-brand-border'} rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center backdrop-blur bg-opacity-95`}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-accent via-brand-accent-secondary to-brand-accent"></div>

        <div className="inline-flex p-[1.5px] rounded-2xl bg-gradient-to-br from-brand-accent to-brand-accent-secondary mb-4 shadow-md shadow-brand-accent/15">
          <div className="w-14 h-14 bg-brand-bg rounded-2xl flex items-center justify-center overflow-hidden p-1">
            <img src={appLogo} alt="Logo" className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2 font-mono">
          {t.lockTitle}
        </h2>
        
        <p className="text-xs text-brand-text-muted mb-6">
          {t.lockSecureDesc}
        </p>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const hasVal = enteredPin.length > idx;
            return (
              <motion.div
                key={idx}
                animate={{
                  scale: hasVal ? 1.2 : 1,
                  backgroundColor: isError 
                    ? '#ef4444' 
                    : hasVal 
                    ? 'var(--brand-accent)' 
                    : 'transparent'
                }}
                className={`w-4 h-4 rounded-full border-2 ${
                  isError 
                    ? 'border-rose-600' 
                    : hasVal 
                    ? 'border-brand-accent' 
                    : 'border-brand-border'
                }`}
              ></motion.div>
            );
          })}
        </div>

        {/* Error message */}
        {isError && (
          <div className="text-xs text-rose-500 font-bold mb-4">
            {t.passcodePinError}
          </div>
        )}

        {/* Grid Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-4 font-mono select-none" dir="ltr">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full border border-brand-border/40 bg-brand-bg/50 hover:bg-brand-accent/20 hover:border-brand-accent active:scale-95 transition-all text-white font-bold text-xl flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={handleClear}
            className="w-16 h-16 rounded-full text-xs text-brand-text-muted hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            {lang === 'fa' ? 'پاک‌کردن' : 'Clear'}
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full border border-brand-border/40 bg-brand-bg/50 hover:bg-brand-accent/20 hover:border-brand-accent active:scale-95 transition-all text-white font-bold text-xl flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full text-brand-text-muted hover:text-brand-accent flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
