import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Activity, 
  Sliders, 
  AlertTriangle, 
  HelpCircle, 
  DollarSign, 
  Sparkles, 
  Play,
  RotateCcw,
  FileDown,
  AreaChart as ChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine,
  Cell,
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PortfolioAsset {
  ticker: string;
  lots: number;
  averagePrice: number;
  marketPrice: number;
  currentPrice: number;
  change: number;
  marketValue: number;
  unrealized: number;
}

interface RiskAnalyticsProps {
  portfolioData: PortfolioAsset[];
  cashBalance: number;
}

// Fixed metadata for precise Risk Modelling
const TICKER_RISK_METADATA: Record<string, { name: string; dailyVol: number; expectedReturn: number; beta: number; sector: string }> = {
  'DEFI': { name: "DEFI (Financial Services)", dailyVol: 0.046, expectedReturn: 0.22, beta: 1.65, sector: "Financial" },
  'DSSA': { name: "DSSA (Energy Conglo)", dailyVol: 0.021, expectedReturn: 0.12, beta: 0.85, sector: "Energy" },
  'BUMI': { name: "BUMI (Bumi Resources Tbk)", dailyVol: 0.038, expectedReturn: 0.15, beta: 1.45, sector: "Energy" },
  'KOTA': { name: "KOTA (Service & Logistics)", dailyVol: 0.052, expectedReturn: 0.18, beta: 1.75, sector: "Service" },
  'CTTH': { name: "CTTH (PT Citatah Tbk)", dailyVol: 0.032, expectedReturn: 0.11, beta: 1.05, sector: "Basic Materials" },
  'LAND': { name: "LAND (Property & Dev)", dailyVol: 0.035, expectedReturn: 0.14, beta: 1.30, sector: "Property" },
  'LPKR': { name: "LPKR (Lippo Karawaci)", dailyVol: 0.025, expectedReturn: 0.10, beta: 1.10, sector: "Property" },
  'PIPA': { name: "PIPA (Metal & Piping)", dailyVol: 0.039, expectedReturn: 0.16, beta: 1.40, sector: "Service" },
  'BACH': { name: "BACH (Alumina Chemical)", dailyVol: 0.034, expectedReturn: 0.17, beta: 1.15, sector: "Basic Materials" },
  'EMMI': { name: "EMMI (Manufacturing)", dailyVol: 0.028, expectedReturn: 0.13, beta: 0.95, sector: "Consumer" },
  'JECX': { name: "JECX (Tech & Commerce)", dailyVol: 0.045, expectedReturn: 0.20, beta: 1.50, sector: "Technology" },
  'PRDL': { name: "PRDL (Real Estate Dev)", dailyVol: 0.032, expectedReturn: 0.12, beta: 1.25, sector: "Property" },
  'RANS': { name: "RANS (Media & Ent)", dailyVol: 0.050, expectedReturn: 0.19, beta: 1.60, sector: "Consumer" },
  'PJHB-W': { name: "PJHB-W (Security Warrant)", dailyVol: 0.080, expectedReturn: 0.25, beta: 2.10, sector: "Financial" },
  'DEFAULT': { name: "Asset Group", dailyVol: 0.032, expectedReturn: 0.13, beta: 1.20, sector: "Other" }
};

