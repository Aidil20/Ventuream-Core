import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, 
  Fingerprint, 
  Share2, 
  Sliders, 
  Search, 
  AlertTriangle, 
  RefreshCw, 
  Info,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Download
} from 'lucide-react';

export interface GnnNode {
  id: string;
  name: string;
  type: 'offshore' | 'shell' | 'nominee' | 'clearing' | 'regulated';
  riskScore: number; // 0 to 100
  uboPercentage: number; // Ultimate Beneficial Ownership percentage
  jurisdiction: string;
  assetClass: string;
  status: 'High Alert' | 'Suspicious' | 'Benign';
  coordinates: { x: number; y: number };
}

export interface GnnLink {
  source: string;
  target: string;
  relationship: string;
  flowVolume: string; // e.g. "$120M"
  timeLagMinutes: number;
}

const INITIAL_NODES: GnnNode[] = [
  { id: '1', name: 'BVI Smelter Corp', type: 'offshore', riskScore: 92, uboPercentage: 85, jurisdiction: 'British Virgin Islands', assetClass: 'Mining Commodities', status: 'High Alert', coordinates: { x: 100, y: 150 } },
  { id: '2', name: 'Cayman Trust LLC', type: 'shell', riskScore: 84, uboPercentage: 60, jurisdiction: 'Cayman Islands', assetClass: 'Intermediated Holding', status: 'Suspicious', coordinates: { x: 300, y: 150 } },
  { id: '3', name: 'PT Prima Nominees', type: 'nominee', riskScore: 68, uboPercentage: 15, jurisdiction: 'Indonesia', assetClass: 'Corporate Proxy', status: 'Suspicious', coordinates: { x: 500, y: 300 } },
  { id: '4', name: 'SID-COMP-8302', type: 'regulated', riskScore: 12, uboPercentage: 100, jurisdiction: 'Indonesia', assetClass: 'VAM Managed Portfolio', status: 'Benign', coordinates: { x: 700, y: 300 } },
  { id: '5', name: 'Sovereign Clearing Corp', type: 'clearing', riskScore: 18, uboPercentage: 0, jurisdiction: 'Singapore', assetClass: 'Financial Hub', status: 'Benign', coordinates: { x: 400, y: 100 } },
  { id: '6', name: 'Seychelles Apex Trust', type: 'offshore', riskScore: 88, uboPercentage: 45, jurisdiction: 'Seychelles', assetClass: 'Investment Vehicle', status: 'High Alert', coordinates: { x: 200, y: 350 } }
];

const INITIAL_LINKS: GnnLink[] = [
  { source: '1', target: '2', relationship: 'Double Invoicing', flowVolume: '$42.5M', timeLagMinutes: 18 },
  { source: '2', target: '3', relationship: 'Asset Transfer', flowVolume: '$38.0M', timeLagMinutes: 72 },
  { source: '3', target: '4', relationship: 'Portfolio Placement', flowVolume: '$15.4M', timeLagMinutes: 12 },
  { source: '5', target: '2', relationship: 'Intermediary Swap', flowVolume: '$20.1M', timeLagMinutes: 4 },
  { source: '6', target: '3', relationship: 'Nominee Channeling', flowVolume: '$18.8M', timeLagMinutes: 28 }
];

interface GnnGraphProps {
  onNodeSelect?: (node: GnnNode) => void;
}

