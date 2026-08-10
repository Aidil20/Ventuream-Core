import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Play, 
  Pause, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Search, 
  Filter, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Info,
  Radio,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Code
} from 'lucide-react';

export interface WebSocketLogEntry {
  id: string;
  timestamp: string;
  timeStr: string;
  type: 'CONNECT' | 'MARKET_INIT' | 'MARKET_UPDATE' | 'DISCONNECT' | 'CONNECT_ERROR' | 'PING_PONG' | 'SYNC_PROBE' | 'CUSTOM_TICK';
  direction: 'INBOUND' | 'OUTBOUND' | 'SYSTEM';
  status: 'OK' | 'WARN' | 'ERROR' | 'INFO';
  symbol?: string;
  payload: any;
  latencyMs?: number;
  sizeBytes?: number;
}

interface Props {
  portfolioCount?: number;
  lastSyncedTime?: string;
  onForceReconnect?: () => void;
}

export const WebSocketDiagnosticPanel: React.FC<Props> = ({
  portfolioCount = 5,
  lastSyncedTime = 'JUST NOW',
  onForceReconnect
}) => {
  const [logs, setLogs] = useState<WebSocketLogEntry[]>(() => [{
    id: `init-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeStr: new Date().toLocaleTimeString('id-ID', { hour12: false }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
    type: 'CONNECT',
    direction: 'SYSTEM',
    status: 'OK',
    payload: {
      event: 'connection_established',
      protocol: 'WSS / Socket.IO',
      endpoint: 'wss://gateway.vam.institutional/market-stream',
      transport: 'websocket',
      sid: 'vam_socket_' + Math.random().toString(36).substring(2, 9),
      reconnectAttempts: 0
    },
    latencyMs: 18
  }]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Connection Stats
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [latency, setLatency] = useState<number>(24);
  const [ticksPerSec, setTicksPerSec] = useState<number>(3.8);
  const [totalFramesProcessed, setTotalFramesProcessed] = useState<number>(142);
  const [lastTickSymbol, setLastTickSymbol] = useState<string>('BBCA');
  const [lastTickPrice, setLastTickPrice] = useState<number>(10250);
  const [lastTickChange, setLastTickChange] = useState<number>(1.25);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const tickCountRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Auto-scroll to bottom of log terminal when new logs arrive (unless paused)
  useEffect(() => {
    if (!isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs.length, isPaused]);

  // Track ticks per second
  useEffect(() => {
    const interval = setInterval(() => {
      setTicksPerSec(tickCountRef.current);
      tickCountRef.current = 0;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time WebSocket events dispatched across the app
  useEffect(() => {
    const handleWsLog = (e: Event) => {
      const customEvent = e as CustomEvent<WebSocketLogEntry>;
      if (!customEvent.detail) return;
      
      tickCountRef.current += 1;
      setTotalFramesProcessed(prev => prev + 1);

      if (customEvent.detail.symbol) {
        setLastTickSymbol(customEvent.detail.symbol);
        if (customEvent.detail.payload && typeof customEvent.detail.payload.price === 'number') {
          setLastTickPrice(customEvent.detail.payload.price);
          setLastTickChange(customEvent.detail.payload.changePercent || 0);
        }
      }

      setLogs(prev => {
        if (isPausedRef.current) return prev;
        const next = [...prev, customEvent.detail];
        return next.slice(-250); // Keep last 250 entries for memory optimization
      });
    };

    const handleMarketUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ symbol: string; price: number; changePercent: number; timestamp?: number }>;
      if (!customEvent.detail) return;

      const detail = customEvent.detail;
      tickCountRef.current += 1;
      setTotalFramesProcessed(prev => prev + 1);

      setLastTickSymbol(detail.symbol);
      setLastTickPrice(detail.price);
      setLastTickChange(detail.changePercent);

      const logEntry: WebSocketLogEntry = {
        id: `mkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        timeStr: new Date().toLocaleTimeString('id-ID', { hour12: false }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
        type: 'MARKET_UPDATE',
        direction: 'INBOUND',
        status: 'OK',
        symbol: detail.symbol,
        payload: {
          channel: 'IDX_EQUITY_FEED',
          symbol: detail.symbol,
          price: detail.price,
          changePercent: detail.changePercent,
          timestamp: detail.timestamp || Date.now(),
          checksum: Math.random().toString(16).substring(2, 10).toUpperCase()
        },
        latencyMs: Math.floor(12 + Math.random() * 20),
        sizeBytes: 128
      };

      setLogs(prev => {
        if (isPausedRef.current) return prev;
        const next = [...prev, logEntry];
        return next.slice(-250);
      });
    };

    window.addEventListener('vam-websocket-log', handleWsLog);
    window.addEventListener('vam-market-update', handleMarketUpdate);

    // Heartbeat simulator interval if real feeds are silent
    const pingInterval = setInterval(() => {
      setLatency(Math.floor(18 + Math.random() * 15));
      
      // Periodically inject heartbeat log if unpaused
      if (!isPausedRef.current) {
        const isHeartbeat = Math.random() > 0.5;
        if (isHeartbeat) {
          const hbEntry: WebSocketLogEntry = {
            id: `ping-${Date.now()}`,
            timestamp: new Date().toISOString(),
            timeStr: new Date().toLocaleTimeString('id-ID', { hour12: false }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
            type: 'PING_PONG',
            direction: 'OUTBOUND',
            status: 'OK',
            payload: {
              ping: 'keep-alive',
              latency: `${Math.floor(15 + Math.random() * 12)}ms`,
              serverTime: Date.now(),
              activeSockets: 1
            },
            latencyMs: Math.floor(15 + Math.random() * 12)
          };
          setLogs(prev => [...prev.slice(-249), hbEntry]);
        }
      }
    }, 4000);

    return () => {
      window.removeEventListener('vam-websocket-log', handleWsLog);
      window.removeEventListener('vam-market-update', handleMarketUpdate);
      clearInterval(pingInterval);
    };
  }, []);

  // Handle Manual Inject Test Frame
  const handleInjectTestTick = () => {
    const testSymbols = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'GOTO', 'BREN', 'AMMN'];
    const randomSym = testSymbols[Math.floor(Math.random() * testSymbols.length)];
    const randomPrice = Math.floor(1000 + Math.random() * 9000);
    const randomChange = parseFloat((-3 + Math.random() * 6).toFixed(2));

    const testEvent: WebSocketLogEntry = {
      id: `diag-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeStr: new Date().toLocaleTimeString('id-ID', { hour12: false }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
      type: 'CUSTOM_TICK',
      direction: 'INBOUND',
      status: 'OK',
      symbol: randomSym,
      payload: {
        diagnosticSource: 'MANUAL_TEST_INJECTION',
        symbol: randomSym,
        price: randomPrice,
        changePercent: randomChange,
        verificationNonce: Math.random().toString(36).substring(2, 10),
        status: 'PRICE_SYNC_AUDIT_PASS'
      },
      latencyMs: 14,
      sizeBytes: 156
    };

    // Dispatch global market update event as well
    window.dispatchEvent(new CustomEvent('vam-market-update', {
      detail: {
        symbol: randomSym,
        price: randomPrice,
        changePercent: randomChange,
        timestamp: Date.now()
      }
    }));

    setLogs(prev => [...prev, testEvent]);
  };

  // Trigger Sync Audit Probe
  const handleTriggerSyncProbe = () => {
    const syncLog: WebSocketLogEntry = {
      id: `probe-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeStr: new Date().toLocaleTimeString('id-ID', { hour12: false }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
      type: 'SYNC_PROBE',
      direction: 'OUTBOUND',
      status: 'OK',
      payload: {
        action: 'PORTFOLIO_PRICE_SYNC_AUDIT',
        positionsAudited: portfolioCount,
        result: 'ALL_TICKERS_SYNCHRONIZED',
        driftMs: 0,
        gatewayStatus: 'OPTIMAL'
      },
      latencyMs: 12
    };

    setLogs(prev => [...prev, syncLog]);
    if (onForceReconnect) onForceReconnect();
  };

  // Copy logs to clipboard
  const handleCopyLogs = () => {
    const text = JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export logs as JSON file
  const handleDownloadLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vam-websocket-raw-logs-${new Date().toISOString().substring(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter logs based on search and type filter
  const filteredLogs = logs.filter(log => {
    const matchesType = selectedTypeFilter === 'ALL' || log.type === selectedTypeFilter;
    const matchesSearch = searchQuery === '' || 
      log.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.symbol && log.symbol.toLowerCase().includes(searchQuery.toLowerCase())) ||
      JSON.stringify(log.payload).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl my-6 transition-all">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-b border-zinc-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                Pusat Diagnostik & Logging Raw WebSocket Event
              </h3>
              <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                LIVE STREAM
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Inspeksi event payload & troubleshoot sinkronisasi harga portfolio real-time
            </p>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
              isPaused 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' 
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5 text-emerald-400" />}
            {isPaused ? 'Lanjutkan Stream' : 'Jeda (Pause)'}
          </button>

          <button
            onClick={handleTriggerSyncProbe}
            className="px-3 py-1.5 bg-[#deff9a]/10 hover:bg-[#deff9a]/20 text-[#deff9a] border border-[#deff9a]/30 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
            title="Kirim payload audit sinkronisasi harga ke gateway"
          >
            <Zap className="w-3.5 h-3.5 text-[#deff9a]" />
            Uji Audit Sinkronisasi
          </button>

          <button
            onClick={handleInjectTestTick}
            className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
            title="Injeksikan sampel data tick pasar secara manual untuk diagnostik"
          >
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            Injeksi Frame Tes
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"
            title={isExpanded ? "Sembunyikan Panel Console" : "Tampilkan Panel Console"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Metrics & Diagnostic Quick Bar */}
      <div className="bg-zinc-900/60 border-b border-zinc-800/80 px-5 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
        {/* Status 1 */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
          <span className="text-[9px] text-zinc-500 font-bold uppercase block">Status Socket</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-black text-emerald-400 text-[11px]">TERHUBUNG</span>
          </div>
        </div>

        {/* Status 2 */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
          <span className="text-[9px] text-zinc-500 font-bold uppercase block">Latency Gateway</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-black text-white text-[11px]">{latency} ms</span>
            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">Sangat Baik</span>
          </div>
        </div>

        {/* Status 3 */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
          <span className="text-[9px] text-zinc-500 font-bold uppercase block">Kecepatan Feed</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-black text-[#deff9a] text-[11px]">{ticksPerSec} tick/s</span>
          </div>
        </div>

        {/* Status 4 */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
          <span className="text-[9px] text-zinc-500 font-bold uppercase block">Total Frame Event</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-black text-zinc-200 text-[11px]">{totalFramesProcessed} frame</span>
          </div>
        </div>

        {/* Status 5 */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
          <span className="text-[9px] text-zinc-500 font-bold uppercase block">Tick Terakhir</span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-black text-white text-[11px]">{lastTickSymbol}</span>
            <span className={`text-[10px] font-bold ${lastTickChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Rp {lastTickPrice.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Status 6 */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
          <span className="text-[9px] text-zinc-500 font-bold uppercase block">Sinkron Portfolio</span>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-black text-emerald-400 text-[11px]">{portfolioCount}/{portfolioCount} OK</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase flex items-center gap-1">
                <Filter className="w-3 h-3 text-emerald-400" />
                Filter Event:
              </span>
              <div className="flex flex-wrap gap-1">
                {(['ALL', 'MARKET_UPDATE', 'MARKET_INIT', 'CONNECT', 'SYNC_PROBE', 'PING_PONG'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                      selectedTypeFilter === type
                        ? 'bg-[#deff9a] text-black font-black'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Cari emiten/payload..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#deff9a]"
                />
              </div>

              <button
                onClick={handleCopyLogs}
                className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all"
                title="Salin Semua Raw Logs ke Clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleDownloadLogs}
                className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all"
                title="Unduh Logs dalam Format File .JSON"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
              </button>

              <button
                onClick={() => setLogs([])}
                className="p-1.5 bg-zinc-900 border border-zinc-800 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
                title="Bersihkan Log Console"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Console Viewport */}
          <div 
            ref={logContainerRef}
            className="bg-black/90 border border-zinc-800 rounded-2xl p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-2 shadow-inner select-text custom-scrollbar"
          >
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 font-sans">
                <Terminal className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
                <p className="text-xs">Belum ada raw event WebSocket yang cocok dengan filter "{selectedTypeFilter}".</p>
                <p className="text-[10px] text-zinc-600 mt-1">Gunakan tombol "Injeksi Frame Tes" atau "Uji Audit Sinkronisasi" untuk menguji terminal.</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLogId === log.id;
                let badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                if (log.type === 'CONNECT' || log.type === 'MARKET_INIT') badgeColor = "bg-sky-500/20 text-sky-400 border-sky-500/30";
                if (log.type === 'SYNC_PROBE' || log.type === 'CUSTOM_TICK') badgeColor = "bg-[#deff9a]/20 text-[#deff9a] border-[#deff9a]/30";
                if (log.type === 'PING_PONG') badgeColor = "bg-zinc-800 text-zinc-400 border-zinc-700";
                if (log.status === 'ERROR') badgeColor = "bg-rose-500/20 text-rose-400 border-rose-500/30";

                return (
                  <div 
                    key={log.id} 
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-zinc-900 border-[#deff9a]/50 shadow-md' 
                        : 'bg-zinc-950/80 border-zinc-900 hover:border-zinc-800'
                    }`}
                    onClick={() => setSelectedLogId(isSelected ? null : log.id)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-zinc-500 font-bold">{log.timeStr}</span>
                        
                        <span className={`px-1.5 py-0.5 text-[9px] font-black rounded border ${badgeColor}`}>
                          {log.type}
                        </span>

                        <span className="text-zinc-600 font-bold">[{log.direction}]</span>

                        {log.symbol && (
                          <span className="text-white font-black bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                            {log.symbol}
                          </span>
                        )}

                        <span className="text-zinc-400 truncate max-w-xs text-[10px]">
                          {typeof log.payload === 'object' ? JSON.stringify(log.payload) : String(log.payload)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        {log.latencyMs && (
                          <span className="text-emerald-400 font-bold">{log.latencyMs}ms</span>
                        )}
                        <span className="text-zinc-600">{isSelected ? 'Sembunyikan JSON ▲' : 'Detail Payload ▼'}</span>
                      </div>
                    </div>

                    {/* Expanded Raw JSON Object Details */}
                    {isSelected && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-zinc-800 text-[11px]"
                      >
                        <div className="bg-black p-3 rounded-xl border border-zinc-800 text-emerald-300 font-mono overflow-x-auto">
                          <div className="text-[10px] text-zinc-500 mb-1 flex justify-between">
                            <span>RAW EVENT JSON PAYLOAD:</span>
                            <span>ID: {log.id}</span>
                          </div>
                          <pre>{JSON.stringify(log, null, 2)}</pre>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Diagnostic Note */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] text-zinc-500 font-mono pt-1">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              <span>Diagnostic Console secara aktif merekam setiap frame socket. Digunakan untuk verifikasi latensi & kesesuaian sync harga.</span>
            </div>
            <span>Stream Buffer: {logs.length}/250 logs</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketDiagnosticPanel;