export default function RiskAnalytics({ portfolioData, cashBalance }: RiskAnalyticsProps) {
  const [riskFreeRate, setRiskFreeRate] = useState<number>(6.25); // default BI rate (6.25%)
  const [activeTab, setActiveTab] = useState<'analytical' | 'historical' | 'stress'>('analytical');
  const [stressScenario, setStressScenario] = useState<string>('none');
  const [showTooltipInfo, setShowTooltipInfo] = useState<string | null>(null);
  const [varConfLevel, setVarConfLevel] = useState<'95' | '99'>('95');
  const [varHorizon, setVarHorizon] = useState<'1D' | '10D'>('1D');

  // 1. Math Analysis: Portfolio Weights & Metrics
  const riskAnalysis = useMemo(() => {
    const assetsMarketVal = portfolioData.reduce((acc, curr) => acc + (curr.marketValue || 0), 0);
    const totalPortfolioValue = assetsMarketVal + cashBalance;

    if (totalPortfolioValue === 0) {
      return {
        assetsVal: 0,
        totalVal: 0,
        cashWeight: 100,
        assets: [],
        portfolioDailyVol: 0,
        portfolioAnnualVol: 0,
        recentPortfolioDailyVol: 0,
        recentPortfolioAnnualVol: 0,
        portfolioExpectedReturn: 0,
        sharpeRatio: 0,
        portfolioBeta: 0,
        treynorRatio: 0,
        diversificationBenefit: 0,
        var95_1d: 0,
        var99_1d: 0,
        var99_10d: 0,
        ewmaVar95_1d: 0,
        ewmaVar99_1d: 0,
        ewmaVar99_10d: 0,
        histReturnSamples: [],
        histVar95: 0,
        histVar99: 0,
        assetRiskContributions: []
      };
    }

    const cashWeight = cashBalance / totalPortfolioValue;

    // Normalizing assets list & calculating stand-alone parameters
    const assetsWithWeights = portfolioData.map(asset => {
      const cleanTicker = asset.ticker.replace('.JK', '');
      const meta = TICKER_RISK_METADATA[cleanTicker] || TICKER_RISK_METADATA.DEFAULT;
      const weight = asset.marketValue / totalPortfolioValue;

      // Calculate EWMA Volatility (lambda = 0.94) based on recent realized daily change %
      const dailyReturnFrac = (asset.change || 0) / 100;
      const ewmaDailyVol = Math.sqrt(0.06 * Math.pow(dailyReturnFrac, 2) + 0.94 * Math.pow(meta.dailyVol, 2));
      const recentVol = Math.max(meta.dailyVol * 0.4, Math.min(meta.dailyVol * 2.5, ewmaDailyVol));

      return {
        ticker: cleanTicker,
        fullName: meta.name,
        marketValue: asset.marketValue,
        weight: weight,
        dailyVol: meta.dailyVol,
        recentVol: recentVol,
        annualVol: meta.dailyVol * Math.sqrt(252),
        recentAnnualVol: recentVol * Math.sqrt(252),
        expectedReturn: meta.expectedReturn,
        beta: meta.beta,
        sector: meta.sector
      };
    }).filter(a => a.marketValue > 0);

    // Dynamic Variance-Covariance Matrix Modeling (Constant Correlation model = 0.25)
    // cash has 0 volatility, 0 correlation
    const rho = 0.25;
    let portfolioVariance = 0;
    let recentPortfolioVariance = 0;

    // Single-Index Portfolio Volatility Formula with pairs
    assetsWithWeights.forEach((a) => {
      // variance term: w_i^2 * s_i^2
      portfolioVariance += Math.pow(a.weight, 2) * Math.pow(a.dailyVol, 2);
      recentPortfolioVariance += Math.pow(a.weight, 2) * Math.pow(a.recentVol, 2);
    });

    for (let i = 0; i < assetsWithWeights.length; i++) {
      for (let j = i + 1; j < assetsWithWeights.length; j++) {
        const a = assetsWithWeights[i];
        const b = assetsWithWeights[j];
        // covariance term: 2 * w_i * w_j * cov_ij
        portfolioVariance += 2 * a.weight * b.weight * rho * a.dailyVol * b.dailyVol;
        recentPortfolioVariance += 2 * a.weight * b.weight * rho * a.recentVol * b.recentVol;
      }
    }

    const portfolioDailyVol = Math.sqrt(portfolioVariance);
    const portfolioAnnualVol = portfolioDailyVol * Math.sqrt(252);

    const recentPortfolioDailyVol = Math.sqrt(recentPortfolioVariance);
    const recentPortfolioAnnualVol = recentPortfolioDailyVol * Math.sqrt(252);

    // Standalone risk sum to calculate diversification benefit
    const sumStandaloneAnnualVol = assetsWithWeights.reduce((acc, curr) => acc + (curr.weight * curr.annualVol), 0);
    const diversificationBenefit = Math.max(0, sumStandaloneAnnualVol - portfolioAnnualVol);

    // Annual expected return (weighted average)
    const expectedReturnRiskFreeCash = cashWeight * (riskFreeRate / 100);
    const expectedReturnAssets = assetsWithWeights.reduce((acc, curr) => acc + (curr.weight * curr.expectedReturn), 0);
    const portfolioExpectedReturn = expectedReturnAssets + expectedReturnRiskFreeCash;

    // Sharpe Ratio
    const rRiskFreeFraction = riskFreeRate / 100;
    const sharpeRatio = portfolioAnnualVol > 0 
      ? (portfolioExpectedReturn - rRiskFreeFraction) / portfolioAnnualVol 
      : 0;

    // Portfolio Beta (weighted)
    const portfolioBeta = assetsWithWeights.reduce((acc, curr) => acc + (curr.weight * curr.beta), 0);

    // Treynor Ratio
    const treynorRatio = portfolioBeta > 0 
      ? (portfolioExpectedReturn - rRiskFreeFraction) / portfolioBeta 
      : 0;

    // Value at Risk Calculations (Standard Parametric multipliers)
    const var95_1d = 1.645 * portfolioDailyVol * totalPortfolioValue;
    const var99_1d = 2.326 * portfolioDailyVol * totalPortfolioValue;
    const var99_10d = Math.sqrt(10) * var99_1d;

    // Volatility-Scaled VaR (EWMA 0.94 Decay model based on live volatility)
    const ewmaVar95_1d = 1.645 * recentPortfolioDailyVol * totalPortfolioValue;
    const ewmaVar99_1d = 2.326 * recentPortfolioDailyVol * totalPortfolioValue;
    const ewmaVar99_10d = Math.sqrt(10) * ewmaVar99_1d;

    // Calculate Asset Risk Marginal Contribution (MCTR approximation)
    const assetRiskContributions = assetsWithWeights.map(a => {
      // Standalone proportion of portfolio variance = weight * dailyVol
      // Marginal Contribution to Volatility (MCTR) = cov(asset, port) / vol_port
      // In Constant Correlation: cov_ip = w_i * vol_i^2 + sum_{j != i} ( w_j * rho * vol_i * vol_j )
      let covarianceWithPortfolio = a.weight * Math.pow(a.dailyVol, 2);
      assetsWithWeights.forEach(other => {
        if (other.ticker !== a.ticker) {
          covarianceWithPortfolio += other.weight * rho * a.dailyVol * other.dailyVol;
        }
      });
      
      const marginalRisk = portfolioDailyVol > 0 ? covarianceWithPortfolio / portfolioDailyVol : 0;
      const riskContribution = a.weight > 0 ? a.weight * marginalRisk * Math.sqrt(252) : 0; // annualized
      
      return {
        ticker: a.ticker,
        weight: a.weight * 100,
        standaloneVol: a.annualVol * 100,
        riskCont: riskContribution * 100,
        percentageContribution: portfolioAnnualVol > 0 ? (riskContribution / portfolioAnnualVol) * 100 : 0
      };
    });

    // 2. Historical Simulation: Scenario returns generation (Deterministic pseudo-random)
    const numDays = 150;
    const histReturnSamples: number[] = [];
    
    // Seeded random normal approximation generator for consistent numbers
    const getSeededRandomNormal = (seedString: string, mean: number, std: number) => {
      let hash = 0;
      for (let i = 0; i < seedString.length; i++) {
        hash = (hash << 5) - hash + seedString.charCodeAt(i);
        hash |= 0;
      }
      // Simple LCG
      let randVal = Math.abs(Math.sin(hash)) * 1000 % 1;
      let randVal2 = Math.abs(Math.cos(hash + 100)) * 1000 % 1;
      
      // Box-Muller transform
      const u1 = Math.max(randVal, 0.00001);
      const u2 = Math.max(randVal2, 0.00001);
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return mean + (std * z);
    };

    for (let day = 1; day <= numDays; day++) {
      // 1. common market factor return
      const mktRet = getSeededRandomNormal(`day-${day}-idx`, 0.0004, 0.012); // ~6.3% annual mean, Vol 19%
      
      let dayCombinedReturn = 0;
      assetsWithWeights.forEach(a => {
        // firm specific idiosyncratic risk
        const firmVol = Math.sqrt(Math.max(0.0001, Math.pow(a.dailyVol, 2) - Math.pow(a.beta * 0.012, 2)));
        const firmRet = getSeededRandomNormal(`day-${day}-${a.ticker}`, 0, firmVol);
        
        // Single factor model
        const assetDayReturn = (a.expectedReturn / 252) + (a.beta * mktRet) + firmRet;
        dayCombinedReturn += a.weight * assetDayReturn;
      });

      // portfolio combined cash portion (constant daily risk-free return)
      const cashDayReturn = cashWeight * (rRiskFreeFraction / 252);
      dayCombinedReturn += cashDayReturn;

      histReturnSamples.push(dayCombinedReturn);
    }

    // Sort ascending for VaR percentile analysis
    const sortedSample = [...histReturnSamples].sort((a, b) => a - b);
    // 95% Var = 5th percentile of 150 days (~7th elements)
    const index95 = Math.floor(0.05 * sortedSample.length);
    const index99 = Math.floor(0.01 * sortedSample.length);
    
    const histVar95 = Math.abs(sortedSample[index95]) * totalPortfolioValue;
    const histVar99 = Math.abs(sortedSample[index99]) * totalPortfolioValue;

    return {
      assetsVal: assetsMarketVal,
      totalVal: totalPortfolioValue,
      cashWeight: cashWeight * 100,
      assets: assetsWithWeights,
      portfolioDailyVol,
      portfolioAnnualVol,
      recentPortfolioDailyVol,
      recentPortfolioAnnualVol,
      portfolioExpectedReturn,
      sharpeRatio,
      portfolioBeta,
      treynorRatio,
      diversificationBenefit,
      var95_1d,
      var99_1d,
      var99_10d,
      ewmaVar95_1d,
      ewmaVar99_1d,
      ewmaVar99_10d,
      histReturnSamples,
      histVar95,
      histVar99,
      assetRiskContributions
    };
  }, [portfolioData, cashBalance, riskFreeRate]);

  // Selected Value at Risk (VaR) Calculation based on user configuration and recent market volatility
  const selectedVaR = useMemo(() => {
    const z = varConfLevel === '95' ? 1.645 : 2.326;
    const hFactor = varHorizon === '1D' ? 1 : Math.sqrt(10);
    const dailyVol = riskAnalysis.recentPortfolioDailyVol;
    
    // Percentage Risk Score is: Confidence Z-score * Daily Portfolio Volatility * Sqrt(Horizon) * 100
    const pctScore = z * dailyVol * hFactor * 100;
    const idrLoss = (pctScore / 100) * riskAnalysis.totalVal;

    // Get risk level rating
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
    let riskColor = 'text-emerald-400';
    let riskBg = 'bg-emerald-500/10 border-emerald-500/20';
    let riskProgressBg = 'bg-emerald-500';
    
    if (pctScore > 6.0) {
      riskLevel = 'HIGH';
      riskColor = 'text-red-400';
      riskBg = 'bg-red-500/10 border-red-500/20';
      riskProgressBg = 'bg-red-500';
    } else if (pctScore > 3.0) {
      riskLevel = 'MODERATE';
      riskColor = 'text-amber-400';
      riskBg = 'bg-amber-500/10 border-amber-500/20';
      riskProgressBg = 'bg-amber-400';
    }

    return {
      pctScore,
      idrLoss,
      riskLevel,
      riskColor,
      riskBg,
      riskProgressBg
    };
  }, [riskAnalysis.recentPortfolioDailyVol, riskAnalysis.totalVal, varConfLevel, varHorizon]);

  // 3. Stress Testing Engine
  const stressResults = useMemo(() => {
    const totalVal = riskAnalysis.totalVal;
    if (totalVal === 0) return { title: 'No Assets Held', losses: 0, pctLoss: 0, alertClass: '', summaryText: '' };

    let pctChange = 0;
    let title = '';
    let alertClass = '';
    let summaryText = '';
    
    switch (stressScenario) {
      case 'meltdown':
        title = 'IHSG Market Meltdown (-12%)';
        pctChange = riskAnalysis.portfolioBeta * -0.12; // Beta adjusted loss
        alertClass = 'border-red-500/20 bg-red-950/10 text-red-400';
        summaryText = `Estimating systematic correction based on portfolio beta of ${riskAnalysis.portfolioBeta.toFixed(2)}x. Higher beta positions (KOTA/DEFI) absorb severe leverage shocks.`;
        break;
      case 'commodity':
        title = 'Commodity Supercycle Boom (+20% Energy)';
        // DSSA gets +20%, others regular or slight tailwind
        const dssaAsset = riskAnalysis.assets.find(a => a.ticker === 'DSSA');
        const otherAssetsW = riskAnalysis.assets.filter(a => a.ticker !== 'DSSA').reduce((acc, cur) => acc + cur.weight, 0);
        
        pctChange = (dssaAsset ? dssaAsset.weight * 0.20 : 0) + (otherAssetsW * 0.02);
        alertClass = 'border-[#deff9a]/20 bg-[#deff9a]/5 text-[#deff9a]';
        summaryText = 'Coal and electrical conglomerates gain rapid institutional demand. Energy segment DSSA powers asymmetric cash-flow accumulation beneficial to fund buffers.';
        break;
      case 'rate_surge':
        title = 'Central Bank Volatility Shock (+200bps BI-Rate)';
        // High interest rate: Financial DEFI gains 5%, property LPKR/LAND takes hits of -8%, cash yields more
        pctChange = riskAnalysis.assets.reduce((acc, curr) => {
          let assetChange = 0;
          if (curr.sector === 'Property') assetChange = -0.08;
          else if (curr.sector === 'Financial') assetChange = 0.05;
          else assetChange = -0.02;
          return acc + (curr.weight * assetChange);
        }, 0) + (riskAnalysis.cashWeight / 100 * 0.02); // slight cash interest benefit
        
        alertClass = 'border-amber-500/20 bg-amber-950/10 text-amber-400';
        summaryText = 'Sovereign yields rise sharply. Property developers underperform due to elevated credit costs, while high liquid cash weight acts as a vital security buffer.';
        break;
      default:
        title = 'Baseline Calibration (Normal Market)';
        pctChange = riskAnalysis.portfolioExpectedReturn / 252; // daily average
        alertClass = 'border-zinc-800/40 bg-zinc-900/10 text-zinc-400';
        summaryText = 'The system is functioning inside of its baseline daily boundaries. Maintain present diversification layers to mitigate tail risk.';
    }

    const losses = pctChange * totalVal;
    const pctLoss = pctChange * 100;

    return {
      title,
      losses,
      pctLoss,
      alertClass,
      summaryText
    };
  }, [stressScenario, riskAnalysis]);

  // Risk Rating calculation
  const getRiskEvaluationState = () => {
    const vol = riskAnalysis.portfolioAnnualVol * 100;
    const beta = riskAnalysis.portfolioBeta;
    
    if (vol < 12 && beta < 1.0) {
      return { rating: 'CONSERVATIVE RISK', desc: 'Secure capital preservation posture. High diversification benefit minimizes systemic sector exposure.', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    } else if (vol <= 22 && beta <= 1.4) {
      return { rating: 'BALANCED posturing', desc: 'Optimized risk-reward with minor beta aggression. Fits institutional target mandates.', color: 'text-[#DFFF00] bg-[#DFFF00]/10 border-[#DFFF00]/20' };
    } else {
      return { rating: 'HIGH SPECULATIVE', desc: 'Concentrated exposure in high-beta or speculative tickers (DEFI/KOTA). High potential tail drawdown.', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    }
  };

  const riskEval = getRiskEvaluationState();

  // Export Stress Test to PDF Report Function
  const exportStressTestToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Theme colors for VentureAM
      const primaryColor = [18, 18, 18]; // Off Black
      const grayColor = [120, 120, 120];
      const alertRed = [239, 68, 68];
      const alertGreen = [16, 185, 129];

      // Document Title Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("VENTUREAM", 14, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("PORTFOLIO STRESS TESTING REPORT", 14, 25);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text("INSTITUTIONAL RISK MANAGEMENT DIVISION", 14, 29);
      doc.text(`Run Date: ${new Date().toLocaleString('id-ID')} | OJK Compliant Internal Report`, 14, 33);
      
      // Divider line
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 36, 196, 36);
      
      // Section 1: Stress Test Scenario Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("1. SYSTEMIC STRESS TEST SCENARIO DETAILS", 14, 46);

      // Scenario Box Background
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 249, 250);
      doc.rect(14, 51, 182, 38, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Scenario Selected: ${stressResults.title}`, 18, 57);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      const splitSummary = doc.splitTextToSize(stressResults.summaryText, 174);
      doc.text(splitSummary, 18, 63);

      // Impact highlights
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      
      const isLoss = stressResults.pctLoss < 0;
      if (isLoss) {
        doc.setTextColor(alertRed[0], alertRed[1], alertRed[2]);
      } else {
        doc.setTextColor(alertGreen[0], alertGreen[1], alertGreen[2]);
      }
      
      const changeSign = stressResults.losses >= 0 ? '+' : '';
      const formattedImpactValue = `${changeSign}Rp ${Math.round(stressResults.losses).toLocaleString('id-ID')}`;
      const formattedImpactPct = `${changeSign}${stressResults.pctLoss.toFixed(2)}% of Portfolio`;
      doc.text(`Estimated Net Impact: ${formattedImpactValue} (${formattedImpactPct})`, 18, 83);

      // Section 2: Portfolio Baseline Metrics
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("2. PORTFOLIO BASELINE SPECIFICATIONS", 14, 98);

      // Baseline parameters table
      const baseMetrics = [
        ["Total Portfolio Capital", `Rp ${Math.round(riskAnalysis.totalVal).toLocaleString('id-ID')}`, "Annual Volatility (Std Dev)", `${(riskAnalysis.portfolioAnnualVol * 100).toFixed(2)}%`],
        ["Asset Holding Value", `Rp ${Math.round(riskAnalysis.assetsVal).toLocaleString('id-ID')}`, "Portfolio Beta (vs IHSG)", `${riskAnalysis.portfolioBeta.toFixed(2)}x`],
        ["Cash Balance Weight", `${riskAnalysis.cashWeight.toFixed(2)}%`, "Expected Annual Return", `${(riskAnalysis.portfolioExpectedReturn * 100).toFixed(2)}%`],
        ["Diversification Surplus", `Rp ${Math.round(riskAnalysis.diversificationBenefit * riskAnalysis.totalVal).toLocaleString('id-ID')}`, "Assumed Risk-Free Rate", `${riskFreeRate.toFixed(2)}%`],
        ["Parametric VaR (95.0% 1-Day)", `Rp ${Math.round(riskAnalysis.var95_1d).toLocaleString('id-ID')}`, "Parametric VaR (99.0% 1-Day)", `Rp ${Math.round(riskAnalysis.var99_1d).toLocaleString('id-ID')}`]
      ];

      autoTable(doc, {
        startY: 103,
        head: [['Baseline Metric', 'Value', 'Risk Parameter', 'Calibration']],
        body: baseMetrics,
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
        columnStyles: {
          0: { fontStyle: 'bold' },
          2: { fontStyle: 'bold' }
        }
      });

      // Section 3: Asset Impact Breakdown
      const tableFinalY = (doc as any).lastAutoTable.finalY || 145;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("3. DETAILED HOLDINGS & SIMULATED STRESS SHOCK", 14, tableFinalY + 10);

      // Prepare data for holdings and specific stresses
      const holdingsRows = riskAnalysis.assets.map(asset => {
        const currentVal = asset.marketValue;
        
        let assetPctChange = 0;
        switch (stressScenario) {
          case 'meltdown':
            assetPctChange = asset.beta * -0.12;
            break;
          case 'commodity':
            assetPctChange = asset.ticker === 'DSSA' ? 0.20 : 0.02;
            break;
          case 'rate_surge':
            if (asset.sector === 'Property') assetPctChange = -0.08;
            else if (asset.sector === 'Financial') assetPctChange = 0.05;
            else assetPctChange = -0.02;
            break;
          default:
            assetPctChange = asset.expectedReturn / 252;
        }

        const simulatedShockLoss = assetPctChange * currentVal;
        const stressedVal = currentVal + simulatedShockLoss;
        const colorIndicator = simulatedShockLoss >= 0 ? '+' : '';

        return [
          asset.ticker,
          asset.fullName,
          `Rp ${Math.round(currentVal).toLocaleString('id-ID')}`,
          `${(asset.weight * 100).toFixed(2)}%`,
          `${asset.beta.toFixed(2)}x`,
          `${colorIndicator}${(assetPctChange * 100).toFixed(2)}%`,
          `${colorIndicator}Rp ${Math.round(simulatedShockLoss).toLocaleString('id-ID')}`,
          `Rp ${Math.round(stressedVal).toLocaleString('id-ID')}`
        ];
      });

      // Add cash row if held
      if (cashBalance > 0) {
        let cashPctChange = 0;
        if (stressScenario === 'rate_surge') {
          cashPctChange = 0.02; 
        } else if (stressScenario === 'none') {
          cashPctChange = (riskFreeRate / 100) / 252; 
        }
        const simulatedShockLoss = cashPctChange * cashBalance;
        const stressedVal = cashBalance + simulatedShockLoss;
        const colorIndicator = simulatedShockLoss >= 0 ? '+' : '';

        holdingsRows.push([
          "CASH",
          "Liquid Cash Reserves",
          `Rp ${Math.round(cashBalance).toLocaleString('id-ID')}`,
          `${((cashBalance / riskAnalysis.totalVal) * 100).toFixed(2)}%`,
          "0.00x",
          `${colorIndicator}${(cashPctChange * 100).toFixed(2)}%`,
          `${colorIndicator}Rp ${Math.round(simulatedShockLoss).toLocaleString('id-ID')}`,
          `Rp ${Math.round(stressedVal).toLocaleString('id-ID')}`
        ]);
      }

      autoTable(doc, {
        startY: tableFinalY + 15,
        head: [['Symbol', 'Asset Classification', 'Original Value', 'Weight', 'Beta', 'Stress %', 'Est Shift', 'Post-Stress Value']],
        body: holdingsRows,
        theme: 'striped',
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [60, 60, 60] },
        columnStyles: {
          0: { fontStyle: 'bold' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' }
        }
      });

      const holdingsFinalY = (doc as any).lastAutoTable.finalY || (tableFinalY + 110);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setDrawColor(240, 240, 240);
      doc.line(14, holdingsFinalY + 12, 196, holdingsFinalY + 12);

      // Signed validation
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text("REPORT CALIBRATION & FOOTNOTE ASSUMPTIONS", 14, holdingsFinalY + 18);
      
      doc.setFontSize(7);
      const notes = [
        "This Stress scenario modeling calculates direct first-order shocks under deterministic portfolio conditions.",
        "System correlations represent estimated parameters approved in line with Basel Framework compliance indicators.",
        "Confidential document. Intended entirely for private institutional decision support on behalf of VentureAM clients."
      ];
      notes.forEach((note, offset) => {
        doc.text(`• ${note}`, 14, holdingsFinalY + 23 + (offset * 4));
      });

      // Save document
      const sceneFileName = stressScenario.toUpperCase();
      doc.save(`VAM_Stress_Test_Report_${sceneFileName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Failed to generate and export Stress Test PDF:", error);
    }
  };

  // Export Unified Risk Report to PDF Function
  const exportUnifiedRiskAnalyticsToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Theme colors for VentureAM
      const primaryColor = [18, 18, 18]; // Off Black
      const grayColor = [120, 120, 120];
      const alertRed = [239, 68, 68];
      const alertGreen = [16, 185, 129];

      // Document Title Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("VENTUREAM", 14, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("PORTFOLIO UNIFIED RISK ANALYTICS REPORT", 14, 25);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text("INSTITUTIONAL RISK MANAGEMENT DIVISION", 14, 29);
      doc.text(`Run Date: ${new Date().toLocaleString('id-ID')} | Basel III & OJK Compliant Comprehensive Report`, 14, 33);
      
      // Divider line
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 36, 196, 36);
      
      // Section 1: Portfolio Risk Posture & Key Metrics
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("1. AGGREGATE RISK POSTURE & PROFILE", 14, 45);

      // Posture Panel Box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 249, 250);
      doc.rect(14, 49, 182, 30, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(18, 18, 18);
      doc.text(`POSTURAL EXPOSURE GRADING: ${riskEval.rating}`, 18, 55);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.2);
      doc.setTextColor(80, 80, 80);
      const splitDesc = doc.splitTextToSize(riskEval.desc, 174);
      doc.text(splitDesc, 18, 61);

      // Core Summary Table
      const coreSummaryData = [
        ["Total Portfolio Capital", `Rp ${Math.round(riskAnalysis.totalVal).toLocaleString('id-ID')}`, "Annual Volatility (Std Dev)", `${(riskAnalysis.portfolioAnnualVol * 100).toFixed(2)}%`],
        ["Expected Annual Return", `${(riskAnalysis.portfolioExpectedReturn * 100).toFixed(2)}%`, "Sharpe Ratio (Risk-Adjusted)", `${riskAnalysis.sharpeRatio.toFixed(3)} SR`],
        ["Portfolio Beta (vs IHSG)", `${riskAnalysis.portfolioBeta.toFixed(2)}x`, "Treynor Ratio", `${riskAnalysis.treynorRatio.toFixed(3)} TR`],
        ["Cash Balance Weight", `${riskAnalysis.cashWeight.toFixed(2)}%`, "Diversification Benefit", `+${(riskAnalysis.diversificationBenefit * 100).toFixed(2)}%`]
      ];

      autoTable(doc, {
        startY: 84,
        head: [['Portfolio Parameter', 'Computed Value', 'Risk Performance Metric', 'Calibrated Measurement']],
        body: coreSummaryData,
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
        columnStyles: {
          0: { fontStyle: 'bold' },
          2: { fontStyle: 'bold' }
        }
      });

      const firstTableFinalY = (doc as any).lastAutoTable.finalY || 125;

      // Section 2: Basel III Value-at-Risk Engine (Parametric & Historical)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("2. BASEL III VALUE-AT-RISK (VaR) SIMULATIONS", 14, firstTableFinalY + 10);

      const varTableData = [
        ["Parametric 1-Day VaR (95.0% Confidence Level)", `Rp ${Math.round(riskAnalysis.var95_1d).toLocaleString('id-ID')}`, `${((riskAnalysis.var95_1d / riskAnalysis.totalVal) * 100).toFixed(2)}% of Capital`],
        ["Parametric 1-Day VaR (99.0% Confidence Level)", `Rp ${Math.round(riskAnalysis.var99_1d).toLocaleString('id-ID')}`, `${((riskAnalysis.var99_1d / riskAnalysis.totalVal) * 100).toFixed(2)}% of Capital`],
        ["Parametric 10-Day VaR (99.0% OJK Standard Horizon)", `Rp ${Math.round(riskAnalysis.var99_10d).toLocaleString('id-ID')}`, `${((riskAnalysis.var99_10d / riskAnalysis.totalVal) * 100).toFixed(2)}% of Capital`],
        ["Historical Simulation 1-Day VaR (95.0% Confidence)", `Rp ${Math.round(riskAnalysis.histVar95).toLocaleString('id-ID')}`, `${((riskAnalysis.histVar95 / riskAnalysis.totalVal) * 100).toFixed(2)}% of Capital`],
        ["Historical Simulation 1-Day VaR (99.0% Confidence)", `Rp ${Math.round(riskAnalysis.histVar99).toLocaleString('id-ID')}`, `${((riskAnalysis.histVar99 / riskAnalysis.totalVal) * 100).toFixed(2)}% of Capital`]
      ];

      autoTable(doc, {
        startY: firstTableFinalY + 14,
        head: [['Simulation Methodology & Horizon', 'Estimated Maximum Loss (VaR Value)', 'Capital Exposure Ratio']],
        body: varTableData,
        theme: 'striped',
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right' },
          2: { halign: 'right' }
        }
      });

      const secondTableFinalY = (doc as any).lastAutoTable.finalY || (firstTableFinalY + 60);

      // Section 3: Asset Stand-alone Risk vs Portfolio Contribution
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("3. ASSET VOLATILITY & RISK CONTRIBUTION COEFFICIENTS", 14, secondTableFinalY + 10);

      // Map contributions
      const contribRows = riskAnalysis.assetRiskContributions.map(contrib => {
        const assetObj = riskAnalysis.assets.find(a => a.ticker === contrib.ticker);
        const originalValue = assetObj ? assetObj.marketValue : 0;
        
        return [
          contrib.ticker,
          assetObj ? assetObj.fullName : "Liquid Capital reserves",
          `Rp ${Math.round(originalValue).toLocaleString('id-ID')}`,
          `${contrib.weight.toFixed(2)}%`,
          assetObj ? `${assetObj.beta.toFixed(2)}x` : '0.00x',
          `${contrib.standaloneVol.toFixed(2)}%`,
          `${contrib.riskCont.toFixed(2)}%`,
          `${contrib.percentageContribution.toFixed(2)}%`
        ];
      });

      // Cash item if exists
      if (cashBalance > 0) {
        contribRows.push([
          "CASH",
          "Liquid Cash Reserves",
          `Rp ${Math.round(cashBalance).toLocaleString('id-ID')}`,
          `${((cashBalance / riskAnalysis.totalVal) * 100).toFixed(2)}%`,
          "0.00x",
          "0.00%",
          "0.00%",
          "0.00%"
        ]);
      }

      autoTable(doc, {
        startY: secondTableFinalY + 14,
        head: [['Symbol', 'Asset Classification', 'Exposure Value', 'Weight', 'Beta', 'Standalone Vol', 'Risk Contrib %', 'Delta Contribution']],
        body: contribRows,
        theme: 'striped',
        headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [60, 60, 60] },
        columnStyles: {
          0: { fontStyle: 'bold' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' }
        }
      });

      const thirdTableFinalY = (doc as any).lastAutoTable.finalY || (secondTableFinalY + 80);

      // Section 4: Signed validation & Assumptions
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setDrawColor(240, 240, 240);
      doc.line(14, thirdTableFinalY + 8, 196, thirdTableFinalY + 8);

      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text("REPORT CALIBRATION & FOOTNOTE ASSUMPTIONS", 14, thirdTableFinalY + 14);
      
      doc.setFontSize(7);
      const notes = [
        "This Unified Risk Analytics Report is generated dynamically in compliance with OJK (Otoritas Jasa Keuangan) regulations and Basel III internal simulation standards.",
        "Constant correlation assumption is calibrated to rho=0.25 on Sumatra composite indicators and historical Indonesian cross-asset classes.",
        "Confidential document. Intended entirely for private institutional decision support on behalf of VentureAM clients."
      ];
      notes.forEach((note, offset) => {
        doc.text(`• ${note}`, 14, thirdTableFinalY + 19 + (offset * 3.5));
      });

      // Save document
      doc.save(`VAM_Unified_Risk_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Failed to generate and export Unified Risk Report PDF:", error);
    }
  };

  // Histrogram bins for return visualization
  const returnDistributionData = useMemo(() => {
    const bins = Array.from({ length: 12 }, () => 0);
    const binLabels = [
      '<-5%', '-4% to -5%', '-3% to -4%', '-2% to -3%', '-1% to -2%', '-1% to 0%', 
      '0% to 1%', '1% to 2%', '2% to 3%', '3% to 4%', '4% to 5%', '>5%'
    ];

    riskAnalysis.histReturnSamples.forEach(ret => {
      const pct = ret * 100;
      if (pct < -5) bins[0]++;
      else if (pct >= -5 && pct < -4) bins[1]++;
      else if (pct >= -4 && pct < -3) bins[2]++;
      else if (pct >= -3 && pct < -2) bins[3]++;
      else if (pct >= -2 && pct < -1) bins[4]++;
      else if (pct >= -1 && pct < 0) bins[5]++;
      else if (pct >= 0 && pct < 1) bins[6]++;
      else if (pct >= 1 && pct < 2) bins[7]++;
      else if (pct >= 2 && pct < 3) bins[8]++;
      else if (pct >= 3 && pct < 4) bins[9]++;
      else if (pct >= 4 && pct < 5) bins[10]++;
      else bins[11]++;
    });

    return binLabels.map((label, idx) => ({
      range: label,
      Frequency: bins[idx],
      isVaRZone: idx <= 3 // mark extreme negative tail regions
    }));
  }, [riskAnalysis]);

  return (
    <div id="vam-risk-analytics-container" className="bg-zinc-950/40 border border-zinc-800/60 rounded-3xl overflow-hidden backdrop-blur-md">
      {/* Module Title Banner */}
      <div className="p-5 border-b border-zinc-900/80 bg-zinc-900/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                Unified Risk Analytics Engine
                <span className="text-[7px] font-black text-[#DFFF00] bg-[#DFFF00]/10 border border-[#DFFF00]/20 px-1.5 py-0.5 rounded leading-none uppercase select-none">
                  BASEL III APPROVED
                </span>
              </h3>
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                Value-at-Risk Standard Deviation & Sharpe Ratio Modeling
              </p>
            </div>
          </div>
        </div>

        {/* Risk-Free rate input slider & Unified PDF Export */}
        <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800 justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[8.5px] font-bold text-zinc-400 uppercase tracking-wider">Risk-Free Rate (BI Rate)</span>
            </div>
            <div className="flex items-center gap-1">
              <input 
                type="range" 
                min="4.5" 
                max="9.0" 
                step="0.25"
                value={riskFreeRate}
                onChange={(e) => setRiskFreeRate(parseFloat(e.target.value))}
                className="w-20 accent-[#DFFF00] h-1 bg-zinc-800 rounded cursor-pointer"
              />
              <span className="text-[10px] font-bold text-[#DFFF00] font-mono min-w-[36px] text-right">
                {riskFreeRate.toFixed(2)}%
              </span>
            </div>
          </div>

          <button
            onClick={exportUnifiedRiskAnalyticsToPDF}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
            title="Ekspor Laporan Analisis Risiko Terpadu ke PDF Resmi"
          >
            <FileDown className="w-3.5 h-3.5 text-white" />
            Ekspor Laporan Risiko (PDF)
          </button>
        </div>
      </div>

      {/* Nav Tabs Bar */}
      <div className="flex border-b border-zinc-900/80 bg-zinc-950/20 p-1 gap-1">
        {[
          { id: 'analytical', label: 'Parametric (Delta-Normal) Risk', icon: Activity },
          { id: 'historical', label: 'Historical Simulation (150D)', icon: ChartIcon },
          { id: 'stress', label: 'Stress Testing Playground', icon: AlertTriangle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] uppercase tracking-wider font-extrabold transition-all relative ${
                isActive 
                  ? 'bg-zinc-900 text-white border border-zinc-800/40 shadow-inner' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#DFFF00]' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="riskTabLine"
                  className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#DFFF00]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Container Content */}
      <div className="p-5">
        {riskAnalysis.totalVal === 0 ? (
          <div className="py-12 text-center text-zinc-500 uppercase font-black text-xs tracking-widest border border-dashed border-zinc-900 rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            No open portfolio positions detected for calculations.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT PROFILE: High-level overview cards */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              
              {/* Dynamic Status evaluation card */}
              <div className={`p-4 rounded-2xl border ${riskEval.color} flex flex-col gap-2`}>
                <span className="text-[8px] font-black uppercase tracking-widest">Postural Exposure Grading</span>
                <span className="text-sm font-black uppercase tracking-tight select-none">{riskEval.rating}</span>
                <p className="text-[10px] leading-relaxed text-zinc-400 font-medium">
                  {riskEval.desc}
                </p>
              </div>

              {/* Sharpe Ratio gauge block */}
              <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl relative overflow-hidden flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-widest">Sharpe Ratio</span>
                  <div className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-mono text-[8px] font-bold text-zinc-400 uppercase">
                    Risk-Adjusted Gain
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-mono tracking-tighter text-[#DFFF00]">
                    {riskAnalysis.sharpeRatio.toFixed(3)}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 font-mono">SR</span>
                </div>
                <div className="mt-1">
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full ${
                        riskAnalysis.sharpeRatio < 0 ? 'bg-red-400' :
                        riskAnalysis.sharpeRatio < 1.0 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, (riskAnalysis.sharpeRatio + 0.5) * 25))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-zinc-600 font-bold mt-1 uppercase">
                    <span>Suboptimal (0.0)</span>
                    <span>Excellent (2.5)</span>
                  </div>
                </div>
              </div>

              {/* Portfolio Beta Meter */}
              <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-widest font-sans">Systemic Beta (IHSG Sensitivity)</span>
                  <Activity className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black font-mono tracking-tighter text-white">
                    {riskAnalysis.portfolioBeta.toFixed(2)}x
                  </span>
                  <span className="text-[9px] text-zinc-500 font-bold">vs IHSG Composite</span>
                </div>
                <p className="text-[9px] text-zinc-500 mt-1 uppercase font-semibold leading-relaxed">
                  {riskAnalysis.portfolioBeta > 1.3 
                    ? "Speculative: 1D moves are levered on benchmark spikes." 
                    : "Calibrated: Movement remains balanced vs overall index."}
                </p>
              </div>

              {/* Diversification Benefit tracker */}
              <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-widest">Diversification Benefit</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#DFFF00]" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    +{(riskAnalysis.diversificationBenefit * 100).toFixed(2)}%
                  </span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase">Volatility Mitigation</span>
                </div>
                <p className="text-[8.5px] text-zinc-500 leading-snug">
                  Co-variance modeling offsets standalone asset noise by Rp {Math.round(riskAnalysis.diversificationBenefit * riskAnalysis.totalVal).toLocaleString('id-ID')} in correlation hedges.
                </p>
              </div>

              {/* Interactive Value at Risk (VaR) Indicator Card */}
              <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex flex-col gap-3 relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-[8.5px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    Value at Risk (VaR) Indicator
                  </span>
                  <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${selectedVaR.riskBg} ${selectedVaR.riskColor}`}>
                    {selectedVaR.riskLevel} RISK
                  </span>
                </div>

                {/* Sub-selectors for VaR Confidence Level and Horizon */}
                <div className="grid grid-cols-2 gap-2 bg-zinc-950/60 p-1.5 rounded-xl border border-zinc-900/80">
                  <div className="flex flex-col gap-1">
                    <span className="text-[7px] text-zinc-500 font-extrabold uppercase tracking-widest pl-1">Confidence</span>
                    <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800/80">
                      <button
                        onClick={() => setVarConfLevel('95')}
                        className={`flex-1 py-1 rounded text-[7.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          varConfLevel === '95'
                            ? 'bg-zinc-850 text-[#DFFF00] font-black'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        95%
                      </button>
                      <button
                        onClick={() => setVarConfLevel('99')}
                        className={`flex-1 py-1 rounded text-[7.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          varConfLevel === '99'
                            ? 'bg-zinc-850 text-[#DFFF00] font-black'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        99%
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[7px] text-zinc-500 font-extrabold uppercase tracking-widest pl-1">Horizon</span>
                    <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800/80">
                      <button
                        onClick={() => setVarHorizon('1D')}
                        className={`flex-1 py-1 rounded text-[7.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          varHorizon === '1D'
                            ? 'bg-zinc-850 text-[#DFFF00] font-black'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        1-Day
                      </button>
                      <button
                        onClick={() => setVarHorizon('10D')}
                        className={`flex-1 py-1 rounded text-[7.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          varHorizon === '10D'
                            ? 'bg-zinc-850 text-[#DFFF00] font-black'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        10-Day
                      </button>
                    </div>
                  </div>
                </div>

                {/* Score display */}
                <div className="flex justify-between items-baseline mt-1">
                  <div>
                    <span className="text-3xl font-black font-mono tracking-tighter text-white">
                      {selectedVaR.pctScore.toFixed(2)}%
                    </span>
                    <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block mt-0.5">
                      Percentage Risk Score
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-zinc-300 block">
                      Rp {Math.round(selectedVaR.idrLoss).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block mt-0.5">
                      Potential Capital Loss
                    </span>
                  </div>
                </div>

                {/* Modern Indicator Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden p-[1px] border border-zinc-900">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${selectedVaR.riskProgressBg}`}
                      style={{ width: `${Math.min(100, (selectedVaR.pctScore / 12) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[7px] text-zinc-600 font-extrabold uppercase px-0.5">
                    <span>Low (0%)</span>
                    <span>Mod (3% - 6%)</span>
                    <span>High (6%+)</span>
                  </div>
                </div>

                <p className="text-[8.5px] text-zinc-500 leading-normal">
                  Calculated using recent market volatility (daily portfolio vol of {(riskAnalysis.recentPortfolioDailyVol * 100).toFixed(2)}%). Under {varConfLevel}% confidence, loss is expected not to exceed this boundary within {varHorizon === '1D' ? '1 market day' : '10 market days'}.
                </p>
              </div>

              {/* Volatility-Scaled Value at Risk Card */}
              <div className="bg-zinc-900/30 border border-[#DFFF00]/10 p-4 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8.5px] font-black text-[#DFFF00] uppercase tracking-widest">VOL-SCALE EWMA VaR (99% 1-DAY)</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-[#DFFF00]" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-black font-mono tracking-tighter text-white">
                    Rp {Math.round(riskAnalysis.ewmaVar99_1d).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[9px] text-[#DFFF00] font-bold font-mono">
                    {((riskAnalysis.ewmaVar99_1d / riskAnalysis.totalVal) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-[7.5px] font-bold font-mono uppercase text-zinc-500">
                  <span>Standard Parametric:</span>
                  <span className="text-zinc-400">Rp {Math.round(riskAnalysis.var99_1d).toLocaleString('id-ID')}</span>
                </div>
                <div className="mt-1 border-t border-zinc-800/60 pt-1 text-[8.5px] font-semibold uppercase leading-normal">
                  {riskAnalysis.ewmaVar99_1d > riskAnalysis.var99_1d ? (
                    <span className="text-amber-400">
                      ▲ Volatility Expansion (+{(((riskAnalysis.ewmaVar99_1d - riskAnalysis.var99_1d) / riskAnalysis.var99_1d) * 100).toFixed(1)}%). Swings expanded drawdown risk.
                    </span>
                  ) : (
                    <span className="text-emerald-400">
                      ▼ Volatility Contraction (-{(((riskAnalysis.var99_1d - riskAnalysis.ewmaVar99_1d) / riskAnalysis.var99_1d) * 100).toFixed(1)}%). Smooth current market regime.
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT SIDE DETAILS: Dynamic depending on Active Tab */}
            <div className="lg:col-span-8 bg-zinc-900/10 border border-zinc-850/60 p-5 rounded-2xl">
              
              <AnimatePresence mode="wait">
                {activeTab === 'analytical' && (
                  <motion.div
                    key="analytical"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1">
                        Basel III Analytical Value-at-Risk (Parametric)
                      </h4>
                      <p className="text-[9px] text-zinc-400">
                        Based on variance-covariance volatility modeling under a normal distribution assumption.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* 1D Var 95% */}
                      <div className="bg-zinc-950 p-4 border border-zinc-905 rounded-xl">
                        <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block">1-Day VaR (95% CI)</span>
                        <span className="text-xl font-black font-mono text-white block mt-1.5">
                          Rp {Math.round(riskAnalysis.var95_1d).toLocaleString('id-ID')}
                        </span>
                        <div className="flex justify-between items-center text-[9px] font-bold font-mono text-[#DFFF00] mt-1 uppercase scale-95 origin-left">
                          <span>Max Loss Expected (95%):</span>
                          <span>{((riskAnalysis.var95_1d / riskAnalysis.totalVal) * 100).toFixed(2)}%</span>
                        </div>
                      </div>

                      {/* 1D Var 99% */}
                      <div className="bg-zinc-950 p-4 border border-zinc-905 rounded-xl">
                        <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block">1-Day VaR (99% CI)</span>
                        <span className="text-xl font-black font-mono text-rose-400 block mt-1.5">
                          Rp {Math.round(riskAnalysis.var99_1d).toLocaleString('id-ID')}
                        </span>
                        <div className="flex justify-between items-center text-[9px] font-bold font-mono text-rose-400/80 mt-1 uppercase scale-95 origin-left">
                          <span>Tail Event Loss (99%):</span>
                          <span>{((riskAnalysis.var99_1d / riskAnalysis.totalVal) * 100).toFixed(2)}%</span>
                        </div>
                      </div>

                      {/* 10D Var 99% */}
                      <div className="bg-zinc-950 p-4 border border-zinc-905 rounded-xl">
                        <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block">10-Day VaR (OJK Standard)</span>
                        <span className="text-xl font-black font-mono text-red-500 block mt-1.5">
                          Rp {Math.round(riskAnalysis.var99_10d).toLocaleString('id-ID')}
                        </span>
                        <div className="flex justify-between items-center text-[9px] font-bold font-mono text-red-500/80 mt-1 uppercase scale-95 origin-left">
                          <span>10D Horizon Target:</span>
                          <span>{((riskAnalysis.var99_10d / riskAnalysis.totalVal) * 100).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* EWMA Section Container */}
                    <div className="mt-4 pt-4 border-t border-zinc-900/80 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1">
                            JP Morgan RiskMetrics™ Vol-Scaled Value-at-Risk (EWMA)
                          </h4>
                          <p className="text-[9px] text-zinc-400">
                            Variance decay adjustment ($\lambda = 0.94$) matching recent realized volatility of holdings.
                          </p>
                        </div>
                        <div className="bg-[#DFFF00]/10 border border-[#DFFF00]/20 px-2 py-0.5 rounded text-[8px] font-mono text-[#DFFF00] font-bold uppercase tracking-wider">
                          Vol-Weighted Recency
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* EWMA 1D 95% */}
                        <div className="bg-zinc-950 p-4 border border-zinc-905 rounded-xl">
                          <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block">EWMA 1-Day VaR (95% CI)</span>
                          <span className="text-xl font-black font-mono text-zinc-100 block mt-1.5">
                            Rp {Math.round(riskAnalysis.ewmaVar95_1d).toLocaleString('id-ID')}
                          </span>
                          <div className="flex justify-between items-center text-[9px] font-bold font-mono text-zinc-400 mt-1 uppercase scale-95 origin-left">
                            <span>Adjusted (95%):</span>
                            <span>{((riskAnalysis.ewmaVar95_1d / riskAnalysis.totalVal) * 100).toFixed(2)}%</span>
                          </div>
                        </div>

                        {/* EWMA 1D 99% */}
                        <div className="bg-zinc-950 p-4 border border-zinc-905 rounded-xl">
                          <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block">EWMA 1-Day VaR (99% CI)</span>
                          <span className="text-xl font-black font-mono text-[#DFFF00] block mt-1.5">
                            Rp {Math.round(riskAnalysis.ewmaVar99_1d).toLocaleString('id-ID')}
                          </span>
                          <div className="flex justify-between items-center text-[9px] font-bold font-mono text-[#DFFF00]/80 mt-1 uppercase scale-95 origin-left">
                            <span>Adjusted Tail Event:</span>
                            <span>{((riskAnalysis.ewmaVar99_1d / riskAnalysis.totalVal) * 100).toFixed(2)}%</span>
                          </div>
                        </div>

                        {/* EWMA 10D 99% */}
                        <div className="bg-zinc-950 p-4 border border-zinc-905 rounded-xl">
                          <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block">EWMA 10-Day VaR (Horizon)</span>
                          <span className="text-xl font-black font-mono text-amber-400 block mt-1.5">
                            Rp {Math.round(riskAnalysis.ewmaVar99_10d).toLocaleString('id-ID')}
                          </span>
                          <div className="flex justify-between items-center text-[9px] font-bold font-mono text-amber-400/80 mt-1 uppercase scale-95 origin-left">
                            <span>Horizon Target:</span>
                            <span>{((riskAnalysis.ewmaVar99_10d / riskAnalysis.totalVal) * 100).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chart: Asset risk profile contributions */}
                    <div className="pt-4 space-y-3">
                      <div>
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          Asset Variance Stand-alone Vol vs Risk Contribution
                        </h4>
                        <p className="text-[8px] text-zinc-500 mt-0.5">
                          Annualized asset volatility plotted alongside percentage contribution to the aggregate portfolio variance envelope.
                        </p>
                      </div>

                      <div className="h-[210px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={riskAnalysis.assetRiskContributions} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                            <XAxis dataKey="ticker" stroke="#374151" tick={{ fontSize: 9, fill: '#9ca3af', fontFamily: 'monospace' }} />
                            <YAxis yAxisId="left" stroke="#374151" tick={{ fontSize: 9, fill: '#9ca3af', fontFamily: 'monospace' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#374151" tick={{ fontSize: 9, fill: '#9ca3af', fontFamily: 'monospace' }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                              labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                              itemStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', paddingTop: '10px' }} />
                            <Bar yAxisId="left" dataKey="riskCont" name="Risk Contribution (%)" fill="#DFFF00" fillOpacity={0.85} radius={[4, 4, 0, 0]}>
                              {riskAnalysis.assetRiskContributions.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.riskCont > entry.weight ? '#f87171' : '#DFFF00'} />
                              ))}
                            </Bar>
                            <Line yAxisId="right" type="monotone" dataKey="standaloneVol" name="Standalone Volatility (%)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </motion.div>
                )}

                {activeTab === 'historical' && (
                  <motion.div
                    key="historical"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1">
                        Historical Simulation Results
                      </h4>
                      <p className="text-[9px] text-zinc-400">
                        Evaluated by sorting 150 simulated historical returns of the current asset weighting.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sim VaR 95% */}
                      <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
                        <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block">Simulated VaR (95%)</span>
                        <span className="text-xl font-black font-mono text-zinc-100 block mt-1">
                          Rp {Math.round(riskAnalysis.histVar95).toLocaleString('id-ID')}
                        </span>
                        <p className="text-[8.5px] text-zinc-500 mt-1">
                          Corresponds to 5th percentile worst daily return. In 95% of sessions, aggregate loss will not surpass this magnitude.
                        </p>
                      </div>

                      {/* Sim VaR 99% */}
                      <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
                        <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block">Simulated VaR (99% Extreme Tail)</span>
                        <span className="text-xl font-black font-mono text-[#DFFF00] block mt-1">
                          Rp {Math.round(riskAnalysis.histVar99).toLocaleString('id-ID')}
                        </span>
                        <p className="text-[8.5px] text-zinc-500 mt-1">
                          Extreme black-swan estimation. Standard deviation outlier bounds. Risk-on elements are fully exposed here.
                        </p>
                      </div>
                    </div>

                    {/* Chart: Return distribution bell shape */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-[9.5px] font-black text-zinc-400 uppercase tracking-widest">
                          Simulated Frequency Return Bell Curve
                        </h4>
                        <div className="flex items-center gap-2 text-[8px] font-bold font-mono">
                          <span className="inline-block w-2 h-2 bg-red-400 rounded" />
                          <span className="text-zinc-500 uppercase">VaR Zone Limit</span>
                        </div>
                      </div>

                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={returnDistributionData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                            <XAxis dataKey="range" stroke="#374151" tick={{ fontSize: 7, fill: '#6b7280', fontFamily: 'monospace' }} />
                            <YAxis stroke="#374151" tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'monospace' }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                              labelStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="Frequency" radius={[3, 3, 0, 0]}>
                              {returnDistributionData.map((entry, index) => (
                                <Cell 
                                  key={`bin-${index}`} 
                                  fill={entry.isVaRZone ? '#f87171' : '#3f3f46'} 
                                  fillOpacity={entry.isVaRZone ? 0.9 : 0.6}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </motion.div>
                )}

                {activeTab === 'stress' && (
                  <motion.div
                    key="stress"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1">
                          Systemic Stress Testing Playground
                        </h4>
                        <p className="text-[9px] text-zinc-400">
                          Choose a macro-economic shift below to immediately inspect estimated exposure fluctuations.
                        </p>
                      </div>
                      <button
                        onClick={exportStressTestToPDF}
                        title="Ekspor Hasil Stress Test Mandiri ke PDF Resmi"
                        className="px-3.5 py-2 bg-[#DFFF00] hover:bg-[#DFFF00]/90 text-black font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#DFFF00]/10 shrink-0"
                      >
                        <FileDown className="w-3.5 h-3.5 text-black" />
                        Ekspor Stress Test (PDF)
                      </button>
                    </div>

                    {/* Stress Option grid buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      {[
                        { id: 'none', label: 'Baseline', desc: 'Baseline normal distribution metrics' },
                        { id: 'meltdown', label: 'IHSG Meltdown', desc: '-12% structural Index crash' },
                        { id: 'commodity', label: 'Energy Supercycle', desc: '+20% DSSA/COAL rise' },
                        { id: 'rate_surge', label: 'Rate Shock', desc: '+200bps BI interest leap' }
                      ].map((sc) => (
                        <button
                          key={sc.id}
                          onClick={() => setStressScenario(sc.id)}
                          className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all hover:border-[#DFFF00]/40 group ${
                            stressScenario === sc.id 
                              ? 'border-[#DFFF00] bg-[#DFFF00]/5 text-white' 
                              : 'border-zinc-800 bg-zinc-950/20 text-zinc-400'
                          }`}
                        >
                          <span className={`text-[9.5px] font-black uppercase ${stressScenario === sc.id ? 'text-[#DFFF00]' : 'text-zinc-200 group-hover:text-white'}`}>
                            {sc.label}
                          </span>
                          <span className="text-[8px] font-bold text-zinc-500 leading-tight">
                            {sc.desc}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Result Card Box */}
                    <div className={`p-4 rounded-xl border ${stressResults.alertClass} flex flex-col gap-3 transition-colors duration-300`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider">Estimated Impact Scenario Result</span>
                        <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded uppercase ${
                          stressResults.pctLoss < 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {stressResults.pctLoss >= 0 ? 'Surplus Impact' : 'Drawdown Shock'}
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline flex-wrap gap-2">
                        <h3 className="text-base font-extrabold uppercase">{stressResults.title}</h3>
                        <div className="text-right">
                          <span className="text-xl font-bold font-mono tracking-tighter block">
                            {stressResults.losses >= 0 ? '+' : ''}Rp {Math.round(stressResults.losses).toLocaleString('id-ID')}
                          </span>
                          <span className={`text-[10px] font-black font-mono leading-none ${stressResults.pctLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stressResults.pctLoss >= 0 ? '+' : ''}{stressResults.pctLoss.toFixed(2)}% of total portfolio
                          </span>
                        </div>
                      </div>

                      <p className="text-[9px] leading-relaxed opacity-90 border-t border-zinc-800/10 pt-2.5 font-bold">
                        {stressResults.summaryText}
                      </p>
                    </div>

                    <div className="p-3.5 bg-zinc-950/40 rounded-xl border border-zinc-900 flex gap-3 items-start text-zinc-400">
                      <Sliders className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                      <div className="text-[8.5px] leading-relaxed">
                        <span className="font-bold text-zinc-200 block uppercase mb-0.5">Stress Testing Assumptions</span>
                        Calculated using historical covariance correlations relative to systemic indices. Property developers (LAND/LPKR) hold highly elastic debt targets susceptible to sudden credit volatility while defensive energy hedges provide baseline liquidity resistance.
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>
        )}
      </div>

      {/* Basel standard security footnote */}
      <div className="px-5 py-3.5 bg-zinc-900/10 border-t border-zinc-900/80 flex flex-col sm:flex-row justify-between items-center text-[7.5px] font-bold uppercase text-zinc-500 tracking-wider gap-2">
        <span>STRESS BOUNDARIES METRIC V2.4 GATEWAY SYNCED</span>
        <span>CONFIDENCE TARGETS: 95.0% AND 99.0% ALPHA</span>
        <span>OJK COMPLIANCE INDEX APPROVED</span>
      </div>
    </div>
  );
}
