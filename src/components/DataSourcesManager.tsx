import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Plus, Trash2, Globe, Upload, FileSpreadsheet, Settings } from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  url: string;
  description: string | null;
  source_type: string;
  is_active: boolean;
}

interface UploadedFile {
  name: string;
  created_at: string;
}

export function DataSourcesManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSources();
      loadFiles();
    }
  }, [isOpen]);

  const loadSources = async () => {
    const { data } = await supabase.from('data_sources').select('*').order('created_at', { ascending: false });
    if (data) setSources(data);
  };

  const loadFiles = async () => {
    const { data } = await supabase.storage.from('data-files').list('', { limit: 100 });
    if (data) setFiles(data.map(f => ({ name: f.name, created_at: f.created_at || '' })));
  };

  const addSource = async () => {
    if (!newName.trim() || !newUrl.trim()) return;
    await supabase.from('data_sources').insert({ name: newName, url: newUrl, description: newDesc || null });
    setNewName(''); setNewUrl(''); setNewDesc('');
    loadSources();
  };

  const deleteSource = async (id: string) => {
    await supabase.from('data_sources').delete().eq('id', id);
    loadSources();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    await supabase.storage.from('data-files').upload(file.name, file, { upsert: true });
    setIsUploading(false);
    loadFiles();
  };

  const deleteFile = async (name: string) => {
    await supabase.storage.from('data-files').remove([name]);
    loadFiles();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ background: '#1e3a8a' }}>
          <div className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Gestione Fonti Dati</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Web Sources */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: '#1e3a8a' }}>
              <Globe className="w-4 h-4" /> Fonti Web (URL / API)
            </h3>
            <div className="space-y-2 mb-3">
              {sources.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{s.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{s.url}</div>
                  </div>
                  <button onClick={() => deleteSource(s.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {sources.length === 0 && <p className="text-xs text-gray-400 italic">Nessuna fonte web configurata</p>}
            </div>
            <div className="space-y-2 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome fonte (es. CRM Aziendale)"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-400" />
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL (es. https://api.esempio.com/dati)"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-400" />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descrizione (opzionale)"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-400" />
              <button onClick={addSource} disabled={!newName.trim() || !newUrl.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                style={{ background: '#1e3a8a' }}>
                <Plus className="w-3.5 h-3.5" /> Aggiungi Fonte
              </button>
            </div>
          </section>

          {/* File Upload */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: '#065f46' }}>
              <FileSpreadsheet className="w-4 h-4" /> File Dati (CSV / Excel)
            </h3>
            <div className="space-y-2 mb-3">
              {files.map(f => (
                <div key={f.name} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="flex-1 text-xs font-medium truncate">{f.name}</span>
                  <button onClick={() => deleteFile(f.name)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {files.length === 0 && <p className="text-xs text-gray-400 italic">Nessun file caricato</p>}
            </div>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-green-300 bg-green-50/50 cursor-pointer hover:bg-green-50 transition-colors">
              <Upload className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">
                {isUploading ? 'Caricamento...' : 'Carica file CSV o Excel'}
              </span>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>
          </section>
        </div>
      </div>
    </div>
  );
}
