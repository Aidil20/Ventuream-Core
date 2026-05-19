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
  { id: 'SFO', name: 'SFO-CLOUD', x: 80, y: 220, size: 6 },
  { id: 'NYC', name: 'NYC-TERMINAL', x: 230, y: 190, size: 12 },
  { id: 'SAO', name: 'SAO PAULO-LINK', x: 330, y: 390, size: 6 },
  { id: 'LDN', name: 'LDN-NODE', x: 440, y: 130, size: 8 },
  { id: 'FRA', name: 'FRANKFURT-DATA', x: 520, y: 165, size: 6 },
  { id: 'DUB', name: 'DUBAI-GATE', x: 590, y: 230, size: 6 },
  { id: 'SO', name: 'SO-HUB', x: 745, y: 325, size: 14 },
  { id: 'TOK', name: 'TOK GATEWAY', x: 850, y: 180, size: 7 },
  { id: 'SYD', name: 'SYD-PRIMARY', x: 880, y: 440, size: 6 },
];

const CONNECTIONS = [
  { from: 'SFO', to: 'NYC' },
  { from: 'NYC', to: 'LDN' },
  { from: 'LDN', to: 'FRA' },
  { from: 'FRA', to: 'DUB' },
  { from: 'DUB', to: 'SO' },
  { from: 'SO', to: 'TOK' },
  { from: 'SO', to: 'SYD' },
  { from: 'NYC', to: 'SAO' },
  { from: 'SFO', to: 'LDN' },
  { from: 'DUB', to: 'FRA' },
  { from: 'NYC', to: 'TOK' },
  { from: 'SAO', to: 'LDN' },
  { from: 'SYD', to: 'SO' },
  { from: 'TOK', to: 'NYC' },
];

// More refined world map wireframe 
const WORLD_PATHS = [
  // North America
  "M50,150 L70,120 L100,100 L130,90 L160,85 L190,95 L220,110 L240,140 L250,180 L245,220 L230,250 L200,270 L160,265 L120,250 L80,225 L60,190 Z", 
  // South America
  "M200,280 L230,280 L255,300 L270,340 L275,380 L260,430 L230,470 L200,480 L180,450 L170,400 L180,330 Z",
  // Europe
  "M420,100 L450,85 L480,80 L520,85 L540,100 L550,130 L540,160 L510,180 L470,185 L430,160 L410,130 Z",
  // Africa
  "M400,180 L440,175 L480,185 L530,200 L570,230 L585,280 L580,340 L550,390 L510,420 L460,405 L420,360 L400,280 L390,220 Z",
  // Eurasia
  "M550,110 L600,90 L670,85 L750,90 L820,105 L880,130 L920,160 L940,200 L950,250 L930,300 L880,330 L800,350 L720,330 L620,320 L580,280 L560,200 Z",
  // Australia
  "M820,400 L860,390 L900,410 L920,440 L910,480 L870,490 L830,470 L810,430 Z",
  // SE Asia - Detailed (Indonesia, Malaysia, Philippines)
  "M720,310 L740,305 L760,315 L755,330 L730,335 Z", // Mainland SE Asia / Malay Peninsula
  "M710,345 L745,340 L760,355 L740,370 L700,365 Z", // Sumatra
  "M755,345 L785,340 L800,360 L785,385 L760,380 Z", // Borneo
  "M745,375 L800,375 L820,385 L760,395 Z", // Java
  "M805,345 L825,350 L830,380 L810,385 Z", // Sulawesi
  "M840,350 L870,355 L875,380 L840,385 Z", // Papua (partly)
  "M780,280 L800,280 L810,310 L790,320 L775,300 Z", // Philippines
];

interface NetworkMapProps {
  activePrices?: Record<string, number>;
}

