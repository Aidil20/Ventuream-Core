import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, ShieldCheck, Globe, Activity, Cpu, Radio, Zap, ExternalLink } from 'lucide-react';

interface GatewayNode {
  id: string;
  name: string;
  fullName: string;
  region: string;
  x: number;
  y: number;
  latency: string;
  status: 'OPTIMAL' | 'STABLE' | 'BUSY';
  ip: string;
  load: string;
  syncRate: string;
  protocol: string;
  connections: string[];
}

const GATEWAY_NODES: GatewayNode[] = [
  { id: 'nyc', name: 'New York', fullName: 'New York Gate (VAM-NYC)', region: 'North America', x: 80, y: 70, latency: '68ms', status: 'OPTIMAL', ip: '198.51.100.12', load: '14%', syncRate: '99.99%', protocol: 'IBKR Gateway / FIX v4.4', connections: ['lon', 'dxb', 'sg'] },
  { id: 'lon', name: 'London', fullName: 'London Interceptor (VAM-LON)', region: 'United Kingdom', x: 220, y: 55, latency: '12ms', status: 'OPTIMAL', ip: '192.0.2.78', load: '32%', syncRate: '100.00%', protocol: 'CGS Broker Feed', connections: ['nyc', 'ned', 'sui'] },
  { id: 'ned', name: 'Belanda', fullName: 'Amsterdam Link (VAM-AMS)', region: 'Netherlands (Eropa)', x: 242, y: 52, latency: '14ms', status: 'OPTIMAL', ip: '192.0.2.99', load: '21%', syncRate: '99.98%', protocol: 'Euronext Ultra Feed', connections: ['lon', 'ger'] },
  { id: 'ger', name: 'Germany', fullName: 'Frankfurt Hub (VAM-FRA)', region: 'Germany (Eropa)', x: 260, y: 56, latency: '15ms', status: 'OPTIMAL', ip: '192.0.2.112', load: '45%', syncRate: '100.00%', protocol: 'Xetra Premium API', connections: ['ned', 'sui', 'sau'] },
  { id: 'sui', name: 'Swiss', fullName: 'Zürich Vault (VAM-ZRH)', region: 'Switzerland (Eropa)', x: 252, y: 64, latency: '16ms', status: 'OPTIMAL', ip: '192.0.2.150', load: '18%', syncRate: '100.00%', protocol: 'SIX Swiss Exchange v3.0', connections: ['ger', 'lon', 'dxb'] },
  { id: 'sau', name: 'Saudi Arabia', fullName: 'Riyadh Secure Hub (VAM-RUH)', region: 'Saudi Arabia', x: 335, y: 94, latency: '74ms', status: 'STABLE', ip: '203.0.113.43', load: '9%', syncRate: '99.95%', protocol: 'Tadawul Direct Gateway', connections: ['ger', 'dxb'] },
  { id: 'dxb', name: 'Dubai', fullName: 'Dubai Gateway (VAM-DXB)', region: 'Middle East (UAE)', x: 355, y: 90, latency: '62ms', status: 'OPTIMAL', ip: '203.0.113.88', load: '19%', syncRate: '100.00%', protocol: 'DFM Multi-Asset Bridge', connections: ['sau', 'sg', 'sui', 'nyc'] },
  { id: 'sg', name: 'Singapore', fullName: 'Singapore Core (VAM-SIN)', region: 'Singapore Hub', x: 440, y: 140, latency: '4ms', status: 'OPTIMAL', ip: '203.0.113.1', load: '72%', syncRate: '100.00%', protocol: 'Primary SGX/MAS Fiber Node', connections: ['dxb', 'chn', 'tok', 'aus', 'nyc'] },
  { id: 'chn', name: 'China', fullName: 'Shanghai Exchange (VAM-SHA)', region: 'Mainland China', x: 462, y: 86, latency: '26ms', status: 'STABLE', ip: '198.51.100.200', load: '58%', syncRate: '99.96%', protocol: 'SSE Direct SSE-X Link', connections: ['sg', 'tok'] },
  { id: 'tok', name: 'Tokyo', fullName: 'Tokyo Liquidity Gate (VAM-NRT)', region: 'Japan', x: 505, y: 76, latency: '9ms', status: 'OPTIMAL', ip: '198.51.100.55', load: '48%', syncRate: '100.00%', protocol: 'TSE Arrowhead v4', connections: ['sg', 'chn', 'aus'] },
  { id: 'aus', name: 'Australia', fullName: 'Sydney Terminal (VAM-SYD)', region: 'Australia Oceania', x: 525, y: 190, latency: '42ms', status: 'OPTIMAL', ip: '203.0.113.254', load: '24%', syncRate: '99.99%', protocol: 'ASX Liquidity Feed', connections: ['sg', 'tok'] },
];

