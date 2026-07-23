import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import pptxgen from 'pptxgenjs';

// ==========================================
// GRAPHICAL UI DIAGRAM HELPERS FOR PDF
// ==========================================

function drawWindowFrame(doc: jsPDF, x: number, y: number, w: number, h: number, title: string) {
  // Container background
  doc.setFillColor(15, 20, 30);
  doc.roundedRect(x, y, w, h, 3, 3, 'F');
  doc.setDrawColor(40, 55, 80);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 3, 3, 'S');

  // Title bar
  doc.setFillColor(24, 32, 48);
  doc.roundedRect(x, y, w, 7, 3, 3, 'F');
  
  // Mac-style Window Controls
  doc.setFillColor(239, 68, 68); doc.circle(x + 4, y + 3.5, 1, 'F');
  doc.setFillColor(245, 158, 11); doc.circle(x + 8, y + 3.5, 1, 'F');
  doc.setFillColor(16, 185, 129); doc.circle(x + 12, y + 3.5, 1, 'F');

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(223, 255, 0);
  doc.text(title.toUpperCase(), x + 17, y + 5);
}

// Diagram 1: Mockup Dashboard UI
function drawDashboardDiagram(doc: jsPDF, x: number, y: number, w: number, h: number) {
  drawWindowFrame(doc, x, y, w, h, "Tampilan Interface - Dashboard & Overview Portofolio");

  const startY = y + 10;
  const cardW = (w - 12) / 3;

  // Metric Card 1: NAV
  doc.setFillColor(22, 30, 45);
  doc.roundedRect(x + 3, startY, cardW, 16, 2, 2, 'F');
  doc.setFontSize(6);
  doc.setTextColor(140, 150, 170);
  doc.text("TOTAL PORTFOLIO NAV", x + 5, startY + 4);
  doc.setFontSize(9);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Rp 1.450.000.000", x + 5, startY + 10);
  doc.setFontSize(5.5);
  doc.setTextColor(16, 185, 129);
  doc.text("+Rp 84.500.000 (+6.2%)", x + 5, startY + 14);

  // Metric Card 2: CASH RDN
  doc.setFillColor(22, 30, 45);
  doc.roundedRect(x + 5 + cardW, startY, cardW, 16, 2, 2, 'F');
  doc.setFontSize(6);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(140, 150, 170);
  doc.text("SALDO CASH RDN & GIRO", x + 7 + cardW, startY + 4);
  doc.setFontSize(9);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(223, 255, 0);
  doc.text("Rp 320.000.000", x + 7 + cardW, startY + 10);
  doc.setFontSize(5.5);
  doc.setTextColor(180, 190, 205);
  doc.text("Gateway: CGS CIMB Active", x + 7 + cardW, startY + 14);

  // Metric Card 3: REALIZED P&L
  doc.setFillColor(22, 30, 45);
  doc.roundedRect(x + 7 + cardW * 2, startY, cardW, 16, 2, 2, 'F');
  doc.setFontSize(6);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(140, 150, 170);
  doc.text("30-DAY REALIZED P&L", x + 9 + cardW * 2, startY + 4);
  doc.setFontSize(9);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text("+Rp 42.150.000", x + 9 + cardW * 2, startY + 10);
  doc.setFontSize(5.5);
  doc.setTextColor(140, 150, 170);
  doc.text("Win Rate: 78.4%", x + 9 + cardW * 2, startY + 14);

  // Chart representation line
  const chartY = startY + 20;
  doc.setFillColor(18, 25, 38);
  doc.roundedRect(x + 3, chartY, w - 6, 18, 2, 2, 'F');
  doc.setFontSize(6);
  doc.setTextColor(223, 255, 0);
  doc.text("GRAFIK PERFORMA PORTOFOLIO 30 HARI", x + 6, chartY + 4);

  // Draw chart path
  doc.setDrawColor(223, 255, 0);
  doc.setLineWidth(0.6);
  doc.line(x + 10, chartY + 14, x + 30, chartY + 12);
  doc.line(x + 30, chartY + 12, x + 50, chartY + 15);
  doc.line(x + 50, chartY + 15, x + 80, chartY + 8);
  doc.line(x + 80, chartY + 8, x + 110, chartY + 11);
  doc.line(x + 110, chartY + 11, x + 140, chartY + 6);
  doc.line(x + 140, chartY + 6, x + 170, chartY + 5);

  // Dots on chart
  doc.setFillColor(255, 255, 255);
  doc.circle(x + 80, chartY + 8, 1, 'F');
  doc.circle(x + 170, chartY + 5, 1, 'F');
}

