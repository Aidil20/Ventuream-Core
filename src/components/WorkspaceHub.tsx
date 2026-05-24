import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  FileText, 
  Calendar, 
  Table, 
  Search, 
  PlusCircle, 
  Check, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  File, 
  AlertCircle, 
  Download, 
  FolderOpen,
  ArrowRight,
  Sparkles,
  Link,
  ChevronRight,
  Info,
  Network
} from 'lucide-react';
import { getAccessToken } from '../lib/auth';
import { BeneficialOwnershipGnnGraph } from './BeneficialOwnershipGnnGraph';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  htmlLink?: string;
}

interface WorkspaceHubProps {
  onAuthRequired: () => void;
}

type ActiveTab = 'drive' | 'docs' | 'sheets' | 'calendar' | 'gnn';

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({ onAuthRequired }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('drive');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File Lists
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [docs, setDocs] = useState<DriveFile[]>([]);
  const [sheets, setSheets] = useState<DriveFile[]>([]);
  
  // Calendar Events
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Detailed Workspace views
  const [selectedDocContent, setSelectedDocContent] = useState<{ title: string; body: string } | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [selectedSheetRange, setSelectedSheetRange] = useState<string>('A1:E10');
  const [sheetData, setSheetData] = useState<any[][] | null>(null);
  const [sheetTitle, setSheetTitle] = useState<string>('');

  // Confirmation Modals / Operation Flags
  const [confirmAction, setConfirmAction] = useState<{
    type: 'create-doc' | 'create-sheet' | 'create-event' | 'delete-event' | 'delete-file';
    title: string;
    description: string;
    payload: any;
  } | null>(null);

  // Quick Preset Forms (mutators)
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocMemoType, setNewDocMemoType] = useState('Investment Memorandum');
  const [newDocAsset, setNewDocAsset] = useState('Commodities & Coal Export');
  
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newSheetType, setNewSheetType] = useState('Institutional Portfolio Tracker');
  
  const [eventSummary, setEventSummary] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDuration, setEventDuration] = useState('60'); // Minutes
  const [eventDesc, setEventDesc] = useState('');

  // Fetch standard files
  const fetchAllFilesAndData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        onAuthRequired();
        setIsLoading(false);
        return;
      }

      // 1. Google Drive general list
      const driveRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,modifiedTime)&orderBy=modifiedTime desc,name&pageSize=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!driveRes.ok) throw new Error(`Drive API failed: ${driveRes.statusText}`);
      const driveJson = await driveRes.json();
      const allFiles: DriveFile[] = driveJson.files || [];
      setFiles(allFiles);

      // Filter Docs & Sheets for their respective tabs
      setDocs(allFiles.filter(f => f.mimeType === 'application/vnd.google-apps.document'));
      setSheets(allFiles.filter(f => f.mimeType === 'application/vnd.google-apps.spreadsheet'));

      // 2. Google Calendar general list
      const nowStr = new Date().toISOString();
      const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${nowStr}&maxResults=15`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (calRes.ok) {
        const calJson = await calRes.json();
        setEvents(calJson.items || []);
      } else {
        console.warn('Calendar fetch failed, maybe scope not granted or empty:', calRes.statusText);
      }
    } catch (err: any) {
      console.error('Workspace fetch error:', err);
      setError(err.message || 'Connection lost to Google Workspace API gateway');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'gnn') {
      fetchAllFilesAndData();
    }
  }, [activeTab]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <FolderOpen className="w-4 h-4 text-amber-400" />;
    if (mimeType.includes('document')) return <FileText className="w-4 h-4 text-blue-400" />;
    if (mimeType.includes('spreadsheet')) return <Table className="w-4 h-4 text-emerald-400" />;
    return <File className="w-4 h-4 text-zinc-400" />;
  };

  // FETCH A GOOGLE DOC TO READ TEXT
  const loadDocContent = async (docId: string, title: string) => {
    setIsLoading(true);
    setSelectedDocContent(null);
    setSelectedDocId(docId);
    try {
      const token = getAccessToken();
      const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Could not pull document body. Ensure correct document permissions.');
      const docData = await res.json();
      
      // Extract structural text
      let textContent = '';
      if (docData.body && docData.body.content) {
        docData.body.content.forEach((elem: any) => {
          if (elem.paragraph && elem.paragraph.elements) {
            elem.paragraph.elements.forEach((pElem: any) => {
              if (pElem.textRun && pElem.textRun.content) {
                textContent += pElem.textRun.content;
              }
            });
          }
        });
      }
      setSelectedDocContent({
        title: title,
        body: textContent || 'Empty Document'
      });
    } catch (err: any) {
      console.error(err);
      setError(`Docs content error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // FETCH GOOGLE SHEETS DYNAMIC RANGES
  const loadSheetValues = async (sheetId: string) => {
    if (!sheetId) return;
    setIsLoading(true);
    setSheetData(null);
    try {
      const token = getAccessToken();
      
      // Step A: Fetch Sheet title/meta
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties(title),sheets(properties(title))`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let finalRange = selectedSheetRange;
      if (metaRes.ok) {
        const metaJson = await metaRes.json();
        setSheetTitle(metaJson.properties?.title || 'Liquid Ledger');
        const firstTab = metaJson.sheets?.[0]?.properties?.title;
        if (firstTab && !selectedSheetRange.includes('!')) {
          finalRange = `'${firstTab}'!${selectedSheetRange}`;
        }
      }

      // Step B: Fetch Values
      const valuesRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(finalRange)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!valuesRes.ok) {
        throw new Error(`Out of range or access denied. Range format e.g. "Sheet1!A1:D10"`);
      }
      
      const valuesJson = await valuesRes.json();
      setSheetData(valuesJson.values || []);
    } catch (err: any) {
      console.error(err);
      setError(`Sheets data fetch failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // EXECUTE MUTATION: CREATE GOOGLE DOC
  const handleCreateDocSubmit = () => {
    const title = newDocTitle || `VAM ${newDocMemoType} - ${newDocAsset}`;
    setConfirmAction({
      type: 'create-doc',
      title: 'Confirm Google Document Creation',
      description: `This will create a new live Google Document titled "${title}" in your Google Drive under account pt.ventuream@gmail.com with structured legal templates.`,
      payload: { title }
    });
  };

  const executeCreateDoc = async (title: string) => {
    setIsLoading(true);
    setConfirmAction(null);
    try {
      const token = getAccessToken();
      const docRes = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });

      if (!docRes.ok) throw new Error('Failed to create document structure');
      const createdDoc = await docRes.json();
      const docId = createdDoc.documentId;

      // BatchUpdate to add corporate memorandum headers
      const updatePayload = {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: `VENTUREAM INSTITUTIONAL GROUP\nINVESTMENT MEMORANDUM & RISK ADVISORY\n---------------------------------------------\nDOCUMENT ID: ${docId}\nGENERATION DATE: ${new Date().toLocaleDateString()}\nSTATUS: ACTIVE DRAFT\nASSET CATEGORY: ${newDocAsset}\n\n[1. executive-summary]\nThis secure memorandum outlines capital allocation parameters and regulatory compliance checks for cross-border investments in line with institutional guidelines.\n\n[2. risk-assessment]\nTBML checks and Trade Divergence tests pre-aligned. Counterparty verification completed.\n`
            }
          }
        ]
      };

      await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });

      setNewDocTitle('');
      await fetchAllFilesAndData();
      await loadDocContent(docId, title);
    } catch (err: any) {
      console.error(err);
      setError(`Could not create Google Doc template: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // EXECUTE MUTATION: CREATE GOOGLE SHEET
  const handleCreateSheetSubmit = () => {
    const title = newSheetTitle || `VAM Ledger - ${newSheetType}`;
    setConfirmAction({
      type: 'create-sheet',
      title: 'Confirm Google Spreadsheet Creation',
      description: `This will provision a new active, structured Google Spreadsheet titled "${title}" in your Google Drive under pt.ventuream@gmail.com.`,
      payload: { title }
    });
  };

  const executeCreateSheet = async (title: string) => {
    setIsLoading(true);
    setConfirmAction(null);
    try {
      const token = getAccessToken();
      const sheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          properties: { title }
        })
      });

      if (!sheetRes.ok) throw new Error('Spreadsheet creation failed');
      const createdSheet = await sheetRes.json();
      const spreadsheetId = createdSheet.spreadsheetId;

      // Write default audit tracker columns
      const values = [
        ["TIMESTAMP", "ASSET ID", "COMMODITY CATEGORY", "REBALANCE WT", "RISK ALERT"],
        [new Date().toISOString(), "IDX:ADRO", "Coal Export", "15.4%", "LOW_DIVERGENCE"],
        [new Date().toISOString(), "IDX:PTBA", "Coal Mining", "12.0%", "NOMINAL"],
        [new Date().toISOString(), "IDX:ANTM", "Nickel Mineral", "18.5%", "HIGH_INVOICE_SURGE"]
      ];

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Sheet1'!A1:E4?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ values })
      });

      setNewSheetTitle('');
      await fetchAllFilesAndData();
      setSelectedSheetId(spreadsheetId);
      await loadSheetValues(spreadsheetId);
    } catch (err: any) {
      console.error(err);
      setError(`Could not compile Google Sheet asset: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // EXECUTE MUTATION: CREATE CALENDAR EVENT
  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary || !eventDate || !eventTime) return;

    const startDateTime = new Date(`${eventDate}T${eventTime}`).toISOString();
    const endDateTime = new Date(new Date(`${eventDate}T${eventTime}`).getTime() + parseInt(eventDuration) * 60 * 1000).toISOString();

    setConfirmAction({
      type: 'create-event',
      title: 'Schedule Secure Corporate Event',
      description: `Create an calendar event "${eventSummary}" from ${eventTime} on ${eventDate} inside your Google Calendar account pt.ventuream@gmail.com?`,
      payload: {
        summary: eventSummary,
        description: eventDesc || "VentureAM secure meeting sync",
        start: { dateTime: startDateTime, timeZone: 'Asia/Jakarta' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Jakarta' }
      }
    });
  };

  const executeCreateEvent = async (payload: any) => {
    setIsLoading(true);
    setConfirmAction(null);
    try {
      const token = getAccessToken();
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Calendar event insertion failed');

      setEventSummary('');
      setEventDate('');
      setEventTime('');
      setEventDesc('');
      await fetchAllFilesAndData();
    } catch (err: any) {
      console.error(err);
      setError(`Calendar sync failure: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE EVENT (WITH STRICT CONFIRMATION)
  const handleDeleteEventClick = (eventId: string, summary: string) => {
    setConfirmAction({
      type: 'delete-event',
      title: 'DISMISS CALENDAR EVENT (DESTRUCTIVE)',
      description: `This will permanently delete the event "${summary}" from Google Calendar under pt.ventuream@gmail.com. This action is irreversible.`,
      payload: { eventId }
    });
  };

  const executeDeleteEvent = async (eventId: string) => {
    setIsLoading(true);
    setConfirmAction(null);
    try {
      const token = getAccessToken();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Did not delete from calendar');
      await fetchAllFilesAndData();
    } catch (err: any) {
      console.error(err);
      setError(`Failed to delete event: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // FILTER LOGIC FOR SEARCH INPUT
  const getFilteredItems = (items: DriveFile[]) => {
    return items.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#DFFF00]/10 rounded-2xl border border-[#DFFF00]/20 shadow-[0_0_15px_rgba(223,255,0,0.05)]">
            <Cloud className="w-6 h-6 text-[#DFFF00]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">VentureAM Workspace Hub</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
              Secure Global Gateway Integration (Drive, Docs, Sheets, Calendar)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#DFFF00] rounded-full animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-zinc-400">
              Account: pt.ventuream@gmail.com
            </span>
          </div>

          <button 
            onClick={fetchAllFilesAndData}
            disabled={isLoading}
            className="p-2 bg-zinc-900 hover:bg-zinc-850 rounded-xl border border-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Interactive Tab Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
        <button
          onClick={() => { setActiveTab('drive'); setSearchTerm(''); }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'drive' 
              ? 'bg-[#DFFF00] text-black shadow-md' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Cloud className="w-4 h-4" />
          VAM Drive
        </button>

        <button
          onClick={() => { setActiveTab('docs'); setSearchTerm(''); }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'docs' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Google Docs
        </button>

        <button
          onClick={() => { setActiveTab('sheets'); setSearchTerm(''); }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'sheets' 
              ? 'bg-emerald-500 text-white shadow-md' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Table className="w-4 h-4" />
          Google Sheets
        </button>

        <button
          onClick={() => { setActiveTab('calendar'); setSearchTerm(''); }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'calendar' 
              ? 'bg-[#deff9a] text-black shadow-md' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendar
        </button>

        <button
          onClick={() => { setActiveTab('gnn'); setSearchTerm(''); }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'gnn' 
              ? 'bg-purple-500 text-white shadow-md' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Network className="w-4 h-4" />
          GNN Ownership
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h5 className="text-xs font-black text-red-400 uppercase tracking-widest">Workspace Sync Intercepted</h5>
            <p className="text-[11px] font-bold text-zinc-400 mt-1 uppercase">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-[10px] text-zinc-500 hover:text-white font-black uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Main Dashboard Workspace Content Grid */}
      {activeTab === 'gnn' ? (
        <BeneficialOwnershipGnnGraph />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand: Tab Content Core (Span 7 or 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* A. GOOGLE DRIVE GENERAL VIEW */}
          {activeTab === 'drive' && (
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Enterprise File Repository</h4>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">Files on Secure Drive Folder</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input 
                    type="text"
                    placeholder="Search cloud files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/50 border border-zinc-900 rounded-xl py-2 pl-9 pr-4 text-[11px] font-bold text-white focus:outline-none focus:border-[#DFFF00]/50 transition-all w-48"
                  />
                </div>
              </div>

              {isLoading && files.length === 0 ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-zinc-900/50 animate-pulse rounded-xl border border-zinc-950" />
                  ))}
                </div>
              ) : getFilteredItems(files).length === 0 ? (
                <div className="p-16 text-center border border-dashed border-zinc-900 rounded-2xl flex flex-col items-center">
                  <Cloud className="w-8 h-8 text-zinc-800 mb-3" />
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">No cataloged file matches research profile</span>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {getFilteredItems(files).map((file, idx) => (
                    <div 
                      key={`${file.id}-${idx}`} 
                      className="bg-black/40 border border-zinc-900/60 p-3.5 rounded-xl flex items-center justify-between hover:border-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-zinc-900 rounded-lg">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{file.name}</p>
                          <span className="text-[9px] text-zinc-600 uppercase tracking-wider block mt-0.5">
                            Modified: {new Date(file.modifiedTime).toLocaleDateString()} at {new Date(file.modifiedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a 
                          href={`https://drive.google.com/open?id=${file.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                          title="Open in Workspace"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* B. GOOGLE DOCS VIEW */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">VAM Legal Memorandums</h4>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">Google Docs on Drive</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input 
                      type="text"
                      placeholder="Search memo drafts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-black/50 border border-zinc-900 rounded-xl py-2 pl-9 pr-4 text-[11px] font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all w-40"
                    />
                  </div>
                </div>

                {isLoading && docs.length === 0 ? (
                  <div className="h-24 bg-zinc-900/20 rounded-2xl animate-pulse" />
                ) : getFilteredItems(docs).length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-zinc-900 rounded-2xl">
                    <FileText className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">No active Google Documents found</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {getFilteredItems(docs).map((docFile, idx) => (
                      <button
                        key={`${docFile.id}-${idx}`}
                        onClick={() => loadDocContent(docFile.id, docFile.name)}
                        className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          selectedDocId === docFile.id 
                            ? 'bg-blue-950/20 border-blue-500/50' 
                            : 'bg-black/40 border-zinc-900 hover:border-zinc-850'
                        }`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-[8px] font-mono text-zinc-600 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900 uppercase">
                            DOCS ID: {docFile.id.substring(0, 8)}...
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs font-black text-zinc-200 line-clamp-1 group-hover:text-white">{docFile.name}</p>
                          <span className="text-[9px] text-zinc-650 font-bold uppercase tracking-widest mt-1 block">
                            Ref: {new Date(docFile.modifiedTime).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Secure Document Contents Reader Container */}
              {selectedDocContent && (
                <div className="bg-zinc-950 border border-blue-500/20 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                      <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">
                        Active Memorandums Viewer: {selectedDocContent.title}
                      </h4>
                    </div>
                    <a 
                      href={`https://docs.google.com/document/d/${selectedDocId}/edit`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] font-black uppercase text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/5 px-2.5 py-1 rounded border border-blue-500/10"
                    >
                      Open in Docs
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="bg-black border border-zinc-900 rounded-2xl p-5 font-mono text-[11px] leading-relaxed text-zinc-400 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                    {selectedDocContent.body}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* C. GOOGLE SHEETS VIEW */}
          {activeTab === 'sheets' && (
            <div className="space-y-6">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Spreadsheet Registry</h4>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">Google Sheets from Drive Workspace</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      placeholder="Custom Spreadsheet ID..."
                      value={selectedSheetId}
                      onChange={(e) => setSelectedSheetId(e.target.value)}
                      className="bg-black/50 border border-zinc-900 rounded-xl py-1.5 px-3 text-[10px] font-mono text-zinc-300 tracking-tight focus:outline-none focus:border-emerald-500/50 w-44"
                    />
                    <button
                      onClick={() => loadSheetValues(selectedSheetId)}
                      disabled={!selectedSheetId || isLoading}
                      className="px-3.5 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 disabled:opacity-40"
                    >
                      Load Sheet
                    </button>
                  </div>
                </div>

                {isLoading && sheets.length === 0 ? (
                  <div className="h-16 bg-zinc-900/20 rounded-xl animate-pulse" />
                ) : sheets.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-zinc-900 rounded-2xl text-zinc-500 text-[10px] uppercase font-bold">
                    No Spreadsheets Detected
                  </div>
                ) : (
                  <div className="flex gap-2 pb-2 overflow-x-auto select-none custom-scrollbar">
                    {sheets.map((sheet, idx) => (
                      <button
                        key={`${sheet.id}-${idx}`}
                        onClick={() => {
                          setSelectedSheetId(sheet.id);
                          loadSheetValues(sheet.id);
                        }}
                        className={`px-4 py-2.5 rounded-xl border text-[11px] font-mono whitespace-nowrap transition-colors inline-flex items-center gap-2 ${
                          selectedSheetId === sheet.id
                            ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400'
                            : 'bg-black/50 border-zinc-900 text-zinc-400 hover:border-zinc-850 hover:text-zinc-200'
                        }`}
                      >
                        <Table className="w-3.5 h-3.5" />
                        {sheet.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid cell viewer container */}
              {selectedSheetId && (
                <div className="bg-zinc-950 border border-emerald-500/10 rounded-3xl p-6 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-zinc-900 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">
                        Values Grid for: {sheetTitle || "Active Spreadsheet"}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">Range:</span>
                      <input 
                        type="text"
                        value={selectedSheetRange}
                        onChange={(e) => setSelectedSheetRange(e.target.value)}
                        className="bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-200 w-24 text-center"
                      />
                      <button 
                        onClick={() => loadSheetValues(selectedSheetId)}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-850"
                        title="Reload range values"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <a 
                        href={`https://docs.google.com/spreadsheets/d/${selectedSheetId}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] font-black text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-1 px-2.5 rounded hover:text-white"
                      >
                        Launch Sheets
                      </a>
                    </div>
                  </div>

                  {sheetData === null ? (
                    <div className="p-8 text-center bg-black/40 border border-zinc-900 rounded-xl text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                      Input Range above & click reload to analyze matrix
                    </div>
                  ) : sheetData.length === 0 ? (
                    <div className="p-12 text-center text-zinc-650 text-xs font-mono uppercase">
                      Sheet is empty within range {selectedSheetRange}
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-zinc-900 rounded-xl">
                      <table className="w-full text-left border-collapse text-[11px] font-mono">
                        <thead>
                          <tr className="bg-zinc-900/60 border-b border-zinc-900">
                            {sheetData[0]?.map((hdr: any, idx: number) => (
                              <th key={idx} className="p-3 font-semibold text-zinc-300 uppercase tracking-widest">{hdr}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sheetData.slice(1).map((row: any[], rIdx: number) => (
                            <tr key={rIdx} className="border-b border-zinc-900 hover:bg-zinc-900/20">
                              {row.map((val: any, cIdx: number) => (
                                <td key={cIdx} className="p-3 text-zinc-400 font-mono tracking-tighter truncate max-w-[200px]">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* D. GOOGLE CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Institutional Schedules</h4>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">Google Calendar Events</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-22 text-zinc-600 font-mono text-[9px] uppercase">Primary Calendar</span>
                </div>
              </div>

              {isLoading && events.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-zinc-900/50 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="p-12 border border-dashed border-zinc-900 rounded-2xl text-center flex flex-col items-center">
                  <Calendar className="w-8 h-8 text-zinc-800 mb-3" />
                  <span className="text-[10px] font-bold text-zinc-650 uppercase tracking-widest">No scheduled event listings found</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {events.map((event, idx) => {
                    const startStr = event.start?.dateTime || event.start?.date || '';
                    const parsedDate = startStr ? new Date(startStr) : null;
                    return (
                      <div 
                        key={`${event.id || 'evt'}-${idx}`}
                        className="p-4 bg-zinc-950/40 border border-zinc-900 hover:border-zinc-850 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center justify-center text-center p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl min-w-12 h-14 shrink-0">
                            <span className="text-[9px] font-black text-[#deff9a] uppercase leading-none">
                              {parsedDate ? parsedDate.toLocaleString('default', { month: 'short' }) : 'N/A'}
                            </span>
                            <span className="text-base font-black text-white mt-1 leading-none">
                              {parsedDate ? parsedDate.getDate() : '-'}
                            </span>
                          </div>

                          <div>
                            <h5 className="text-xs font-black text-zinc-100 uppercase tracking-wide leading-snug">{event.summary}</h5>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mt-1.5 flex items-center gap-2">
                              {parsedDate ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day'}
                              {event.description && (
                                <span className="text-zinc-500 normal-case italic border-l border-zinc-850 pl-2 line-clamp-1">
                                  {event.description}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          {event.htmlLink && (
                            <a 
                              href={event.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-zinc-900 hover:bg-[#deff9a]/10 border border-zinc-850 text-zinc-500 hover:text-white rounded transition-colors"
                              title="Open on calendar"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteEventClick(event.id, event.summary)}
                            className="p-1.5 bg-zinc-900 hover:bg-red-500/10 border border-zinc-850 text-zinc-650 hover:text-red-400 rounded transition-colors"
                            title="Delete meeting"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Hand: Workspace Form Controls / Creator Panel (Span 4) */}
        <div className="lg:col-span-4 space-y-6">

          {/* CREATION PANEL FOR ACTIVE TAB */}
          {activeTab === 'drive' && (
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <div className="p-3 bg-[#DFFF00]/5 border border-[#DFFF00]/10 rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-[#DFFF00] shrink-0 mt-0.5" />
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider leading-relaxed">
                  Enterprise client has full read privileges for document management. Select Google Docs or Sheets tabs to initiate live file builders.
                </div>
              </div>
              <div className="border border-zinc-900 p-4 rounded-2xl text-[10px] space-y-2">
                <span className="text-zinc-500 block uppercase tracking-widest font-black">DRIVE ENDPOINTS PRE-ALIGNED:</span>
                <p className="text-zinc-300 font-mono">GET /drive/v3/files</p>
                <p className="text-zinc-300 font-mono">GET /files/{"{id}"}?alt=media</p>
              </div>
            </div>
          )}

          {/* CREATOR: GOOGLE DOC */}
          {activeTab === 'docs' && (
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Document Provisioner</h4>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Produce Template Drafts on Docs</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">MEMORANDUM TYPE</label>
                  <select 
                    value={newDocMemoType} 
                    onChange={(e) => setNewDocMemoType(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-[#DFFF00]"
                  >
                    <option value="Investment Memorandum">Investment Memorandum</option>
                    <option value="Legal Compliance Summary">Legal Compliance Summary</option>
                    <option value="Financial Divergence Audit">Financial Divergence Audit</option>
                    <option value="Forensic Trading Report">Forensic Trading Report</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">ASSET FOCUS</label>
                  <select 
                    value={newDocAsset} 
                    onChange={(e) => setNewDocAsset(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-[#DFFF00]"
                  >
                    <option value="Coal Export Logistics">Coal Export Logistics</option>
                    <option value="Minerals & Alumina Refinery">Minerals & Alumina Refinery</option>
                    <option value="Bursa Efek Commodities">Bursa Efek Commodities</option>
                    <option value="General Asset Rebalancing">General Asset Rebalancing</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">CUSTOM MEMO TITLE (OPTIONAL)</label>
                  <input 
                    type="text" 
                    placeholder="Auto-generated if left blank..."
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-[#DFFF00]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateDocSubmit}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-blue-500 text-white hover:bg-blue-650 transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  Initialize Doc Template
                </button>
              </div>
            </div>
          )}

          {/* CREATOR: GOOGLE SHEET */}
          {activeTab === 'sheets' && (
            <div className="bg-zinc-900/30 border border-[#deff9a]/10 rounded-3xl p-6 space-y-4">
              <div>
                <h4 className="text-xs font-black text-[#deff9a] uppercase tracking-widest">Active Table Provisioner</h4>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Spreadsheet structures & metrics columns</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">TEMPLATE STYLE</label>
                  <select 
                    value={newSheetType} 
                    onChange={(e) => setNewSheetType(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-[#DFFF00]"
                  >
                    <option value="Asset Portfolio tracker">Asset Portfolio tracker</option>
                    <option value="IDX Divergence Checklist">IDX Divergence Checklist</option>
                    <option value="Rebalance Weight Audit">Rebalance Weight Audit</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">SPREADSHEET NAME (OPTIONAL)</label>
                  <input 
                    type="text" 
                    placeholder="Defaults to corporate label..."
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-[#DFFF00]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateSheetSubmit}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  Create Spreadsheet Structure
                </button>
              </div>
            </div>
          )}

          {/* CREATOR: GOOGLE CALENDAR EVENT */}
          {activeTab === 'calendar' && (
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Schedule Operations Sync</h4>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Book new events inside Google Calendar</p>
              </div>

              <form onSubmit={handleCreateEventSubmit} className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">EVENT SUMMARY / NAME</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. VAM Rebalance Review"
                    value={eventSummary}
                    onChange={(e) => setEventSummary(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-[#deff9a]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">DATE</label>
                    <input 
                      type="date" 
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-black border border-zinc-900 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-[#deff9a]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">TIME (WIB)</label>
                    <input 
                      type="time" 
                      required
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-black border border-zinc-900 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-[#deff9a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">DURATION (MIN)</label>
                    <select 
                      value={eventDuration} 
                      onChange={(e) => setEventDuration(e.target.value)}
                      className="w-full bg-black border border-zinc-900 rounded-xl px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="30">30 Min</option>
                      <option value="60">60 Min (1 Hr)</option>
                      <option value="90">90 Min</option>
                      <option value="120">2 Hrs</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-zinc-600 uppercase block mt-1">Automatic sync timezone: WIB / GMT+7</span>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">DESCRIPTION</label>
                  <textarea 
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Institutional agenda, rebalance target weight check..."
                    className="w-full h-16 bg-black border border-zinc-900 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-[#deff9a] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#deff9a] text-black hover:bg-[#deff50] transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  Schedule Calendar Meeting
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
      )}

      {/* 4. VENTUREAM CORPORATE ACTION GATEWAY CONFIRMATION DIALOG (MODAL) */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-[2.5rem] max-w-md w-full shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider leading-none">
                  {confirmAction.title}
                </h4>
              </div>

              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide leading-relaxed mb-6">
                {confirmAction.description}
              </p>

              <div className="flex items-center gap-3 justify-end border-t border-zinc-900 pt-5">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-widest transition-colors"
                >
                  Abort Action
                </button>
                <button
                  onClick={() => {
                    const { type, payload } = confirmAction;
                    if (type === 'create-doc') {
                      executeCreateDoc(payload.title);
                    } else if (type === 'create-sheet') {
                      executeCreateSheet(payload.title);
                    } else if (type === 'create-event') {
                      executeCreateEvent(payload);
                    } else if (type === 'delete-event') {
                      executeDeleteEvent(payload.eventId);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-colors ${
                    confirmAction.type.startsWith('delete') ? 'bg-red-500 hover:bg-red-600' : 'bg-[#DFFF00] text-black hover:bg-[#deff50]'
                  }`}
                >
                  Execute Authorized Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
