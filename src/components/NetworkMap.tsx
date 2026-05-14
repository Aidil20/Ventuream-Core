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
  { id: 'SFO', name: 'SFO-CLOUD', x: 100, y: 180, size: 6 },
  { id: 'NYC', name: 'NYC-TERMINAL', x: 260, y: 170, size: 8 },
  { id: 'SAO', name: 'SAO PAULO-LINK', x: 320, y: 380, size: 6 },
  { id: 'LDN', name: 'LDN-NODE', x: 480, y: 130, size: 6 },
  { id: 'FRA', name: 'FRANKFURT-DATA', x: 520, y: 140, size: 6 },
  { id: 'DUB', name: 'DUBAI-GATE', x: 640, y: 220, size: 6 },
  { id: 'SG', name: 'SO-HUB', x: 780, y: 320, size: 10 },
  { id: 'TOK', name: 'TOK-GATEWAY', x: 880, y: 160, size: 7 },
  { id: 'SYD', name: 'SYD-PRIMARY', x: 900, y: 420, size: 6 },
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
  { from: 'SG', to: 'DUB' },
  { from: 'FRA', to: 'SG' },
  { from: 'NYC', to: 'FRA' },
];

// Simplified world map wireframe paths
const CONTINENTS_PATH = "M100,150 Q150,150 180,200 T250,220 T280,350 T250,450 T150,450 T100,350 Z " + // Americas
                       "M450,100 Q550,80 650,120 T750,150 T850,100 T950,150 T900,250 T800,300 T750,450 T650,400 T550,480 T450,400 Z " + // Eurasia/Africa
                       "M850,380 Q900,380 950,420 T900,480 T850,450 Z"; // Oceania (symbolic)

export const InternationalNetworkMap: React.FC = () => {
  return (
    <div className="relative w-full aspect-[2/1] bg-[#020407] rounded-[2.5rem] border border-zinc-800/40 overflow-hidden shadow-2xl group">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(#DFFF00 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      
      {/* PING Indicator Overlay */}
      <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 bg-black/60 rounded-full border border-emerald-500/20 backdrop-blur-md z-20">
        <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">PING:</span>
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">32ms (LIVE)</span>
      </div>

      <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#DFFF00" />
          </radialGradient>
        </defs>

        {/* Continental Outlines (Wireframe) */}
        <path
          d={CONTINENTS_PATH}
          fill="none"
          stroke="#10b981"
          strokeWidth="0.5"
          strokeDasharray="2 4"
          className="opacity-20"
        />

        {/* Connection Arcs */}
        <g>
          {CONNECTIONS.map((conn, idx) => {
            const fromNode = NODES.find(n => n.id === conn.from);
            const toNode = NODES.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2 - Math.abs(toNode.x - fromNode.x) * 0.1;
            const d = `M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`;

            return (
              <React.Fragment key={`${conn.from}-${conn.to}-${idx}`}>
                {/* Background Line */}
                <path
                  d={d}
                  stroke="#DFFF00"
                  strokeWidth="0.5"
                  fill="none"
                  className="opacity-10"
                />
                {/* Animated traveling dot */}
                <motion.path
                  d={d}
                  stroke="#DFFF00"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="0 1000"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: [0, 0.2, 0.2, 0],
                    pathOffset: [0, 0, 1, 1],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2, 
                    repeat: Infinity, 
                    delay: Math.random() * 5,
                    ease: "linear"
                  }}
                  style={{ filter: 'url(#glow)' }}
                />
              </React.Fragment>
            );
          })}
        </g>

        {/* Nodes and Labels */}
        {NODES.map((node) => (
          <g key={node.id}>
            {/* Glow Aura */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size * 2}
              fill="#DFFF00"
              initial={{ opacity: 0.1 }}
              animate={{ opacity: [0.05, 0.2, 0.05] }}
              transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
            />
            {/* Core Node */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size / 2}
              fill="url(#nodeGradient)"
              className="glow-yellow"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
            />
            {/* Label */}
            <text
              x={node.x}
              y={node.y + (node.y > 250 ? -node.size - 10 : node.size + 15)}
              className="text-[9px] font-black fill-zinc-400 uppercase tracking-tighter"
              textAnchor="middle"
            >
              {node.name}
            </text>
          </g>
        ))}

        {/* Decorative Icons (Random Arcs/Symbols) */}
        <g className="opacity-30 fill-[#DFFF00]">
           <path d="M500,200 l-3,-3 l3,-3 l3,3 Z" transform="translate(10, -5)" /> {/* Miniature icon approximation */}
           <path d="M200,300 l0,-5 l-2,0 l2,-3 l2,3 l-2,0 Z" /> {/* Arrow up */}
           {/* Add more as needed to match the cluttered professional look */}
        </g>
      </svg>

      {/* Footer Label */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3">
        <div className="flex flex-col">
          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-[0.2em]">Institutional Mesh</p>
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Protocol: VAM-v2 Secure</p>
        </div>
      </div>
    </div>
  );
};
