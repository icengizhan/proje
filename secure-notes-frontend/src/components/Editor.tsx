import { useRef, useEffect, useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { PenTool, Highlighter, Type, Download, Image as ImageIcon, FilePlus, RefreshCcw, Trash2, ExternalLink, Eye, Edit3, AlertTriangle } from 'lucide-react';
import type { Note, PaperType, PaperColor } from '../types';
import api from '../api/axios';

interface EditorProps {
  note: Note;
  onUpdate: (updatedNote: Note) => void;
  onDeletePermanently: (id: number) => void;
  onRestore: (id: number) => void;
  onTrash: (id: number) => void;
  onLinkClick?: (linkName: string) => void;
}

// Image error fallback component
function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  // Prefix relative URLs with backend base
  const fullSrc = src.startsWith('/') ? `http://localhost:3000${src}` : src;

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 my-3 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm">
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
      className="max-w-full rounded-2xl shadow-md border border-gray-100 my-4 transition-transform hover:scale-[1.01]"
      style={{ maxHeight: '500px', objectFit: 'contain' }}
    />
  );
}

export default function Editor({ note, onUpdate, onDeletePermanently, onRestore, onTrash, onLinkClick }: EditorProps) {
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

  // Reset states on note change
  useEffect(() => {
    setDetectedLink(null);
    setIsPreview(false);
  }, [note.id]);

  // Cursor-based wiki-link detection
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

  // Upload file to backend, get permanent URL, insert into note
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

      const permanentUrl = response.data.url; // e.g. /uploads/uuid.png
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

  const getPaperStyles = (type: PaperType, color: PaperColor) => {
    const colors = { white: 'bg-white', yellow: 'bg-[#FEF5D7]', gray: 'bg-[#F2F2F2]' };
    const patterns = {
      blank: '',
      lined: 'bg-[linear-gradient(transparent_95%,#cbd5e1_100%)] bg-[length:100%_2.2rem]',
      grid: 'bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[length:1.5rem_1.5rem]',
      dots: 'bg-[radial-gradient(#9ca3af_1.5px,transparent_1.5px)] bg-[length:1.6rem_1.6rem]',
    };
    return `${colors[color]} ${patterns[type]}`;
  };

  // Render markdown content as rich preview
  const renderPreview = (text: string) => {
    // Split by markdown image pattern AND wiki-links
    const parts = text.split(/(!\[.*?\]\(.*?\)|\[\[.*?\]\])/g);

    return parts.map((part, index) => {
      // Markdown image: ![alt](url)
      const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        return <ImageWithFallback key={index} alt={imgMatch[1]} src={imgMatch[2]} />;
      }

      // Wiki-link: [[Note Name]]
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const linkName = part.slice(2, -2);
        return (
          <span
            key={index}
            onClick={() => onLinkClick?.(linkName)}
            className="text-blue-600 font-semibold bg-blue-50 rounded-lg px-2 py-0.5 cursor-pointer hover:bg-blue-100 hover:underline transition-colors inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {linkName}
          </span>
        );
      }

      // Regular text — preserve line breaks
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
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full p-8 text-center border-l border-gray-200">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <Trash2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Not Çöp Kutusunda</h2>
          <p className="text-gray-500 text-sm mb-8">Bu notu geri yükleyebilir veya kalıcı olarak silebilirsiniz.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => onRestore(note.id)} className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition">
              <RefreshCcw className="w-4 h-4" /> Geri Yükle
            </button>
            <button onClick={() => onDeletePermanently(note.id)} className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition">
              <Trash2 className="w-4 h-4" /> Tamamen Sil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)] border-l border-gray-200 z-30">
      
      {/* 🛠️ Top Toolbar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 shrink-0 bg-white/95 backdrop-blur-md">
        
        {/* Drawing & Text Tools + Preview Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setIsPreview(false)}
              className={`p-2 rounded-lg transition ${!isPreview ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-200'}`}
              title="Yazma Modu"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={`p-2 rounded-lg transition ${isPreview ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-200'}`}
              title="Önizleme Modu"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>

          {!isPreview && (
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button className="p-2 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition" title="Kalem (Yakında)">
                <PenTool className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition" title="Fosforlu Kalem (Yakında)">
                <Highlighter className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Paper Details */}
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm font-medium border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <select className="px-3 py-2 bg-transparent text-gray-700 focus:outline-none cursor-pointer" value={note.paperType} onChange={(e) => onUpdate({ ...note, paperType: e.target.value as PaperType })}>
              <option value="blank">Boş Kağıt</option>
              <option value="lined">Çizgili</option>
              <option value="grid">Kareli</option>
              <option value="dots">Dotted</option>
            </select>
            <div className="w-px h-6 bg-gray-200"></div>
            <select className="px-3 py-2 bg-transparent text-gray-700 focus:outline-none cursor-pointer" value={note.paperColor} onChange={(e) => onUpdate({ ...note, paperColor: e.target.value as PaperColor })}>
              <option value="white">Beyaz</option>
              <option value="yellow">Sarı / Krem</option>
              <option value="gray">Gri</option>
            </select>
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1 text-gray-500">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50" title="Resim/PDF Ekle">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1"></div>
          <button onClick={handleDownloadTxt} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition" title="İndir (TXT)">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={() => onTrash(note.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition" title="Çöp Kutusuna Taşı">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 📄 Paper Area */}
      <div className="flex-1 overflow-auto flex justify-center py-10 bg-gray-100 relative">
        <div className={`w-[800px] min-h-[1056px] shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden flex flex-col ${getPaperStyles(note.paperType, note.paperColor)} transition-colors duration-500 ease-in-out`}>
          
          {/* Note Title */}
          <div className="px-12 pt-16 pb-4">
            <input
              type="text"
              className="w-full text-5xl font-black text-gray-900 border-none bg-transparent focus:outline-none focus:ring-0 placeholder-gray-300"
              placeholder="Not Başlığı..."
              value={note.title}
              onChange={(e) => onUpdate({ ...note, title: e.target.value })}
              readOnly={isPreview}
            />
          </div>

          {/* Content Area: Write or Preview */}
          {isPreview ? (
            // 👁️ PREVIEW MODE — Render images, wiki-links, and text beautifully
            <div
              className="flex-1 px-12 pb-16 text-[22px] text-gray-800 cursor-text"
              style={{ lineHeight: '35.2px' }}
              onClick={() => setIsPreview(false)}
            >
              {note.content ? (
                renderPreview(note.content)
              ) : (
                <p className="text-gray-400 italic">Bu not henüz boş. Yazma moduna geçmek için tıklayın.</p>
              )}
            </div>
          ) : (
            // ✏️ WRITE MODE — Raw textarea
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
          <div className="absolute bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 text-sm font-medium rounded-xl shadow-lg border border-blue-100">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Dosya yükleniyor...
          </div>
        )}
      </div>
    </div>
  );
}