// Diagram 2: Stock Recommendation Analysis Engine Diagram
function drawStockRecommendationDiagram(doc: jsPDF, x: number, y: number, w: number, h: number) {
  drawWindowFrame(doc, x, y, w, h, "Modul Rekomendasi Saham - Engine & Skema Analisis");

  const startY = y + 10;

  // Header recommendation card
  doc.setFillColor(22, 30, 45);
  doc.roundedRect(x + 3, startY, w - 6, 12, 2, 2, 'F');
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("EMITEN TARGET: BBRI (Bank Rakyat Indonesia)", x + 6, startY + 5);

  // Rating Badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(x + w - 42, startY + 2, 36, 8, 2, 2, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text("STRONG BUY (Skor AI: 94/100)", x + w - 40, startY + 7);

  // 4 Analysis Pillar Boxes
  const pillarW = (w - 12) / 4;
  const pillarY = startY + 15;

  const pillars = [
    { name: "1. MACD & RSI", val: "Bullish Cross\nRSI: 58.4 (Optimal)", color: [16, 185, 129] },
    { name: "2. Moving Average", val: "EMA 20 > EMA 50\nGolden Cross Active", color: [223, 255, 0] },
    { name: "3. Fibonacci & Vol", val: "Supp @ 4.250\nVol Spike +240%", color: [59, 130, 246] },
    { name: "4. Sentimen Gemini", val: "Growth LDR 89%\nSkor AI: 94/100", color: [168, 85, 247] }
  ];

  pillars.forEach((p, idx) => {
    const px = x + 3 + idx * (pillarW + 2);
    doc.setFillColor(20, 28, 42);
    doc.roundedRect(px, pillarY, pillarW, 20, 2, 2, 'F');
    doc.setDrawColor(p.color[0], p.color[1], p.color[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(px, pillarY, pillarW, 20, 2, 2, 'S');

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(p.color[0], p.color[1], p.color[2]);
    doc.text(p.name, px + 3, pillarY + 5);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(220, 230, 245);
    const split = doc.splitTextToSize(p.val, pillarW - 5);
    doc.text(split, px + 3, pillarY + 11);
  });

  // Risk Execution Bar
  const execY = pillarY + 23;
  doc.setFillColor(28, 38, 56);
  doc.roundedRect(x + 3, execY, w - 6, 8, 2, 2, 'F');
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(223, 255, 0);
  doc.text("LEVEL EKSEKUSI:", x + 5, execY + 5.5);

  doc.setFont("Helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text("Buy/Entry: 4.300", x + 32, execY + 5.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Target 1: 4.550 (+5.8%)", x + 65, execY + 5.5);
  doc.text("Target 2: 4.800 (+11.6%)", x + 110, execY + 5.5);
  doc.setTextColor(239, 68, 68);
  doc.text("Stop Loss: 4.150 (-3.4%)", x + 152, execY + 5.5);
}

// Diagram 3: Scanner & Fundamental Diagram
function drawScannerFundamentalDiagram(doc: jsPDF, x: number, y: number, w: number, h: number) {
  drawWindowFrame(doc, x, y, w, h, "Tampilan VAM Smart Scanner & Audit Fundamental AI");

  const startY = y + 10;
  const halfW = (w - 9) / 2;

  // Left: VAM Smart Scanner Table
  doc.setFillColor(20, 28, 42);
  doc.roundedRect(x + 3, startY, halfW, 36, 2, 2, 'F');
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(223, 255, 0);
  doc.text("VAM SMART SCANNER (LIVE FEED)", x + 6, startY + 5);

  const scannerRows = [
    { ticker: "TLKM", signal: "Vol Breakout", vol: "+310%", status: "BULLISH" },
    { ticker: "ASII", signal: "MACD Cross", vol: "+180%", status: "BUY" },
    { ticker: "BCA", signal: "Golden Cross", vol: "+210%", status: "STRONG BUY" },
    { ticker: "PGAS", signal: "RSI Oversold", vol: "+150%", status: "ACCUMULATE" }
  ];

  scannerRows.forEach((r, idx) => {
    const ry = startY + 9 + idx * 6.5;
    doc.setFontSize(6);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(r.ticker, x + 6, ry + 4);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(180, 190, 205);
    doc.text(r.signal, x + 24, ry + 4);
    doc.text(r.vol, x + 52, ry + 4);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(r.status, x + 68, ry + 4);
  });

  // Right: Fundamental Audit Card
  doc.setFillColor(20, 28, 42);
  doc.roundedRect(x + 6 + halfW, startY, halfW, 36, 2, 2, 'F');
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(59, 130, 246);
  doc.text("FUNDAMENTAL EMITEN AUDIT (BBRI)", x + 9 + halfW, startY + 5);

  const fundMetrics = [
    "P/E Ratio: 11.2x (Undervalued vs Sector 14.5x)",
    "PBV Ratio: 1.85x | ROE: 18.5% (High Efficiency)",
    "Debt to Equity (DER): 0.82 (Aman & Solved)",
    "Altman Z-Score: 3.42 (SAFE ZONE - Bebas Kebangkrutan)",
    "Skor AI Gemini: 94/100 (Sangat Direkomendasikan)"
  ];

  fundMetrics.forEach((m, idx) => {
    const my = startY + 9 + idx * 5.2;
    doc.setFontSize(5.8);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(220, 230, 245);
    doc.text("• " + m, x + 9 + halfW, my + 3.5);
  });
}


// ==========================================
// 1. PRESENTATION DECK - PDF & PPTX
// ==========================================

export async function generatePresentationPDF() {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const setDarkBackground = () => {
    doc.setFillColor(11, 14, 20);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  const addHeaderFooter = (slideNum: number, totalSlides: number, title: string) => {
    doc.setDrawColor(223, 255, 0);
    doc.setLineWidth(0.8);
    doc.line(15, 12, pageWidth - 15, 12);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(223, 255, 0);
    doc.text("VENTUREAM", 15, 9);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 170, 190);
    doc.text(`PRESENTATION DECK | ${title.toUpperCase()}`, 45, 9);

    doc.setDrawColor(30, 40, 55);
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);

    doc.setFontSize(7);
    doc.setTextColor(120, 130, 145);
    doc.text("CONFIDENTIAL & PROPRIETARY — VENTUREAM INSTITUTIONAL SYSTEM", 15, pageHeight - 7);
    doc.text(`SLIDE ${slideNum} OF ${totalSlides}`, pageWidth - 35, pageHeight - 7);
  };

  // --- SLIDE 1: TITLE ---
  setDarkBackground();
  doc.setFillColor(20, 28, 40);
  doc.roundedRect(25, 25, pageWidth - 50, pageHeight - 50, 6, 6, 'F');
  doc.setDrawColor(223, 255, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(25, 25, pageWidth - 50, pageHeight - 50, 6, 6, 'S');

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(223, 255, 0);
  doc.text("VENTUREAM INSTITUTIONAL", pageWidth / 2, 60, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Next-Generation Multi-Asset Portfolio & Trading System", pageWidth / 2, 75, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(160, 170, 190);
  doc.text("International Gateway (IBKR / CGS) | AI Stock Recommendations | Realtime Risk Execution", pageWidth / 2, 88, { align: 'center' });

  autoTable(doc, {
    startY: 110,
    margin: { left: 45, right: 45 },
    head: [['CORE GATEWAY', 'DATA STREAM', 'COMPLIANCE', 'ANALYTICS ENGINE']],
    body: [
      ['IBKR & CGS CIMB', 'Socket.IO Real-time Feed', 'OJK & IDX Certified', 'Gemini AI & VAM Engine']
    ],
    theme: 'plain',
    styles: {
      fillColor: [15, 20, 30],
      textColor: [223, 255, 0],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 4,
      lineColor: [40, 50, 70],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [25, 35, 50],
      textColor: [255, 255, 255],
      fontSize: 8
    }
  });

  // --- SLIDE 2: EXECUTIVE SUMMARY ---
  doc.addPage();
  setDarkBackground();
  addHeaderFooter(2, 6, "Executive Summary");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Executive Summary & System Objectives", 15, 25);

  doc.setFontSize(10);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(180, 190, 205);
  doc.text("VentureAM merupakan platform manajemen investasi institusional kelas dunia yang merender visibilitas portofolio real-time,", 15, 34);
  doc.text("rekomendasi saham otomatis berbasis teknikal & AI Gemini, serta eksekusi rebalancing yang terintegrasi.", 15, 40);

  // Draw Visual Diagram
  drawDashboardDiagram(doc, 15, 48, pageWidth - 30, 50);

  // --- SLIDE 3: STOCK RECOMMENDATION ANALYTICS ---
  doc.addPage();
  setDarkBackground();
  addHeaderFooter(3, 6, "Stock Recommendation Engine");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Modul Rekomendasi Saham & Dasarnya", 15, 25);

  drawStockRecommendationDiagram(doc, 15, 32, pageWidth - 30, 55);

  doc.setFontSize(9);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(180, 190, 205);
  doc.text("Basis Analisis Rekomendasi Saham VentureAM:", 15, 95);

  const recPoints = [
    "1. Indikator Teknikal Multilapis: Kombinasi sinyal MACD Crossover, RSI Momentum (14), EMA 20/50/200, dan Lonjakan Volume.",
    "2. Level Support/Resistance & Fibonacci: Kalkulasi Pivot Points dan Fibonacci Retracement (23.6%, 38.2%, 61.8%) untuk titik presisi entry.",
    "3. Sentimen & AI Audit Gemini: Scoring otomatis 0-100 berbasis ekstraksi berita emiten, laporan keuangan, dan tren makro.",
    "4. Parameter Manajemen Risiko: Penentuan Target Price 1, Target Price 2, dan Cut Loss (Stop Loss) dengan Rasio Risk/Reward min 1:2."
  ];

  let ry = 103;
  recPoints.forEach(pt => {
    doc.text("• " + pt, 18, ry);
    ry += 6;
  });

  // --- SLIDE 4: VAM SCANNER & FUNDAMENTAL AUDIT ---
  doc.addPage();
  setDarkBackground();
  addHeaderFooter(4, 6, "Scanner & Fundamental Audit");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Smart Scanner & Audit Fundamental AI", 15, 25);

  drawScannerFundamentalDiagram(doc, 15, 32, pageWidth - 30, 55);

  // --- SLIDE 5: SYSTEM MODULES ---
  doc.addPage();
  setDarkBackground();
  addHeaderFooter(5, 6, "Core Architecture & Modules");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Arsitektur & Modul Utama Sistem", 15, 25);

  autoTable(doc, {
    startY: 32,
    margin: { left: 15, right: 15 },
    head: [['MODUL', 'DESKRIPSI FUNGSI', 'TEKNOLOGI / ENGINE', 'OUTPUT']],
    body: [
      ['Dashboard Portfolio', 'Pemantauan alokasi aset, cash balance, RDN, dan P&L harian 30 hari', 'Recharts & Decimals.js', 'Visual Chart & Holdings Table'],
      ['Rekomendasi Saham', 'Analisis teknikal (MACD/RSI/EMA/Fibonacci) + Skor AI Gemini', 'Gemini AI & Technical Engine', 'Signal Recommendation Card'],
      ['VAM Smart Scanner', 'Pemindaian sinyal teknikal (MACD, RSI, Vol) saham IDX/US real-time', 'Socket.IO & TradingView Engine', 'Live Alert Signal'],
      ['Fundamental Analyst', 'Audit keuangan emiten, rasio solvabilitas, Altman Z-Score & Score AI', 'Gemini AI & Market Data API', 'Audit Report PDF & Financial Score'],
      ['Rebalance Tool', 'Simulasi kalkulasi lot dan estimasi biaya transaksi sebelum eksekusi order', 'Algoritma Portfolio Optimizer', 'Execution Order Sheet'],
      ['Financial Reporting', 'Generasi laporan neraca, laba rugi, dan catatan kas institusi', 'OJK Standard Export System', 'PDF & Excel Financial Reports']
    ],
    theme: 'grid',
    styles: {
      fillColor: [18, 24, 35],
      textColor: [230, 235, 245],
      fontSize: 8.5,
      cellPadding: 3.5,
      lineColor: [40, 50, 70],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [30, 42, 60],
      textColor: [223, 255, 0],
      fontStyle: 'bold',
      fontSize: 9
    }
  });

  // --- SLIDE 6: ROADMAP & CONCLUSION ---
  doc.addPage();
  setDarkBackground();
  addHeaderFooter(6, 6, "Roadmap & Conclusion");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Rencana Pengembangan & Kontak", 15, 25);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(223, 255, 0);
  doc.text("VentureAM Institutional System Ready for Deployment", pageWidth / 2, 55, { align: 'center' });

  autoTable(doc, {
    startY: 70,
    margin: { left: 40, right: 40 },
    head: [['TAHAP', 'TARGET MILISTONE', 'STATUS']],
    body: [
      ['Phase 1', 'Peluncuran Gateway IBKR / CGS & Kalender Ekonomi Publik', 'COMPLETED / LIVE'],
      ['Phase 2', 'Pemindai Sinyal VAM AI & Daily Realized P&L Tracker', 'COMPLETED / LIVE'],
      ['Phase 3', 'Modul Rekomendasi Saham & Analisis Teknikal Gemini', 'COMPLETED / LIVE'],
      ['Phase 4', 'Otomatisasi Laporan Keuangan PDF/PPTX & User Manual Diagram', 'COMPLETED / LIVE']
    ],
    theme: 'grid',
    styles: {
      fillColor: [18, 24, 35],
      textColor: [230, 235, 245],
      fontSize: 8.5,
      cellPadding: 4,
      halign: 'center'
    },
    headStyles: {
      fillColor: [30, 42, 60],
      textColor: [223, 255, 0],
      fontStyle: 'bold'
    }
  });

  doc.setFontSize(9);
  doc.setTextColor(140, 150, 170);
  doc.text("Email Dukungan: pt.ventuream@gmail.com | aidilsyahdan2000@gmail.com", pageWidth / 2, 160, { align: 'center' });

  doc.save('VentureAM_Presentation_Deck.pdf');
}

export async function generatePresentationPPTX() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'VentureAM Systems';
  pptx.company = 'PT Venture AM Institutional';
  pptx.title = 'VentureAM Institutional Presentation Deck';

  // SLIDE 1
  const slide1 = pptx.addSlide();
  slide1.background = { color: "0B0E14" };
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 0.5, w: 9.0, h: 4.6,
    line: { color: "DFFF00", width: 1.5 },
    fill: { color: "111622" }
  });
  slide1.addText("VENTUREAM INSTITUTIONAL", {
    x: 0.8, y: 1.2, w: 8.4, h: 0.8,
    fontSize: 28, bold: true, color: "DFFF00", fontFace: "Calibri", align: "center"
  });
  slide1.addText("Next-Generation Multi-Asset Portfolio & Trading System", {
    x: 0.8, y: 2.0, w: 8.4, h: 0.5,
    fontSize: 16, bold: true, color: "FFFFFF", fontFace: "Calibri", align: "center"
  });

  // SLIDE 2: RECOMMENDATION BASIS
  const slide2 = pptx.addSlide();
  slide2.background = { color: "0B0E14" };
  slide2.addText("REKOMENDASI SAHAM & BASIS ANALISIS", {
    x: 0.5, y: 0.4, w: 9.0, h: 0.5,
    fontSize: 20, bold: true, color: "DFFF00", fontFace: "Calibri"
  });

  const recCards = [
    { title: "1. MACD & RSI Momentum", text: "Perpotongan MACD signal line & RSI 14 di zona akumulasi ideal." },
    { title: "2. Moving Averages & Vol", text: "EMA 20/50 Golden Cross disertai lonjakan volume harian di atas 200%." },
    { title: "3. Fibonacci Retracement", text: "Penentuan area support/resistance presisi (23.6%, 38.2%, 61.8%)." },
    { title: "4. Sentimen & Gemini AI", text: "Audit skor 0-100 berbasis pengolahan berita emiten & laporan keuangan." }
  ];

  recCards.forEach((c, i) => {
    const xPos = 0.5 + (i % 2) * 4.6;
    const yPos = 1.1 + Math.floor(i / 2) * 1.8;
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: yPos, w: 4.3, h: 1.6,
      fill: { color: "18202E" },
      line: { color: "334155", width: 1 }
    });
    slide2.addText(c.title, {
      x: xPos + 0.2, y: yPos + 0.2, w: 3.9, h: 0.35,
      fontSize: 12, bold: true, color: "DFFF00", fontFace: "Calibri"
    });
    slide2.addText(c.text, {
      x: xPos + 0.2, y: yPos + 0.6, w: 3.9, h: 0.8,
      fontSize: 10, color: "E2E8F0", fontFace: "Calibri"
    });
  });

  await pptx.writeFile({ fileName: 'VentureAM_Presentation_Deck.pptx' });
}


