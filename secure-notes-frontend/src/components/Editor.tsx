import { useRef, useEffect, useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { PenTool, Highlighter, Download, Image as ImageIcon, RefreshCcw, Trash2, ExternalLink, Eye, Edit3, AlertTriangle, PanelLeftClose, PanelLeftOpen, Maximize, Minimize } from 'lucide-react';
import type { Note, PaperType, PaperColor } from '../types';
import api from '../api/axios';

interface EditorProps {
  note: Note;
  onUpdate: (updatedNote: Note) => void;
  onDeletePermanently: (id: number) => void;
  onRestore: (id: number) => void;
  onTrash: (id: number) => void;
  onLinkClick?: (linkName: string) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

// Image error fallback component
function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  const fullSrc = src.startsWith('/') ? `http://localhost:3000${src}` : src;

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 my-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-500 dark:text-red-400 text-sm">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span>Resim yüklenemedi: <span className="font-medium">{alt}</span></span>
      </div>
    );
  }

  return (
    <img
      src={fullSrc}
      alt={alt}
      onError={() => setError(true)}
      className="max-w-full rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 my-4 transition-transform hover:scale-[1.01]"
      style={{ maxHeight: '500px', objectFit: 'contain' }}
    />
  );
}

export default function Editor({ note, onUpdate, onDeletePermanently, onRestore, onTrash, onLinkClick, isFocusMode, onToggleFocusMode, isSidebarOpen, onToggleSidebar }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const skipSaveId = useRef<number | null>(null);

  const [isPreview, setIsPreview] = useState(false);
  const [detectedLink, setDetectedLink] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Debounced autosave
  useEffect(() => {
    if (skipSaveId.current !== note.id) {
      skipSaveId.current = note.id;
      return;
    }
    const timer = setTimeout(() => {
      api.patch(`/notes/${note.id}`, {
        title: note.title,
        content: note.content,
        paperType: note.paperType,
        paperColor: note.paperColor
      }).catch(err => {
        console.error('Otomatik kaydetme hatası:', err);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [note.title, note.content, note.paperType, note.paperColor, note.id]);

  useEffect(() => {
    setDetectedLink(null);
    setIsPreview(false);
  }, [note.id]);

  const handleCursorChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;

    let start = -1;
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === '[' && i > 0 && text[i - 1] === '[') { start = i - 1; break; }
      if (text[i] === ']') break;
    }
    if (start === -1) { setDetectedLink(null); return; }

    let end = -1;
    for (let i = cursorPos; i < text.length - 1; i++) {
      if (text[i] === ']' && text[i + 1] === ']') { end = i + 2; break; }
      if (text[i] === '[') break;
    }
    if (end === -1) { setDetectedLink(null); return; }

    const linkName = text.slice(start + 2, end - 2).trim();
    setDetectedLink(linkName.length > 0 ? linkName : null);
  }, []);

  const handleDownloadTxt = () => {
    const el = document.createElement('a');
    const file = new Blob([note.content], { type: 'text/plain;charset=utf-8' });
    el.href = URL.createObjectURL(file);
    el.download = `${note.title || 'Not'}.txt`;
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const permanentUrl = response.data.url;
      const isImage = file.type.startsWith('image/');
      const markdown = `\n${isImage ? '!' : ''}[${file.name}](${permanentUrl})\n`;
      onUpdate({ ...note, content: note.content + markdown });
    } catch (err) {
      console.error('Dosya yükleme hatası:', err);
      alert('Dosya yüklenirken bir sorun oluştu.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Paper styles always remain light regardless of theme
  const getPaperStyles = (type: PaperType, color: PaperColor) => {

    const colors: Record<PaperColor, string> = { white: 'bg-white', yellow: 'bg-[#FEF5D7]', gray: 'bg-[#F2F2F2]' };
    const patterns: Record<PaperType, string> = {
      blank: '',
      lined: 'bg-[linear-gradient(transparent_95%,#cbd5e1_100%)] bg-[length:100%_2.2rem]',
      grid: 'bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[length:1.5rem_1.5rem]',
      dots: 'bg-[radial-gradient(#9ca3af_1.5px,transparent_1.5px)] bg-[length:1.6rem_1.6rem]',
    };
    return `${colors[color]} ${patterns[type]}`;
  };

  const renderPreview = (text: string) => {
    const parts = text.split(/(!\[.*?\]\(.*?\)|\[\[.*?\]\])/g);

    return parts.map((part, index) => {
      const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        return <ImageWithFallback key={index} alt={imgMatch[1]} src={imgMatch[2]} />;
      }

      if (part.startsWith('[[') && part.endsWith(']]')) {
        const linkName = part.slice(2, -2);
        return (
          <span
            key={index}
            onClick={() => onLinkClick?.(linkName)}
            className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 rounded-lg px-2 py-0.5 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:underline transition-colors inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {linkName}
          </span>
        );
      }

      return (
        <span key={index} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {part}
        </span>
      );
    });
  };

  // Deleted note overlay
  if (note.isDeleted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#121212] h-full p-8 text-center border-l border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 dark:text-red-400">
            <Trash2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Not Çöp Kutusunda</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Bu notu geri yükleyebilir veya kalıcı olarak silebilirsiniz.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => onRestore(note.id)} className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition">
              <RefreshCcw className="w-4 h-4" /> Geri Yükle
            </button>
            <button onClick={() => onDeletePermanently(note.id)} className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition">
              <Trash2 className="w-4 h-4" /> Tamamen Sil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#121212] h-full shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)] border-l border-gray-200 dark:border-gray-800 z-30 transition-colors duration-300">
      
      {/* 🛠️ Top Toolbar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md transition-colors duration-300">
        
        {/* Panel Controls + Preview Toggle */}
        <div className="flex items-center gap-3">
          {/* Focus Mode Controls */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-lg transition ${!isSidebarOpen ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              title={isSidebarOpen ? 'Menüyü Gizle' : 'Menüyü Göster'}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <button
              onClick={onToggleFocusMode}
              className={`p-2 rounded-lg transition ${isFocusMode ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              title={isFocusMode ? 'Odak Modundan Çık' : 'Odak Modu'}
            >
              {isFocusMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setIsPreview(false)}
              className={`p-2 rounded-lg transition ${!isPreview ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              title="Yazma Modu"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={`p-2 rounded-lg transition ${isPreview ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              title="Önizleme Modu"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>

          {!isPreview && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Kalem (Yakında)">
                <PenTool className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Fosforlu Kalem (Yakında)">
                <Highlighter className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Paper Details */}
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
            <select className="px-3 py-2 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer" value={note.paperType} onChange={(e) => onUpdate({ ...note, paperType: e.target.value as PaperType })}>
              <option value="blank">Boş Kağıt</option>
              <option value="lined">Çizgili</option>
              <option value="grid">Kareli</option>
              <option value="dots">Dotted</option>
            </select>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
            <select className="px-3 py-2 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer" value={note.paperColor} onChange={(e) => onUpdate({ ...note, paperColor: e.target.value as PaperColor })}>
              <option value="white">Beyaz</option>
              <option value="yellow">Sarı / Krem</option>
              <option value="gray">Gri</option>
            </select>
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition disabled:opacity-50" title="Resim/PDF Ekle">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
          <button onClick={handleDownloadTxt} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition" title="İndir (TXT)">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={() => onTrash(note.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg transition" title="Çöp Kutusuna Taşı">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 📄 Paper Area */}
      <div className="flex-1 overflow-auto flex justify-center py-10 bg-gray-100 dark:bg-[#0d0d0d] relative transition-colors duration-300">
        <div className={`w-[800px] min-h-[1056px] shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/30 sm:rounded-xl overflow-hidden flex flex-col ${getPaperStyles(note.paperType, note.paperColor)} transition-colors duration-500 ease-in-out`}>
          
          {/* Note Title */}
          <div className="px-12 pt-16 pb-4">
            <input
              type="text"
              className="w-full text-5xl font-black text-gray-900 border-none bg-transparent focus:outline-none focus:ring-0 placeholder-gray-300"
              placeholder="Not Başlığı..."
              value={note.title}
              onChange={(e) => onUpdate({ ...note, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  textareaRef.current?.focus();
                }
              }}
              onFocus={(e) => {
                if (e.target.value === 'Yeni Not') {
                  e.target.select();
                }
              }}
              readOnly={isPreview}
            />
          </div>

          {/* Content Area */}
          {isPreview ? (
            <div
              className="flex-1 px-12 pb-16 text-[22px] text-gray-800 cursor-text"
              style={{ lineHeight: '35.2px' }}
              onClick={() => setIsPreview(false)}
            >
              {note.content ? (
                renderPreview(note.content)
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic">Bu not henüz boş. Yazma moduna geçmek için tıklayın.</p>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              className="w-full flex-1 px-12 pb-16 resize-none text-[22px] text-gray-800 border-none bg-transparent focus:outline-none focus:ring-0 placeholder-gray-400"
              style={{ lineHeight: '35.2px' }}
              placeholder="Fikirlerinizi buraya dökün... [[Not Adı]] ile link, resim butonu ile görsel ekleyin."
              value={note.content}
              onChange={(e) => onUpdate({ ...note, content: e.target.value })}
              onClick={handleCursorChange}
              onKeyUp={handleCursorChange}
              autoFocus
            />
          )}
        </div>

        {/* 🔮 Floating Wiki-Link Button */}
        {!isPreview && detectedLink && (
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={() => onLinkClick?.(detectedLink)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200"
            >
              <ExternalLink className="w-4 h-4" />
              "{detectedLink}" notuna git
            </button>
          </div>
        )}

        {/* Upload indicator */}
        {uploading && (
          <div className="absolute bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-xl shadow-lg border border-blue-100 dark:border-blue-900">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Dosya yükleniyor...
          </div>
        )}
      </div>
    </div>
  );
}
