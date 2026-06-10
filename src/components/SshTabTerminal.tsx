import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Play, Copy, Check, Cpu, RefreshCw, Layers, ShieldAlert, X, Minimize2, PlayCircle, Loader2 } from 'lucide-react';
import { Server, Language } from '../types';
import { copyToClipboard } from '../utils';
import { motion } from 'motion/react';

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
  const [logs, setLogs] = useState<string[]>([]);
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

  // Advanced Virtual Linux Filesystem & Directories State
  const [currentDir, setCurrentDir] = useState<string>('/home/ubuntu');
  const [fileSystem, setFileSystem] = useState<Record<string, { type: 'file' | 'dir'; content?: string; children?: string[] }>>({
    '/': { type: 'dir', children: ['home', 'var', 'etc', 'usr', 'root'] },
    '/home': { type: 'dir', children: ['ubuntu'] },
    '/home/ubuntu': { type: 'dir', children: ['welcome.txt', 'scripts', 'sanaee.sh'] },
    '/home/ubuntu/welcome.txt': { type: 'file', content: 'Welcome to JeyNode Web SSH Terminal!\nFeel free to explore our virtual environment.\nType "help" to view custom operational directions.' },
    '/home/ubuntu/scripts': { type: 'dir', children: ['update.sh'] },
    '/home/ubuntu/scripts/update.sh': { type: 'file', content: '#!/bin/bash\nsudo apt update && sudo apt upgrade -y' },
    '/home/ubuntu/sanaee.sh': { type: 'file', content: '#!/bin/bash\nbash <(curl -Ls https://raw.githubusercontent.com/ir-vahid/sanaee/master/install.sh)' },
    '/var': { type: 'dir', children: ['log', 'www'] },
    '/var/log': { type: 'dir', children: ['nginx', 'syslog'] },
    '/var/log/syslog': { type: 'file', content: 'Jun 10 14:55:01 jeynode systemd[1]: Started Periodic Command Scheduler.\nJun 10 14:59:12 jeynode sshd[42]: Accepted publickey for ubuntu from 109.124.88.204 port 22' },
    '/var/log/nginx': { type: 'dir', children: ['access.log', 'error.log'] },
    '/var/log/nginx/access.log': { type: 'file', content: '127.0.0.1 - - [10/Jun/2026:14:56:11] "GET /api/health HTTP/1.1" 200 15 "-" "curl/8.5.0"' },
    '/var/log/nginx/error.log': { type: 'file', content: '2026/06/10 14:56:11 [info] 518#518: *1 client 127.0.0.1 closed keep alive connection' },
    '/etc': { type: 'dir', children: ['nginx', 'hosts', 'resolv.conf'] },
    '/etc/hosts': { type: 'file', content: '127.0.0.1   localhost\n127.0.1.1   jeynode\n\n# The following lines are desirable for IPv6 capable hosts\n::1     localhost ip6-localhost ip6-loopback' },
    '/etc/resolv.conf': { type: 'file', content: 'nameserver 8.8.8.8\nnameserver 1.1.1.1' },
    '/etc/nginx': { type: 'dir', children: ['nginx.conf'] },
    '/etc/nginx/nginx.conf': { type: 'file', content: 'user nginx;\nworker_processes auto;\nerror_log /var/log/nginx/error.log;\npid /run/nginx.pid;\n\nevents {\n    worker_connections 1024;\n}' },
    '/root': { type: 'dir', children: ['.bashrc'] },
    '/root/.bashrc': { type: 'file', content: '# ~/.bashrc: executed by bash(1) for non-login shells.\nexport PATH=$PATH:/usr/local/bin' }
  });

  // Editor states
  const [nanoState, setNanoState] = useState<NanoState | null>(null);
  const [isPythonMode, setIsPythonMode] = useState<boolean>(false);

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

  // Initial connection simulation
  useEffect(() => {
    setLogs([]);
    setIsConnecting(true);
    setIsHtopActive(false);
    setNanoState(null);
    setIsPythonMode(false);

    const connectionLines = [
      `$ ssh ${server.username}@${server.ip} -p ${server.sshPort}`,
      `Connecting to remote address [${server.ip}] via port ${server.sshPort}...`,
      `Establishing secure encrypted SSH-2.0-OpenSSH_9.6p1 protocol channel...`,
      `🔒 Verifying JeyNode encrypted credentials from crypt-vault...`
    ];

    let lineIndex = 0;
    const connTimer = setInterval(() => {
      if (lineIndex < connectionLines.length) {
        setLogs(prev => [...prev, connectionLines[lineIndex]]);
        lineIndex++;
      } else {
        clearInterval(connTimer);
        // Authentication success
        setTimeout(() => {
          setLogs(prev => [
            ...prev,
            `🔑 Private key authenticated (authorized_keys verified).`,
            `Last login: ${new Date(Date.now() - 3600000 * 2.5).toLocaleString()} from 109.124.88.204`,
            `\n`,
            `===================================================================`,
            `  __       _  _           _      ___           _ `,
            `  \\_\\ ___ | || | ___   __| | ___| _ \\ __ _  __| |`,
            `   | |/ _ \\| || |/ _ \\ / _\` |/ _ \\  _// _\` |/ _\` |`,
            ` __| |  __/| || | (_) | (_| |  __/ |_| (_| | (_| |`,
            `/\\__/ \\___||_||_|\\___/ \\__,_|\\___|\\___|\\__,_|\\__,_|`,
            `                                                  `,
            ` Welcome to JeyNodePad Web-SSH Virtual Console v2.0`,
            ` Dedicated Sandbox Ingress IP: ${server.ip}`,
            ` OS Distribution: Ubuntu 24.04 LTS (GNU/Linux kernel 6.8.0-31)`,
            `===================================================================`,
            `\n`,
            ` * System Load Average: 0.22, 0.15, 0.08`,
            ` * System CPU Usage:   8.4% (Active nodes check)`,
            ` * RAM Utilization:   32% of 4.0 GB total space`,
            ` * HDD Allocation:    16.12 GB (38.5% capacity occupied)`,
            ` * Active Operations: 12 background tunnels running`,
            `\n`,
            `Type 'help' to inspect authorized virtual commands inside JeyNode.`,
          ]);
          setIsConnecting(false);

          // Focus input on complete
          setTimeout(() => inputRef.current?.focus(), 150);

          // Trigger initial automated command if present
          if (initialCommand) {
            triggerAutomatedCommand(initialCommand, initialCommandName);
          }
        }, 500);
      }
    }, 450);

    return () => clearInterval(connTimer);
  }, [server, initialCommand]);

  // Scroll terminal logs on update or tab activation
  useEffect(() => {
    if (isActive) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isConnecting, isHtopActive, nanoState, isPythonMode, isActive]);

  // Focus input automatically when active
  useEffect(() => {
    if (isActive && !isHtopActive && !nanoState) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isActive, isHtopActive, nanoState]);

  // Handle live CPU/RAM changes inside htop simulation
  useEffect(() => {
    if (!isHtopActive) return;

    const timer = setInterval(() => {
      setHtopData({
        cpu: Math.min(100, Math.max(2, Math.floor(Math.random() * 40) + (Math.random() > 0.5 ? 5 : 20))),
        ram: Math.min(100, Math.max(30, Math.floor(Math.random() * 5) + 42)),
        tasks: Math.floor(Math.random() * 6) + 96
      });
    }, 1500);

    addInterval(timer);
    return () => clearInterval(timer);
  }, [isHtopActive]);

  // Formats dir structure for prompt
  const displayDir = currentDir === '/home/ubuntu' ? '~' : currentDir;

  // Resolves absolute pathing and relative directory moving
  const handleCd = (targetPath: string) => {
    if (!targetPath || targetPath === '~') {
      setCurrentDir('/home/ubuntu');
      return;
    }
    if (targetPath === '/') {
      setCurrentDir('/');
      return;
    }

    let resolvedPath = '';
    if (targetPath.startsWith('/')) {
      resolvedPath = targetPath;
    } else {
      const parts = targetPath.split('/');
      let currentParts = currentDir === '/' ? [] : currentDir.split('/');

      for (const part of parts) {
        if (part === '.' || part === '') continue;
        if (part === '..') {
          currentParts.pop();
        } else {
          currentParts.push(part);
        }
      }
      resolvedPath = '/' + currentParts.join('/');
    }

    if (resolvedPath === '') resolvedPath = '/';

    // Clean trailing slash
    if (resolvedPath.endsWith('/') && resolvedPath !== '/') {
      resolvedPath = resolvedPath.substring(0, resolvedPath.length - 1);
    }

    const targetNode = fileSystem[resolvedPath];
    if (targetNode && targetNode.type === 'dir') {
      setCurrentDir(resolvedPath);
    } else if (targetNode && targetNode.type === 'file') {
      setLogs(prev => [...prev, `-bash: cd: ${targetPath}: Not a directory`]);
    } else {
      setLogs(prev => [...prev, `-bash: cd: ${targetPath}: No such file or directory`]);
    }
  };

  // Lists files layout
  const handleLs = (options: string[]) => {
    const isDetailed = options.includes('-l') || options.includes('-la') || options.includes('-al') || options.includes('la') || options.includes('ll');
    const showHidden = options.includes('-a') || options.includes('-la') || options.includes('-al');

    const node = fileSystem[currentDir];
    if (!node || !node.children) return;

    let items = [...node.children];
    if (showHidden) {
      items = ['.', '..', ...items];
    }

    if (isDetailed) {
      setLogs(prev => [
        ...prev,
        `total ${items.length * 4}`,
        ...items.map(item => {
          let isDir = false;
          let pSize = 4096;
          if (item === '.' || item === '..') {
            isDir = true;
          } else {
            const itemPath = currentDir === '/' ? `/${item}` : `${currentDir}/${item}`;
            const target = fileSystem[itemPath];
            isDir = target?.type === 'dir';
            pSize = target?.type === 'file' ? (target.content?.length || 0) : 4096;
          }

          const typeChar = isDir ? 'd' : '-';
          const permissions = isDir ? 'rwxr-xr-x' : 'rw-r--r--';
          return `${typeChar}${permissions} 2 ubuntu ubuntu ${pSize.toString().padStart(5)} Jun 10 14:55 ${item}${isDir ? '/' : ''}`;
        })
      ]);
    } else {
      setLogs(prev => [...prev, items.map(item => {
        const itemPath = currentDir === '/' ? `/${item}` : `${currentDir}/${item}`;
        const isDir = item === '.' || item === '..' || fileSystem[itemPath]?.type === 'dir';
        return isDir ? `${item}/` : item;
      }).join('    ')]);
    }
  };

  // Creates blank files
  const handleTouch = (filename: string) => {
    if (!filename) {
      setLogs(prev => [...prev, 'touch: missing file operand']);
      return;
    }
    const fullPath = currentDir === '/' ? `/${filename}` : `${currentDir}/${filename}`;

    setFileSystem(prev => {
      const parent = prev[currentDir];
      if (!parent || !parent.children) return prev;
      const updatedChildren = parent.children.includes(filename) ? parent.children : [...parent.children, filename];

      return {
        ...prev,
        [currentDir]: { ...parent, children: updatedChildren },
        [fullPath]: { type: 'file', content: '' }
      };
    });
  };

  // Create directory
  const handleMkdir = (dirname: string) => {
    if (!dirname) {
      setLogs(prev => [...prev, 'mkdir: missing operand']);
      return;
    }
    const fullPath = currentDir === '/' ? `/${dirname}` : `${currentDir}/${dirname}`;

    setFileSystem(prev => {
      const parent = prev[currentDir];
      if (!parent || !parent.children) return prev;
      const updatedChildren = parent.children.includes(dirname) ? parent.children : [...parent.children, dirname];

      return {
        ...prev,
        [currentDir]: { ...parent, children: updatedChildren },
        [fullPath]: { type: 'dir', children: [] }
      };
    });
  };

  // Removes a file or directory
  const handleRm = (target: string, isRecursive: boolean) => {
    if (!target) {
      setLogs(prev => [...prev, 'rm: missing operand']);
      return;
    }

    const fullPath = currentDir === '/' ? `/${target}` : `${currentDir}/${target}`;
    const targetNode = fileSystem[fullPath];

    if (!targetNode) {
      setLogs(prev => [...prev, `rm: cannot remove '${target}': No such file or directory`]);
      return;
    }

    if (targetNode.type === 'dir' && !isRecursive) {
      setLogs(prev => [...prev, `rm: cannot remove '${target}': Is a directory (use -r)`]);
      return;
    }

    setFileSystem(prev => {
      const nextFS = { ...prev };
      delete nextFS[fullPath];

      // Remove from parent children
      const parent = nextFS[currentDir];
      if (parent && parent.children) {
        nextFS[currentDir] = {
          ...parent,
          children: parent.children.filter(c => c !== target)
        };
      }
      return nextFS;
    });

    setLogs(prev => [...prev, `Removed ${targetNode.type === 'dir' ? 'directory' : 'file'} '${target}'`]);
  };

  // GNU Nano Editor Saver
  const handleSaveNano = () => {
    if (!nanoState) return;
    const path = nanoState.filePath;
    const name = nanoState.filename;

    setFileSystem(prev => {
      const parentDir = currentDir;
      const parentNode = prev[parentDir];
      let updatedChildren = parentNode?.children ? [...parentNode.children] : [];
      if (parentNode && !updatedChildren.includes(name)) {
        updatedChildren.push(name);
      }

      return {
        ...prev,
        ...(parentNode ? { [parentDir]: { ...parentNode, children: updatedChildren } } : {}),
        [path]: { type: 'file', content: nanoState.content }
      };
    });

    setLogs(prev => [...prev, `[nano] Saved changes to ${path} (${nanoState.content.length} B)`]);
    setNanoState(null);
  };

  // Executes standard commands
  const handleCommandRun = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    // Add to history
    setCommandHistory(prev => [trimmed, ...prev]);
    setHistoryIndex(-1);

    // Save prompt to log
    const userPrompt = isPythonMode 
      ? `>>> ${trimmed}` 
      : `[${server.username}@${server.name}]:${displayDir}$ ${trimmed}`;
    setLogs(prev => [...prev, userPrompt]);
    setInputVal('');

    // Handle python interpretation mode
    if (isPythonMode) {
      setTimeout(() => {
        const cleanPy = trimmed.toLowerCase();
        if (cleanPy === 'exit()' || cleanPy === 'quit()') {
          setIsPythonMode(false);
          setLogs(prev => [...prev, 'Exited Python REPL session back to bash environment.']);
          return;
        }

        try {
          if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
            const inside = trimmed.slice(6, -1);
            setLogs(prev => [...prev, inside.replace(/['"]/g, '')]);
          } else {
            // Arithmetic fallback
            const result = new Function(`return (${trimmed})`)();
            if (result !== undefined) {
              setLogs(prev => [...prev, String(result)]);
            }
          }
        } catch (e: any) {
          setLogs(prev => [
            ...prev,
            `  File "<stdin>", line 1`,
            `SyntaxError: invalid syntax (${e.message})`
          ]);
        }
      }, 50);
      return;
    }

    // Standard shell execution parsing
    const parts = trimmed.split(/\s+/);
    const coreCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    setTimeout(() => {
      switch (coreCmd) {
        case 'help':
          setLogs(prev => [
            ...prev,
            `🔧 JeyNode Virtual Console Engine (Full Interactive Linux Emulator v2.0)`,
            `      help              Display this details roster index.`,
            `      ls [options]      List folder items (supports: ls, ls -la, etc.)`,
            `      cd <directory>    Navigate filesystem folders (supports: cd .., cd ~)`,
            `      pwd               Print active folder path in workspace.`,
            `      cat <file>        Read the contents of a text asset.`,
            `      nano <file>       Open interactive inline GUI text editor.`,
            `      touch <file>      Synthesize a new blank asset in current folder.`,
            `      mkdir <dir>       Construct a new folder tier.`,
            `      rm [-r] <item>    Delete folder items or files.`,
            `      echo <msg>        Broadcast messages or redirect (e.g. echo "text" > file.txt).`,
            `      python3 / python  Initiate virtual python prompt session.`,
            `      neofetch          Render structural system and OS graphics.`,
            `      ip a / ip config  Inspect active interfaces and network.`,
            `      htop              Launch gorgeous real-time visual system resources monitor.`,
            `      df -h / free -m   Check simulated disk space and memory buffers.`,
            `      ping <host>       Simulate direct ping requests (e.g., ping google.com).`,
            `      docker ps         Display container logs or processes.`,
            `      apt               Execute system simulated library actions (apt update).`,
            `      sanaee            Configure Sanaee management dashboard on current node.`,
            `      clear             Empty terminal screen.`,
            `      exit              Terminate SSH session completely.`,
            `\n* Supporting arbitrary user commands: Unknown commands will execute with realistic bash returns.`
          ]);
          break;

        case 'clear':
          setLogs([]);
          break;

        case 'pwd':
          setLogs(prev => [...prev, currentDir]);
          break;

        case 'whoami':
          setLogs(prev => [...prev, server.username || 'ubuntu']);
          break;

        case 'who':
          setLogs(prev => [...prev, `${server.username || 'ubuntu'}   pts/0        2026-06-10 14:55 (109.124.88.204)`]);
          break;

        case 'cd':
          handleCd(args[0]);
          break;

        case 'ls':
          handleLs(args);
          break;

        case 'touch':
          handleTouch(args[0]);
          break;

        case 'mkdir':
          handleMkdir(args[0]);
          break;

        case 'rm':
          const isRec = args.includes('-r') || args.includes('-rf');
          const targetItem = args.filter(a => !a.startsWith('-'))[0];
          handleRm(targetItem, isRec);
          break;

        case 'nano':
          if (!args[0]) {
            setLogs(prev => [...prev, 'nano: missing filename parameter']);
            break;
          }
          const nanoFilename = args[0];
          const nanoPath = currentDir === '/' ? `/${nanoFilename}` : `${currentDir}/${nanoFilename}`;
          const existingFile = fileSystem[nanoPath];

          if (existingFile && existingFile.type === 'dir') {
            setLogs(prev => [...prev, `nano: '${nanoFilename}' is a directory`]);
          } else {
            setNanoState({
              filename: nanoFilename,
              content: existingFile?.content || '',
              filePath: nanoPath
            });
          }
          break;

        case 'cat':
          if (!args[0]) {
            setLogs(prev => [...prev, 'cat: missing filename operand']);
            break;
          }
          const catFilename = args[0];
          const catPath = currentDir === '/' ? `/${catFilename}` : `${currentDir}/${catFilename}`;
          const catNode = fileSystem[catPath];

          if (!catNode) {
            setLogs(prev => [...prev, `cat: ${catFilename}: No such file or directory`]);
          } else if (catNode.type === 'dir') {
            setLogs(prev => [...prev, `cat: ${catFilename}: Is a directory`]);
          } else {
            setLogs(prev => [...prev, catNode.content || '']);
          }
          break;

        case 'echo':
          const redirectIdx = args.indexOf('>');
          if (redirectIdx !== -1) {
            const redirectText = args.slice(0, redirectIdx).join(' ').replace(/['"]/g, '');
            const destFile = args[redirectIdx + 1];
            if (destFile) {
              const fileLoc = currentDir === '/' ? `/${destFile}` : `${currentDir}/${destFile}`;
              setFileSystem(prev => {
                const parent = prev[currentDir];
                const updatedChildren = parent?.children && !parent.children.includes(destFile) 
                  ? [...parent.children, destFile] 
                  : (parent?.children || []);
                return {
                  ...prev,
                  ...(parent ? { [currentDir]: { ...parent, children: updatedChildren } } : {}),
                  [fileLoc]: { type: 'file', content: redirectText }
                };
              });
              setLogs(prev => [...prev, `[redirect] Redirection written into file '${destFile}'`]);
            } else {
              setLogs(prev => [...prev, 'echo: syntax error near redirection']);
            }
          } else {
            setLogs(prev => [...prev, args.join(' ').replace(/['"]/g, '')]);
          }
          break;

        case 'python':
        case 'python3':
          setIsPythonMode(true);
          setLogs(prev => [
            ...prev,
            `Python 3.12.3 (main, Apr 10 2026, 05:30:11)`,
            `[GCC 13.2.0] on Linux-Ubuntu-24.04`,
            `Type "help", "copyright", "credits" or "license" for more information.`,
          ]);
          break;

        case 'neofetch':
          setLogs(prev => [
            ...prev,
            `            .-/++/-.            ${server.username}@${server.name}`,
            `        .::/++++++++/::.        ---------------------`,
            `      .:////++++++++////:.      OS: Ubuntu 24.04 LTS x86_64`,
            `     ://////++++++++//////:     Host: KVM Virtual Machine Space`,
            `    .//////:--::::--://////.    Kernel: Linux 6.8.0-31-generic`,
            `    ://///.  -++++-  ./////:    Uptime: 14 days, 6 hours, 21 mins`,
            `    ://///.  -++++-  ./////:    Packages: 894 (dpkg), 12 (snap)`,
            `    .//////:--::::--://////.    Shell: bash 5.2.21`,
            `     ://////++++++++//////:     Terminal: JeyNode Webconsole v2.0`,
            `      .:////++++++++////:.      CPU: Automated E5-2696 v4 (2 cores)`,
            `        .::/++++++++/::.        Memory: 1320MiB / 4012MiB (32%)`,
            `            .-/++/-.            Disk: 16.12GB / 39.12GB (38%)`,
            `                                IP: ${server.ip} (via SSH Port ${server.sshPort})`,
          ]);
          break;

        case 'ip':
        case 'ifconfig':
          setLogs(prev => [
            ...prev,
            `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000`,
            `    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00`,
            `    inet 127.0.0.1/8 scope host lo`,
            `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000`,
            `    link/ether 52:54:00:73:da:ff brd ff:ff:ff:ff:ff:ff`,
            `    inet ${server.ip}/24 brd ${server.ip.substring(0, server.ip.lastIndexOf('.'))}.255 scope global dynamic eth0`,
            `    inet6 fe80::5054:ff:fe73:daff/64 scope link`,
          ]);
          break;

        case 'df':
          setLogs(prev => [
            ...prev,
            `Filesystem      Size  Used Avail Use% Mounted on`,
            `udev            1.9G     0  1.9G   0% /dev`,
            `tmpfs           393M  1.1M  392M   1% /run`,
            `/dev/vda1        39G   16G   23G  38% /`,
            `tmpfs           2.0G     0  2.0G   0% /dev/shm`,
            `tmpfs           5.0M     0  5.0M   0% /run/lock`,
          ]);
          break;

        case 'free':
          setLogs(prev => [
            ...prev,
            `               total        used        free      shared  buff/cache   available`,
            `Mem:            3922        1320        1518          12        1084        2340`,
            `Swap:           1024         180         844`,
          ]);
          break;

        case 'uname':
          if (args[0] === '-a' || args[0] === '-r') {
            setLogs(prev => [...prev, `Linux ${server.name} 6.8.0-31-generic #31-Ubuntu SMP Thursday Apr 11 02:22:15 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux`]);
          } else {
            setLogs(prev => [...prev, `Linux`]);
          }
          break;

        case 'htop':
          setIsHtopActive(true);
          break;

        case 'ping':
          const target = args[0] || 'google.com';
          setLogs(prev => [...prev, `PING ${target} (${target === 'google.com' ? '142.250.74.46' : '1.1.1.1'}) 56(84) bytes of data.`]);

          let count = 0;
          const pingInterval = setInterval(() => {
            if (count < 5) {
              const rtt = (Math.random() * 25 + 12).toFixed(1);
              setLogs(prev => [...prev, `64 bytes from ${target}: icmp_seq=${count+1} ttl=56 time=${rtt} ms`]);
              count++;
            } else {
              clearInterval(pingInterval);
              setLogs(prev => [
                ...prev,
                `\n--- ${target} ping statistics ---`,
                `5 packets transmitted, 5 received, 0% packet loss, time 4015ms`,
                `rtt min/avg/max = 12.1/20.4/37.2 ms`
              ]);
            }
          }, 600);
          addInterval(pingInterval);
          break;

        case 'docker':
          if (args[0] === 'ps') {
            setLogs(prev => [
              ...prev,
              `CONTAINER ID   IMAGE                 COMMAND                  CREATED        STATUS          PORTS                                      NAMES`,
              `fa371eec81e3   nginx:alpine          "/docker-entrypoint.…"   2 days ago     Up 48 hours     0.0.0.0:80->80/tcp, :::80->80/tcp           web-ingress`,
              `081bc13e31ae   redis:7-alpine        "docker-entrypoint.s…"   4 days ago     Up 4 days       0.0.0.0:6379->6379/tcp                     redis-cache`,
              `a3bc89139ffc   postgres:16-alpine    "docker-entrypoint.s…"   10 days ago    Up 10 days      0.0.0.0:5432->5432/tcp                     db-postgresql`,
            ]);
          } else {
            setLogs(prev => [...prev, `docker: commands available: 'docker ps', 'docker images'`]);
          }
          break;

        case 'sanaee':
        case 'x-ui':
          triggerAutomatedCommand('sanaee', 'Sanaee Panel Installation');
          break;

        case 'apt':
          if (args[0] === 'update' || args[0] === 'upgrade') {
            triggerAutomatedCommand('update', 'System Package Upgrade');
          } else {
            setLogs(prev => [...prev, `Usage: 'apt update' or 'apt upgrade' to run the server upgrade action.`]);
          }
          break;

        case 'exit':
          onClose();
          break;

        default:
          // ARBITRARY COMMAND WORKSPACE SIMULATOR Fallback (No Limit Shell)
          // Since the user typed a custom action or script, we run a realistic process simulation
          setLogs(prev => [
            ...prev,
            `⚙️ [Simulated Execution] env PATH=$PATH:/usr/bin /bin/bash -c "${trimmed}"`,
            `💡 System processed command execution logic internally...`,
            `Status: completed successfully with return-code: 0`,
          ]);
      }
    }, 150);
  };

  // Triggers simulated action script steps (like apt updates or custom curl installations)
  const triggerAutomatedCommand = (type: string, titleName?: string) => {
    setIsHtopActive(false);
    setIsConnecting(true);

    const isUpdate = type.includes('update') || type === 'update';
    const isSanaee = type.includes('sanaee') || type === 'sanaee';

    let scriptSteps = isSanaee ? [
      `$ bash <(curl -Ls https://raw.githubusercontent.com/ir-vahid/sanaee/master/install.sh)`,
      `[⚡ Sanaee Ingress] Initiating connection to repository api...`,
      `[⚡ Sanaee Ingress] Download successfully started (24.18 MB payload size)...`,
      `[⚡ Sanaee Ingress] Extracting directory structure & components to /usr/local/sanaee/...`,
      `[⚡ Sanaee Ingress] Installing system packages: curl, unzip, fail2ban, tar, iptables...`,
      `[⚡ Sanaee Ingress] Configuring cryptographic architecture... verified.`,
      `[⚡ Sanaee Ingress] Generating admin system login controls...`,
      `[⚡ Sanaee Ingress] Creating stateful systemd service configuration schema: sanaee.service`,
      `[⚡ Sanaee Ingress] Reloading daemon core and activating services...`,
      `\n`,
      `========================================================================`,
      `  🎉 SANAEE MANAGEMENT SYSTEM ESTABLISHED SUCCESSFULLY!`,
      `========================================================================`,
      `  Status:             ● operational (active / running)`,
      `  Local access path:   http://${server.ip}:2053`,
      `  Direct address path: http://[your-direct-public-ip]:2053`,
      `  Workspace Port:     2053`,
      `  Database Engine:    SQLite (local secure)`,
      `  Default Auth User:  admin`,
      `  Default Auth Pass:  admin`,
      `========================================================================`,
      `  Please execute 'ufw allow 2053/tcp' inside firewall policies.`,
      `\n`
    ] : isUpdate ? [
      `$ sudo apt-get update && sudo apt-get upgrade -y`,
      `Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease`,
      `Get:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]`,
      `Get:3 http://archive.ubuntu.com/ubuntu noble-backports InRelease [51.0 kB]`,
      `Get:4 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]`,
      `Fetched 303 kB in 1.4s (216 kB/s)`,
      `Reading state database... Done`,
      `Ready to fetch 5 package updates (Total size: 14.12 MB)...`,
      `[Processing updates] libc6 (2.39-0ubuntu8_amd64) ... 32%`,
      `[Processing updates] curl (8.5.0-2ubuntu10_amd64) ... 58%`,
      `[Processing updates] openssh-server (9.6p1-3ubuntu1_amd64) ... 84%`,
      `[Processing updates] systemd (255.4-1ubuntu8_amd64) ... 99%`,
      `Restarting OpenBSD Secure Shell sshd.service daemon...`,
      `Applying kernel tuning adjustments...`,
      `🚀 All packages and kernel libraries upgraded successfully! [0 errors]`
    ] : [
      `$ ${type}`,
      `⌛ Custom Action triggered: "${titleName || 'Background script shadow'}"`,
      `📡 Hooking connection channel to JeyNode terminal secure agent...`,
      `⚙️ Executing virtual commands on host at ${server.ip}...`,
      `📦 Processing packages, configuring environmental parameters...`,
      `🚀 Command sequence completed flawlessly with exit code 0.`
    ];

    let step = 0;
    const runner = setInterval(() => {
      if (step < scriptSteps.length) {
        setLogs(prev => [...prev, scriptSteps[step]]);
        step++;
      } else {
        clearInterval(runner);
        setIsConnecting(false);
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }, 400);

    addInterval(runner);
  };

  const handleCopyClipboard = () => {
    const data = logs.join('\n');
    copyToClipboard(data).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Keyboard navigation for history entries
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommandRun(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInputVal('');
      }
    }
  };

  const renderLogLine = (log: string, index: number) => {
    // If the log line is undefined, null, or not a string, handle it gracefully
    if (!log || typeof log !== 'string') {
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-zinc-300 hover:bg-white/5 px-1 py-0.5 rounded font-mono text-xs">
          {String(log || '')}
        </div>
      );
    }

    // If it's a command prompt entered by the user
    if (log.startsWith('$ ') || log.startsWith('>>> ')) {
      return (
        <div key={index} className="flex items-start gap-1.5 font-mono text-xs text-white/95 py-1 bg-brand-accent/5 px-2 border-l-2 border-brand-accent rounded-r font-semibold">
          <span className="text-yellow-400 shrink-0 font-bold select-none">{log.startsWith('>>> ') ? '>>>' : '$'}</span>
          <span className="text-brand-accent-secondary font-mono tracking-wide">{log.substring(log.startsWith('>>> ') ? 4 : 2)}</span>
        </div>
      );
    }

    // Dynamic prompt parsing and coloring in prompt logs (e.g. $[ubuntu@host]:~$ command)
    if (log.includes('[') && log.includes(']@') && log.includes(']:')) {
      const promptEndIdx = log.indexOf(']:');
      if (promptEndIdx !== -1) {
        const promptPart = log.substring(0, promptEndIdx + 2);
        const commandPart = log.substring(promptEndIdx + 2);
        
        const parts = promptPart.replace('[', '').split(']@');
        if (parts.length === 2) {
          const username = parts[0];
          const hostAndDir = parts[1];
          const dirSymbolIndex = hostAndDir.indexOf(']:');
          if (dirSymbolIndex !== -1) {
            const hostname = hostAndDir.substring(0, dirSymbolIndex);
            const remaining = hostAndDir.substring(dirSymbolIndex + 2);
            
            return (
              <div key={index} className="flex flex-wrap items-center gap-x-1.5 hover:bg-white/5 px-1 py-0.5 rounded font-mono text-xs">
                <span className="text-emerald-400 font-bold">[{username}</span>
                <span className="text-emerald-500 font-bold">@</span>
                <span className="text-cyan-400 font-bold">{hostname}</span>
                <span className="text-emerald-400 font-bold">]:</span>
                <span className="text-yellow-400 font-semibold">{remaining}</span>
                <span className="text-white ml-2 font-semibold tracking-wide">{commandPart}</span>
              </div>
            );
          }
        }
      }
    }

    // Success colors
    if (
      log.toLowerCase().includes('success') || 
      log.includes('🔑') || 
      log.includes('🔒') || 
      log.toLowerCase().includes('authenticated') || 
      log.toLowerCase().includes('welcome')
    ) {
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-emerald-400 hover:bg-white/5 px-1 py-0.5 rounded font-mono text-xs font-medium">
          {log}
        </div>
      );
    }

    // Warnings and Errors
    if (
      log.toLowerCase().includes('error') || 
      log.toLowerCase().includes('warn') || 
      log.toLowerCase().includes('fail') || 
      log.toLowerCase().includes('denied') || 
      log.includes('✘')
    ) {
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-2 py-1 rounded font-mono text-xs border-l-2 border-rose-500">
          {log}
        </div>
      );
    }

    // Interactive indicators
    if (
      log.startsWith('➔ ') || 
      log.toLowerCase().includes('running') || 
      log.toLowerCase().includes('establishing') || 
      log.toLowerCase().includes('verifying')
    ) {
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-cyan-400 hover:bg-white/5 px-1 py-0.5 rounded font-mono text-xs">
          {log}
        </div>
      );
    }

    // File listings/ls contents
    if (log.includes('welcome.txt') || log.includes('scripts') || log.includes('sanaee.sh') || log.includes('total ')) {
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-zinc-300 hover:bg-white/5 px-1 py-0.5 rounded font-mono text-xs">
          {log.split('    ').map((item, i) => {
            const isDir = item.endsWith('/');
            const isShell = item.endsWith('.sh');
            return (
              <span 
                key={i} 
                className={`mr-4 inline-block font-bold ${
                  isDir ? 'text-cyan-400 hover:underline' : isShell ? 'text-emerald-400' : 'text-zinc-100'
                }`}
              >
                {item}
              </span>
            );
          })}
        </div>
      );
    }

    // Default lines
    return (
      <div key={index} className="whitespace-pre-wrap leading-relaxed text-zinc-300 hover:bg-white/5 px-1 py-0.5 rounded font-mono text-xs leading-relaxed">
        {log}
      </div>
    );
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
          {/* Quick Stats shortcut */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNanoState(null);
              setIsHtopActive(!isHtopActive);
            }}
            className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
              isHtopActive 
                ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                : 'bg-slate-800/80 border-brand-border/40 hover:text-white text-emerald-400'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">htop</span>
          </button>

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
              setLogs([]);
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
      <div className="flex-1 p-5 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-brand-border text-left select-text h-[400px] sshBox">
        {nanoState ? (
          /* NANO TEXT EDITOR VIEW */
          <div className="flex-1 flex flex-col h-full bg-[#02070a] text-white p-3 font-mono text-xs rounded-xl border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white text-slate-900 px-3 py-1 flex justify-between select-none font-bold rounded">
              <span>  GNU nano 8.0</span>
              <span className="truncate">File: {nanoState.filename}</span>
              <span className="text-rose-600 font-extrabold uppercase animate-pulse">[Modified]</span>
            </div>
            
            <textarea
              value={nanoState.content}
              onChange={(e) => setNanoState({ ...nanoState, content: e.target.value })}
              className="w-full h-[220px] bg-[#010406] text-emerald-300 p-4 font-mono focus:outline-none resize-none leading-relaxed mt-2.5 rounded border border-white/5 outline-none"
              placeholder="Type your file content here..."
              autoFocus
            />
            
            {/* Nano Action items */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[9px] md:text-[10px] mt-3 p-2 bg-[#010304] border border-white/5 rounded select-none">
              <button 
                onClick={handleSaveNano}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-2 py-1.5 rounded font-black cursor-pointer transition-all"
              >
                <span className="bg-black/20 text-white px-1.5 py-0.5 rounded text-[8px]">^O</span>
                <span>Save File [WriteOut]</span>
              </button>
              <button 
                onClick={() => setNanoState(null)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-2 py-1.5 rounded font-bold cursor-pointer transition-all"
              >
                <span className="bg-black/20 text-white px-1.5 py-0.5 rounded text-[8px]">^X</span>
                <span>Exit [No Save]</span>
              </button>
              <div className="hidden sm:flex items-center text-zinc-500 gap-1 text-[8.5px]">
                <span className="bg-white/10 text-white px-1 py-0.5 rounded font-mono">^K</span> Cut text code
              </div>
              <div className="hidden sm:flex items-center text-zinc-500 gap-1 text-[8.5px]">
                <span className="bg-white/10 text-white px-1 py-0.5 rounded font-mono">^U</span> Paste clipboard
              </div>
            </div>
          </div>
        ) : isHtopActive ? (
          /* GLORIOUS HTOP PROCESSES OR RESOURCES VISUALIZER COCKPIT */
          <div className="space-y-4" style={{ direction: 'ltr' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-brand-border/30 pb-2">
              <span className="text-white text-xs font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>📊 SYSTEM REAL-TIME RESOURCE MONITOR (HTOP)</span>
              </span>
              <button 
                onClick={() => setIsHtopActive(false)}
                className="text-[10px] px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded cursor-pointer font-bold"
              >
                Exit Htop [F10]
              </button>
            </div>

            {/* Bars */}
            <div className="space-y-2.5">
              {/* CPU */}
              <div>
                <div className="flex justify-between text-[10px] text-brand-text-muted mb-1">
                  <span>CPU [Processor core E5-2696 v4]</span>
                  <span className="text-emerald-400 font-bold font-mono">{htopData.cpu}%</span>
                </div>
                <div className="w-full bg-slate-900 border border-brand-border/40 rounded-full h-3 overflow-hidden p-0.5">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${htopData.cpu}%` }}
                  />
                </div>
              </div>

              {/* Memory */}
              <div>
                <div className="flex justify-between text-[10px] text-brand-text-muted mb-1">
                  <span>RAM [Usage allocation]</span>
                  <span className="text-emerald-400 font-bold font-mono">{htopData.ram}% (1.76 GB / 4.0 GB)</span>
                </div>
                <div className="w-full bg-slate-900 border border-brand-border/40 rounded-full h-3 overflow-hidden p-0.5">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${htopData.ram}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Procs List */}
            <div className="pt-3">
              <span className="text-[10px] text-emerald-300 font-bold block mb-1">RUNNING SYSTEMD SERVICES & WORKSPACE PORTS:</span>
              <div className="border border-brand-border/30 rounded bg-slate-950 p-2 font-mono text-[10px] text-white/90 space-y-1">
                <div className="grid grid-cols-4 border-b border-brand-border/20 pb-1 text-emerald-400 font-bold mb-1.5">
                  <span>PID</span>
                  <span>CPU%</span>
                  <span>COMMAND</span>
                  <span>STATUS</span>
                </div>
                <div className="grid grid-cols-4 text-emerald-400 leading-tight">
                  <span className="font-mono">102</span>
                  <span>2.4%</span>
                  <span className="text-white">sanaee.service</span>
                  <span className="text-[9px] px-1 py-0.2 bg-emerald-500/10 rounded tracking-wider">ONLINE</span>
                </div>
                <div className="grid grid-cols-4 leading-tight text-emerald-300/80">
                  <span className="font-mono">518</span>
                  <span>1.1%</span>
                  <span className="text-white">nginx -g daemon off;</span>
                  <span className="text-[9px] px-1 py-0.2 bg-emerald-500/10 rounded tracking-wider">ONLINE</span>
                </div>
                <div className="grid grid-cols-4 leading-tight text-white/60">
                  <span className="font-mono">42</span>
                  <span>0.5%</span>
                  <span>sshd (listening: 22)</span>
                  <span className="text-[9px]">LISTENING</span>
                </div>
                <div className="grid grid-cols-4 leading-tight text-white/50">
                  <span className="font-mono">499</span>
                  <span>0.0%</span>
                  <span>dockerd daemon loop</span>
                  <span className="text-[9px]">SLEEPING</span>
                </div>
                <div className="grid grid-cols-4 leading-tight text-white/40">
                  <span className="font-mono">11</span>
                  <span>0.2%</span>
                  <span>systemd core controller</span>
                  <span className="text-[9px]">ISOLATED</span>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-brand-text-muted leading-relaxed">
              * The resource data feeds live telemetry loops simulating load checks. Pressing <span className="text-emerald-400 font-bold hover:underline cursor-pointer" onClick={() => setIsHtopActive(false)}>exit button</span> restores physical control shell logs instantly.
            </div>
          </div>
        ) : (
          <>
            {/* Logs render */}
            {logs.map((log, index) => renderLogLine(log, index))}

            {/* INTEGRATED INTERNAL INLINE INPUT FOR AUTHENTIC SSH CONTROL FEEL */}
            <div className="flex items-start sm:items-center gap-1.5 pt-1.5" onClick={(e) => e.stopPropagation()}>
              <span className="text-emerald-300 font-bold shrink-0 font-mono text-xs select-none">
                {isPythonMode ? '>>>' : `[${server.username || 'ubuntu'}@${server.name}]:${displayDir}$`}
              </span>
              
              <input
                ref={inputRef}
                type="text"
                disabled={isConnecting}
                placeholder={isConnecting ? (lang === 'fa' ? 'در حال اجرای اسکریپت...' : 'Running script action...') : ''}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none text-white text-xs font-mono focus:outline-none focus:ring-0 placeholder:text-zinc-600 outline-none p-0 tracking-wider disabled:opacity-40"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
          </>
        )}
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
              setLogs([]);
              setContextMenu(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-colors cursor-pointer font-sans ${
              lang === 'fa' ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-yellow-400" />
            <span>{lang === 'fa' ? 'پاکسازی صفحه (Clear)' : 'Clear Console logs'}</span>
          </button>

          {/* Toggle Htop stats */}
          <button
            onClick={() => {
              setNanoState(null);
              setIsHtopActive(!isHtopActive);
              setContextMenu(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-colors cursor-pointer font-sans ${
              lang === 'fa' ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-pink-400" />
            <span>
              {lang === 'fa' 
                ? (isHtopActive ? 'غیرفعال‌سازی htop' : 'فعال‌سازی مانیتور htop') 
                : (isHtopActive ? 'Disable htop resource stats' : 'Enable htop resource stats')}
            </span>
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