// ==========================================
// 2. USER MANUAL - PDF & PPTX (DETAILED)
// ==========================================

export async function generateUserManualPDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const addPageHeaderFooter = (pageNo: number, title: string) => {
    // Top bar
    doc.setFillColor(11, 14, 20);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(223, 255, 0);
    doc.text("VENTUREAM INSTITUTIONAL SYSTEM", 12, 10);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(180, 190, 205);
    doc.text(`MANUAL PENGGUNA | ${title.toUpperCase()}`, pageWidth - 12, 10, { align: 'right' });

    // Bottom bar
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Halaman " + pageNo, pageWidth - 12, pageHeight - 7, { align: 'right' });
    doc.text("Dokumen Resmi Operasional User VentureAM", 12, pageHeight - 7);
  };

  // ---------------------------------------------------------
  // PAGE 1: COVER MANUAL PENGGUNA
  // ---------------------------------------------------------
  doc.setFillColor(11, 14, 20);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setDrawColor(223, 255, 0);
  doc.setLineWidth(1);
  doc.roundedRect(12, 15, pageWidth - 24, pageHeight - 30, 4, 4, 'S');

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(223, 255, 0);
  doc.text("VENTUREAM", pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("MANUAL PENGGUNA & PANDUAN PENGGUNAAN FITUR", pageWidth / 2, 58, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(160, 170, 190);
  doc.text("Panduan Operasional Lengkap Semua Menu, Analisis Rekomendasi Saham, & Diagram UI", pageWidth / 2, 68, { align: 'center' });

  autoTable(doc, {
    startY: 85,
    margin: { left: 20, right: 20 },
    head: [['BAB', 'JUDUL MODUL & PENJELASAN MENU', 'STATUS PENGGUNA']],
    body: [
      ['Bab 1', 'Akses Sistem, Struktur Menu & Hak Akses Peran User', 'Akses Publik & Admin'],
      ['Bab 2', 'Dashboard Utama, Portofolio & Kalender Ekonomi Makro', 'Terbuka Semua Level'],
      ['Bab 3', 'Rekomendasi Saham & Basis Analisis Teknikal Gemini', 'Analisis & Sinyal Live'],
      ['Bab 4', 'VAM Smart Scanner & Audit Fundamental Emiten AI', 'Trading & Research'],
      ['Bab 5', 'Rebalancing Portofolio & Gateway IBKR/CGS CIMB', 'Akses Institusi'],
      ['Bab 6', 'Financial Reporting Center, Legal & Drive Storage', 'Audit & Compliance']
    ],
    theme: 'grid',
    styles: {
      fillColor: [18, 24, 35],
      textColor: [230, 235, 245],
      fontSize: 8.5,
      cellPadding: 4
    },
    headStyles: {
      fillColor: [30, 42, 60],
      textColor: [223, 255, 0],
      fontStyle: 'bold'
    }
  });

  doc.setFontSize(8);
  doc.setTextColor(140, 150, 165);
  doc.text(`Versi Manual: 3.2.0 | Tanggal Rilis: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, 260, { align: 'center' });

  // ---------------------------------------------------------
  // PAGE 2: BAB 1 - AKSES SISTEM & PANDUAN NAVIGASI
  // ---------------------------------------------------------
  doc.addPage();
  addPageHeaderFooter(2, "Bab 1: Navigasi & Hak Akses");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(11, 14, 20);
  doc.text("BAB 1: AKSES SISTEM, STRUKTUR MENU & HAK AKSES PERAN USER", 12, 25);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const bab1Desc = "VentureAM menggunakan arsitektur otentikasi ganda berbasis Firebase Auth dan Google OAuth 2.0. " +
  "Pengguna dapat berpindah antar menu aplikasi dengan lancar melalui Sidebar Navigation Menu yang dapat dibuka kapan saja melalui icon burger menu di pojok kiri atas.";
  const b1Lines = doc.splitTextToSize(bab1Desc, pageWidth - 24);
  doc.text(b1Lines, 12, 32);

  // Table of Roles
  autoTable(doc, {
    startY: 42,
    margin: { left: 12, right: 12 },
    head: [['TINGKATAN PERAN', 'DESKRIPSI HAK AKSES MENU', 'OTENTIKASI REQUIRED']],
    body: [
      ['Akses Publik (Public)', 'Dapat membuka Dashboard Utama, Kalender Ekonomi Makro, Market Heatmap, Rekomendasi Saham, VAM Smart Scanner, dan Audit Sync.', 'Bebas Akses (Tanpa Login)'],
      ['Akses Investor / Manager', 'Dapat menambahkan watchlist pribadi, mengatur alert harga emiten, dan menyimpan preferensi analisis.', 'Google OAuth / Email Login'],
      ['Akses Institutional Admin', 'Membuka penuh fitur Rebalancing Portofolio, Realized P&L Ledger 30 Hari, Financial Reporting Center, dan Google Drive Cloud Sync.', 'Firebase Auth Institutional']
    ],
    theme: 'grid',
    styles: {
      fillColor: [245, 247, 250],
      textColor: [30, 30, 30],
      fontSize: 8,
      cellPadding: 3.5
    },
    headStyles: {
      fillColor: [20, 28, 42],
      textColor: [223, 255, 0],
      fontStyle: 'bold'
    }
  });

  // Include Visual Diagram 1: Dashboard UI Diagram
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(11, 14, 20);
  doc.text("DIAGRAM MOCKUP INTERFACE DASHBOARD PORTOFOLIO:", 12, 105);

  drawDashboardDiagram(doc, 12, 110, pageWidth - 24, 55);

  // ---------------------------------------------------------
  // PAGE 3: BAB 2 - DASHBOARD & KALENDER EKONOMI
  // ---------------------------------------------------------
  doc.addPage();
  addPageHeaderFooter(3, "Bab 2: Dashboard & Kalender Ekonomi");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(11, 14, 20);
  doc.text("BAB 2: PENJELASAN FUNGSI FITUR - DASHBOARD & KALENDER EKONOMI", 12, 25);

  const bab2Content = [
    { title: "1. Overview Portofolio & Total NAV", text: "Memuat metrik konsolidasi nilai portofolio institusi, saldo kas RDN (Rekening Dana Nasabah), saldo Giro bank penampung, serta kalkulasi P&L harian. Dilengkapi grafik tren performa 30 hari." },
    { title: "2. Table Holdings & Asset Breakdown", text: "Menampilkan daftar seluruh emiten yang dimiliki beserta total lot, rata-rata harga beli (average price), harga pasar terupdate, alokasi persentase portofolio, dan profit/loss mengambang." },
    { title: "3. Ticker Feed & Global Indices Bar", text: "Papan ticker di bagian atas menyajikan pergerakan indeks utama (IHSG, S&P 500, Nasdaq, Nikkei 225, dan Volatility Index VIX) yang diupdate secara otomatis via Socket.IO." },
    { title: "4. Menu Kalender Ekonomi Makro", text: "Menyajikan jadwal pengumuman indikator ekonomi global seperti keputusan suku bunga FFR/BI Rate, data inflasi CPI, Non-Farm Payrolls, dan GDP growth beserta tingkat dampaknya (High, Medium, Low Impact)." }
  ];

  let b2Y = 32;
  bab2Content.forEach(item => {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(11, 14, 20);
    doc.text(item.title, 12, b2Y);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    const splitText = doc.splitTextToSize(item.text, pageWidth - 24);
    doc.text(splitText, 12, b2Y + 5);

    b2Y += splitText.length * 5 + 8;
  });

  // Table summary for Economic Calendar
  autoTable(doc, {
    startY: b2Y + 2,
    margin: { left: 12, right: 12 },
    head: [['INDIKATOR MAKRO', 'FREKUENSI', 'DAMPAK TERHADAP PASAR MODAL']],
    body: [
      ['Keputusan Suku Bunga (BI / Fed)', 'Bulanan', 'Dampak Sangat Tinggi (High Volatility) pada perbankan & obligasi.'],
      ['Consumer Price Index (CPI/Inflasi)', 'Bulanan', 'Mempengaruhi ekspektasi suku bunga dan sektor konsumer.'],
      ['Gross Domestic Product (GDP)', 'Kuartalan', 'Indikator utama pertumbuhan ekonomi nasional & pertumbuhan laba emiten.']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3.5 },
    headStyles: { fillColor: [30, 42, 60], textColor: [223, 255, 0] }
  });

  // ---------------------------------------------------------
  // PAGE 4: BAB 3 - REKOMENDASI SAHAM & DASAR ANALISIS
  // ---------------------------------------------------------
  doc.addPage();
  addPageHeaderFooter(4, "Bab 3: Rekomendasi Saham");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(11, 14, 20);
  doc.text("BAB 3: PENJELASAN MENU REKOMENDASI SAHAM & BASIS ANALISISNYA", 12, 25);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const recIntro = "Menu 'Rekomendasi Saham' dirancang khusus untuk membantu analis dan investor menemukan peluang transaksi berkualitas tinggi. " +
  "Setiap rekomendasi yang dimunculkan oleh sistem VentureAM dihasilkan secara terstruktur melalui kalkulasi algoritma teknikal dan evaluasi AI Gemini.";
  doc.text(doc.splitTextToSize(recIntro, pageWidth - 24), 12, 32);

  // Boxed explanation of analysis basis
  doc.setFillColor(245, 248, 252);
  doc.roundedRect(12, 45, pageWidth - 24, 75, 3, 3, 'F');
  doc.setDrawColor(200, 215, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, 45, pageWidth - 24, 75, 3, 3, 'S');

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 25, 45);
  doc.text("EMPAT PILAR ANALISIS DALAM MENU REKOMENDASI SAHAM:", 16, 53);

  const basisDetails = [
    { name: "1. Indikator Teknikal Multilapis", desc: "Menggabungkan sinyal perpotongan MACD Crossover (Moving Average Convergence Divergence), tingkat RSI 14 Momentum (area oversold/overbought 30-70), serta konfirmasi EMA 20, 50, dan 200." },
    { name: "2. Pola Chart & Level Fibonacci", desc: "Sistem mendeteksi breakout pola chart dan menghitung rasio Fibonacci Retracement (23.6%, 38.2%, 61.8%) untuk menentukan titik support & resistance yang presisi." },
    { name: "3. Skor AI & Sentimen Pasar Gemini", desc: "Ekstraksi berita emiten, laporan keuangan kuartalan, dan sentimen publik diproses oleh Google Gemini AI untuk memberikan skor kesehatan emiten (0 - 100)." },
    { name: "4. Parameter Manajemen Risiko Presisi", desc: "Setiap rekomendasi wajib menyertakan batas Target Price 1, Target Price 2, dan Cut Loss / Stop Loss dengan rasio Risk-to-Reward minimum 1:2." }
  ];

  let bdY = 60;
  basisDetails.forEach(b => {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(11, 14, 20);
    doc.text(b.name, 16, bdY);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    const splitB = doc.splitTextToSize(b.desc, pageWidth - 36);
    doc.text(splitB, 16, bdY + 4);

    bdY += splitB.length * 4.5 + 4;
  });

  // Diagram 2: Stock Recommendation Engine Diagram
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(11, 14, 20);
  doc.text("DIAGRAM SKEMA ENGINE REKOMENDASI SAHAM:", 12, 128);

  drawStockRecommendationDiagram(doc, 12, 133, pageWidth - 24, 60);

  // ---------------------------------------------------------
  // PAGE 5: BAB 4 - VAM SMART SCANNER & FUNDAMENTAL AUDIT
  // ---------------------------------------------------------
  doc.addPage();
  addPageHeaderFooter(5, "Bab 4: Scanner & Fundamental Audit");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(11, 14, 20);
  doc.text("BAB 4: VAM SMART SCANNER & AUDIT FUNDAMENTAL EMITEN AI", 12, 25);

  const bab4Content = [
    { title: "1. VAM Smart Scanner (Terminal Scanner)", text: "Pemindai saham otomatis real-time yang memantau lonjakan volume abnormal (Unusual Volume Spike), akumulasi institusi, sinyal Bullish Engulfing, serta pergerakan intraday secara simultan pada bursa IDX dan pasar saham global." },
    { title: "2. Fundamental Analyst & Audit AI", text: "Pusat analisis laporan keuangan emiten. Menyajikan rasio PER, PBV, Debt to Equity (DER), Return on Equity (ROE), Dividend Yield, serta prediksi kebangkrutan menggunakan rumus Altman Z-Score." },
    { title: "3. Stock Explorer & TradingView Interactive Chart", text: "Fasilitas grafik candlestick interaktif TradingView lengkap dengan Time & Sales tick stream real-time, kedalaman pasar (Orderbook Depth), serta berita sektoral." }
  ];

  let b4Y = 32;
  bab4Content.forEach(item => {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(11, 14, 20);
    doc.text(item.title, 12, b4Y);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    const splitText = doc.splitTextToSize(item.text, pageWidth - 24);
    doc.text(splitText, 12, b4Y + 5);

    b4Y += splitText.length * 5 + 6;
  });

  // Diagram 3: Scanner & Fundamental Diagram
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(11, 14, 20);
  doc.text("DIAGRAM MOCKUP INTERFACE SCANNER & AUDIT FUNDAMENTAL:", 12, b4Y + 4);

  drawScannerFundamentalDiagram(doc, 12, b4Y + 9, pageWidth - 24, 55);

  // ---------------------------------------------------------
  // PAGE 6: BAB 5 - REBALANCING & FINANCIAL REPORTING
  // ---------------------------------------------------------
  doc.addPage();
  addPageHeaderFooter(6, "Bab 5: Rebalance & Reporting");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(11, 14, 20);
  doc.text("BAB 5: REBALANCING PORTOFOLIO & FINANCIAL REPORTING CENTER", 12, 25);

  const bab5Content = [
    { title: "1. Rebalancing Execution Tool", text: "Modul simulasi kalkulasi penyesuaian lot saham berdasarkan target alokasi portofolio. Menghitung estimasi biaya transaksi (brokerage fee & levy) serta memperhitungkan ketersediaan saldo RDN sebelum order dikirim ke CGS/IBKR." },
    { title: "2. Financial Reporting Center (Standard OJK)", text: "Pusat penerbitan laporan keuangan resmi institusi mencakup Laporan Neraca (Balance Sheet), Laporan Laba Rugi (Income Statement), dan Laporan Arus Kas (Cash Flow Statement) yang dapat diekspor langsung ke PDF & Excel." },
    { title: "3. Legal Document Center (SoA, SPK & Presentasi)", text: "Fasilitas pencetakan otomatis dokumen hukum seperti Statement of Account (SoA), Surat Perjanjian Kerjasama (SPK), NDA, serta cetak Presentasi Deck dan Manual User." },
    { title: "4. Drive Cloud Sync & Audit Sync Log", text: "Integrasi cloud storage Google Drive Enterprise dengan enkripsi VAM Tunnel, serta pencatatan audit log transaksi berbasis hash integritas data." }
  ];

  let b5Y = 32;
  bab5Content.forEach(item => {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(11, 14, 20);
    doc.text(item.title, 12, b5Y);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    const splitText = doc.splitTextToSize(item.text, pageWidth - 24);
    doc.text(splitText, 12, b5Y + 5);

    b5Y += splitText.length * 5 + 6;
  });

  // Table of Output Documents
  autoTable(doc, {
    startY: b5Y + 2,
    margin: { left: 12, right: 12 },
    head: [['JENIS DOKUMEN', 'FORMAT EKSPOR', 'PERUNTUKAN DOKUMEN']],
    body: [
      ['Dokumen Presentasi Aplikasi', 'PDF (Landscape) & PPTX (16:9)', 'Presentasi Eksekutif, Investor & Board Meeting'],
      ['Dokumen Manual Pengguna', 'PDF (A4) & PPTX (Slides)', 'Panduan Operasional Karyawan & Onboarding User'],
      ['Laporan Keuangan Institusi', 'PDF & Microsoft Excel', 'Pelaporan Tahunan, Auditing & Audit OJK'],
      ['Statement of Account (SoA)', 'PDF Resmi Terenkripsi', 'Pernyataan Saldo & Rekonsiliasi Nasabah']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3.5 },
    headStyles: { fillColor: [30, 42, 60], textColor: [223, 255, 0] }
  });

  // Save PDF
  doc.save('VentureAM_User_Manual_Guide.pdf');
}

export async function generateUserManualPPTX() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'VentureAM Training Team';
  pptx.title = 'User Onboarding & System Manual Deck';

  // SLIDE 1: COVER
  const slide1 = pptx.addSlide();
  slide1.background = { color: "0B0E14" };

  slide1.addText("VENTUREAM USER MANUAL", {
    x: 0.8, y: 1.2, w: 8.4, h: 0.8,
    fontSize: 26, bold: true, color: "DFFF00", fontFace: "Calibri", align: "center"
  });

  slide1.addText("Panduan Langkah demi Langkah Penggunaan Semua Fitur System VentureAM", {
    x: 0.8, y: 2.1, w: 8.4, h: 0.5,
    fontSize: 14, color: "FFFFFF", fontFace: "Calibri", align: "center"
  });

  // SLIDE 2: ALL MENUS OVERVIEW
  const slide2 = pptx.addSlide();
  slide2.background = { color: "0B0E14" };

  slide2.addText("RINGKASAN SELURUH MENU SISTEM VENTUREAM", {
    x: 0.5, y: 0.4, w: 9.0, h: 0.5,
    fontSize: 18, bold: true, color: "DFFF00", fontFace: "Calibri"
  });

  const menusList = [
    "1. Dashboard Portofolio: Pemantauan NAV, Cash RDN, Giro, & 30-Day Realized P&L.",
    "2. Kalender Ekonomi: Jadwal rilis pengumuman makro ekonomi global & lokal.",
    "3. Rekomendasi Saham: Analisis teknikal (MACD/RSI/EMA/Fibonacci) + Skor AI Gemini.",
    "4. VAM Smart Scanner: Sinyal real-time unusual volume & momentum breakout.",
    "5. Fundamental Analyst: Audit rasio emiten & kalkulasi Altman Z-Score.",
    "6. Rebalance Tool & Reporting: Simulasi order lot & cetak laporan keuangan OJK."
  ];

  menusList.forEach((m, idx) => {
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: 0.5, y: 1.0 + idx * 0.65, w: 9.0, h: 0.55,
      fill: { color: "18202E" },
      line: { color: "334155", width: 1 }
    });

    slide2.addText(m, {
      x: 0.7, y: 1.05 + idx * 0.65, w: 8.6, h: 0.45,
      fontSize: 10.5, color: "E2E8F0", fontFace: "Calibri"
    });
  });

  // SLIDE 3: STOCK RECOMMENDATION BASIS
  const slide3 = pptx.addSlide();
  slide3.background = { color: "0B0E14" };

  slide3.addText("MODUL REKOMENDASI SAHAM & BASIS ANALISISNYA", {
    x: 0.5, y: 0.4, w: 9.0, h: 0.5,
    fontSize: 18, bold: true, color: "DFFF00", fontFace: "Calibri"
  });

  const recPointsSlide = [
    "• Indikator Teknikal Multilapis: MACD Crossover, RSI 14 Momentum, dan EMA 20/50/200.",
    "• Fibonacci & Chart Pattern: Level support/resistance presisi (23.6%, 38.2%, 61.8%).",
    "• Sentimen AI Gemini: Scoring 0-100 dari pengolahan berita emiten & laporan keuangan.",
    "• Risk-to-Reward Management: Target Price 1, Target Price 2, & Stop Loss dengan rasio min 1:2."
  ];

  recPointsSlide.forEach((pt, idx) => {
    slide3.addShape(pptx.ShapeType.roundRect, {
      x: 0.5, y: 1.1 + idx * 0.9, w: 9.0, h: 0.75,
      fill: { color: "18202E" },
      line: { color: "334155", width: 1 }
    });

    slide3.addText(pt, {
      x: 0.7, y: 1.2 + idx * 0.9, w: 8.6, h: 0.55,
      fontSize: 11, color: "E2E8F0", fontFace: "Calibri"
    });
  });

  await pptx.writeFile({ fileName: 'VentureAM_User_Manual_Guide.pptx' });
}