export const GlobalGatewayBanner: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<GatewayNode>(GATEWAY_NODES.find(n => n.id === 'sg')!);
  const [hoveredNode, setHoveredNode] = useState<GatewayNode | null>(null);

  const getArcPath = (x1: number, y1: number, x2: number, y2: number) => {
    const cx = (x1 + x2) / 2;
    // Calculate a dynamic height curve that scales with the distance to make the paths look incredibly organic and balanced
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const cy = (y1 + y2) / 2 - distance * 0.18; // curved upwards nicely represent orbiting pathways
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };

  const activeNode = hoveredNode || selectedNode;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden bg-gradient-to-r from-[#03010b] via-[#0b061c] to-[#04010d] border border-purple-500/20 p-6 sm:p-8 rounded-[2.5rem] shadow-[0_4px_40px_rgba(139,92,246,0.1)] flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch justify-between"
    >
      {/* Absolute background visual decorators */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-56 h-56 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid Pattern overlay for tech aesthetics */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f123508_1px,transparent_1px),linear-gradient(to_bottom,#1f123508_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />

      {/* Left Column: Title and Live Inspector State */}
      <div className="flex flex-col justify-between z-10 lg:w-[40%] gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
                VAM Institutional Sync
              </h2>
              <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">
                International Gateway Router
              </span>
            </div>
          </div>

          <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-4 leading-tight">
            Global Gateway <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-[#ca8a04] to-[#DFFF00]">Sync Status</span>
          </h3>
          <p className="text-[10.5px] text-zinc-400 mt-2 max-w-sm">
            High-performance fiber synchronization between international market hubs. Hover or click on any node to audit latency and routing metrics.
          </p>
        </div>

        {/* Live Interactive Node Inspector */}
        <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-4 relative group">
          <div className="absolute top-2 right-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8px] font-black font-mono text-emerald-400 uppercase tracking-widest">GATEWAY SECURE</span>
          </div>

          <p className="text-[8px] text-purple-400 font-black tracking-widest uppercase font-mono">NODE INSPECTOR</p>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNode.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="mt-2.5 space-y-3"
            >
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                  {activeNode.fullName}
                  <span className="text-[8px] px-2 py-0.5 bg-purple-950 text-purple-300 font-bold tracking-widest border border-purple-500/20 uppercase rounded-[6px]">
                    {activeNode.region}
                  </span>
                </h4>
                <p className="text-[9px] font-mono text-zinc-500 mt-0.5">IP ADDRESS: {activeNode.ip} | PROTOCOL: {activeNode.protocol}</p>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-900">
                <div className="bg-zinc-900/40 p-2 rounded-xl border border-zinc-900">
                  <span className="text-[7.5px] text-zinc-500 font-black uppercase tracking-wider block">LATENCY</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Activity className="w-3 h-3 text-[#DFFF00]" />
                    <span className="text-xs font-black font-mono text-[#DFFF00]">{activeNode.latency}</span>
                  </div>
                </div>

                <div className="bg-zinc-900/40 p-2 rounded-xl border border-zinc-900">
                  <span className="text-[7.5px] text-zinc-500 font-black uppercase tracking-wider block">ROUTE LOAD</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Cpu className="w-3 h-3 text-purple-400" />
                    <span className="text-xs font-black font-mono text-purple-400">{activeNode.load}</span>
                  </div>
                </div>

                <div className="bg-zinc-900/40 p-2 rounded-xl border border-zinc-900">
                  <span className="text-[7.5px] text-zinc-500 font-black uppercase tracking-wider block">SYNC EXCELLENCE</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-black font-mono text-emerald-400">{activeNode.syncRate}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: High-fidelity, highly interactive custom SVG World Network Map */}
      <div className="relative flex-1 bg-[#04020a]/90 rounded-[2rem] border border-purple-900/20 flex items-center justify-center p-3 select-none overflow-hidden min-h-[220px] lg:min-h-auto">
        <svg
          className="w-full h-full min-h-[210px]"
          viewBox="0 0 600 230"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle World Map grid matrix vector representation */}
          <g opacity="0.12" fill="#a855f7" stroke="none">
            {/* Rows of micro terminal cells mimicking realistic geographic outlines */}
            {/* North America / US West / US East */}
            <circle cx="50" cy="50" r="1.5" /><circle cx="65" cy="45" r="1.5" /><circle cx="55" cy="65" r="1.5" /><circle cx="70" cy="55" r="1.5" /><circle cx="80" cy="70" r="1.5" /><circle cx="95" cy="60" r="1.5" /><circle cx="110" cy="65" r="1.5" />
            <circle cx="40" cy="35" r="1" /><circle cx="60" cy="30" r="1" /><circle cx="75" cy="40" r="1.5" /><circle cx="90" cy="50" r="1.5" /><circle cx="105" cy="55" r="1" />
            {/* South America */}
            <circle cx="115" cy="110" r="1" /><circle cx="125" cy="130" r="1" /><circle cx="130" cy="140" r="1.5" /><circle cx="140" cy="160" r="1" /><circle cx="145" cy="175" r="1" /><circle cx="150" cy="190" r="1.5" />
            <circle cx="120" cy="120" r="1.5" /><circle cx="135" cy="150" r="1" />
            {/* Europe / UK */}
            <circle cx="210" cy="45" r="1.5" /><circle cx="225" cy="40" r="1" /><circle cx="220" cy="55" r="1.5" /><circle cx="235" cy="50" r="1.5" /><circle cx="250" cy="45" r="1.5" /><circle cx="265" cy="40" r="1" />
            <circle cx="230" cy="65" r="1" /><circle cx="245" cy="60" r="1.5" /><circle cx="260" cy="55" r="1.5" /><circle cx="275" cy="50" r="1" />
            <circle cx="240" cy="75" r="1.5" /><circle cx="255" cy="70" r="1" /><circle cx="270" cy="65" r="1.5" />
            {/* Africa */}
            <circle cx="245" cy="115" r="1" /><circle cx="255" cy="130" r="1.5" /><circle cx="265" cy="145" r="1" /><circle cx="270" cy="160" r="1.5" /><circle cx="275" cy="175" r="1" />
            <circle cx="260" cy="120" r="1" /><circle cx="280" cy="150" r="1" />
            {/* Middle East */}
            <circle cx="310" cy="80" r="1.5" /><circle cx="325" cy="85" r="1" /><circle cx="340" cy="90" r="1.5" /><circle cx="355" cy="95" r="1.5" /><circle cx="360" cy="85" r="1" />
            {/* Asia (Siberia, China, India, Japan) */}
            <circle cx="400" cy="40" r="1.5" /><circle cx="420" cy="35" r="1" /><circle cx="440" cy="30" r="1.5" /><circle cx="460" cy="40" r="1" /><circle cx="480" cy="35" r="1.5" />
            <circle cx="385" cy="65" r="1" /><circle cx="405" cy="60" r="1.5" /><circle cx="425" cy="55" r="1" /><circle cx="445" cy="50" r="1.5" /><circle cx="465" cy="45" r="1" />
            <circle cx="395" cy="80" r="1.5" /><circle cx="410" cy="75" r="1" /><circle cx="430" cy="70" r="1.5" /><circle cx="450" cy="65" r="1" /><circle cx="470" cy="60" r="1.5" />
            <circle cx="420" cy="95" r="1" /><circle cx="435" cy="90" r="1.5" /><circle cx="450" cy="85" r="1" /><circle cx="465" cy="80" r="1.5" /><circle cx="485" cy="75" r="1" /><circle cx="500" cy="70" r="1.5" />
            {/* Southeast Asia & Singapore */}
            <circle cx="435" cy="115" r="1" /><circle cx="445" cy="130" r="1.5" /><circle cx="450" cy="140" r="1.5" /><circle cx="460" cy="150" r="1" />
            {/* Australia */}
            <circle cx="495" cy="175" r="1" /><circle cx="510" cy="180" r="1.5" /><circle cx="525" cy="190" r="1.5" /><circle cx="540" cy="185" r="1" /><circle cx="530" cy="200" r="1" />
          </g>

          {/* Glowing Filter Definitions */}
          <defs>
            <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#DFFF00" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Curved Connections (Dynamic Orbit Curves) */}
          <g>
            {GATEWAY_NODES.flatMap((node) => 
              node.connections.map((targetId) => {
                const target = GATEWAY_NODES.find(n => n.id === targetId);
                // Draw each path exactly once to save memory and optimize render workload
                if (!target || node.id < target.id) return null;

                const isConnectedToSelected = selectedNode.id === node.id || selectedNode.id === target.id;
                const isConnectedToHovered = hoveredNode && (hoveredNode.id === node.id || hoveredNode.id === target.id);
                
                return (
                  <React.Fragment key={`${node.id}-${target.id}`}>
                    {/* Base Curve (Shadow/Dull background Link) */}
                    <path
                      d={getArcPath(node.x, node.y, target.x, target.y)}
                      stroke={isConnectedToHovered ? '#c084fc' : isConnectedToSelected ? 'url(#linkGrad)' : '#3b0764'}
                      strokeWidth={isConnectedToHovered ? '2' : isConnectedToSelected ? '1.5' : '1'}
                      strokeOpacity={isConnectedToHovered ? '0.8' : isConnectedToSelected ? '0.6' : '0.2'}
                      fill="none"
                      className="transition-all duration-300 pointer-events-none"
                    />

                    {/* Animated Pulsing Light Ray Dash Path */}
                    {(isConnectedToSelected || isConnectedToHovered) && (
                      <path
                        d={getArcPath(node.x, node.y, target.x, target.y)}
                        stroke={isConnectedToHovered ? '#DFFF00' : '#c084fc'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                        filter="url(#mapGlow)"
                        className="pointer-events-none opacity-80"
                        style={{
                          strokeDasharray: '22, 120',
                          animation: `flowArcAnim-${node.id} 4.5s linear infinite`
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </g>

          {/* Interactive Nodes Group */}
          <g>
            {GATEWAY_NODES.map((node) => {
              const isSelected = selectedNode.id === node.id;
              const isHovered = hoveredNode?.id === node.id;
              
              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer group/node"
                >
                  {/* Outer Pulsing Aura */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="10"
                      className="fill-purple-500/10 stroke-purple-400/30 animate-ping pointer-events-none"
                      style={{ animationDuration: '3s' }}
                    />
                  )}

                  {/* Interactive Hit Area (Larger transparent circle for touch target support) */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="12"
                    className="fill-transparent"
                  />

                  {/* Visual Node Outer Ring */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected || isHovered ? '7' : '5.5'}
                    fill="#020105"
                    stroke={isHovered ? '#DFFF00' : isSelected ? '#a855f7' : '#581c87'}
                    strokeWidth="1.5"
                    className="transition-all duration-200 shadow-md shadow-black"
                  />

                  {/* visual Node Inner Centroid Core */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected || isHovered ? '3.5' : '2.2'}
                    fill={isHovered ? '#DFFF00' : isSelected ? '#c084fc' : '#a855f7'}
                    className="transition-all duration-200"
                  />

                  {/* Node Hover Tooltip/Label Tag */}
                  <text
                    x={node.x}
                    y={node.y - 12}
                    textAnchor="middle"
                    className={`font-mono font-black text-[8px] uppercase tracking-wider fill-white select-none pointer-events-none transition-all duration-200 ${
                      isSelected || isHovered ? 'opacity-100 scale-100 fill-[#DFFF00]' : 'opacity-40 scale-95 hover:opacity-100'
                    }`}
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Dynamic orbital connection styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          ${GATEWAY_NODES.map((node, i) => `
            @keyframes flowArcAnim-${node.id} {
              0% { stroke-dashoffset: ${140 + i * 20}; }
              100% { stroke-dashoffset: ${-140 - i * 20}; }
            }
          `).join('\n')}
        `}} />

        {/* Small floating hint helper */}
        <div className="absolute bottom-3 right-4 px-2.5 py-1 bg-zinc-950/90 rounded-xl border border-zinc-900 text-[8px] text-zinc-400 font-bold tracking-widest uppercase flex items-center gap-2 backdrop-blur-md shadow-md">
          <span className="w-1.5 h-1.5 bg-[#DFFF00] inline-block rounded-full animate-ping" />
          CLICK NODE TO AUDIT ROUTE
        </div>
      </div>
    </motion.div>
  );
};
