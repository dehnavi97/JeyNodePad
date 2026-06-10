import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Play, Copy, Check, Cpu, RefreshCw, Layers, ShieldAlert, X, Minimize2, PlayCircle, Loader2 } from 'lucide-react';
import { Server, Language } from '../types';
import { copyToClipboard } from '../utils';
import { motion } from 'motion/react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

const isTauri = typeof window !== 'undefined' && (('__TAURI__' in window) || (window as any).__TAURI__ !== undefined);

interface SshTabTerminalProps {
  key?: string;
  server: Server;
  lang: Language;
  initialCommand?: string;
  initialCommandName?: string;
  onClose: () => void;
  isActive?: boolean;
}

interface NanoState {
  filename: string;
  content: string;
  filePath: string;
}

export function SshTabTerminal({ server, lang, initialCommand, initialCommandName, onClose, isActive }: SshTabTerminalProps) {
  const [logs, setLogs] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [inputVal, setInputVal] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isHtopActive, setIsHtopActive] = useState(false);
  const [htopData, setHtopData] = useState({ cpu: 12, ram: 45, tasks: 98 });
  const [isCopied, setIsCopied] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  // Interval IDs tracking for cleanup on destruction
  const intervalsRef = useRef<number[]>([]);

  const addInterval = (id: any) => {
    intervalsRef.current.push(id);
  };

  // Clean up all intervals on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(id => clearInterval(id));
      console.log(`SSH Connection to server ${server.ip} terminated.`);
    };
  }, [server.ip]);

  // Close custom context menu on outside click or scroll events
  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu, true);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu, true);
    };
  }, []);

  // Real SSH connection
  useEffect(() => {
    setLogs('');
    setIsConnecting(true);

    let unlisten: (() => void) | undefined;

    const startSsh = async () => {
      if (!isTauri) {
        setLogs(
          `$ ssh ${server.username}@${server.ip} -p ${server.sshPort}\n` +
          `[JeyNode Error]: Real SSH is only available in the desktop version.\n` +
          `This environment is running in a browser.`
        );
        setIsConnecting(false);
        return;
      }

      unlisten = await listen<{ id: string; output: string }>('ssh-output', (event) => {
        if (event.payload.id === server.id) {
          setLogs(prev => prev + event.payload.output);
          setIsConnecting(false);
        }
      });

      try {
        await invoke('ssh_connect', {
          id: server.id,
          ip: server.ip,
          port: server.sshPort,
          user: server.username,
          pass: server.password
        });

        if (initialCommand) {
          // Wait a bit for shell to be ready
          setTimeout(() => {
            invoke('ssh_write', { id: server.id, data: initialCommand + '\n' });
          }, 1000);
        }
      } catch (err: any) {
        setLogs(prev => [...prev, `\r\n[JeyNode Error]: ${err}\r\n`]);
        setIsConnecting(false);
      }
    };

    startSsh();

    return () => {
      if (unlisten) unlisten();
      if (isTauri) {
        invoke('ssh_close', { id: server.id }).catch(() => {});
      }
    };
  }, [server.id]);

  // Scroll terminal logs on update or tab activation
  useEffect(() => {
    if (isActive) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isConnecting, isActive]);

  // Focus input automatically when active
  useEffect(() => {
    if (isActive) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isActive]);


  // Executes standard commands
  const handleCommandRun = (cmdStr: string) => {
    if (!isTauri) return;

    // Command is now just sent to backend
    invoke('ssh_write', { id: server.id, data: cmdStr + '\n' });
    setInputVal('');
  };

  const handleCopyClipboard = () => {
    copyToClipboard(logs).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Keyboard navigation for history entries
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommandRun(inputVal);
    }
  };


  return (
    <div 
      className="flex-1 flex flex-col h-full bg-slate-950 text-emerald-400 font-mono text-[11px] select-text relative rounded-2xl border border-brand-border/40 overflow-hidden shadow-2xl glow-card"
      style={{ direction: 'ltr' }}
      onClick={() => {
        const selection = window.getSelection()?.toString();
        if (!selection) {
          inputRef.current?.focus();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      
      {/* Top Header Information Panel */}
      <div className="bg-slate-900 border-b border-brand-border/30 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse-slow">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-xs">{server.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 flex items-center gap-1.5 font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                {lang === 'fa' ? 'اتصال برقرار است' : 'SSH Link Active'}
              </span>
            </div>
            <div className="text-[9px] text-brand-text-muted mt-0.5 font-mono">
              {server.username}@{server.ip}:{server.sshPort}
            </div>
          </div>
        </div>

        {/* Buttons / Controls */}
        <div className="flex items-center gap-2">

          {/* Copy whole session log */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyClipboard();
            }}
            className="p-2 rounded-lg bg-slate-800/80 border border-brand-border/40 hover:text-white text-brand-text-muted cursor-pointer transition-colors"
            title="Copy logs"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Wipe log screen */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLogs('');
            }}
            className="p-2 rounded-lg bg-slate-800/80 border border-brand-border/40 hover:text-white text-brand-text-muted cursor-pointer transition-colors"
            title="Clear"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Close connection */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 hover:bg-rose-600 hover:text-white text-rose-400 cursor-pointer transition-colors"
            title={lang === 'fa' ? 'قطع اتصال' : 'Disconnect SSH'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CORE DISPLAY WINDOW */}
      <div className="flex-1 p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-brand-border text-left select-text h-[400px] sshBox">
        {/* Logs render */}
        <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-zinc-300 leading-normal mb-2">
          {logs}
        </pre>

        {/* INTEGRATED INTERNAL INLINE INPUT FOR AUTHENTIC SSH CONTROL FEEL */}
        <div className="flex items-start sm:items-center gap-1.5 pt-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-emerald-400 font-bold shrink-0 font-mono text-xs select-none">
            {'>'}
          </span>
          <input
            ref={inputRef}
            type="text"
            disabled={isConnecting}
            placeholder={isConnecting ? (lang === 'fa' ? 'در حال اتصال...' : 'Connecting...') : ''}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none text-white text-xs font-mono focus:outline-none focus:ring-0 placeholder:text-zinc-600 outline-none p-0 tracking-wider disabled:opacity-40"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
        <div ref={terminalEndRef} />
      </div>

      {contextMenu && (
        <div 
          className="fixed ForceFixed z-50 bg-slate-900/95 border border-brand-border/60 rounded-xl shadow-2xl py-1.5 min-w-[200px] backdrop-blur-md glow-card text-left font-sans text-xs text-white"
          style={{ 
            top: `${contextMenu.y}px`, 
            left: `${contextMenu.x}px`,
            direction: lang === 'fa' ? 'rtl' : 'ltr'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Copy Selected */}
          <button
            onClick={() => {
              const selectedText = window.getSelection()?.toString();
              if (selectedText) {
                copyToClipboard(selectedText).then(() => {
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                });
              } else {
                handleCopyClipboard();
              }
              setContextMenu(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 transition-colors cursor-pointer ${
              lang === 'fa' ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-sans">
                {lang === 'fa' 
                  ? (window.getSelection()?.toString() ? 'کپی بخش انتخاب‌شده' : 'کپی کردن تمام گزارش‌ها') 
                  : (window.getSelection()?.toString() ? 'Copy Selection' : 'Copy All Logs')}
              </span>
            </div>
            <span className="text-[10px] text-brand-text-muted font-mono select-none">Ctrl+C</span>
          </button>

          {/* Paste */}
          <button
            onClick={async () => {
              setContextMenu(null);
              try {
                const text = await navigator.clipboard.readText();
                if (text) {
                  setInputVal(prev => prev + text);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }
              } catch (err) {
                console.warn('Clipboard read not supported, paste via Ctrl+V', err);
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 transition-colors cursor-pointer font-sans ${
              lang === 'fa' ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'fa' ? 'جایگذاری متن (Paste)' : 'Paste text'}</span>
            </div>
            <span className="text-[10px] text-brand-text-muted font-mono select-none">Ctrl+V</span>
          </button>

          <div className="my-1 border-t border-brand-border/30" />

          {/* Clear screen */}
          <button
            onClick={() => {
              setLogs('');
              setContextMenu(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-colors cursor-pointer font-sans ${
              lang === 'fa' ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-yellow-400" />
            <span>{lang === 'fa' ? 'پاکسازی صفحه (Clear)' : 'Clear Console logs'}</span>
          </button>


          <div className="my-1 border-t border-brand-border/30" />

          {/* Exit prompt / Disconnect */}
          <button
            onClick={() => {
              onClose();
              setContextMenu(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer font-sans ${
              lang === 'fa' ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <X className="w-3.5 h-3.5 text-rose-500" />
            <span>{lang === 'fa' ? 'قطع اتصال (Disconnect)' : 'Disconnect Session'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
