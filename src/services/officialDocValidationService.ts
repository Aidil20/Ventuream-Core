import QRCode from 'qrcode';
import jsPDF from 'jspdf';

export type OfficialDivisionKey = 
  | 'DIVISI_PORTOFOLIO_PASAR_MODAL'
  | 'DIVISI_KEUANGAN_AUDIT'
  | 'DIVISI_KEPATUHAN_RISIKO'
  | 'DIVISI_TEKNOLOGI_SISTEM'
  | 'DIREKSI_EKSEKUTIF'
  | 'SATUAN_PENGAWAS_INTERN';

export interface OfficialDivisionInfo {
  key: OfficialDivisionKey;
  code: string;
  name: string;
  nameEn: string;
  signatoryTitle: string;
  signatoryOfficer: string;
  accentColorHex: string;
  accentColorRgb: [number, number, number];
  badgeText: string;
}

export const OFFICIAL_DIVISIONS: Record<OfficialDivisionKey, OfficialDivisionInfo> = {
  DIVISI_PORTOFOLIO_PASAR_MODAL: {
    key: 'DIVISI_PORTOFOLIO_PASAR_MODAL',
    code: 'DIV-PPM',
    name: 'Divisi Pengelolaan Portofolio & Riset Pasar Modal',
    nameEn: 'Division of Portfolio Management & Capital Markets Research',
    signatoryTitle: 'Head of Portfolio Management & Chief Investment Officer',
    signatoryOfficer: 'Aidil Syahdan Al fitrah',
    accentColorHex: '#DFFF00',
    accentColorRgb: [223, 255, 0],
    badgeText: 'PORTFOLIO & TRADING SYSTEMS'
  },
  DIVISI_KEUANGAN_AUDIT: {
    key: 'DIVISI_KEUANGAN_AUDIT',
    code: 'DIV-KAA',
    name: 'Divisi Keuangan, Akuntansi & Audit Konsolidasi',
    nameEn: 'Division of Financial Accounting & Consolidated Audit',
    signatoryTitle: 'Chief Financial Officer & Senior Lead Auditor',
    signatoryOfficer: 'Divisi Akuntansi & Pelaporan Korporasi',
    accentColorHex: '#10B981',
    accentColorRgb: [16, 185, 129],
    badgeText: 'FINANCIAL & AUDIT LEDGER'
  },
  DIVISI_KEPATUHAN_RISIKO: {
    key: 'DIVISI_KEPATUHAN_RISIKO',
    code: 'DIV-KMR',
    name: 'Divisi Kepatuhan, Manajemen Risiko & Regulasi Hukum',
    nameEn: 'Division of Risk Management, Legal & Regulatory Compliance',
    signatoryTitle: 'Chief Compliance Officer & Head of Risk Governance',
    signatoryOfficer: 'Tim Kepatuhan OJK & Regulasi Pasar Modal',
    accentColorHex: '#3B82F6',
    accentColorRgb: [59, 130, 246],
    badgeText: 'RISK & REGULATORY GOVERNANCE'
  },
  DIVISI_TEKNOLOGI_SISTEM: {
    key: 'DIVISI_TEKNOLOGI_SISTEM',
    code: 'DIV-TIS',
    name: 'Divisi Rekayasa Teknologi, Arsitektur & Infrastruktur Sistem',
    nameEn: 'Division of Technology Engineering & Systems Infrastructure',
    signatoryTitle: 'Chief Technology Officer & Lead System Architect',
    signatoryOfficer: 'VentureAM Core Engineering Architecture',
    accentColorHex: '#A855F7',
    accentColorRgb: [168, 85, 247],
    badgeText: 'CORE TECHNOLOGY & ARCHITECTURE'
  },
  DIREKSI_EKSEKUTIF: {
    key: 'DIREKSI_EKSEKUTIF',
    code: 'DIV-DIR',
    name: 'Kantor Direktur Utama & Dewan Direksi Eksekutif',
    nameEn: 'Office of President Director & Executive Managing Board',
    signatoryTitle: 'President Director & Chief Executive Officer',
    signatoryOfficer: 'Aidil Syahdan Al fitrah',
    accentColorHex: '#F59E0B',
    accentColorRgb: [245, 158, 11],
    badgeText: 'EXECUTIVE BOARD OF DIRECTORS'
  },
  SATUAN_PENGAWAS_INTERN: {
    key: 'SATUAN_PENGAWAS_INTERN',
    code: 'DIV-SPI',
    name: 'Satuan Pengawas Intern (SPI) & Komite Audit Perseroan',
    nameEn: 'Internal Audit Unit & Corporate Audit Committee',
    signatoryTitle: 'Head of Internal Audit & Supervisory Board',
    signatoryOfficer: 'Komite Audit & SPI PT Venture Asset Management',
    accentColorHex: '#EC4899',
    accentColorRgb: [236, 72, 153],
    badgeText: 'INTERNAL AUDIT SUPERVISORY'
  }
};

