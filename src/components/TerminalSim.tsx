import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Play, Copy, Check, Server as ServerIcon, Network } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language, Server } from '../types';
import { copyToClipboard } from '../utils';
import { motion } from 'motion/react';

interface TerminalSimProps {
  server: Server;
  lang: Language;
}

export function TerminalSim({ server, lang }: TerminalSimProps) {
  const t = TRANSLATIONS[lang];
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isPingerRunning, setIsPingerRunning] = useState(false);
  const [sshCopied, setSshCopied] = useState(false);
  const [pingCopied, setPingCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Default welcome
  useEffect(() => {
    setTerminalLogs([
      `${t.terminalPrompt} initialized core module diagnostics.`,
      `Target Node Name: ${server.name}`,
      `Access Target IP: ${server.ip} (Port ${server.sshPort})`,
      `Root User Context: ${server.username}`,
      `Ready to simulate Ping Diagnostic Transmission. Use button below.`,
    ]);
  }, [server, lang]);

  // Scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const runPingSimulation = () => {
    if (isPingerRunning) return;

    setIsPingerRunning(true);
    setTerminalLogs((prev) => [
      ...prev,
      `\n${t.terminalPrompt} ping ${server.ip} -c 4`,
      t.pingerSim,
    ]);

    let seq = 1;
    const interval = setInterval(() => {
      const ms = Math.floor(Math.random() * 85) + 15;
      const responseLine = t.pingerOnline
        .replace('{ip}', server.ip)
        .replace('{ms}', ms.toString());

      setTerminalLogs((prev) => [...prev, responseLine]);

      seq++;
      if (seq > 4) {
        clearInterval(interval);
        // Summarize
        setTimeout(() => {
          setTerminalLogs((prev) => [
            ...prev,
            `--- ${server.ip} ping statistics ---`,
            `4 packets transmitted, 4 received, 0% packet loss, time 3004ms`,
            `rtt min/avg/max/mdev = 15.22/38.45/85.12/12.44 ms`,
            `${t.terminalPrompt} `,
          ]);
          setIsPingerRunning(false);
        }, 300);
      }
    }, 600);
  };

  const copySshCommand = () => {
    const cmd = `ssh ${server.username}@${server.ip} -p ${server.sshPort}`;
    copyToClipboard(cmd).then((success) => {
      if (success) {
        setSshCopied(true);
        setTimeout(() => setSshCopied(false), 2000);
      }
    });
  };

  const copyPingCommand = () => {
    const cmd = `ping ${server.ip} -t`;
    copyToClipboard(cmd).then((success) => {
      if (success) {
        setPingCopied(true);
        setTimeout(() => setPingCopied(false), 2000);
      }
    });
  };

  return (
    <div className="bg-black/80 rounded-xl border border-brand-border/60 overflow-hidden font-mono text-[11px] text-emerald-400 p-4">
      {/* Mini Top bar */}
      <div className="flex items-center justify-between border-b border-brand-border/30 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand-accent-secondary" />
          <span className="text-[10px] text-brand-text-muted font-bold tracking-wider uppercase">
            {lang === 'fa' ? 'شبیه‌ساز ترافیک شبکه پایگاه' : 'Network Diagnostics Terminal'}
          </span>
        </div>
        <div className="flex gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        </div>
      </div>

      {/* Console Display */}
      <div className="h-44 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-brand-border text-left" dir="ltr">
        {terminalLogs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap leading-relaxed hover:bg-white/5 px-1 py-0.5 rounded">
            {log}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Mini controls panel */}
      <div className="mt-4 pt-3 border-t border-brand-border/30 grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ direction: lang === 'fa' ? 'rtl' : 'ltr' }}>
        {/* Run simulator button */}
        <button
          onClick={runPingSimulation}
          disabled={isPingerRunning}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-brand-accent text-brand-bg hover:bg-brand-accent/95 disabled:bg-brand-border/50 disabled:text-brand-text-muted rounded-lg font-bold font-mono transition-transform active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{t.runDiagnostics}</span>
        </button>

        {/* Windows CMD commands */}
        <div className="flex flex-col gap-1.5 text-[10px] text-brand-text-muted">
          {/* SSH Command */}
          <button
            onClick={copySshCommand}
            className="flex items-center justify-between p-1.5 bg-brand-bg/50 border border-brand-border/40 rounded-md hover:border-brand-accent/40 hover:text-white transition-colors cursor-pointer text-left font-mono"
            dir="ltr"
            title={t.sshCmdCopy}
          >
            <span className="truncate max-w-[200px]">ssh {server.username}@{server.ip} -p {server.sshPort}</span>
            <span className="text-[10px] text-brand-accent flex items-center gap-1 shrink-0 ml-2">
              {sshCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {sshCopied ? 'OK' : 'SSH'}
            </span>
          </button>

          {/* Ping Command */}
          <button
            onClick={copyPingCommand}
            className="flex items-center justify-between p-1.5 bg-brand-bg/50 border border-brand-border/40 rounded-md hover:border-brand-accent/40 hover:text-white transition-colors cursor-pointer text-left font-mono"
            dir="ltr"
            title={t.pingCmdCopy}
          >
            <span>ping {server.ip} -t</span>
            <span className="text-[10px] text-brand-accent-secondary flex items-center gap-1 shrink-0 ml-2">
              {pingCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {pingCopied ? 'OK' : 'PING'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
