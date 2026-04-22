import { Pin, Star, Lock } from 'lucide-react';
import type { Note } from '../types';

interface NoteCardProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onTogglePin?: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  onLinkClick?: (linkName: string) => void;
}

export default function NoteCard({ note, isActive, onClick, onTogglePin, onToggleFavorite, onLinkClick }: NoteCardProps) {
  const renderPreview = (content: string) => {
    const truncated = content.length > 80 ? content.slice(0, 80) + '...' : content;
    const parts = truncated.split(/(\[\[.*?\]\])/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const linkName = part.slice(2, -2);
        return (
          <span 
            key={index} 
            className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 rounded px-1.5 py-0.5 text-xs mx-0.5 hover:underline cursor-pointer transition transform hover:bg-blue-100 dark:hover:bg-blue-900/50"
            onClick={(e) => { e.stopPropagation(); onLinkClick?.(linkName); }}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div 
      onClick={onClick}
      className={`relative flex flex-col p-5 bg-white dark:bg-[#1e1e1e] rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
        isActive 
          ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' 
          : 'shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-1'
      }`}
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight text-lg line-clamp-1">{note.title || 'Başlıksız Not'}</h3>
        
        {/* Icons Area */}
        <div className="flex items-center gap-1.5 shrink-0 text-gray-400 dark:text-gray-500">
          {note.isLocked && <Lock className="w-4 h-4 text-orange-500 fill-orange-100" />}
          
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(note.id); }}
            className={`p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition ${note.isFavorite ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
          >
            <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-yellow-400' : ''}`} />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onTogglePin?.(note.id); }}
            className={`p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition ${note.isPinned ? 'text-blue-600 dark:text-blue-400' : 'hover:text-blue-500'}`}
          >
            <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-blue-600 dark:fill-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400 flex-1 leading-relaxed line-clamp-3">
        {renderPreview(note.content)}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 font-medium">
        <span>{note.date}</span>
        {note.paperColor !== 'white' && (
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: note.paperColor === 'yellow' ? '#fde047' : '#e5e7eb' }}></span>
        )}
      </div>
    </div>
  );
}