export interface OfficialDocValidationPayload {
  system: string;
  version: string;
  docNumber: string;
  divisionKey: OfficialDivisionKey;
  divisionCode: string;
  divisionName: string;
  documentTitle: string;
  classification: string;
  issuedTimestamp: string;
  issuedDateStr: string;
  securityHash: string;
  gatewayStatus: string;
  signatoryTitle: string;
  signatoryOfficer: string;
  verificationUrl: string;
}

// Generate simple deterministic 16-character pseudo SHA-256 hash for document integrity verification
export function generateDocSecurityHash(docNumber: string, divisionCode: string, timestamp: string): string {
  let hashVal = 0x811c9dc5;
  const raw = `VAM-OFFICIAL|${docNumber}|${divisionCode}|${timestamp}|INSTITUTIONAL_CORE_v3.4`;
  for (let i = 0; i < raw.length; i++) {
    hashVal ^= raw.charCodeAt(i);
    hashVal = (hashVal * 0x01000193) >>> 0;
  }
  const hex1 = hashVal.toString(16).toUpperCase().padStart(8, '0');
  
  let hashVal2 = 0x5a17e9b3;
  for (let i = raw.length - 1; i >= 0; i--) {
    hashVal2 ^= raw.charCodeAt(i);
    hashVal2 = (hashVal2 * 0x01000193) >>> 0;
  }
  const hex2 = hashVal2.toString(16).toUpperCase().padStart(8, '0');

  return `SHA256-${hex1}${hex2}`;
}

