import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  File, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon,
  FolderOpen,
  Search,
  AlertCircle
} from 'lucide-react';
import { listDriveFiles, DriveFile } from '../services/driveService';
import DocumentExportCenter from './DocumentExportCenter';

interface DriveCenterProps {
  onAuthRequired: () => void;
}

export const DriveCenter: React.FC<DriveCenterProps> = ({ onAuthRequired }) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listDriveFiles();
      setFiles(data);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('No access token')) {
        onAuthRequired();
      } else {
        setError(err.message || 'Failed to load files from Google Drive');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <FolderOpen className="w-5 h-5 text-blue-400" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileText className="w-5 h-5 text-green-400" />;
    if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-400" />;
    return <File className="w-5 h-5 text-zinc-400" />;
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Featured Document & Presentation Export Section */}
      <DocumentExportCenter />

      <div className="space-y-6 border-t border-zinc-800 pt-6">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Cloud className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">VentureAM Cloud</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Google Drive Enterprise Integration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-[11px] font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all w-48"
              />
            </div>
            <button 
              onClick={fetchFiles}
              disabled={isLoading}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all disabled:opacity-50 group"
            >
              <RefreshCw className={`w-4 h-4 text-zinc-400 group-hover:text-white transition-colors ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-zinc-900/40 rounded-[2.5rem] border border-zinc-800/80 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="p-8">
            {error ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-red-500/5 rounded-[2rem] border border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Sync Error</h4>
                <p className="text-xs text-zinc-500 font-bold max-w-xs uppercase leading-relaxed">{error}</p>
                <button 
                  onClick={fetchFiles}
                  className="mt-6 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all"
                >
                  Retry Connection
                </button>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-zinc-800/40 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 border border-zinc-800 border-dashed">
                  <Cloud className="w-10 h-10 text-zinc-700" />
                </div>
                <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em]">No files found in your Drive</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredFiles.map((file, idx) => (
                    <motion.div 
                      key={file.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between hover:bg-zinc-800/40 hover:border-blue-500/30 transition-all cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 group-hover:scale-110 transition-transform">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-zinc-100 group-hover:text-white transition-colors">{file.name}</p>
                          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter mt-0.5">
                            Modified {new Date(file.modifiedTime).toLocaleDateString()} at {new Date(file.modifiedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={`https://drive.google.com/open?id=${file.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-zinc-900 hover:bg-blue-500/20 text-zinc-500 hover:text-blue-400 rounded-lg border border-zinc-800 transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => {/* Download logic */}}
                          className="p-2 bg-zinc-900 hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-400 rounded-lg border border-zinc-800 transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          <div className="bg-zinc-950/50 p-6 border-t border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Gateway Tunnel Encrypted</span>
            </div>
            <p className="text-[9px] text-zinc-600 font-bold uppercase">Linked Account: pt.ventuream@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

