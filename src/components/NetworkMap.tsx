import React from 'react';
import { motion } from 'motion/react';

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
}

const NODES: Node[] = [
  { id: 'SFO', name: 'SFO-CLOUD', x: 80, y: 195, size: 5 },
  { id: 'NYC', name: 'NYC-TERMINAL', x: 180, y: 160, size: 7 },
  { id: 'SAO', name: 'SAO PAULO-LINK', x: 280, y: 380, size: 5 },
  { id: 'LDN', name: 'LDN-NODE', x: 450, y: 120, size: 6 },
  { id: 'PAR', name: 'PARIS-HUB', x: 480, y: 140, size: 4 },
  { id: 'FRA', name: 'FRANKFURT-DATA', x: 505, y: 135, size: 5 },
  { id: 'DUB', name: 'DUBAI-GATE', x: 610, y: 220, size: 5 },
  { id: 'SG', name: 'SINGAPORE-HUB', x: 780, y: 330, size: 8 },
  { id: 'JKT', name: 'JKT-GATEWAY', x: 790, y: 360, size: 10 },
  { id: 'TOK', name: 'TOK-GATEWAY', x: 880, y: 160, size: 6 },
  { id: 'SYD', name: 'SYD-PRIMARY', x: 900, y: 420, size: 5 },
  { id: 'HKG', name: 'HONG KONG-HUB', x: 820, y: 220, size: 7 },
];

const CONNECTIONS = [
  { from: 'SFO', to: 'NYC' },
  { from: 'NYC', to: 'LDN' },
  { from: 'LDN', to: 'FRA' },
  { from: 'FRA', to: 'DUB' },
  { from: 'DUB', to: 'SG' },
  { from: 'SG', to: 'TOK' },
  { from: 'NYC', to: 'SAO' },
  { from: 'SG', to: 'SYD' },
  { from: 'NYC', to: 'SG' },
  { from: 'FRA', to: 'SG' },
  { from: 'SFO', to: 'LDN' },
  { from: 'DUB', to: 'FRA' },
  { from: 'HKG', to: 'SG' },
  { from: 'HKG', to: 'TOK' },
  { from: 'JKT', to: 'SG' },
  { from: 'JKT', to: 'HKG' },
  { from: 'LDN', to: 'PAR' },
  { from: 'PAR', to: 'FRA' },
];

// Simplified more detailed world map wireframe paths (Multi-path representational)
const WORLD_PATHS = [
  "M50,150 L80,130 L120,135 L160,110 L230,120 L260,160 L240,220 L210,240 L180,245 L150,220 L100,230 L70,210 Z", // North America
  "M190,260 L220,260 L240,290 L260,350 L250,420 L230,460 L190,440 L170,380 L180,310 Z", // South America
  "M440,110 L480,90 L520,100 L560,95 L610,110 L640,150 L630,220 L580,260 L540,270 L500,240 L460,200 L440,150 Z", // Eurasia West
  "M650,120 L750,110 L850,120 L920,140 L940,200 L950,260 L920,320 L860,340 L800,350 L720,330 L660,280 L640,210 Z", // Eurasia East
  "M470,230 L530,230 L580,260 L590,320 L560,380 L520,410 L470,380 L440,330 L450,280 Z", // Africa
  "M830,390 L880,380 L930,400 L940,450 L910,480 L860,470 L820,440 Z" // Australia
];

interface NetworkMapProps {
  activePrices?: Record<string, number>;
}