export const BeneficialOwnershipGnnGraph: React.FC<GnnGraphProps> = React.memo(({ onNodeSelect }) => {
  const [nodes, setNodes] = useState<GnnNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<GnnLink[]>(INITIAL_LINKS);
  
  // Controls
  const [minRiskThreshold, setMinRiskThreshold] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Jurisdiction grouping & toggling states
  const [disabledJurisdictions, setDisabledJurisdictions] = useState<string[]>([]);

  const allJurisdictions = useMemo(() => {
    return Array.from(new Set(nodes.map(n => n.jurisdiction)));
  }, [nodes]);

  const toggleJurisdiction = useCallback((jurisdiction: string) => {
    setDisabledJurisdictions(prev => 
      prev.includes(jurisdiction) 
        ? prev.filter(j => j !== jurisdiction) 
        : [...prev, jurisdiction]
    );
  }, []);

  const enableAllJurisdictions = useCallback(() => {
    setDisabledJurisdictions([]);
  }, []);

  // 1. MEMOIZED GRAPH PROJECTION
  // This performs the structural graph reduction based on the filter criteria.
  // Memoization prevents expensive operations (re-filtering nodes, calculating connectivity) 
  // on every parent update, which is a major bottleneck during layout calculations.
  const projectedGraph = useMemo(() => {
    // Filter nodes based on searching criteria & risk scores and jurisdiction toggle
    const filteredNodes = nodes.filter(node => {
      const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            node.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk = node.riskScore >= minRiskThreshold;
      const isJurisdictionEnabled = !disabledJurisdictions.includes(node.jurisdiction);
      return matchesSearch && matchesRisk && isJurisdictionEnabled;
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

    // Links are only rendered if BOTH source and target nodes exist in our projected projection
    const filteredLinks = links.filter(link => 
      filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
    );

    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }, [nodes, links, searchQuery, minRiskThreshold, disabledJurisdictions]);

  // 1.5. JURISDICTION GEOGRAPHIC BOUNDARY CLUSTERS
  const jurisdictionClusters = useMemo(() => {
    const clusters: Record<string, {
      nodes: GnnNode[];
      centroid: { x: number; y: number };
      radius: number;
    }> = {};

    projectedGraph.nodes.forEach(node => {
      const j = node.jurisdiction;
      if (!clusters[j]) {
        clusters[j] = {
          nodes: [],
          centroid: { x: 0, y: 0 },
          radius: 0
        };
      }
      clusters[j].nodes.push(node);
    });

    Object.keys(clusters).forEach(j => {
      const c = clusters[j];
      const count = c.nodes.length;
      if (count === 0) return;

      let sumX = 0;
      let sumY = 0;
      c.nodes.forEach(n => {
        sumX += n.coordinates.x;
        sumY += n.coordinates.y;
      });
      const cx = sumX / count;
      const cy = sumY / count;
      c.centroid = { x: cx, y: cy };

      // Calculate the radius to span all nodes in the cluster with some padding
      let maxDist = 0;
      c.nodes.forEach(n => {
        const dx = n.coordinates.x - cx;
        const dy = n.coordinates.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) maxDist = dist;
      });
      // Ensure a reasonable minimum radius for single nodes
      c.radius = Math.max(50, maxDist + 35);
    });

    return clusters;
  }, [projectedGraph.nodes]);

  // Handle manual coordinate adjustment or risk adjustments
  const handleScaleUpRisk = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, riskScore: Math.min(100, n.riskScore + 5) };
      }
      return n;
    }));
  }, []);

  const selectedNode = useMemo(() => {
    return projectedGraph.nodes.find(n => n.id === selectedNodeId) || null;
  }, [projectedGraph.nodes, selectedNodeId]);

  const handleNodeClick = useCallback((node: GnnNode) => {
    setSelectedNodeId(node.id);
    if (onNodeSelect) {
      onNodeSelect(node);
    }
  }, [onNodeSelect]);

  const toggleSimulation = useCallback(() => {
    setSimulationActive(prev => !prev);
  }, []);

  const handleDownloadFilteredGraph = useCallback(() => {
    if (isDownloading) return;
    setIsDownloading(true);

    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectedGraph, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `VAM_Radar_Filtered_Graph_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setIsDownloading(false);

      // Trigger a beautiful notification toast matching VAM branding
      setToastMessage(`DATA EXPORT INITIATED: Successfully downloaded ${projectedGraph.nodes.length} entity nodes and ${projectedGraph.links.length} vectors to JSON payload.`);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 4000);
    }, 1500);
  }, [projectedGraph, isDownloading]);

  return (
    <div className="bg-[#020407]/90 border border-zinc-900 rounded-[2rem] p-6 space-y-6 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFFF00]/[0.01] rounded-full blur-3xl pointer-events-none" />

      {/* Header and Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <span className="text-[8px] font-black text-[#DFFF00] uppercase tracking-[0.2em] block">
            GNN Tensor Module
          </span>
          <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">
            Optimized Beneficial Ownership Graph Map
          </h4>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
            Memoized neural trace projection preventing parent update pipeline lag
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Risk Sliders */}
          <div className="flex items-center gap-2 bg-zinc-950 px-3.5 py-1.5 rounded-xl border border-zinc-900">
            <Sliders className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">
              Min Risk Limit: {minRiskThreshold}%
            </span>
            <input 
              type="range" 
              min="0" 
              max="90" 
              value={minRiskThreshold}
              onChange={(e) => setMinRiskThreshold(Number(e.target.value))}
              className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#DFFF00]"
            />
          </div>

          {/* Search nodes */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input 
              type="text"
              placeholder="Filter by Entity / Country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/80 border border-zinc-900 rounded-xl py-1.5 pl-8 pr-3 text-[10px] font-bold text-white focus:outline-none focus:border-[#DFFF00]/50 w-44"
            />
          </div>

          <button 
            onClick={toggleSimulation}
            className={`p-2 rounded-xl border transition-all ${simulationActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
            title="Toggle neural pulse"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${simulationActive ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
        </div>
      </div>

      {/* Jurisdiction Cluster Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/60 p-4 border border-zinc-900 rounded-[1.5rem]" id="jurisdiction-controls">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-[#DFFF00]" />
            <span className="text-[9px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">
              Jurisdiction Clusters:
            </span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              id="btn-show-all-jurisdictions"
              onClick={enableAllJurisdictions}
              className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all border ${
                disabledJurisdictions.length === 0 
                  ? 'bg-[#DFFF00]/10 border-[#DFFF00]/30 text-[#DFFF00]' 
                  : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-500 hover:text-white'
              }`}
            >
              Show All
            </button>
            {allJurisdictions.map((jurisdiction, index) => {
              const isEnabled = !disabledJurisdictions.includes(jurisdiction);
              const hue = (index * 68) % 360;
              const markerColor = `hsl(${hue}, 85%, 60%)`;
              const count = nodes.filter(n => n.jurisdiction === jurisdiction).length;

              return (
                <button
                  key={jurisdiction}
                  id={`btn-toggle-jur-${jurisdiction.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => toggleJurisdiction(jurisdiction)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all flex items-center gap-2 border ${
                    isEnabled 
                      ? 'bg-zinc-900 border-zinc-805 text-zinc-100 hover:border-zinc-700' 
                      : 'bg-red-950/10 border-red-950/30 text-zinc-600 line-through'
                  }`}
                >
                  <span 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: isEnabled ? markerColor : 'gray' }} 
                  />
                  <span>{jurisdiction}</span>
                  <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded-md ${isEnabled ? 'bg-zinc-800 text-[#DFFF00] font-black' : 'bg-zinc-900 text-zinc-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          id="btn-download-filtered-graph"
          onClick={handleDownloadFilteredGraph}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              if (!isDownloading) {
                handleDownloadFilteredGraph();
              }
            }
          }}
          disabled={isDownloading}
          className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all bg-[#DFFF00] hover:bg-[#deff9a] text-black flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export visible nodes and relationships based on current filters"
          aria-label="Download Filtered Graph as JSON format"
          aria-busy={isDownloading}
          aria-live="polite"
        >
          {isDownloading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{isDownloading ? 'Processing Export...' : 'Download Filtered Graph'}</span>
        </button>
      </div>

      {/* Main Grid: Interactive Canvas & Node Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Interactive Neural Projection Canvas */}
        <div className="lg:col-span-8 bg-black/40 border border-zinc-900/60 rounded-2xl relative min-h-[400px] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(223,255,0,0.015)_0%,transparent_75%)] pointer-events-none" />
          
          {/* Canvas Crosshairs */}
          <div className="absolute inset-0 stroke-zinc-900/30 stroke-[0.5] stroke-dasharray-[2_4] pointer-events-none select-none">
            <svg width="100%" height="100%">
              <line x1="50%" y1="0%" x2="50%" y2="100%" />
              <line x1="0%" y1="50%" x2="100%" y2="50%" />
            </svg>
          </div>

          {/* Render Graph Visualizations via absolute positioning and SVG layers */}
          <div className="relative w-full h-[380px]">
            {/* SVG Connecting Paths Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 2 L 10 5 L 0 8 z" fill="#e2e8f0" opacity="0.3" />
                </marker>
              </defs>

              {/* Geographic Cluster Boundaries (Visual Grouping Field Backgrounds) */}
              <g id="geographic-clusters" opacity="0.8">
                {Object.entries(jurisdictionClusters).map(([jurisdiction, cluster]: [string, any], index) => {
                  if (cluster.nodes.length === 0) return null;
                  const { x, y } = cluster.centroid;
                  
                  // Custom elegant palette for geo layers
                  const hue = (index * 68) % 360;
                  const clusterColor = `hsla(${hue}, 80%, 65%, 0.045)`;
                  const strokeColor = `hsla(${hue}, 85%, 60%, 0.22)`;
                  const textColor = `hsla(${hue}, 90%, 75%, 0.85)`;
                  
                  return (
                    <g key={`cluster-${jurisdiction}`}>
                      {/* Dotted orbital bounding circle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={cluster.radius}
                        fill={clusterColor}
                        stroke={strokeColor}
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                      />
                      
                      {/* Subtle centroid spot */}
                      <circle
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill={strokeColor}
                        opacity="0.45"
                      />

                      {/* Cluster text banner */}
                      <g transform={`translate(${x - cluster.radius + 12}, ${y - cluster.radius + 20})`}>
                        <rect
                          x="-5"
                          y="-9"
                          width={jurisdiction.length * 5.2 + 10}
                          height="13"
                          rx="3.5"
                          fill="#030712"
                          stroke={strokeColor}
                          strokeWidth="0.6"
                          opacity="0.9"
                        />
                        <text
                          fill={textColor}
                          fontSize="7"
                          fontWeight="extrabold"
                          fontFamily="monospace"
                          className="uppercase tracking-widest"
                          y="0"
                        >
                          {jurisdiction}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {projectedGraph.links.map((link, idx) => {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode || !projectedGraph.nodes.includes(sourceNode) || !projectedGraph.nodes.includes(targetNode)) return null;

                const dx = targetNode.coordinates.x - sourceNode.coordinates.x;
                const dy = targetNode.coordinates.y - sourceNode.coordinates.y;
                const angle = Math.atan2(dy, dx);
                
                // Fine adjustments to make lines look extremely crisp
                const startX = sourceNode.coordinates.x;
                const startY = sourceNode.coordinates.y;
                const endX = targetNode.coordinates.x;
                const endY = targetNode.coordinates.y;

                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2 - 20;

                // Color lines based on link potential risks
                const isHighRisk = sourceNode.riskScore > 80 || targetNode.riskScore > 80;
                const strokeColor = isHighRisk ? 'rgba(239, 68, 68, 0.4)' : 'rgba(223, 255, 0, 0.2)';

                return (
                  <g key={`${link.source}-${link.target}-${idx}`}>
                    {/* Flow Arc Curve */}
                    <path
                      d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      markerEnd="url(#arrow)"
                    />
                    
                    {/* Interactive flow volume bubble on path */}
                    <g transform={`translate(${midX}, ${midY + 10})`}>
                      <rect 
                        x="-24" 
                        y="-10" 
                        width="48" 
                        height="14" 
                        rx="4" 
                        fill="#09090b" 
                        stroke={isHighRisk ? '#ef4444' : '#18181b'} 
                        strokeWidth="0.5" 
                        opacity="0.9"
                      />
                      <text 
                        fill={isHighRisk ? '#f87171' : '#a1a1aa'} 
                        fontSize="7" 
                        fontWeight="bold" 
                        fontFamily="monospace"
                        textAnchor="middle" 
                        y="-1.5"
                      >
                        {link.flowVolume}
                      </text>
                    </g>
                    
                    {/* Signal impulse particle */}
                    {simulationActive && (
                      <motion.circle
                        r="3"
                        fill={isHighRisk ? '#ef4444' : '#DFFF00'}
                        initial={{ offset: 0 }}
                        animate={{
                          cx: [startX, midX, endX],
                          cy: [startY, midY, endY],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 3 + Math.random() * 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: idx * 0.7
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Neural Entity Nodes Layout Layer */}
            {projectedGraph.nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              
              const nodeBgColor = () => {
                if (node.status === 'High Alert') return 'bg-red-950/80 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
                if (node.status === 'Suspicious') return 'bg-orange-950/80 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.15)]';
                return 'bg-emerald-950/80 border-emerald-500';
              };

              const nodeLetter = node.type === 'offshore' ? 'EXP' : node.type === 'shell' ? 'SHB' : node.type === 'nominee' ? 'NOM' : node.type === 'clearing' ? 'CLR' : 'SID';

              return (
                <div
                  key={node.id}
                  style={{ 
                    position: 'absolute', 
                    left: `${node.coordinates.x}px`, 
                    top: `${node.coordinates.y}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isSelected ? 30 : 20
                  }}
                  className="cursor-pointer group flex flex-col items-center select-none"
                  onClick={() => handleNodeClick(node)}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-mono font-extrabold text-[10px] text-white transition-all ${nodeBgColor()} ${isSelected ? 'ring-2 ring-offset-2 ring-offset-black ring-[#DFFF00]' : ''}`}
                  >
                    {nodeLetter}
                  </motion.div>
                  <span className="text-[9px] font-bold text-zinc-100 uppercase mt-1.5 line-clamp-1 max-w-[100px] text-center bg-black/80 px-1.5 py-0.5 rounded border border-zinc-900/40">
                    {node.name}
                  </span>
                  <span className="text-[7px] font-mono text-zinc-500 uppercase mt-0.5">
                    {node.jurisdiction}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Insights Inspector Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4 h-full flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4.5 h-4.5 text-[#DFFF00]" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                        Entity Profile Ledger
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase ${
                      selectedNode.status === 'High Alert' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                      selectedNode.status === 'Suspicious' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                    }`}>
                      {selectedNode.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-black text-zinc-100 uppercase tracking-widest">{selectedNode.name}</h5>
                    <p className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest leading-normal">
                      PRIMARY JURISDICTION: <span className="text-zinc-300 font-mono text-[11px] font-normal leading-none block mt-0.5">{selectedNode.jurisdiction}</span>
                    </p>
                    <p className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest leading-normal">
                      ASSET CLASS CAP: <span className="text-zinc-300 font-sans text-xs font-bold block mt-0.5">{selectedNode.assetClass}</span>
                    </p>
                  </div>

                  {/* Ultimate beneficial ownership */}
                  <div className="bg-black border border-zinc-900 p-3.5 rounded-xl space-y-2">
                    <div className="flex justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                      <span>UBO Percentage</span>
                      <span className="text-[#DFFF00] font-mono">{selectedNode.uboPercentage}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#DFFF00] h-full rounded-full" style={{ width: `${selectedNode.uboPercentage}%` }} />
                    </div>
                    <span className="text-[7.5px] font-mono text-zinc-600 uppercase block leading-snug">
                      Defines total absolute shareholding ownership control index mapped via backward sovereign chains
                    </span>
                  </div>

                  {/* Neural Risk Analyzer */}
                  <div className="bg-black border border-zinc-900 p-3.5 rounded-xl space-y-2">
                    <div className="flex justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                      <span>Neural GNN Risk Signal</span>
                      <span className={`font-mono font-extrabold ${selectedNode.riskScore > 75 ? 'text-red-500' : 'text-emerald-400'}`}>{selectedNode.riskScore}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${selectedNode.riskScore > 75 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${selectedNode.riskScore}%` }} />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[7.5px] text-zinc-550 uppercase tracking-widest font-black">
                        Confidence Ranker
                      </span>
                      <button 
                        onClick={() => handleScaleUpRisk(selectedNode.id)}
                        className="text-[7.5px] font-black text-[#DFFF00] uppercase hover:underline"
                      >
                        Elevate Risk Vectors +5%
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-900 pt-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-zinc-500 shrink-0" />
                  <p className="text-[8px] font-mono text-zinc-500 leading-normal uppercase">
                    Calculated via sovereign GNN tracing and verified against actual counterparty invoices.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-2xl p-6 h-[400px] flex flex-col items-center justify-center text-center space-y-3">
                <Network className="w-8 h-8 text-zinc-800" />
                <div>
                  <h5 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Select Entity Node</h5>
                  <p className="text-[9px] text-zinc-650 uppercase tracking-wider mt-1.5 leading-relaxed">
                    Tap any node in the interactive GNN matrix representation map to extract institutional UBO percentages & tracing audit lines.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Diagnostics / Alert ledger */}
      <div className="p-4 bg-black border border-zinc-900 rounded-2xl flex items-start gap-3">
        <div className="p-1.5 bg-red-500/10 rounded-lg border border-red-500/25 text-red-400">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
        </div>
        <div>
          <h5 className="text-[8px] font-black text-red-400 uppercase tracking-widest leading-none">
            GNN DENSE GRAPH PREDICTION ALERT: LAYER_GAP MATCHED
          </h5>
          <p className="text-[10px] font-mono text-zinc-500 mt-1 lines-clamp-2">
            Automated cluster correlation: Detected circular patterns channeling $15.4M from BVI Shell trusts into PT Prima Nominees proxies within a 12-minute temporal block. Graph engine isolated this route automatically.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-6 left-6 right-6 z-50 bg-black/95 border border-[#DFFF00]/30 hover:border-[#DFFF00]/50 p-4 rounded-2xl shadow-[0_8px_32px_rgba(223,255,0,0.08)] flex items-center justify-between gap-4 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#DFFF00]/10 rounded-xl border border-[#DFFF00]/20 text-[#DFFF00]">
                <Download className="w-4 h-4 animate-pulse text-[#DFFF00]" />
              </div>
              <div className="text-left">
                <span className="text-[8px] font-black font-mono text-[#DFFF00] uppercase tracking-[0.15em] block">Compliance Engine Export Status</span>
                <p className="text-[10px] font-mono text-white font-medium leading-relaxed mt-0.5">
                  {toastMessage}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowToast(false)}
              className="text-zinc-500 hover:text-white transition-colors p-1"
            >
              <span className="text-xs font-black font-mono">DISMISS x</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

BeneficialOwnershipGnnGraph.displayName = 'BeneficialOwnershipGnnGraph';