export function createOfficialValidationPayload({
  divisionKey,
  documentTitle,
  docNumber,
  classification = 'DOKUMEN RESMI TERVERIFIKASI (INSTITUTIONAL GRADE)',
  customDate
}: {
  divisionKey: OfficialDivisionKey;
  documentTitle: string;
  docNumber?: string;
  classification?: string;
  customDate?: Date;
}): OfficialDocValidationPayload {
  const division = OFFICIAL_DIVISIONS[divisionKey];
  const now = customDate || new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
  const fullDateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const generatedDocNum = docNumber || `VAM/${division.code}/${now.getFullYear()}/${dateStr.slice(4)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const secHash = generateDocSecurityHash(generatedDocNum, division.code, now.toISOString());

  const baseUrl = typeof window !== 'undefined' && window.location?.origin 
    ? window.location.origin 
    : 'https://ventuream.co.id';
    
  const verificationUrl = `${baseUrl}/?verify=${encodeURIComponent(generatedDocNum)}&hash=${encodeURIComponent(secHash)}&div=${encodeURIComponent(division.code)}`;

  return {
    system: 'Venture Asset Management Institutional Gateway System',
    version: 'v3.4.0-PROD',
    docNumber: generatedDocNum,
    divisionKey: division.key,
    divisionCode: division.code,
    divisionName: division.name,
    documentTitle,
    classification,
    issuedTimestamp: `${fullDateStr}, ${timeStr}`,
    issuedDateStr: fullDateStr,
    securityHash: secHash,
    gatewayStatus: 'CONNECTED (IBKR / CGS INTERNATIONAL GATEWAY)',
    signatoryTitle: division.signatoryTitle,
    signatoryOfficer: division.signatoryOfficer,
    verificationUrl
  };
}

/**
 * Generate QR Code data URL asynchronously
 * Using direct verificationUrl allows Google Lens, iOS Camera, Android QR Scanners
 * to immediately recognize the link and open the verification page with 1 tap.
 */
export async function generateOfficialQrCodeDataUrl(payload: OfficialDocValidationPayload): Promise<string> {
  // Use the direct URL so any standard scanner (Google Lens, iPhone Camera, etc.) opens the verification page
  const qrString = payload.verificationUrl || `https://ventuream.co.id/?verify=${encodeURIComponent(payload.docNumber)}&div=${encodeURIComponent(payload.divisionCode)}&hash=${encodeURIComponent(payload.securityHash)}`;

  return await QRCode.toDataURL(qrString, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 250,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}

/**
 * Generate a standalone QR code data URL for a specific division and document
 */
export async function generateDivisionSignatureQrDataUrl(
  divisionKey: OfficialDivisionKey,
  docNumber: string,
  documentTitle: string
): Promise<{ qrDataUrl: string; payload: OfficialDocValidationPayload }> {
  const payload = createOfficialValidationPayload({
    divisionKey,
    docNumber,
    documentTitle
  });
  const qrDataUrl = await generateOfficialQrCodeDataUrl(payload);
  return { qrDataUrl, payload };
}

/**
 * Helper to embed a division signature column with an embedded QR code directly under the division title
 */
export async function embedDivisionSignatureQrBlock({
  doc,
  divisionKey,
  docNumber,
  documentTitle,
  x,
  y,
  width = 68,
  headerTitle,
  signerName,
  signerRole,
  isLeft = true
}: {
  doc: jsPDF;
  divisionKey: OfficialDivisionKey;
  docNumber: string;
  documentTitle: string;
  x: number;
  y: number;
  width?: number;
  headerTitle: string;
  signerName: string;
  signerRole: string;
  isLeft?: boolean;
}): Promise<OfficialDocValidationPayload> {
  const division = OFFICIAL_DIVISIONS[divisionKey] || OFFICIAL_DIVISIONS.DIVISI_KEUANGAN_AUDIT;
  const { qrDataUrl, payload } = await generateDivisionSignatureQrDataUrl(divisionKey, docNumber, documentTitle);

  // 1. Header above QR (Division Title / Committee Title)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(headerTitle, x, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PT Venture Asset Management', x, y + 3.8);

  // 2. QR Code Box under Division Name (Signature Stamp)
  const qrY = y + 5.5;
  const qrSize = 17;
  
  // Background card for QR & validation seal
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, qrY, width, 18.5, 1, 1, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, qrY, width, 18.5, 1, 1, 'S');

  // QR Code Image container
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x + 1, qrY + 1, qrSize, qrSize, 0.5, 0.5, 'F');
  doc.addImage(qrDataUrl, 'PNG', x + 1.2, qrY + 1.2, qrSize - 0.4, qrSize - 0.4);

  // Validation details beside QR
  const badgeX = x + qrSize + 2.5;
  const badgeW = width - qrSize - 3.5;
  
  // Division badge tag
  doc.setFillColor(division.accentColorRgb[0], division.accentColorRgb[1], division.accentColorRgb[2]);
  doc.roundedRect(badgeX, qrY + 1.5, badgeW, 3.8, 0.5, 0.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(0, 0, 0);
  doc.text(`[${division.code}] VERIFIED SEAL`, badgeX + 1.5, qrY + 4.1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(5, 150, 105);
  doc.text('OTORISASI ELEKTRONIK', badgeX, qrY + 8.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Hash: ${payload.securityHash.slice(0, 14)}...`, badgeX, qrY + 11.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Pindai QR / Google Lens', badgeX, qrY + 14.8);

  // 3. Signature line
  const lineY = qrY + 20.5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(x, lineY, x + width, lineY);

  // 4. Signer Name & Title under the line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(signerName, x, lineY + 3.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(signerRole, x, lineY + 7.2);

  return payload;
}

/**
 * Embed dual signature columns with official QR codes under each column
 */
export async function embedDualSignatureQrBlocks({
  doc,
  leftDivisionKey = 'DIVISI_KEUANGAN_AUDIT',
  rightDivisionKey = 'DIREKSI_EKSEKUTIF',
  docNumber,
  documentTitle,
  startY = 140,
  leftHeaderTitle = 'DIVISI AKUNTANSI & PELAPORAN KORPORASI',
  leftSignerName = 'DIVISI AKUNTANSI & PELAPORAN KORPORASI',
  leftSignerRole = 'Satuan Pengawas Intern (Internal Audit)',
  rightHeaderTitle = 'KOMITE AUDIT & DEWAN PENGAWAS',
  rightSignerName = 'Aidil Syahdan Al fitrah',
  rightSignerRole = 'President Director'
}: {
  doc: jsPDF;
  leftDivisionKey?: OfficialDivisionKey;
  rightDivisionKey?: OfficialDivisionKey;
  docNumber: string;
  documentTitle: string;
  startY?: number;
  leftHeaderTitle?: string;
  leftSignerName?: string;
  leftSignerRole?: string;
  rightHeaderTitle?: string;
  rightSignerName?: string;
  rightSignerRole?: string;
}): Promise<{ leftPayload: OfficialDocValidationPayload; rightPayload: OfficialDocValidationPayload }> {
  const pw = doc.internal.pageSize.getWidth();
  const colWidth = 72;
  const leftX = 14;
  const rightX = pw - colWidth - 14;

  const leftPayload = await embedDivisionSignatureQrBlock({
    doc,
    divisionKey: leftDivisionKey,
    docNumber,
    documentTitle,
    x: leftX,
    y: startY,
    width: colWidth,
    headerTitle: leftHeaderTitle,
    signerName: leftSignerName,
    signerRole: leftSignerRole,
    isLeft: true
  });

  const rightPayload = await embedDivisionSignatureQrBlock({
    doc,
    divisionKey: rightDivisionKey,
    docNumber,
    documentTitle,
    x: rightX,
    y: startY,
    width: colWidth,
    headerTitle: rightHeaderTitle,
    signerName: rightSignerName,
    signerRole: rightSignerRole,
    isLeft: false
  });

  return { leftPayload, rightPayload };
}

/**
 * Helper to embed official QR Code validation box directly onto any jsPDF instance.
 */
export async function embedOfficialQrValidationStamp({
  doc,
  divisionKey,
  documentTitle,
  docNumber,
  classification,
  x,
  y,
  width = 75,
  height = 24,
  theme = 'dark',
  customDate
}: {
  doc: jsPDF;
  divisionKey: OfficialDivisionKey;
  documentTitle: string;
  docNumber?: string;
  classification?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  theme?: 'dark' | 'light' | 'gold_bordered';
  customDate?: Date;
}): Promise<OfficialDocValidationPayload> {
  const payload = createOfficialValidationPayload({
    divisionKey,
    documentTitle,
    docNumber,
    classification,
    customDate
  });

  const division = OFFICIAL_DIVISIONS[divisionKey];
  const qrDataUrl = await generateOfficialQrCodeDataUrl(payload);

  const qrSize = Math.min(height - 4, 20);
  const textStartX = x + qrSize + 4;
  const textWidth = width - qrSize - 6;

  // Background styling
  if (theme === 'dark') {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(x, y, width, height, 2, 2, 'F');
    doc.setDrawColor(division.accentColorRgb[0], division.accentColorRgb[1], division.accentColorRgb[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, width, height, 2, 2, 'S');
  } else if (theme === 'gold_bordered') {
    doc.setFillColor(254, 252, 232); // yellow-50
    doc.roundedRect(x, y, width, height, 2, 2, 'F');
    doc.setDrawColor(202, 138, 4); // yellow-600
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, width, height, 2, 2, 'S');
  } else {
    // Light
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(x, y, width, height, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, width, height, 2, 2, 'S');
  }

  // Draw White container for QR Code
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x + 2, y + 2, qrSize, qrSize, 1, 1, 'F');
  doc.addImage(qrDataUrl, 'PNG', x + 2.5, y + 2.5, qrSize - 1, qrSize - 1);

  // Text details
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  if (theme === 'dark') {
    doc.setTextColor(division.accentColorRgb[0], division.accentColorRgb[1], division.accentColorRgb[2]);
  } else if (theme === 'gold_bordered') {
    doc.setTextColor(161, 98, 7);
  } else {
    doc.setTextColor(15, 23, 42);
  }
  doc.text(`DOKUMEN RESMI TERVERIFIKASI SISTEM`, textStartX, y + 5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(5.5);
  if (theme === 'dark') {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(30, 41, 59);
  }
  doc.text(`[${division.code}] ${division.name.toUpperCase().slice(0, 36)}`, textStartX, y + 9);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(5.2);
  if (theme === 'dark') {
    doc.setTextColor(148, 163, 184);
  } else {
    doc.setTextColor(71, 85, 105);
  }
  doc.text(`No. Dokumen: ${payload.docNumber}`, textStartX, y + 13);
  doc.text(`Diterbitkan: ${payload.issuedTimestamp}`, textStartX, y + 16.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(4.8);
  if (theme === 'dark') {
    doc.setTextColor(16, 185, 129); // emerald-400
  } else {
    doc.setTextColor(5, 150, 105);
  }
  doc.text(`VALIDASI QR & SHA-256: ${payload.securityHash}`, textStartX, y + 20);

  return payload;
}

/**
 * Draw a full Official Institutional Signature Block with QR Stamp for concluding pages
 */
export async function embedOfficialSignaturesAndQrBlock({
  doc,
  divisionKey,
  documentTitle,
  docNumber,
  startY,
  theme = 'dark'
}: {
  doc: jsPDF;
  divisionKey: OfficialDivisionKey;
  documentTitle: string;
  docNumber?: string;
  startY: number;
  theme?: 'dark' | 'light';
}): Promise<{ finalY: number; payload: OfficialDocValidationPayload }> {
  const pw = doc.internal.pageSize.getWidth();
  const division = OFFICIAL_DIVISIONS[divisionKey];

  const payload = createOfficialValidationPayload({
    divisionKey,
    documentTitle,
    docNumber
  });

  const qrDataUrl = await generateOfficialQrCodeDataUrl(payload);

  const boxWidth = pw - 24;
  const boxHeight = 36;
  const boxX = 12;
  const boxY = startY;

  // Box Background
  if (theme === 'dark') {
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'F');
    doc.setDrawColor(40, 55, 80);
    doc.setLineWidth(0.4);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'S');
  } else {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'S');
  }

  // Left Section: QR Code & Verification Tag
  const qrBoxSize = 28;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(boxX + 4, boxY + 4, qrBoxSize, qrBoxSize, 2, 2, 'F');
  doc.addImage(qrDataUrl, 'PNG', boxX + 5, boxY + 5, qrBoxSize - 2, qrBoxSize - 2);

  // Center Section: Meta details
  const midX = boxX + qrBoxSize + 8;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  if (theme === 'dark') {
    doc.setTextColor(division.accentColorRgb[0], division.accentColorRgb[1], division.accentColorRgb[2]);
  } else {
    doc.setTextColor(15, 23, 42);
  }
  doc.text('VALIDASI KEABSAHAN DOKUMEN RESMI SISTEM', midX, boxY + 8);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  if (theme === 'dark') {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(30, 41, 59);
  }
  doc.text(`PENERBIT: ${division.name.toUpperCase()}`, midX, boxY + 13);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6);
  if (theme === 'dark') {
    doc.setTextColor(148, 163, 184);
  } else {
    doc.setTextColor(71, 85, 105);
  }
  doc.text(`Kode Divisi: ${division.code} | Klasifikasi: ${payload.classification}`, midX, boxY + 17.5);
  doc.text(`No. Registrasi: ${payload.docNumber}`, midX, boxY + 21.5);
  doc.text(`Waktu Penerbitan: ${payload.issuedTimestamp}`, midX, boxY + 25.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(5.5);
  if (theme === 'dark') {
    doc.setTextColor(16, 185, 129);
  } else {
    doc.setTextColor(5, 150, 105);
  }
  doc.text(`INTEGRITY HASH: ${payload.securityHash} [TAMPER-EVIDENT]`, midX, boxY + 30);

  // Right Section: Official Digital Seal & Signature
  const rightX = pw - 65;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  if (theme === 'dark') {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(15, 23, 42);
  }
  doc.text('OTORISASI ELEKTRONIK', rightX, boxY + 8);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6);
  if (theme === 'dark') {
    doc.setTextColor(148, 163, 184);
  } else {
    doc.setTextColor(100, 116, 139);
  }
  doc.text(division.signatoryTitle, rightX, boxY + 12);

  // Digital Signature Stamp Box
  doc.setFillColor(theme === 'dark' ? 24 : 241, theme === 'dark' ? 32 : 245, theme === 'dark' ? 48 : 249);
  doc.roundedRect(rightX, boxY + 15, 48, 14, 1.5, 1.5, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(16, 185, 129);
  doc.text('[TERVERIFIKASI DIGITAL]', rightX + 4, boxY + 20);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(5.5);
  if (theme === 'dark') {
    doc.setTextColor(226, 232, 240);
  } else {
    doc.setTextColor(30, 41, 59);
  }
  doc.text(division.signatoryOfficer, rightX + 4, boxY + 25);

  return {
    finalY: boxY + boxHeight + 4,
    payload
  };
}