export const InternationalNetworkMap: React.FC<NetworkMapProps> = ({ activePrices = {} }) => {
  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[2/1] lg:aspect-[2.2/1] bg-[#020304] rounded-[3rem] border border-zinc-800/80 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] group select-none">
      {/* Background Deep Grid - Higher density */}
      <div className="absolute inset-0 opacity-[0.08]" 
           style={{ backgroundImage: 'linear-gradient(to right, #DFFF00 1px, transparent 1px), linear-gradient(to bottom, #DFFF00 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 opacity-[0.04]" 
           style={{ backgroundImage: 'linear-gradient(to right, #DFFF00 1px, transparent 1px), linear-gradient(to bottom, #DFFF00 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
      
      {/* HUD Scanner Lines - Faster and multiple */}
      <motion.div 
        className="absolute inset-0 border-t border-[#DFFF00]/20 pointer-events-none z-10"
        initial={{ top: '-10%' }}
        animate={{ top: '110%' }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-[#DFFF00]/5 to-transparent pointer-events-none z-10"
        initial={{ top: '-40%' }}
        animate={{ top: '100%' }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 1 }}
      />
      
      {/* PING Indicator Overlay - More tactical */}
      <div className="absolute top-6 right-6 sm:top-10 sm:right-12 flex items-center gap-4 px-5 py-3 sm:px-8 sm:py-4 bg-[#050505]/80 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl z-20">
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-1">LATENCY MONITOR</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-[#DFFF00] rounded-full animate-pulse shadow-[0_0_10px_#DFFF00]" />
               <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tighter">18<span className="text-zinc-600 text-xs ml-0.5">MS</span></span>
            </div>
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <span className="text-[9px] px-2 py-0.5 bg-[#DFFF00] text-black font-black rounded-lg uppercase tracking-tighter">STABLE</span>
          </div>
        </div>
      </div>

      {/* Coordinate Displays & Tactical Overlay */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-12 z-20 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-sm rotate-45 animate-pulse shadow-[0_0_15px_#10b981]" />
          <h2 className="text-[12px] font-black text-white uppercase tracking-[0.4em]">Node Cluster: JKT-GATEWAY</h2>
        </div>
        <div className="space-y-1.5 pl-5 border-l-2 border-[#DFFF00]/20">
          <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-none">SYS: INSTITUTIONAL MESH v2.4</p>
          <p className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest leading-none flex items-center gap-2">
            <span className="w-1 h-1 bg-emerald-500 rounded-full" />
            ENCRYPTION: AES-256 QUANTUM
          </p>
          <p className="text-[8px] font-mono text-[#DFFF00]/60 uppercase tracking-widest leading-none">STATUS: COMM-LINK ESTABLISHED</p>
        </div>
      </div>

      {/* Corner Technical Artifacts */}
      <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-12 z-20 flex gap-10">
        <div className="space-y-1">
          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-[0.4em]">BANDWIDTH PULSE</p>
          <div className="flex gap-0.5 h-3 items-end">
            {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 0.5].map((h, i) => (
              <motion.div 
                key={i}
                className="w-1 bg-[#DFFF00]/30 rounded-t-sm"
                animate={{ height: [`${h*100}%`, `${Math.random()*100}%`, `${h*100}%`] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-12 z-20 text-right">
        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.5em]">GLOBAL BACKBONE STRATA</p>
        <p className="text-[10px] font-mono text-white/40 mt-1 uppercase tracking-tighter">003.74.881 // SECTOR_G</p>
      </div>

      <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#DFFF00" />
          </radialGradient>
        </defs>

        {/* Continental Mesh (Techno Layer) */}
        {WORLD_PATHS.map((path, i) => (
          <React.Fragment key={`world-path-${i}`}>
            <path
              d={path}
              fill="rgba(16, 185, 129, 0.05)"
              stroke="rgba(110, 231, 183, 0.4)"
              strokeWidth="1"
            />
            {/* Mesh pattern overlay */}
            <pattern id="meshPattern" width="10" height="10" patternUnits="userSpaceOnUse">
               <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.5"/>
            </pattern>
            <path
              d={path}
              fill="url(#meshPattern)"
              stroke="none"
              className="opacity-20"
            />
          </React.Fragment>
        ))}

        {/* Connection Arcs */}
        <g>
          {CONNECTIONS.map((conn, idx) => {
            const fromNode = NODES.find(n => n.id === conn.from);
            const toNode = NODES.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Curved arc control point
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2 - dist * 0.25;
            const d = `M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`;

            return (
              <React.Fragment key={`${conn.from}-${conn.to}-${idx}`}>
                {/* Background Line (Thin glow) */}
                <path
                  d={d}
                  stroke="#DFFF00"
                  strokeWidth="0.5"
                  fill="none"
                  className="opacity-5"
                />
                {/* Animated data pulses */}
                <motion.path
                  d={d}
                  stroke="#DFFF00"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: [0, 0.3, 0.3, 0],
                    pathOffset: [0, 0, 1, 1],
                    opacity: [0, 0.8, 0.8, 0]
                  }}
                  transition={{ 
                    duration: 2.5 + Math.random() * 1.5, 
                    repeat: Infinity, 
                    delay: Math.random() * 4,
                    ease: "easeInOut"
                  }}
                  style={{ filter: 'url(#glow)' }}
                />
                
                {/* Discrete Data Packets (Flying Dots) */}
                <motion.circle
                  r="2"
                  fill="#DFFF00"
                  animate={{
                     offsetDistance: ["0%", "100%"],
                     opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "linear"
                  }}
                  style={{ 
                    offsetPath: `path("${d}")`,
                    filter: 'url(#glow)'
                  }}
                />
              </React.Fragment>
            );
          })}
        </g>

        {/* Nodes and Labels */}
        {NODES.map((node) => (
          <g key={node.id}>
            {/* Outer Glow Aura */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size * 3.5}
              fill="#DFFF00"
              initial={{ opacity: 0.1 }}
              animate={{ opacity: [0.05, 0.25, 0.05], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, delay: Math.random() * 2 }}
              style={{ filter: 'url(#strongGlow)' }}
            />
            
            {/* Radar Scan Ring */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size * 2}
              stroke="#DFFF00"
              strokeWidth="0.5"
              fill="none"
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: Math.random() * 2 }}
            />
            
            {/* Core Node */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size / 1.2}
              fill="url(#nodeGradient)"
              className="drop-shadow-[0_0_15px_rgba(223,255,0,0.9)]"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
            />

            {/* Institutional Label (Enhanced) */}
            <g transform={`translate(${node.x}, ${node.y + (node.y > 350 ? -node.size - 25 : node.size + 15)})`}>
                {node.id === 'JKT' && (
                  <rect x="-40" y="-5" width="80" height="15" rx="4" fill="rgba(0,0,0,0.8)" stroke="rgba(223,255,0,0.3)" strokeWidth="0.5" />
                )}
                <text
                  className={`text-[9px] font-black uppercase tracking-widest ${node.id === 'JKT' ? 'fill-white' : 'fill-zinc-500'}`}
                  textAnchor="middle"
                  y={node.id === 'JKT' ? "6" : "0"}
                >
                  {node.name}
                </text>
                
                {node.id === 'JKT' && (
                  <g transform="translate(45, -30)">
                    {['BBCA', 'BMRI', 'GOTO'].map((symbol, i) => {
                      const price = activePrices[symbol];
                      return (
                        <motion.g 
                          key={symbol} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transform={`translate(0, ${i * 10})`}
                        >
                           <rect x="-5" y="-6" width="35" height="8" rx="1" fill="rgba(0,0,0,0.6)" />
                           <text className="text-[5px] font-bold fill-[#DFFF00] uppercase tracking-tighter" textAnchor="start">
                             {symbol} {price ? price.toLocaleString('id-ID') : '...'}
                           </text>
                        </motion.g>
                      );
                    })}
                  </g>
                )}
            </g>
          </g>
        ))}

        {/* Directional Arrows (Decorative like in image) */}
        <g className="opacity-20 fill-[#DFFF00] stroke-[#DFFF00] strokeWidth-1">
           <path d="M320,150 l4,-4 l4,4" fill="none" />
           <path d="M320,158 l4,-4 l4,4" fill="none" />
           
           <path d="M730,110 l4,-4 l4,4" fill="none" />
           <path d="M730,118 l4,-4 l4,4" fill="none" />
           
           <path d="M820,380 l4,4 l4,-4" fill="none" />
           <path d="M820,388 l4,4 l4,-4" fill="none" />

           {/* Data transfer arrows */}
           <g transform="translate(370, 240) scale(0.5)">
             <path d="M0,0 l10,0 l0,10" fill="none" />
             <path d="M15,15 l-10,0 l0,-10" fill="none" />
           </g>
        </g>
      </svg>

      {/* Institutional Metadata Footer */}
      <div className="absolute bottom-6 left-8 flex items-center gap-6">
        <div className="flex flex-col">
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em]">International Backbone</p>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
             <p className="text-[10px] font-black text-white uppercase tracking-widest">Protocol: VAM-v2 Secure Mesh</p>
          </div>
        </div>
      </div>
    </div>
  );
};