export const InternationalNetworkMap: React.FC<NetworkMapProps> = ({ activePrices = {} }) => {
  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[2.4/1] bg-[#020408] rounded-[2rem] overflow-hidden group select-none">
      {/* Tactical Grid Background */}
      <div className="absolute inset-0 opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(#10b981 0.5px, transparent 0.5px)', backgroundSize: '15px 15px' }} />
      
      {/* HUD Scanner Line */}
      <motion.div 
        className="absolute inset-x-0 h-px bg-emerald-500/20 z-10 pointer-events-none"
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Map Header - Top Left */}
      <div className="absolute top-4 left-5 z-20">
         <h2 className="text-[12px] font-black text-white/50 uppercase tracking-[0.3em]">Global Network Sync <span className="text-white/20">V2.0</span></h2>
      </div>

      {/* PING Indicator Overlay (Fixed like in image) */}
      <div className="absolute top-4 right-5 z-20">
         <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">PING:</span>
           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">32ms (LIVE)</span>
         </div>
      </div>

      <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="landGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          {/* Detailed Mesh Pattern for Landmasses */}
          <pattern id="dotPattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.7" fill="#10b981" opacity="0.3" />
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#10b981" strokeWidth="0.05" opacity="0.15" />
          </pattern>

          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="60%" stopColor="#DFFF00" />
            <stop offset="100%" stopColor="#DFFF00" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Tactical Crosshairs */}
        <g stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.5" strokeDasharray="2 4">
          <line x1="500" y1="0" x2="500" y2="500" />
          <line x1="0" y1="250" x2="1000" y2="250" />
        </g>

        {/* Continental Mesh / Landmasses */}
        {WORLD_PATHS.map((path, i) => (
          <React.Fragment key={`world-path-${i}`}>
            {/* Outer Glow */}
            <path
              d={path}
              fill="none"
              stroke="#10b981"
              strokeWidth="6"
              className="opacity-[0.12]"
              style={{ filter: 'url(#landGlow)' }}
            />
            {/* Outline */}
            <path
              d={path}
              fill="rgba(16, 185, 129, 0.05)"
              stroke="#10b981"
              strokeWidth="1.2"
              className="opacity-50"
            />
            {/* Mesh pattern overlay inside map */}
            <path
              d={path}
              fill="url(#dotPattern)"
              stroke="none"
              className="opacity-80"
            />
          </React.Fragment>
        ))}

        {/* Connection Arcs (Golden Glow) */}
        <g>
          {CONNECTIONS.map((conn, idx) => {
            const fromNode = NODES.find(n => n.id === conn.from);
            const toNode = NODES.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2 - dist * 0.1;
            const d = `M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`;

            return (
              <React.Fragment key={`${conn.from}-${conn.to}-${idx}`}>
                {/* Static base line */}
                <path
                  d={d}
                  stroke="#DFFF00"
                  strokeWidth="0.5"
                  fill="none"
                  className="opacity-10"
                />
                
                {/* Secondary subtle glow pulse layer */}
                <motion.path
                  d={d}
                  stroke="#DFFF00"
                  strokeWidth="0.8"
                  fill="none"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0.05, 0.2, 0.05],
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: Math.random() * 2,
                  }}
                />

                {/* Primary Flowing 'Bits' (Subtle dashes) */}
                <motion.path
                  d={d}
                  stroke="#DFFF00"
                  strokeWidth="1.2"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: [0, 0.15, 0],
                    pathOffset: [0, 1.1],
                    opacity: [0, 0.7, 0]
                  }}
                  transition={{ 
                    duration: 2.5 + Math.random() * 1.5, 
                    repeat: Infinity, 
                    ease: "linear",
                    delay: Math.random() * 3,
                  }}
                  style={{ filter: 'url(#glow)' }}
                />

                {/* Traveling Data Packet (Dot) */}
                <motion.circle
                  r="1.2"
                  fill="#DFFF00"
                  animate={{
                     offsetDistance: ["0%", "100%"],
                     opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: 4 + Math.random() * 3,
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

        {/* Large Nodes with Glowing Center */}
        {NODES.map((node) => (
          <g key={node.id}>
             {/* Pulse Aura */}
             <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size * 2}
              fill="#DFFF00"
              initial={{ scale: 0.8, opacity: 0.1 }}
              animate={{ scale: [1, 2, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
              style={{ filter: 'url(#glow)' }}
            />
             {/* Core Node */}
             <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size / 2}
              fill="#fff"
              animate={{ r: [node.size/2, node.size/2 + 1, node.size/2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="drop-shadow-[0_0_8px_#DFFF00]"
            />
            
            <g transform={`translate(${node.x}, ${node.y + (node.size > 10 ? 22 : 16)})`}>
               <text
                 className="text-[8px] font-black fill-white/90 uppercase tracking-[0.12em]"
                 textAnchor="middle"
               >
                 {node.name}
               </text>
            </g>
          </g>
        ))}
        {/* Decorative Glyphs and Arrows from Image */}
        <g opacity="0.4" fill="none" stroke="#DFFF00" strokeWidth="0.6">
           {/* Double Arrows Up */}
           <path d="M330,120 l5,-5 l5,5 M330,128 l5,-5 l5,5" />
           <path d="M680,110 l5,-5 l5,5 M680,118 l5,-5 l5,5" />
           
           {/* Double Arrows Down */}
           <path d="M780,380 l5,5 l5,-5 M780,388 l5,5 l5,-5" />
           <path d="M220,320 l5,5 l5,-5 M220,328 l5,5 l5,-5" />
           
           {/* Tactical Chevron Groups */}
           <path d="M150,220 l3,-3 l3,3" strokeWidth="0.8" />
           <path d="M150,226 l3,-3 l3,3" strokeWidth="0.8" />
           
           <path d="M850,320 l4,-4 l4,4" strokeWidth="1" />
           <path d="M850,328 l4,-4 l4,4" strokeWidth="1" />
           
           {/* Terminal Symbols */}
           <text x="370" y="270" fill="#DFFF00" fontSize="14" fontFamily="serif" className="opacity-30">Uu</text>
           <text x="820" y="240" fill="#DFFF00" fontSize="14" fontFamily="serif" className="opacity-30">8</text>
           <text x="620" y="320" fill="#DFFF00" fontSize="12" fontFamily="mono" className="opacity-20">&gt;&gt;</text>
        </g>
      </svg>

      {/* Decorative tactical markings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
         <div className="w-[800px] h-[800px] border border-white/5 rounded-full scale-[0.3]" />
         <div className="w-[800px] h-[800px] border border-white/5 rounded-full scale-[0.6]" />
      </div>

    </div>
  );
};
